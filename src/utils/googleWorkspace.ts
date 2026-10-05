import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
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

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else if (user) {
      // User is signed in to Firebase but we need accessToken from popup
      if (onAuthSuccess && cachedAccessToken) {
        onAuthSuccess(user, cachedAccessToken);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google OAuth access token મેળવી શકાયો નથી.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
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

    // 1. Search if spreadsheet already exists in user's Drive
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(
        spreadsheetTitle
      )}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    let spreadsheetId = '';
    let spreadsheetUrl = '';

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        spreadsheetId = searchData.files[0].id;
        spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
      }
    }

    // 2. If not found, create new spreadsheet with 3 sheets
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
    }

    // 3. Prepare Data for Sheet 1: Current Stock
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

    // 4. Prepare Data for Sheet 2: Vitran Register
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

    // 5. Prepare Data for Sheet 3: TCL Chlorination Log
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

    // 6. Update all 3 sheets via values.batchUpdate
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
              range: 'Current Stock (હાલનો સ્ટોક)!A1',
              values: stockRows,
            },
            {
              range: 'Vitran Register (વિતરણ)!A1',
              values: vitranRows,
            },
            {
              range: 'TCL Chlorination (કુવા)!A1',
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

    return {
      success: true,
      spreadsheetId,
      spreadsheetUrl,
      timestamp: new Date().toLocaleTimeString('gu-IN'),
    };
  } catch (error: any) {
    console.error('Google Sheets sync error:', error);
    return {
      success: false,
      error: error.message || 'અજ્ઞાત એરર આવી.',
      timestamp: new Date().toLocaleTimeString('gu-IN'),
    };
  }
};
