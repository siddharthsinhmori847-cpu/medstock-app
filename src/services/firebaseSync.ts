import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
  getDocFromServer,
  writeBatch,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  StockItem,
  BatchItem,
  VitranEntry,
  TclLogEntry,
  RegisterProfile
} from '../types/inventory';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const databaseId = (firebaseConfig as any).firestoreDatabaseId || '(default)';

// Initialize Firestore with offline persistence
let db: Firestore;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  }, databaseId);
} catch {
  // If already initialized or unsupported in environment
  db = getFirestore(app, databaseId);
}

export { db };

// Connection test per skill instructions
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, '_connection_test', 'ping'));
    return true;
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.warn('Firestore is currently running offline with local cache.');
    } else {
      console.info('Firestore initialized:', error?.message || 'Ready');
    }
    return false;
  }
}

// Initial fire-and-forget connection test
testFirestoreConnection().catch(() => {});

// Cloud sync subscribers
type CloudSyncCallback = (data: {
  stockItems?: StockItem[];
  batches?: BatchItem[];
  vitranEntries?: VitranEntry[];
  tclLogs?: TclLogEntry[];
  profile?: RegisterProfile;
}) => void;

let isSyncInitialized = false;

/**
 * Sets up real-time listeners for all MedStock collections.
 * Whenever any device (Web or Mobile APK) changes data, this listener fires
 * and updates the local state in real-time.
 */
export function subscribeToCloudSync(callback: CloudSyncCallback): () => void {
  const unsubscribers: (() => void)[] = [];

  try {
    // 1. Stock Items
    const unsubItems = onSnapshot(collection(db, 'stock_items'), (snapshot) => {
      if (!snapshot.empty) {
        const items: StockItem[] = [];
        snapshot.forEach((d) => items.push(d.data() as StockItem));
        // Sort by createdAt or name
        items.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
        callback({ stockItems: items });
      }
    }, (err) => console.warn('Stock items sync listener note:', err));
    unsubscribers.push(unsubItems);

    // 2. Batches
    const unsubBatches = onSnapshot(collection(db, 'batches'), (snapshot) => {
      if (!snapshot.empty) {
        const batches: BatchItem[] = [];
        snapshot.forEach((d) => batches.push(d.data() as BatchItem));
        callback({ batches });
      }
    }, (err) => console.warn('Batches sync listener note:', err));
    unsubscribers.push(unsubBatches);

    // 3. Vitran Entries
    const unsubEntries = onSnapshot(collection(db, 'vitran_entries'), (snapshot) => {
      if (!snapshot.empty) {
        const entries: VitranEntry[] = [];
        snapshot.forEach((d) => entries.push(d.data() as VitranEntry));
        entries.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
        callback({ vitranEntries: entries });
      }
    }, (err) => console.warn('Vitran entries sync listener note:', err));
    unsubscribers.push(unsubEntries);

    // 4. TCL Logs
    const unsubTcl = onSnapshot(collection(db, 'tcl_logs'), (snapshot) => {
      if (!snapshot.empty) {
        const logs: TclLogEntry[] = [];
        snapshot.forEach((d) => logs.push(d.data() as TclLogEntry));
        logs.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
        callback({ tclLogs: logs });
      }
    }, (err) => console.warn('TCL logs sync listener note:', err));
    unsubscribers.push(unsubTcl);

    // 5. Profile Settings
    const unsubProfile = onSnapshot(doc(db, 'app_settings', 'profile'), (snap) => {
      if (snap.exists()) {
        callback({ profile: snap.data() as RegisterProfile });
      }
    }, (err) => console.warn('Profile sync listener note:', err));
    unsubscribers.push(unsubProfile);

    isSyncInitialized = true;
  } catch (err) {
    console.warn('Real-time sync subscription error:', err);
  }

  return () => {
    unsubscribers.forEach((u) => u());
  };
}

/**
 * Seed initial data to cloud if collections are empty
 */
