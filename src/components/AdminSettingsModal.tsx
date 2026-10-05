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
  Smartphone,
  Download,
  ShieldCheck
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { StockItem } from '../types/inventory';
import {
  googleSignIn,
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
  } = useInventory();

  const [activeTab, setActiveTab] = useState<'STOCK' | 'THEME' | 'DATA' | 'SHEETS' | 'APK'>('STOCK');
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
      setSyncError(err.message || 'Google સાઇન-ઇન નિષ્ફળ રહ્યું.');
    } finally {
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
            onClick={() => setActiveTab('APK')}
            className={`flex-1 min-w-[115px] py-3 px-2 flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'APK'
                ? 'border-cyan-500 text-cyan-500 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android APK</span>
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

              {/* Google Account Card */}
              <div
                className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                {!googleUser ? (
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
                  <p className="text-xs text-rose-400 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{syncError}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ANDROID APK UPDATE & DOWNLOAD */}
          {activeTab === 'APK' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2 text-cyan-400">
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span>Android APK ડાઉનલોડ & અપડેટ (v2.5.0)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  તમારા એન્ડ્રોઇડ ફોનમાં એપ ઇન્સ્ટોલ કરવા માટે નીચેથી લેટેસ્ટ APK સીધી ડાઉનલોડ કરો.
                </p>
              </div>

              {/* APK Card */}
              <div
                className={`p-5 rounded-2xl border shadow-lg space-y-4 ${
                  isDark ? 'bg-slate-900 border-cyan-500/30' : 'bg-cyan-50/50 border-cyan-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-base">MedStock Android App</h4>
                        <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded-full border border-cyan-500/40">
                          v2.5.0 લેટેસ્ટ
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        સાઈઝ: ૪.૬ MB • ફુલ ઓફલાઇન સપોર્ટ • બેકગ્રાઉન્ડ Google સિંક
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </span>
                </div>

                {/* Direct Download Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
                  <a
                    href="/medstock-app.apk"
                    download="medstock-app.apk"
                    className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>લેટેસ્ટ APK ડાઉનલોડ કરો (Direct APK)</span>
                  </a>

                  <a
                    href="https://github.com/siddharthsinhmori847-cpu/medstock-app/releases/tag/v2.5.0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-2"
                  >
                    <span>GitHub Release</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Installation guide */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <p className="font-bold text-slate-300">
                    📲 મોબાઈલમાં કેવી રીતે ઇન્સ્ટોલ કરવું?
                  </p>
                  <ol className="list-decimal list-inside space-y-0.5 pl-1">
                    <li>ઉપરના બટન પર ક્લિક કરીને <strong>APK ફાઇલ ડાઉનલોડ</strong> કરો.</li>
                    <li>મોબાઇલના Downloads ફોલ્ડરમાં જઈને <strong>medstock-app.apk</strong> પર ક્લિક કરો.</li>
                    <li>જો સુરક્ષા સંદેશ પૂછે તો <strong>"Install anyway"</strong> અથવા <strong>"Allow from this source"</strong> પસંદ કરો.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DATA RESET / FRESH */}
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
