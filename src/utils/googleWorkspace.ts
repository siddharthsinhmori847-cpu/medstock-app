import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { StockItem, BatchItem, VitranEntry, TclLogEntry, RegisterProfile } from '../types/inventory';

// Initialize Firebase only once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');

// Cache the access token in memory (never localStorage per security rules)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Direct Google Identity Services (GIS) Token Client for popup/network resilience
export const signInWithGis = async (): Promise<{ user: any; accessToken: string }> => {
  return new Promise((resolve, reject) => {
    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services લોડ થયું નથી. કૃપા કરીને થોડીવાર પછી પ્રયાસ કરો.'));
      return;
    }

    try {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: firebaseConfig.oAuthClientId,
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file openid email profile',
        callback: async (resp: any) => {
          if (resp.error) {
            reject(new Error(resp.error_description || resp.error));
            return;
          }
          if (!resp.access_token) {
            reject(new Error('Google Access Token મેળવી શકાયો નથી.'));
            return;
          }

          cachedAccessToken = resp.access_token;

          // Fetch user profile info with this token
          let userProfile: any = {
            displayName: 'Google વપરાશકર્તા',
            email: '',
            photoURL: '',
          };
          try {
            const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${resp.access_token}` },
            });
            if (userRes.ok) {
              const data = await userRes.json();
              userProfile = {
                displayName: data.name || data.given_name || 'Google વપરાશકર્તા',
                email: data.email || '',
                photoURL: data.picture || '',
              };
            }
          } catch (e) {
            console.warn('Userinfo fetch warning:', e);
          }

          notifySyncSubscribers();
          resolve({ user: userProfile, accessToken: resp.access_token });
        },
      });

      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      reject(err);
    }
  });
};

export const initAuth = (
  onAuthSuccess?: (user: User | any, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Check redirect result first (in case returning from signInWithRedirect)
  getRedirectResult(auth)
    .then((result) => {
      if (result) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          cachedAccessToken = credential.accessToken;
          notifySyncSubscribers();
          if (onAuthSuccess) onAuthSuccess(result.user, credential.accessToken);
        }
      }
    })
    .catch((err) => {
      console.warn('Redirect auth check warning:', err);
    });

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else if (user) {
      if (onAuthSuccess && cachedAccessToken) {
        onAuthSuccess(user, cachedAccessToken);
      }
    } else if (!cachedAccessToken) {
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: any; accessToken: string } | null> => {
  try {
    isSigningIn = true;

    // 1. Try Firebase Popup first
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Google OAuth access token મેળવી શકાયો નથી.');
      }

      cachedAccessToken = credential.accessToken;
      notifySyncSubscribers();
      return { user: result.user, accessToken: cachedAccessToken };
    } catch (popupErr: any) {
      console.warn('Firebase signInWithPopup failed, trying GIS fallback...', popupErr);
      
      // If popup failed due to network error, popup blocked, or unauthorized domain:
      // Try GIS if available
      const google = (window as any).google;
      if (google?.accounts?.oauth2) {
        return await signInWithGis();
      }
      throw popupErr;
    }
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const googleSignInWithRedirect = async (): Promise<void> => {
  isSigningIn = true;
  await signInWithRedirect(auth, provider);
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  localStorage.removeItem('medstock_spreadsheet_id');
  localStorage.removeItem('medstock_spreadsheet_url');
  syncState = {
    status: 'idle',
    lastSyncedTime: null,
    spreadsheetUrl: null,
    error: null,
  };
  notifySyncSubscribers();
};

export interface SyncDataPayload {
  stockItems: StockItem[];
  batches: BatchItem[];
  vitranEntries: VitranEntry[];
  tclLogs: TclLogEntry[];
  profile: RegisterProfile;
  getItemTotalStock: (id: string) => number;
}

export interface SyncResult {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  timestamp: string;
  error?: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

export interface SyncState {
  status: SyncStatus;
  lastSyncedTime: string | null;
  spreadsheetUrl: string | null;
  error: string | null;
}

let syncState: SyncState = {
  status: 'idle',
  lastSyncedTime: localStorage.getItem('medstock_last_sync_time'),
  spreadsheetUrl: localStorage.getItem('medstock_spreadsheet_url'),
  error: null,
};

type SyncSubscriber = (state: SyncState) => void;
const syncSubscribers: Set<SyncSubscriber> = new Set();

export const subscribeSyncState = (subscriber: SyncSubscriber) => {
  syncSubscribers.add(subscriber);
  subscriber({ ...syncState });
  return () => {
    syncSubscribers.delete(subscriber);
  };
};

const notifySyncSubscribers = () => {
  syncSubscribers.forEach((cb) => cb({ ...syncState }));
};

const updateSyncState = (partial: Partial<SyncState>) => {
  syncState = { ...syncState, ...partial };
  if (partial.lastSyncedTime) {
    localStorage.setItem('medstock_last_sync_time', partial.lastSyncedTime);
  }
  if (partial.spreadsheetUrl) {
    localStorage.setItem('medstock_spreadsheet_url', partial.spreadsheetUrl);
  }
  notifySyncSubscribers();
};

export const getSyncState = (): SyncState => ({ ...syncState });

/**
 * Creates or updates Google Spreadsheet with 3 detailed sheets:
 * 1. Current Stock (દવા સ્ટોક)
 * 2. Vitran Register (વિતરણ ખાતાવહી)
 * 3. TCL Chlorination Log (કુવા ક્લોરિનેશન)
 */
export const syncToGoogleSheets = async (
  token: string,
  payload: SyncDataPayload
): Promise<SyncResult> => {
  try {
    const spreadsheetTitle = `MedStock Health Register - ${payload.profile.centerNameGu || 'સબસેન્ટર'}`;

    // Check if spreadsheetId was already saved locally
    let spreadsheetId = localStorage.getItem('medstock_spreadsheet_id') || '';
    let spreadsheetUrl = localStorage.getItem('medstock_spreadsheet_url') || '';

    // If not found locally, search if spreadsheet already exists in user's Drive
    if (!spreadsheetId) {
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(
          spreadsheetTitle
        )}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.files && searchData.files.length > 0) {
          spreadsheetId = searchData.files[0].id;
          spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
          localStorage.setItem('medstock_spreadsheet_id', spreadsheetId);
          localStorage.setItem('medstock_spreadsheet_url', spreadsheetUrl);
        }
      }
    }

    // If still not found, create new spreadsheet with 3 sheets
    if (!spreadsheetId) {
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            title: spreadsheetTitle,
          },
          sheets: [
            { properties: { title: 'Current Stock (હાલનો સ્ટોક)' } },
            { properties: { title: 'Vitran Register (વિતરણ)' } },
            { properties: { title: 'TCL Chlorination (કુવા)' } },
          ],
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error?.message || 'નવું Google Sheet બનાવવામાં ભૂલ આવી.');
      }

      const createData = await createRes.json();
      spreadsheetId = createData.spreadsheetId;
      spreadsheetUrl = createData.spreadsheetUrl;
      localStorage.setItem('medstock_spreadsheet_id', spreadsheetId);
      localStorage.setItem('medstock_spreadsheet_url', spreadsheetUrl);
    }

    // 1. Prepare Data for Sheet 1: Current Stock
    const stockRows = [
      [
        'આઇટમ ID',
        'દવાનું નામ (ગુજરાતી)',
        'અંગ્રેજી નામ',
        'કેટેગરી',
        'હાલનો સ્ટોક',
        'યુનિટ',
        'મિનિમમ એલર્ટ જથ્થો',
        'સ્થિતિ (Status)',
      ],
      ...payload.stockItems.map((item) => {
        const totalStock = payload.getItemTotalStock(item.id);
        const isLow = totalStock <= item.minThreshold;
        return [
          item.id,
          item.nameGu,
          item.nameEn,
          item.category,
          totalStock,
          item.unitGu,
          item.minThreshold,
          isLow ? '⚠️ લો સ્ટોક' : '✅ સામાન્ય',
        ];
      }),
    ];

    // 2. Prepare Data for Sheet 2: Vitran Register
    const vitranRows = [
      [
        'તારીખ',
        'પ્રકાર (Action)',
        'દવાનું નામ',
        'બેચ નંબર',
        'ખુલતો જથ્થો',
        'મળેલ જથ્થો (+)',
        'વપરાશ/વિતરણ જથ્થો (-)',
        'બાકી જથ્થો',
        'યુનિટ',
        'કોને આપ્યો / ક્યાંથી મળ્યો',
        'રેફરન્સ નંબર',
        'નોંધ',
      ],
      ...payload.vitranEntries.map((e) => [
        e.date,
        e.action === 'INWARD' ? 'આવક (IN)' : 'વિતરણ (VITRAN)',
        e.itemNameGu,
        e.batchNumber,
        e.khultoJatho,
        e.malelJatho,
        e.vaprashJatho,
        e.bachat,
        e.unitGu,
        e.koneAapiyo,
        e.referenceNo || '-',
        e.notes || '-',
      ]),
    ];

    // 3. Prepare Data for Sheet 3: TCL Chlorination Log
    const tclRows = [
      [
        'તારીખ',
        'કુવાના માલિકનું નામ / સ્થળ',
        'વિસ્તાર/સ્થાન',
        'કુવાનો આકાર',
        'પાણીનો જથ્થો (લિટર)',
        'જરૂરી PPM',
        'વપરાયેલ TCL (ગ્રામ)',
        'વપરાયેલ TCL (કિ.ગ્રા.)',
        'OT ટેસ્ટ PPM',
        'કામગીરી કરનાર',
        'વિશેષ નોંધ',
      ],
      ...payload.tclLogs.map((t) => [
        t.date,
        t.wellOwnerName,
        t.location,
        t.shape === 'CIRCULAR' ? 'ગોળ કૂવો' : 'ચોરસ/લંબચોરસ સંપ',
        t.waterVolumeLiters,
        t.desiredPpm,
        t.tclUsedGrams,
        t.tclUsedKg,
        t.testedPpm,
        t.operatorName,
        t.notes || '-',
      ]),
    ];

    // 4. Update all 3 sheets via values.batchUpdate
    const updateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: [
            {
              range: 'Current Stock (હાલનો સ્ટોક)!A1:H100',
              values: stockRows,
            },
            {
              range: 'Vitran Register (વિતરણ)!A1:L500',
              values: vitranRows,
            },
            {
              range: 'TCL Chlorination (કુવા)!A1:K500',
              values: tclRows,
            },
          ],
        }),
      }
    );

    if (!updateRes.ok) {
      const err = await updateRes.json();
      throw new Error(err.error?.message || 'શીટ્સમાં ડેટા સેવ કરવામાં ભૂલ આવી.');
    }

    const timeStr = new Date().toLocaleTimeString('gu-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    updateSyncState({
      status: 'synced',
      lastSyncedTime: timeStr,
      spreadsheetUrl,
      error: null,
    });

    // Reset status to idle after 4 seconds
    setTimeout(() => {
      if (syncState.status === 'synced') {
        updateSyncState({ status: 'idle' });
      }
    }, 4000);

    return {
      success: true,
      spreadsheetId,
      spreadsheetUrl,
      timestamp: timeStr,
    };
  } catch (error: any) {
    console.error('Google Sheets sync error:', error);
    const timeStr = new Date().toLocaleTimeString('gu-IN');
    updateSyncState({
      status: 'error',
      error: error.message || 'અજ્ઞાત એરર આવી.',
    });
    return {
      success: false,
      error: error.message || 'અજ્ઞાત એરર આવી.',
      timestamp: timeStr,
    };
  }
};

// Debounced background sync trigger
let syncDebounceTimer: any = null;

export const queueBackgroundSync = (payload: SyncDataPayload, delayMs = 1500) => {
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
  }

  syncDebounceTimer = setTimeout(async () => {
    const token = cachedAccessToken;
    if (!token) {
      // User hasn't signed into Google yet, skip silently
      return;
    }

    updateSyncState({ status: 'syncing', error: null });
    await syncToGoogleSheets(token, payload);
  }, delayMs);
};