export async function seedCloudIfEmpty(
  currentItems: StockItem[],
  currentBatches: BatchItem[],
  currentEntries: VitranEntry[],
  currentTcl: TclLogEntry[],
  currentProfile: RegisterProfile
) {
  try {
    const itemsSnap = await getDocs(collection(db, 'stock_items'));
    if (itemsSnap.empty && currentItems.length > 0) {
      console.log('Seeding initial data to Firestore cloud...');
      const batch = writeBatch(db);

      currentItems.forEach((item) => {
        batch.set(doc(db, 'stock_items', item.id), item);
      });
      currentBatches.forEach((b) => {
        batch.set(doc(db, 'batches', b.id), b);
      });
      currentEntries.forEach((e) => {
        batch.set(doc(db, 'vitran_entries', e.id), e);
      });
      currentTcl.forEach((t) => {
        batch.set(doc(db, 'tcl_logs', t.id), t);
      });
      batch.set(doc(db, 'app_settings', 'profile'), currentProfile);

      await batch.commit();
      console.log('Cloud seeding completed successfully.');
    }
  } catch (err) {
    console.warn('Seed cloud error (offline or delayed):', err);
  }
}

// Single item mutations to sync to cloud
export async function cloudSaveStockItem(item: StockItem) {
  try {
    await setDoc(doc(db, 'stock_items', item.id), item);
  } catch (err) {
    console.warn('cloudSaveStockItem offline note:', err);
  }
}

export async function cloudDeleteStockItem(itemId: string) {
  try {
    await deleteDoc(doc(db, 'stock_items', itemId));
  } catch (err) {
    console.warn('cloudDeleteStockItem offline note:', err);
  }
}

export async function cloudSaveBatch(batch: BatchItem) {
  try {
    await setDoc(doc(db, 'batches', batch.id), batch);
  } catch (err) {
    console.warn('cloudSaveBatch offline note:', err);
  }
}

export async function cloudDeleteBatch(batchId: string) {
  try {
    await deleteDoc(doc(db, 'batches', batchId));
  } catch (err) {
    console.warn('cloudDeleteBatch offline note:', err);
  }
}

export async function cloudSaveVitranEntry(entry: VitranEntry) {
  try {
    await setDoc(doc(db, 'vitran_entries', entry.id), entry);
  } catch (err) {
    console.warn('cloudSaveVitranEntry offline note:', err);
  }
}

export async function cloudSaveTclLog(log: TclLogEntry) {
  try {
    await setDoc(doc(db, 'tcl_logs', log.id), log);
  } catch (err) {
    console.warn('cloudSaveTclLog offline note:', err);
  }
}

export async function cloudDeleteTclLog(logId: string) {
  try {
    await deleteDoc(doc(db, 'tcl_logs', logId));
  } catch (err) {
    console.warn('cloudDeleteTclLog offline note:', err);
  }
}

export async function cloudSaveProfile(profile: RegisterProfile) {
  try {
    await setDoc(doc(db, 'app_settings', 'profile'), profile);
  } catch (err) {
    console.warn('cloudSaveProfile offline note:', err);
  }
}

export async function cloudSyncAllData(
  items: StockItem[],
  batches: BatchItem[],
  entries: VitranEntry[],
  tclLogs: TclLogEntry[],
  profile: RegisterProfile
) {
  try {
    const batch = writeBatch(db);
    items.forEach((item) => batch.set(doc(db, 'stock_items', item.id), item));
    batches.forEach((b) => batch.set(doc(db, 'batches', b.id), b));
    entries.forEach((e) => batch.set(doc(db, 'vitran_entries', e.id), e));
    tclLogs.forEach((t) => batch.set(doc(db, 'tcl_logs', t.id), t));
    batch.set(doc(db, 'app_settings', 'profile'), profile);
    await batch.commit();
    return true;
  } catch (err) {
    console.warn('cloudSyncAllData offline note:', err);
    return false;
  }
}
