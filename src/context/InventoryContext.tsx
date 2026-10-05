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

export interface StockInPayload {
  itemId: string;
  batchNumber: string;
  mfgDate: string;
  expiryDate: string;
  quantity: number;
  receivedFrom?: string;
  referenceNo?: string;
  notes?: string;
}

export interface VitranPayload {
  itemId: string;
  batchId: string;
  date: string;
  quantity: number;
  koneAapiyo: string;
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
  // Theme
  toggleTheme: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  // Actions
  addStockIn: (payload: StockInPayload) => VitranEntry;
  addVitran: (payload: VitranPayload) => VitranEntry;
  addTclLog: (payload: TclLogPayload) => TclLogEntry;
  deleteTclLog: (id: string) => void;
  addNewStockItem: (item: Omit<StockItem, 'id' | 'createdAt'>) => StockItem;
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

  // Add Stock IN (સ્ટોક આવક)
  const addStockIn = (payload: StockInPayload): VitranEntry => {
    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const item = stockItems.find((i) => i.id === payload.itemId);
    if (!item) throw new Error('Stock Item not found');

    const cleanBatchNo = payload.batchNumber.trim().toUpperCase();
    const khultoJatho = getItemTotalStock(payload.itemId);

    let existingBatch = batches.find(
      (b) => b.itemId === payload.itemId && b.batchNumber.toUpperCase() === cleanBatchNo
    );

    let batchId = existingBatch?.id;

    if (existingBatch) {
      setBatches((prev) =>
        prev.map((b) =>
          b.id === existingBatch!.id
            ? {
                ...b,
                quantity: b.quantity + payload.quantity,
                expiryDate: payload.expiryDate || b.expiryDate,
                mfgDate: payload.mfgDate || b.mfgDate,
                receivedFrom: payload.receivedFrom || b.receivedFrom,
              }
            : b
        )
      );
    } else {
      batchId = `batch-${Date.now()}`;
      const newBatch: BatchItem = {
        id: batchId,
        itemId: payload.itemId,
        batchNumber: cleanBatchNo,
        mfgDate: payload.mfgDate,
        expiryDate: payload.expiryDate,
        quantity: payload.quantity,
        initialQuantity: payload.quantity,
        receivedFrom: payload.receivedFrom || 'મુખ્ય ડેપો / ગોડાઉન',
        createdAt: now,
      };
      setBatches((prev) => [newBatch, ...prev]);
    }

    const bachat = khultoJatho + payload.quantity;

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
      mfgDate: payload.mfgDate,
      expiryDate: payload.expiryDate,
      khultoJatho,
      malelJatho: payload.quantity,
      vaprashJatho: 0,
      koneAapiyo: payload.receivedFrom ? `${payload.receivedFrom} (આવક ચલન)` : 'સરકારી દવા ભંડાર (મુખ્ય સ્ટોક)',
      bachat,
      referenceNo: payload.referenceNo || `IN-${Date.now().toString().slice(-6)}`,
      notes: payload.notes || 'નવો સ્ટોક આવક નોંધાયો',
    };

    setVitranEntries((prev) => [newEntry, ...prev]);
    return newEntry;
  };

  // Stock Vitran (દવા વિતરણ)
  const addVitran = (payload: VitranPayload): VitranEntry => {
    const now = new Date().toISOString();
    const item = stockItems.find((i) => i.id === payload.itemId);
    if (!item) throw new Error('Stock item not found');

    const batch = batches.find((b) => b.id === payload.batchId);
    if (!batch) throw new Error('Batch not found');

    if (batch.quantity < payload.quantity) {
      throw new Error(`પૂરતો સ્ટોક ઉપલબ્ધ નથી. બેચ ${batch.batchNumber} માં માત્ર: ${batch.quantity} ${item.unitGu}`);
    }

    const khultoJatho = getItemTotalStock(payload.itemId);

    setBatches((prev) =>
      prev.map((b) => (b.id === batch.id ? { ...b, quantity: b.quantity - payload.quantity } : b))
    );

    const bachat = Math.max(0, khultoJatho - payload.quantity);

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
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      mfgDate: batch.mfgDate,
      expiryDate: batch.expiryDate,
      khultoJatho,
      malelJatho: 0,
      vaprashJatho: payload.quantity,
      koneAapiyo: payload.koneAapiyo,
      bachat,
      referenceNo: payload.referenceNo || `VIT-${Date.now().toString().slice(-6)}`,
      notes: payload.notes || '',
    };

    setVitranEntries((prev) => [newEntry, ...prev]);
    return newEntry;
  };

  // Add TCL Well Chlorination Log Entry
  const addTclLog = (payload: TclLogPayload): TclLogEntry => {
    const now = new Date().toISOString();
    const newLog: TclLogEntry = {
      ...payload,
      id: `tcl-${Date.now()}`,
      timestamp: now,
    };

    setTclLogs((prev) => [newLog, ...prev]);

    // Optionally record auto-vitran of TCL powder if user checked deductFromStock
    if (payload.deductFromStock !== false) {
      const chlorinePowderItem = stockItems.find((i) => i.key === 'clorine-powder');
      if (chlorinePowderItem) {
        const availableBatches = getItemBatches(chlorinePowderItem.id).filter((b) => b.quantity > 0);
        if (availableBatches.length > 0) {
          const batch = availableBatches[0];
          const kgUsed = Math.max(0.1, Number(payload.tclUsedKg.toFixed(2)));
          if (batch.quantity >= kgUsed) {
            try {
              addVitran({
                itemId: chlorinePowderItem.id,
                batchId: batch.id,
                date: payload.date,
                quantity: kgUsed,
                koneAapiyo: `કુવો ક્લોરિનેશન: ${payload.wellOwnerName} (${payload.location})`,
                referenceNo: `TCL-${newLog.id.slice(-5)}`,
                notes: `પાણી: ${payload.waterVolumeLiters.toLocaleString()} લિટર, વ્યાસ: ${payload.wellDiameter || '-'}m, ઊંડાઈ: ${payload.waterDepth}m, PPM: ${payload.desiredPpm}`,
              });
            } catch (err) {
              console.warn('Auto stock deduction skipped:', err);
            }
          }
        }
      }
    }

    return newLog;
  };

  const deleteTclLog = (id: string) => {
    setTclLogs((prev) => prev.filter((log) => log.id !== id));
  };

  const addNewStockItem = (itemData: Omit<StockItem, 'id' | 'createdAt'>): StockItem => {
    const newItem: StockItem = {
      ...itemData,
      id: `item-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setStockItems((prev) => [...prev, newItem]);
    return newItem;
  };

  const updateStockItem = (itemId: string, updates: Partial<StockItem>) => {
    setStockItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, ...updates } : i))
    );
  };

  const deleteStockItem = (itemId: string) => {
    setStockItems((prev) => prev.filter((i) => i.id !== itemId));
    setBatches((prev) => prev.filter((b) => b.itemId !== itemId));
  };

  const updateItemThreshold = (itemId: string, threshold: number) => {
    setStockItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, minThreshold: Math.max(0, threshold) } : i))
    );
  };

  const updateBatchQuantity = (batchId: string, quantity: number) => {
    setBatches((prev) =>
      prev.map((b) => (b.id === batchId ? { ...b, quantity: Math.max(0, quantity) } : b))
    );
  };

  const deleteBatch = (batchId: string) => {
    setBatches((prev) => prev.filter((b) => b.id !== batchId));
  };

  const updateProfile = (newProfile: Partial<RegisterProfile>) => {
    setProfile((prev) => ({ ...prev, ...newProfile }));
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
