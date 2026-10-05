import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import {
  StockItem,
  BatchItem,
  VitranEntry,
  RegisterProfile,
  TclLogEntry
} from '../types/inventory';
import {
  initialStockItems,
  initialBatches,
  initialVitranEntries,
  initialRegisterProfile,
  initialTclLogs
} from '../data/mockData';
import {
  queueBackgroundSync,
  subscribeSyncState,
  getSyncState,
  SyncState
} from '../utils/googleWorkspace';
import {
  subscribeToCloudSync,
  seedCloudIfEmpty,
  cloudSaveStockItem,
  cloudDeleteStockItem,
  cloudSaveBatch,
  cloudDeleteBatch,
  cloudSaveVitranEntry,
  cloudSaveTclLog,
  cloudDeleteTclLog,
  cloudSaveProfile,
  cloudSyncAllData
} from '../services/firebaseSync';

export interface StockInPayload {
  itemId: string;
  batchNumber?: string;
  mfgDate?: string;
  expiryDate?: string;
  quantity?: number;
  receivedFrom?: string;
  referenceNo?: string;
  notes?: string;
}

export interface VitranPayload {
  itemId: string;
  batchId?: string;
  date?: string;
  quantity?: number;
  koneAapiyo?: string;
  referenceNo?: string;
  notes?: string;
}

export type TclLogPayload = Omit<TclLogEntry, 'id' | 'timestamp'> & {
  deductFromStock?: boolean;
};

interface InventoryContextType {
  stockItems: StockItem[];
  batches: BatchItem[];
  vitranEntries: VitranEntry[];
  tclLogs: TclLogEntry[];
  profile: RegisterProfile;
  theme: 'dark' | 'light';
  syncState: SyncState;
  // Cloud & Offline Status (Web ⇄ Mobile APK live sync)
  isOnline: boolean;
  isCloudSyncing: boolean;
  lastCloudSync: string | null;
  syncToCloudNow: () => Promise<boolean>;
  // Theme
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  // Actions
  addStockIn: (payload: StockInPayload) => VitranEntry;
  addVitran: (payload: VitranPayload) => VitranEntry;
  addTclLog: (payload: TclLogPayload) => TclLogEntry;
  deleteTclLog: (id: string) => void;
  addNewStockItem: (item: Partial<StockItem>) => StockItem;
  updateStockItem: (itemId: string, updates: Partial<StockItem>) => void;
  deleteStockItem: (itemId: string) => void;
  updateItemThreshold: (itemId: string, threshold: number) => void;
  updateBatchQuantity: (batchId: string, quantity: number) => void;
  deleteBatch: (batchId: string) => void;
  updateProfile: (profile: Partial<RegisterProfile>) => void;
  resetToDefaults: () => void;
  clearAllData: () => void;
  // Helpers
  getItemTotalStock: (itemId: string) => number;
  getItemBatches: (itemId: string) => BatchItem[];
  getItemStats: (itemId: string) => {
    totalStock: number;
    totalReceived: number;
    totalDistributed: number;
    activeBatches: number;
    isLowStock: boolean;
  };
}

