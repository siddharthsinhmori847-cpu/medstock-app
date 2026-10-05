import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Sun,
  Moon,
  Trash2,
  Edit2,
  Plus,
  RefreshCw,
  Cloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Package,
  Save,
  Check,
  ExternalLink,
  LogOut,
  Download,
  Info,
  Smartphone,
  Globe,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useInventory } from '../context/InventoryContext';
import { StockItem } from '../types/inventory';
import { exportStockDataToCsv } from '../utils/exportCsv';
import {
  googleSignIn,
  googleSignInWithRedirect,
  signInWithGis,
  logoutGoogle,
  syncToGoogleSheets,
  initAuth,
  getAccessToken
} from '../utils/googleWorkspace';
import { User } from 'firebase/auth';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddItem: () => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenAddItem,
}) => {
  const {
    stockItems,
    batches,
    vitranEntries,
    tclLogs,
    profile,
    theme,
    setTheme,
    updateStockItem,
    deleteStockItem,
    updateBatchQuantity,
    deleteBatch,
    clearAllData,
    getItemTotalStock,
    isOnline,
    isCloudSyncing,
    lastCloudSync,
    syncToCloudNow
  } = useInventory();

  const [activeTab, setActiveTab] = useState<'STOCK' | 'THEME' | 'CLOUD' | 'SHEETS' | 'DATA'>('STOCK');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editNameGu, setEditNameGu] = useState('');
  const [editUnitGu, setEditUnitGu] = useState('');
  const [editThreshold, setEditThreshold] = useState<number>(0);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  // Google Auth & Auto-save states
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncUrl, setLastSyncUrl] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setSyncError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);
        handleManualSync(res.accessToken);
      }
    } catch (err: any) {
      console.error('Google Sign in error:', err);
      const code = err.code || '';
      const msg = err.message || '';
      if (code.includes('network-request-failed') || msg.includes('network-request-failed')) {
        setSyncError(
          'નેટવર્ક અથવા પોપ-અપ વિન્ડો કનેક્શન છૂટી ગયું છે. કૃપા કરીને તમારું ઇન્ટરનેટ કનેક્શન ચેક કરી "ફરી પ્રયત્ન કરો" અથવા નીચે આપેલા "મોબાઇલ રીડાયરેક્ટ સાઇન-ઇન" / "Excel ડાઉનલોડ" બટનનો ઉપયોગ કરો.'
        );
      } else if (code.includes('popup-closed-by-user') || msg.includes('popup-closed')) {
        setSyncError('સાઇન-ઇન વિન્ડો બંધ થઈ ગઈ હતી. કૃપા કરીને ફરી Sign in પર ક્લિક કરો.');
      } else if (code.includes('unauthorized-domain') || msg.includes('unauthorized-domain')) {
        setSyncError(
          'Google સુરક્ષા મંજૂરી અપડેટ થઈ રહી છે. કૃપા કરીને ફરી Sign in પર ક્લિક કરો અથવા સીધું ૧-ક્લિક Excel ડાઉનલોડ વાપરો.'
        );
      } else {
        setSyncError(err.message || 'Google સાઇન-ઇન નિષ્ફળ રહ્યું. કૃપા કરીને ફરી પ્રયાસ કરો.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRedirectLogin = async () => {
    setIsLoggingIn(true);
    setSyncError(null);
    try {
      await googleSignInWithRedirect();
    } catch (err: any) {
      setSyncError(err.message || 'રીડાયરેક્ટ સાઇન-ઇન શરૂ થઈ શક્યું નથી.');
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setGoogleToken(null);
    setLastSyncUrl(null);
  };

  const handleManualSync = async (overrideToken?: string) => {
    const token = overrideToken || googleToken || (await getAccessToken());
    if (!token) {
      setSyncError('કૃપા કરીને પહેલા Google એકાઉન્ટ સાથે સાઇન-ઇન કરો.');
      return;
    }

    setIsSyncing(true);
    setSyncError(null);

    const result = await syncToGoogleSheets(token, {
      stockItems,
      batches,
      vitranEntries,
      tclLogs,
      profile,
      getItemTotalStock,
    });

    setIsSyncing(false);

    if (result.success && result.spreadsheetUrl) {
      setLastSyncUrl(result.spreadsheetUrl);
      setLastSyncTime(result.timestamp);
    } else {
      setSyncError(result.error || 'શીટ્સમાં સેવ થઈ શક્યું નથી.');
    }
  };

  if (!isOpen) return null;

  const startEditItem = (item: StockItem) => {
    setEditingItemId(item.id);
    setEditNameGu(item.nameGu);
    setEditUnitGu(item.unitGu);
    setEditThreshold(item.minThreshold);
  };

  const saveEditItem = (itemId: string) => {
    updateStockItem(itemId, {
      nameGu: editNameGu.trim() || 'દવા',
      unitGu: editUnitGu.trim() || 'નંગ',
      minThreshold: editThreshold || 0,
    });
    setEditingItemId(null);
  };

  const handleDeleteItem = (item: StockItem) => {
    if (window.confirm(`શું તમે '${item.nameGu}' ને સ્ટોક લિસ્ટમાંથી કાઢી નાખવા માંગો છો?`)) {
      deleteStockItem(item.id);
    }
  };

  const handleClearAll = () => {
    clearAllData();
    setConfirmClearOpen(false);
    alert('બધો ડેટા સાફ થઈ ગયો છે! હવે તમારું રજિસ્ટર એકદમ ફ્રેશ (૦ સ્ટોક) છે.');
  };

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border transition-colors ${
          isDark ? 'bg-[#0f172a] text-slate-100 border-slate-700' : 'bg-white text-slate-900 border-slate-200'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-5 flex items-center justify-between border-b ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              <Settings className="w-5 h-5 text-teal-500" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">એડમિન કંટ્રોલ અને સેટિંગ્સ</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                સ્ટોક એડિટ, થીમ, Google શીટ્સ, APK અપડેટ અને ફ્રેશ ડેટા
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-200 text-slate-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className={`flex border-b overflow-x-auto text-xs font-bold scrollbar-none ${
            isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-100/70'
          }`}
        >
          <button
            onClick={() => setActiveTab('STOCK')}
            className={`flex-1 min-w-[105px] py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'STOCK'
                ? 'border-teal-500 text-teal-500 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>સ્ટોક મેનેજ</span>
          </button>

          <button
            onClick={() => setActiveTab('THEME')}
            className={`flex-1 min-w-[105px] py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'THEME'
                ? 'border-teal-500 text-teal-500 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            <span>થીમ</span>
          </button>

          <button
            onClick={() => setActiveTab('CLOUD')}
            className={`flex-1 min-w-[130px] py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'CLOUD'
                ? 'border-cyan-500 text-cyan-500 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>ક્લાઉડ સિંક (Web ⇄ App)</span>
          </button>

          <button
            onClick={() => setActiveTab('SHEETS')}
            className={`flex-1 min-w-[115px] py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'SHEETS'
                ? 'border-emerald-500 text-emerald-500 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Google Sheets</span>
          </button>

          <button
            onClick={() => setActiveTab('DATA')}
            className={`flex-1 min-w-[105px] py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'DATA'
                ? 'border-rose-500 text-rose-500 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>ફ્રેશ ડેટા</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1: STOCK MANAGEMENT */}
          {activeTab === 'STOCK' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">દવા / આઇટમ સૂચિ (Master Items)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    અહીંથી તમે દવા સ્ટોક સુધારી શકો છો અથવા નવી દવા ઉમેરી શકો છો.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAddItem();
                  }}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ નવી દવા ઉમેરો</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {stockItems.map((item) => {
                  const currentStock = getItemTotalStock(item.id);
                  const isEditing = editingItemId === item.id;

                  if (isEditing) {
                    return (
                      <div
                        key={item.id}
                        className={`p-3.5 rounded-xl border space-y-3 ${
                          isDark ? 'bg-slate-800/80 border-teal-500/40' : 'bg-teal-50/50 border-teal-300'
                        }`}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold block mb-1">આઇટમનું નામ (ગુજરાતી)</label>
                            <input
                              type="text"
                              value={editNameGu}
                              onChange={(e) => setEditNameGu(e.target.value)}
                              className={`w-full px-3 py-1.5 text-xs font-bold rounded-lg border outline-none ${
                                isDark
                                  ? 'bg-slate-900 border-slate-700 text-white'
                                  : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold block mb-1">યુનિટ (જેમ કે: Kg, ગોળી, બોટલ)</label>
                            <input
                              type="text"
                              value={editUnitGu}
                              onChange={(e) => setEditUnitGu(e.target.value)}
                              className={`w-full px-3 py-1.5 text-xs font-bold rounded-lg border outline-none ${
                                isDark
                                  ? 'bg-slate-900 border-slate-700 text-white'
                                  : 'bg-white border-slate-300 text-slate-900'
                              }`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold block mb-1">
                            મિનિમમ એલર્ટ જથ્થો (Low stock alert limit)
                          </label>
                          <input
                            type="number"
                            value={editThreshold}
                            onChange={(e) => setEditThreshold(Number(e.target.value))}
                            className={`w-full max-w-[200px] px-3 py-1.5 text-xs font-bold rounded-lg border outline-none ${
                              isDark
                                ? 'bg-slate-900 border-slate-700 text-white'
                                : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => saveEditItem(item.id)}
                            className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>સેવ કરો</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingItemId(null)}
                            className="px-3 py-1.5 bg-slate-500 hover:bg-slate-400 text-white text-xs font-bold rounded-lg cursor-pointer"
                          >
                            રદ્દ કરો
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        isDark ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{item.nameGu}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/10 font-bold text-slate-500 dark:text-slate-400">
                            {item.unitGu}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          <span>
                            હાલનો સ્ટોક: <strong className="text-teal-600 dark:text-teal-400">{currentStock}</strong> {item.unitGu}
                          </span>
                          <span>•</span>
                          <span>એલર્ટ લિમિટ: {item.minThreshold}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditItem(item)}
                          title="સુધારો કરો"
                          className="p-1.5 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 rounded-lg cursor-pointer transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item)}
                          title="આઇટમ કાઢો"
                          className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Batches direct stock adjustment */}
              {batches.length > 0 && (
                <div className="pt-4 border-t dark:border-slate-800 border-slate-200 space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                    હાલની બેચ સ્ટોક વિગત (Direct Batch Adjustment)
                  </h4>
                  <div className="space-y-2">
                    {batches.map((batch) => {
                      const item = stockItems.find((i) => i.id === batch.itemId);
                      return (
                        <div
                          key={batch.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                          }`}
                        >
                          <div>
                            <span className="font-bold">{item?.nameGu || 'દવા'}</span>
                            <span className="text-[11px] font-mono text-slate-400 ml-2">
                              બેચ: {batch.batchNumber}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400">જથ્થો:</span>
                            <input
                              type="number"
                              min="0"
                              value={batch.quantity}
                              onChange={(e) => updateBatchQuantity(batch.id, Number(e.target.value))}
                              className={`w-20 px-2 py-1 text-center font-bold rounded-lg border outline-none ${
                                isDark
                                  ? 'bg-slate-800 border-slate-700 text-emerald-400'
                                  : 'bg-slate-100 border-slate-300 text-emerald-700'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`બેચ ${batch.batchNumber} કાઢી નાખવી છે?`)) {
                                  deleteBatch(batch.id);
                                }
                              }}
                              className="text-rose-500 hover:bg-rose-500/10 p-1 rounded-md"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: THEME SWITCH */}
          {activeTab === 'THEME' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm">થીમ મોડ પસંદ કરો (Color Theme)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  તમારી અનુકૂળતા મુજબ ડાર્ક મોડ 🌙 અથવા લાઇટ મોડ ☀️ પસંદ કરો.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2">
                <div
                  onClick={() => setTheme('dark')}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 cursor-pointer transition-all ${
                    isDark
                      ? 'border-teal-500 bg-teal-500/10 shadow-lg scale-[1.02]'
                      : 'border-slate-300 hover:border-slate-400 bg-slate-900 text-white'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#070d18] border border-teal-500/40 flex items-center justify-center text-teal-400">
                    <Moon className="w-6 h-6 text-teal-400" />
                  </div>
                  <div className="text-center">
                    <h4 className="font-black text-sm">ડાર્ક મોડ (Dark Mode)</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">રાત્રે અને નિયમિત વપરાશ માટે</p>
                  </div>
                  {isDark && (
                    <span className="text-[10px] bg-teal-500 text-slate-950 font-black px-2.5 py-0.5 rounded-full">
                      સક્રિય (ACTIVE)
                    </span>
                  )}
                </div>

                <div
                  onClick={() => setTheme('light')}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 cursor-pointer transition-all ${
                    !isDark
                      ? 'border-teal-600 bg-teal-50 shadow-lg scale-[1.02]'
                      : 'border-slate-700 hover:border-slate-600 bg-slate-100 text-slate-900'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-white border border-teal-600/40 flex items-center justify-center text-amber-500 shadow-sm">
                    <Sun className="w-6 h-6 text-amber-500" />
                  </div>
                  <div className="text-center">
                    <h4 className="font-black text-sm text-slate-900">લાઇટ મોડ (Light Mode)</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">દિવસના અજવાળા અને પ્રિન્ટ માટે</p>
                  </div>
                  {!isDark && (
                    <span className="text-[10px] bg-teal-600 text-white font-black px-2.5 py-0.5 rounded-full">
                      સક્રિય (ACTIVE)
                    </span>
                  )}
                </div>
              </div>

              {/* Android APK Download Card */}
              <div
                className={`p-4 rounded-2xl border ${
                  isDark
                    ? 'bg-gradient-to-r from-indigo-950/40 via-slate-900 to-indigo-950/30 border-indigo-500/30'
                    : 'bg-gradient-to-r from-indigo-50 via-white to-indigo-50/70 border-indigo-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <Download className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          MedStock Android APK (v2.7.0 અપડેટ)
                        </h4>
                        <span className="text-[10px] font-black bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                          GitHub Release
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        નેટિવ PDF ડાઉનલોડ, પ્રિન્ટ અને WhatsApp શેર સપોર્ટ સાથેનું અદ્યતન એન્ડ્રોઇડ વર્ઝન ડાઉનલોડ કરો.
                      </p>
                    </div>
                  </div>

                  <a
                    href="https://github.com/siddharthsinhmori847-cpu/medstock-app/releases/download/v2.7.0/medstock-app.apk"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>નવું APK ડાઉનલોડ કરો</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB: REAL-TIME CLOUD SYNC (WEB ⇄ MOBILE APK) */}
          {activeTab === 'CLOUD' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-cyan-500" />
                  <span>Web ⇄ Mobile લાઇવ ક્લાઉડ સિંક (ઓનલાઇન & ઓફલાઇન)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  વેબ એપ્લિકેશન અને મોબાઇલ APK બંને આપોઆપ જોડાયેલા છે. એક જગ્યાએ ડેટા નાખશો એટલે બીજી જગ્યાએ તરત જ આવી જશે.
                </p>
              </div>

              {/* Live Status Card */}
              <div
                className={`p-4 rounded-2xl border ${
                  isDark
                    ? isOnline
                      ? 'bg-cyan-950/20 border-cyan-500/30'
                      : 'bg-amber-950/20 border-amber-500/30'
                    : isOnline
                    ? 'bg-cyan-50/70 border-cyan-200'
                    : 'bg-amber-50/70 border-amber-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isOnline
                          ? 'bg-cyan-500/20 text-cyan-400'
                          : 'bg-amber-500/20 text-amber-500'
                      }`}
                    >
                      {isOnline ? (
                        <Wifi className="w-5 h-5 text-cyan-500" />
                      ) : (
                        <WifiOff className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm">
                          {isOnline ? 'લાઇવ ક્લાઉડ કનેક્શન સક્રિય (Online)' : 'ઓફલાઇન મોડ (Offline)'}
                        </h4>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            isOnline
                              ? 'bg-emerald-500/20 text-emerald-500 dark:text-emerald-400'
                              : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {isOnline ? 'લાઇવ જોડાયેલું' : 'સ્થાનિક સેવ'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {isOnline
                          ? `છેલ્લે ક્લાઉડ સિંક થયું: ${lastCloudSync || 'હમણાં જ'}`
                          : 'ઇન્ટરનેટ બંધ છે. તમારો તમામ ડેટા તમારા ફોનમાં સુરક્ષિત સેવ છે. નેટ ચાલુ થતાં જ સિંક થશે.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => syncToCloudNow()}
                    disabled={isCloudSyncing}
                    className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
                  >
                    <RefreshCw className={`w-4 h-4 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                    <span>{isCloudSyncing ? 'સિંક થઈ રહ્યું છે...' : 'હમણાં સિંક કરો (Force Sync)'}</span>
                  </button>
                </div>
              </div>

              {/* 3 Step Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  className={`p-3.5 rounded-xl border ${
                    isDark ? 'bg-slate-800/40 border-slate-700/80' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center mb-2">
                    <Globe className="w-4 h-4 text-teal-500" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    ૧. વેબ એપમાં ડેટા નાખો
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    કમ્પ્યુટર અથવા બ્રાઉઝરમાં સ્ટોક આવક, વિતરણ કે કુવો ક્લોરિનેશન એન્ટ્રી કરો.
                  </p>
                </div>

                <div
                  className={`p-3.5 rounded-xl border ${
                    isDark ? 'bg-slate-800/40 border-slate-700/80' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-2">
                    <Smartphone className="w-4 h-4 text-cyan-500" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    ૨. મોબાઇલમાં તરત આવશે
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    તમારા Android મોબાઇલ APK માં કોઈપણ રીલોડ વગર ડેટા આપોઆપ લાઈવ દેખાશે!
                  </p>
                </div>

                <div
                  className={`p-3.5 rounded-xl border ${
                    isDark ? 'bg-slate-800/40 border-slate-700/80' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    ૩. ઓફલાઇન પણ કામ કરશે
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    ઇન્ટરનેટ ન હોય તો પણ કામ અટકશે નહીં. નેટ આવતાં જ આપોઆપ ક્લાઉડમાં અપડેટ થઈ જશે.
                  </p>
                </div>
              </div>

              {/* Web App Link Card */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-100 border-slate-200'
                }`}
              >
                <div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    કમ્પ્યુટર / બ્રાઉઝર માટે સત્તાવાર વેબ લિંક:
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 select-all break-all">
                    https://ais-pre-spisgiamnfph6xunhnkmxs-107416021501.asia-southeast1.run.app
                  </p>
                </div>
                <a
                  href="https://ais-pre-spisgiamnfph6xunhnkmxs-107416021501.asia-southeast1.run.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>વેબ લિંક ખોલો</span>
                </a>
              </div>
            </div>
          )}

          {/* TAB 3: GOOGLE SHEETS & DRIVE AUTO-SAVE */}
          {activeTab === 'SHEETS' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <span>Google Sheets & Google Drive ઓટો-સેવ</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  તમારો તમામ સ્ટોક, આવક, વિતરણ ડાયરી અને કુવા ક્લોરિનેશનનો ડેટા તમારા Google Drive પર આપોઆપ સ્પ્રેડશીટમાં સેવ થાય છે.
                </p>
              </div>

              {/* 1-Click Instant Excel / CSV Export (Always works 100% offline & without login) */}
              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50/70 border-emerald-300/80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Download className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                          ૧-ક્લિક સીધી શીટ ડાઉનલોડ (Offline Excel / Sheets)
                        </h4>
                        <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                          કોઈ લોગિન વગર
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        સ્ટોક, બેચ આવક, દૈનિક વિતરણ અને કુવા ક્લોરિનેશન - તમામ ડેટા એક ક્લિકમાં Excel/Sheets માં ડાઉનલોડ કરો.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      exportStockDataToCsv(
                        stockItems,
                        batches,
                        vitranEntries,
                        tclLogs,
                        profile,
                        getItemTotalStock
                      )
                    }
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>Excel / શીટ ફાઇલ ડાઉનલોડ</span>
                  </button>
                </div>
              </div>

              {/* Google Account Card */}
              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                {!googleUser ? (
                  Capacitor.isNativePlatform() ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                          <Info className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                            <span>Android APK માં Google Sign-in ની જરૂર નથી</span>
                            <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full">
                              ઓફલાઇન સુરક્ષિત
                            </span>
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            Google ના સિક્યોરિટી નિયમ (OAuth 2.0 Policy) મુજબ Android APK માંથી બ્રાઉઝર લોગિન માન્ય નથી હોતું (જેથી <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded text-[10px] font-mono text-rose-500">Error 400: origin_mismatch</code> આવે છે).
                          </p>
                          <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 pt-1">
                            ✅ MedStock નો તમારો તમામ સ્ટોક અને રજિસ્ટર ડેટા તમારા ફોનમાં જ સુરક્ષિત છે. Excel/Sheets ફાઇલ માટે ઉપરનું <strong>"૧-ક્લિક સીધી શીટ ડાઉનલોડ"</strong> બટન વાપરો.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                        <button
                          type="button"
                          onClick={() =>
                            exportStockDataToCsv(
                              stockItems,
                              batches,
                              vitranEntries,
                              tclLogs,
                              profile,
                              getItemTotalStock
                            )
                          }
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                        >
                          <Download className="w-4 h-4" />
                          <span>ઓફલાઇન Excel શીટ ડાઉનલોડ કરો</span>
                        </button>

                        <a
                          href="https://ais-pre-spisgiamnfph6xunhnkmxs-107416021501.asia-southeast1.run.app"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                        >
                          <ExternalLink className="w-4 h-4 text-teal-500" />
                          <span>Chrome માં વેબ લિંક ખોલો</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm">ગૂગલ એકાઉન્ટ કનેક્ટ કરો</h4>
                          <p className="text-xs text-slate-400">
                            ઓટો-સેવ અને શીટ બેકઅપ માટે Google સાથે ૧-ક્લિક સાઇન-ઇન કરો.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isLoggingIn}
                        className="px-4 py-2.5 bg-white text-slate-800 hover:bg-slate-100 font-bold text-xs rounded-xl shadow-md border border-slate-300 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                      >
                        {isLoggingIn ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                        ) : (
                          <svg className="w-4 h-4" viewBox="0 0 48 48">
                            <path
                              fill="#EA4335"
                              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                            />
                            <path
                              fill="#4285F4"
                              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                            />
                            <path
                              fill="#34A853"
                              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                            />
                          </svg>
                        )}
                        <span>Sign in with Google</span>
                      </button>
                    </div>
                  )
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {googleUser.photoURL ? (
                          <img
                            src={googleUser.photoURL}
                            alt="Profile"
                            className="w-10 h-10 rounded-full border border-teal-500/40"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm">
                            {googleUser.displayName?.[0] || 'U'}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">{googleUser.displayName || 'Google User'}</span>
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                              કનેક્ટેડ
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">{googleUser.email}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleGoogleLogout}
                        className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>લૉગ આઉટ</span>
                      </button>
                    </div>

                    <div className="pt-3 border-t dark:border-slate-700/60 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => handleManualSync()}
                        disabled={isSyncing}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                      >
                        {isSyncing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>ગૂગલ શીટમાં સેવ થઈ રહ્યું છે...</span>
                          </>
                        ) : (
                          <>
                            <Cloud className="w-4 h-4" />
                            <span>હમણાં બેકઅપ લો (Sync to Sheets)</span>
                          </>
                        )}
                      </button>

                      {lastSyncUrl && (
                        <a
                          href={lastSyncUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                          <span>ગૂગલ શીટ ખોલો (Open Sheet)</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>

                    {lastSyncTime && (
                      <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>છેલ્લે સેવ થયું: {lastSyncTime}</span>
                      </p>
                    )}
                  </div>
                )}

                {syncError && (
                  <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                    <p className="text-xs text-rose-400 flex items-start gap-1.5 leading-relaxed">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{syncError}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-rose-500/10">
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isLoggingIn}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] rounded-lg shadow flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoggingIn ? 'animate-spin' : ''}`} />
                        <span>ફરી પ્રયત્ન કરો (Retry)</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleRedirectLogin}
                        disabled={isLoggingIn}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-[11px] rounded-lg shadow flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
                        <span>મોબાઇલ રીડાયરેક્ટ સાઇન-ઇન</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          exportStockDataToCsv(
                            stockItems,
                            batches,
                            vitranEntries,
                            tclLogs,
                            profile,
                            getItemTotalStock
                          )
                        }
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded-lg shadow flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 ml-auto"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>૧-ક્લિક Excel ડાઉનલોડ</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DATA RESET / FRESH */}
          {activeTab === 'DATA' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-rose-500">બધો જૂનો ડેટા સાફ કરો (Fresh Reset)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  જો તમે એપમાં નાખેલો અગાઉનો સેમ્પલ/ટેસ્ટિંગ ડેટા કાઢીને બિલકુલ નવેસરથી (ફ્રેશ) રજિસ્ટર શરૂ કરવા માંગતા હોવ તો નીચેનું બટન વાપરો.
                </p>
              </div>

              <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-rose-400">ધ્યાન આપો (Warning):</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      આ બટન દબાવવાથી તમામ સેમ્પલ બેચ, વિતરણ એન્ટ્રીઓ અને કુવા લોગ ખાલી થઈ જશે (0 સ્ટોક). તમારી માસ્ટર દવાની યાદી સુરક્ષિત રહેશે.
                    </p>
                  </div>
                </div>

                {!confirmClearOpen ? (
                  <button
                    type="button"
                    onClick={() => setConfirmClearOpen(true)}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>બધો ડેટા સાફ કરી ફ્રેશ કરો (Clear Data)</span>
                  </button>
                ) : (
                  <div className="p-3 bg-rose-950/80 border border-rose-500 rounded-xl space-y-2">
                    <p className="text-xs font-bold text-white text-center">
                      શું તમે ખરેખર બધો ડેટા કાઢીને એપને ફ્રેશ કરવા માંગો છો?
                    </p>
                    <div className="flex items-center gap-2 justify-center">
                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-lg cursor-pointer"
                      >
                        હા, બધું સાફ કરો
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClearOpen(false)}
                        className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        ના, રદ્દ કરો
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-3.5 sm:p-4 border-t flex items-center justify-between text-xs ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}
        >
          <span>મેડસ્ટોક એડમિન પોર્ટલ v2.5.0</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg cursor-pointer shadow-xs"
          >
            બંધ કરો
          </button>
        </div>
      </div>
    </div>
  );
};