const STORAGE_KEYS = {
  ITEMS: 'medstock_clean_items_v4',
  BATCHES: 'medstock_clean_batches_v4',
  ENTRIES: 'medstock_clean_entries_v4',
  TCL_LOGS: 'medstock_clean_tcl_logs_v4',
  PROFILE: 'medstock_clean_profile_v4',
  THEME: 'medstock_theme_v4',
};

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      return savedTheme === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  const [stockItems, setStockItems] = useState<StockItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ITEMS);
      return saved ? JSON.parse(saved) : initialStockItems;
    } catch {
      return initialStockItems;
    }
  });

  const [batches, setBatches] = useState<BatchItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BATCHES);
      return saved ? JSON.parse(saved) : initialBatches;
    } catch {
      return initialBatches;
    }
  });

  const [vitranEntries, setVitranEntries] = useState<VitranEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ENTRIES);
      return saved ? JSON.parse(saved) : initialVitranEntries;
    } catch {
      return initialVitranEntries;
    }
  });

  const [tclLogs, setTclLogs] = useState<TclLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TCL_LOGS);
      return saved ? JSON.parse(saved) : initialTclLogs;
    } catch {
      return initialTclLogs;
    }
  });

  const [profile, setProfile] = useState<RegisterProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return saved ? JSON.parse(saved) : initialRegisterProfile;
    } catch {
      return initialRegisterProfile;
    }
  });

  const [syncState, setSyncState] = useState<SyncState>(getSyncState);
  const isFirstRender = useRef(true);

  // Subscribe to live background sync state
  useEffect(() => {
    const unsubscribe = subscribeSyncState((newState) => {
      setSyncState(newState);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (t: 'dark' | 'light') => {
    setThemeState(t);
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(stockItems));
  }, [stockItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
  }, [batches]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(vitranEntries));
  }, [vitranEntries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TCL_LOGS, JSON.stringify(tclLogs));
  }, [tclLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }, [profile]);

  const getItemTotalStock = (itemId: string): number => {
    return batches
      .filter((b) => b.itemId === itemId)
      .reduce((sum, b) => sum + Math.max(0, b.quantity), 0);
  };

  const getItemBatches = (itemId: string): BatchItem[] => {
    return batches
      .filter((b) => b.itemId === itemId)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  };

  const getItemStats = (itemId: string) => {
    const item = stockItems.find((i) => i.id === itemId);
    const totalStock = getItemTotalStock(itemId);
    const itemBatches = getItemBatches(itemId);
    const entries = vitranEntries.filter((e) => e.itemId === itemId);
    const totalReceived = entries.reduce((sum, e) => sum + e.malelJatho, 0);
    const totalDistributed = entries.reduce((sum, e) => sum + e.vaprashJatho, 0);
    const minThreshold = item?.minThreshold ?? 50;
    const isLowStock = totalStock <= minThreshold;

    return {
      totalStock,
      totalReceived,
      totalDistributed,
      activeBatches: itemBatches.filter((b) => b.quantity > 0).length,
      isLowStock,
    };
  };

  // Online / Offline & Cloud Synchronization State
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [lastCloudSync, setLastCloudSync] = useState<string | null>(null);

  // Monitor network online/offline transitions
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when reconnecting to internet
      seedCloudIfEmpty(stockItems, batches, vitranEntries, tclLogs, profile);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [stockItems, batches, vitranEntries, tclLogs, profile]);

  // Real-Time Cross-Device Synchronization (Web App ⇄ Android Mobile APK)
  useEffect(() => {
    // 1. If cloud is fresh, seed current items
    seedCloudIfEmpty(stockItems, batches, vitranEntries, tclLogs, profile);

    // 2. Real-time Firestore snapshot listener
    const unsubscribe = subscribeToCloudSync((incoming) => {
      setIsCloudSyncing(true);
      if (incoming.stockItems && incoming.stockItems.length > 0) {
        setStockItems(incoming.stockItems);
      }
      if (incoming.batches) {
        setBatches(incoming.batches);
      }
      if (incoming.vitranEntries) {
        setVitranEntries(incoming.vitranEntries);
      }
      if (incoming.tclLogs) {
        setTclLogs(incoming.tclLogs);
      }
      if (incoming.profile) {
        setProfile(incoming.profile);
      }
      setLastCloudSync(
        new Date().toLocaleTimeString('gu-IN', { hour: '2-digit', minute: '2-digit' })
      );
      setTimeout(() => setIsCloudSyncing(false), 400);
    });

    return unsubscribe;
  }, []);

  const syncToCloudNow = async (): Promise<boolean> => {
    setIsCloudSyncing(true);
    const success = await cloudSyncAllData(
      stockItems,
      batches,
      vitranEntries,
      tclLogs,
      profile
    );
    if (success) {
      setLastCloudSync(
        new Date().toLocaleTimeString('gu-IN', { hour: '2-digit', minute: '2-digit' })
      );
    }
    setIsCloudSyncing(false);
    return success;
  };

  // BACKGROUND SYNC: Whenever inventory transactions change, auto-push to Google Sheets!
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    queueBackgroundSync({
      stockItems,
      batches,
      vitranEntries,
      tclLogs,
      profile,
      getItemTotalStock,
    });
  }, [stockItems, batches, vitranEntries, tclLogs, profile]);

  // Add Stock IN (સ્ટોક આવક) - NO MANDATORY DATA (Safe smart fallbacks)
  const addStockIn = (payload: StockInPayload): VitranEntry => {
    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const item = stockItems.find((i) => i.id === payload.itemId) || stockItems[0];
    if (!item) {
      throw new Error('Stock Item not found');
    }

    const cleanBatchNo = (payload.batchNumber && payload.batchNumber.trim())
      ? payload.batchNumber.trim().toUpperCase()
      : `BTH-${Date.now().toString().slice(-5)}`;

    const qty = Math.max(0, Number(payload.quantity) || 1);
    const khultoJatho = getItemTotalStock(item.id);

    let existingBatch = batches.find(
      (b) => b.itemId === item.id && b.batchNumber.toUpperCase() === cleanBatchNo
    );

    let batchId = existingBatch?.id;
    let createdBatch: BatchItem | null = null;

    if (existingBatch) {
      setBatches((prev) =>
        prev.map((b) =>
          b.id === existingBatch!.id
            ? {
                ...b,
                quantity: b.quantity + qty,
                expiryDate: payload.expiryDate || b.expiryDate,
                mfgDate: payload.mfgDate || b.mfgDate,
                receivedFrom: payload.receivedFrom || b.receivedFrom,
              }
            : b
        )
      );
    } else {
      batchId = `batch-${Date.now()}`;
      const defaultExp = new Date();
      defaultExp.setFullYear(defaultExp.getFullYear() + 2);

      createdBatch = {
        id: batchId,
        itemId: item.id,
        batchNumber: cleanBatchNo,
        mfgDate: payload.mfgDate || today,
        expiryDate: payload.expiryDate || defaultExp.toISOString().split('T')[0],
        quantity: qty,
        initialQuantity: qty,
        receivedFrom: (payload.receivedFrom && payload.receivedFrom.trim()) || 'સરકારી દવા ભંડાર / THO',
        createdAt: now,
      };
      setBatches((prev) => [createdBatch!, ...prev]);
    }

    const bachat = khultoJatho + qty;

    const newEntry: VitranEntry = {
      id: `ent-${Date.now()}`,
      timestamp: now,
      date: today,
      action: 'INWARD',
      itemId: item.id,
      itemNameGu: item.nameGu,
      itemNameEn: item.nameEn,
      unitGu: item.unitGu,
      unitEn: item.unitEn,
      batchId: batchId!,
      batchNumber: cleanBatchNo,
      mfgDate: payload.mfgDate || today,
      expiryDate: payload.expiryDate || today,
      khultoJatho,
      malelJatho: qty,
      vaprashJatho: 0,
      koneAapiyo: (payload.receivedFrom && payload.receivedFrom.trim()) || 'સરકારી દવા ભંડાર (મુખ્ય સ્ટોક)',
      bachat,
      referenceNo: payload.referenceNo || `IN-${Date.now().toString().slice(-6)}`,
      notes: payload.notes || 'સ્ટોક આવક નોંધાયો',
    };

    setVitranEntries((prev) => [newEntry, ...prev]);

    // Live Cloud Sync (Web ⇄ Mobile APK)
    cloudSaveVitranEntry(newEntry);
    if (existingBatch) {
      cloudSaveBatch({
        ...existingBatch,
        quantity: existingBatch.quantity + qty,
        expiryDate: payload.expiryDate || existingBatch.expiryDate,
        mfgDate: payload.mfgDate || existingBatch.mfgDate,
        receivedFrom: payload.receivedFrom || existingBatch.receivedFrom,
      });
    } else if (createdBatch) {
      cloudSaveBatch(createdBatch);
    }

    return newEntry;
  };

  // Stock Vitran (દવા વિતરણ) - NO MANDATORY DATA (Safe smart fallbacks)
  const addVitran = (payload: VitranPayload): VitranEntry => {
    const now = new Date().toISOString();
    const item = stockItems.find((i) => i.id === payload.itemId) || stockItems[0];
    if (!item) {
      throw new Error('Stock item not found');
    }

    const qty = Math.max(0, Number(payload.quantity) || 1);

    // If batchId is not provided or not found, pick the first available batch or auto-create one!
    let batch = batches.find((b) => b.id === payload.batchId);
    if (!batch) {
      const itemBatches = batches.filter((b) => b.itemId === item.id);
      batch = itemBatches[0];
    }

    let batchId = batch?.id;
    let batchNumber = batch?.batchNumber || 'GEN-BATCH-01';

    if (!batch) {
      // Auto create a batch so transaction NEVER fails
      batchId = `batch-${Date.now()}`;
      const defaultBatch: BatchItem = {
        id: batchId,
        itemId: item.id,
        batchNumber,
        mfgDate: now.split('T')[0],
        expiryDate: now.split('T')[0],
        quantity: 0,
        initialQuantity: 0,
        receivedFrom: 'સામાન્ય સ્ટોક',
        createdAt: now,
      };
      setBatches((prev) => [defaultBatch, ...prev]);
      batch = defaultBatch;
    } else {
      setBatches((prev) =>
        prev.map((b) => (b.id === batch!.id ? { ...b, quantity: Math.max(0, b.quantity - qty) } : b))
      );
    }

    const khultoJatho = getItemTotalStock(item.id);
    const bachat = Math.max(0, khultoJatho - qty);

    const newEntry: VitranEntry = {
      id: `ent-${Date.now()}`,
      timestamp: now,
      date: payload.date || now.split('T')[0],
      action: 'VITRAN',
      itemId: item.id,
      itemNameGu: item.nameGu,
      itemNameEn: item.nameEn,
      unitGu: item.unitGu,
      unitEn: item.unitEn,
      batchId: batchId!,
      batchNumber,
      mfgDate: batch.mfgDate,
      expiryDate: batch.expiryDate,
      khultoJatho,
      malelJatho: 0,
      vaprashJatho: qty,
      koneAapiyo: (payload.koneAapiyo && payload.koneAapiyo.trim()) || 'સામાન્ય વિતરણ / લાભાર્થી',
      bachat,
      referenceNo: payload.referenceNo || `VIT-${Date.now().toString().slice(-6)}`,
      notes: payload.notes || '',
    };

    setVitranEntries((prev) => [newEntry, ...prev]);

    // Live Cloud Sync (Web ⇄ Mobile APK)
    cloudSaveVitranEntry(newEntry);
    if (batch) {
      cloudSaveBatch({
        ...batch,
        quantity: Math.max(0, batch.quantity - qty),
      });
    }

    return newEntry;
  };

  // Add TCL Well Chlorination Log Entry - NO MANDATORY DATA
  const addTclLog = (payload: TclLogPayload): TclLogEntry => {
    const now = new Date().toISOString();
    const newLog: TclLogEntry = {
      ...payload,
      wellOwnerName: (payload.wellOwnerName && payload.wellOwnerName.trim()) || 'ગામ પીવાનો કુવો / સંપ',
      location: (payload.location && payload.location.trim()) || 'મુખ્ય ગામ',
      waterVolumeLiters: payload.waterVolumeLiters || 10000,
      tclUsedGrams: payload.tclUsedGrams || 80,
      tclUsedKg: payload.tclUsedKg || 0.08,
      desiredPpm: payload.desiredPpm || 2.0,
      id: `tcl-${Date.now()}`,
      timestamp: now,
    };

    setTclLogs((prev) => [newLog, ...prev]);

    // Live Cloud Sync (Web ⇄ Mobile APK)
    cloudSaveTclLog(newLog);

    // Optionally record auto-vitran of TCL powder if user checked deductFromStock
    if (payload.deductFromStock !== false) {
      const chlorinePowderItem = stockItems.find((i) => i.key === 'clorine-powder');
      if (chlorinePowderItem) {
        const availableBatches = getItemBatches(chlorinePowderItem.id);
        const batch = availableBatches[0];
        const kgUsed = Math.max(0.05, Number((newLog.tclUsedKg || 0.08).toFixed(2)));
        if (batch) {
          try {
            addVitran({
              itemId: chlorinePowderItem.id,
              batchId: batch.id,
              date: payload.date,
              quantity: kgUsed,
              koneAapiyo: `કુવો ક્લોરિનેશન: ${newLog.wellOwnerName} (${newLog.location})`,
              referenceNo: `TCL-${newLog.id.slice(-5)}`,
              notes: `પાણી: ${newLog.waterVolumeLiters.toLocaleString()} લિટર, PPM: ${newLog.desiredPpm}`,
            });
          } catch (err) {
            console.warn('Auto stock deduction skipped:', err);
          }
        }
      }
    }

    return newLog;
  };

  const deleteTclLog = (id: string) => {
    setTclLogs((prev) => prev.filter((log) => log.id !== id));
    cloudDeleteTclLog(id);
  };

  const addNewStockItem = (itemData: Partial<StockItem>): StockItem => {
    const newItem: StockItem = {
      id: `item-${Date.now()}`,
      key: itemData.key || `custom-${Date.now()}`,
      nameGu: (itemData.nameGu && itemData.nameGu.trim()) || 'નવી દવા',
      nameEn: (itemData.nameEn && itemData.nameEn.trim()) || 'Medicine',
      category: (itemData.category && itemData.category.trim()) || 'જનરલ દવાઓ',
      unitGu: (itemData.unitGu && itemData.unitGu.trim()) || 'ગોળી (Tabs)',
      unitEn: (itemData.unitEn && itemData.unitEn.trim()) || 'Tabs',
      minThreshold: itemData.minThreshold !== undefined ? Math.max(0, itemData.minThreshold) : 20,
      description: itemData.description || '',
      createdAt: new Date().toISOString(),
    };
    setStockItems((prev) => [...prev, newItem]);
    cloudSaveStockItem(newItem);
    return newItem;
  };

  const updateStockItem = (itemId: string, updates: Partial<StockItem>) => {
    setStockItems((prev) =>
      prev.map((i) => {
        if (i.id === itemId) {
          const updated = { ...i, ...updates };
          cloudSaveStockItem(updated);
          return updated;
        }
        return i;
      })
    );
  };

  const deleteStockItem = (itemId: string) => {
    setStockItems((prev) => prev.filter((i) => i.id !== itemId));
    setBatches((prev) => prev.filter((b) => b.itemId !== itemId));
    cloudDeleteStockItem(itemId);
  };

  const updateItemThreshold = (itemId: string, threshold: number) => {
    setStockItems((prev) =>
      prev.map((i) => {
        if (i.id === itemId) {
          const updated = { ...i, minThreshold: Math.max(0, threshold) };
          cloudSaveStockItem(updated);
          return updated;
        }
        return i;
      })
    );
  };

  const updateBatchQuantity = (batchId: string, quantity: number) => {
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id === batchId) {
          const updated = { ...b, quantity: Math.max(0, quantity) };
          cloudSaveBatch(updated);
          return updated;
        }
        return b;
      })
    );
  };

  const deleteBatch = (batchId: string) => {
    setBatches((prev) => prev.filter((b) => b.id !== batchId));
    cloudDeleteBatch(batchId);
  };

  const updateProfile = (newProfile: Partial<RegisterProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...newProfile };
      cloudSaveProfile(updated);
      return updated;
    });
  };

  // Fresh reset: completely clears all batches, stock transactions and logs
  const clearAllData = () => {
    setBatches([]);
    setVitranEntries([]);
    setTclLogs([]);
    localStorage.removeItem(STORAGE_KEYS.BATCHES);
    localStorage.removeItem(STORAGE_KEYS.ENTRIES);
    localStorage.removeItem(STORAGE_KEYS.TCL_LOGS);
    localStorage.removeItem('medstock_dark_batches_v3');
    localStorage.removeItem('medstock_dark_entries_v3');
    localStorage.removeItem('medstock_dark_tcl_logs_v3');
  };

  const resetToDefaults = () => {
    clearAllData();
    setStockItems(initialStockItems);
    setProfile(initialRegisterProfile);
    cloudSyncAllData(initialStockItems, [], [], [], initialRegisterProfile);
  };

  return (
    <InventoryContext.Provider
      value={{
        stockItems,
        batches,
        vitranEntries,
        tclLogs,
        profile,
        theme,
        syncState,
        isOnline,
        isCloudSyncing,
        lastCloudSync,
        syncToCloudNow,
        toggleTheme,
        setTheme,
        addStockIn,
        addVitran,
        addTclLog,
        deleteTclLog,
        addNewStockItem,
        updateStockItem,
        deleteStockItem,
        updateItemThreshold,
        updateBatchQuantity,
        deleteBatch,
        updateProfile,
        resetToDefaults,
        clearAllData,
        getItemTotalStock,
        getItemBatches,
        getItemStats,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
