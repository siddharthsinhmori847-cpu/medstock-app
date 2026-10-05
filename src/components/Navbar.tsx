import React from 'react';
import {
  Droplet,
  Pill,
  ArrowDownLeft,
  ArrowUpRight,
  Settings,
  Sun,
  Moon,
  Cloud,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Package,
  Printer
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface NavbarProps {
  onOpenStockIn: () => void;
  onOpenVitran: () => void;
  onOpenPrint: () => void;
  onOpenProfile: () => void;
  onOpenAdminSettings: () => void;
  activeTab: string;
  onSelectTab: (tab: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenStockIn,
  onOpenVitran,
  onOpenPrint,
  onOpenProfile,
  onOpenAdminSettings,
  activeTab,
  onSelectTab,
}) => {
  const {
    profile,
    theme,
    toggleTheme,
    syncState,
    stockItems,
    isOnline,
    isCloudSyncing,
    lastCloudSync,
    syncToCloudNow
  } = useInventory();
  const isDark = theme === 'dark';

  const essentialKeys = ['clorine-powder', 'clorine-tablet', 'iron-tablet-small', 'iron-tablet-big'];
  const otherItemsCount = stockItems.filter((i) => !essentialKeys.includes(i.key)).length;

  const tabs = [
    { id: 'DASHBOARD', label: 'મુખ્ય ડેશબોર્ડ' },
    { id: 'CHLORINE_POWDER', label: 'ક્લોરિન પાવડર' },
    { id: 'CHLORINE_TAB', label: 'ક્લોરિન ટેબ્લેટ' },
    { id: 'IRON_TABS', label: 'આયર્ન ગોળીઓ' },
    { id: 'OTHER_STOCK', label: `અન્ય સ્ટોક (${otherItemsCount})` },
    { id: 'TCL_LOG', label: 'કુવા ક્લોરિનેશન રજિસ્ટર' },
    { id: 'VITRAN', label: 'વિતરણ ડાયરી / ખાતાવહી' },
  ];

  return (
    <header
      className={`sticky top-0 z-40 border-b shadow-md transition-colors ${
        isDark ? 'bg-[#0b131e] border-slate-800/90 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Top Header Row */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            onClick={() => onSelectTab('DASHBOARD')}
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold shadow-md cursor-pointer transition-transform active:scale-95"
          >
            <div className="flex items-center -space-x-1">
              <Droplet className="w-4 h-4 text-cyan-200" />
              <Pill className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-base sm:text-lg font-black tracking-tight truncate leading-tight">
                {profile.centerNameGu || 'આરોગ્ય સબસેન્ટર સ્ટોક રજિસ્ટર'}
              </h1>
            </div>
            <p className={`text-[11px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {profile.ownerName || 'સિદ્ધાર્થસિંહ મોરી'} ·{' '}
              <span className="text-teal-500 font-bold">લાઇવ રજિસ્ટર</span>
            </p>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Web ⇄ Mobile Live Cloud Sync Badge */}
          {isOnline ? (
            <button
              type="button"
              onClick={() => syncToCloudNow()}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                isCloudSyncing
                  ? isDark
                    ? 'bg-teal-950/70 border-teal-500/50 text-teal-300 animate-pulse'
                    : 'bg-teal-50 border-teal-300 text-teal-800 animate-pulse'
                  : isDark
                  ? 'bg-emerald-950/60 hover:bg-emerald-900/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
              }`}
              title={
                isCloudSyncing
                  ? 'વેબ અને મોબાઇલ વચ્ચે લાઇવ સિંક થઈ રહ્યું છે...'
                  : `ઓનલાઇન ક્લાઉડ સિંક (Web ⇄ Mobile લાઇવ) - છેલ્લે સિંક: ${lastCloudSync || 'હમણાં'}`
              }
            >
              {isCloudSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              )}
              <span className="hidden sm:inline">
                {isCloudSyncing ? 'સિંક થાય છે...' : 'Web ⇄ Mobile લાઇવ'}
              </span>
              <span className="sm:hidden">
                {isCloudSyncing ? 'સિંક...' : 'લાઇવ'}
              </span>
            </button>
          ) : (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${
                isDark
                  ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                  : 'bg-amber-50 border-amber-300 text-amber-800'
              }`}
              title="ઓફલાઇન મોડ: તમામ ડેટા તમારા ફોનમાં સુરક્ષિત સેવ છે. ઇન્ટરનેટ ચાલુ થતાં જ ક્લાઉડમાં આપોઆપ સિંક થશે."
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
              <span className="hidden sm:inline">ઓફલાઇન (સ્થાનિક સેવ)</span>
              <span className="sm:hidden">ઓફલાઇન</span>
            </div>
          )}

          {/* Live Background Sync Status Badge */}
          {syncState.status === 'syncing' ? (
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border animate-pulse ${
                isDark
                  ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                  : 'bg-cyan-50 border-cyan-200 text-cyan-700'
              }`}
              title="તમારો નવો ટ્રાન્ઝેક્શન ડેટા Google Sheets માં બેકઅપ થઈ રહ્યો છે..."
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span className="hidden md:inline">Sheets સેવ થાય છે...</span>
            </div>
          ) : syncState.status === 'synced' ? (
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                isDark
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}
              title={`છેલ્લે સેવ થયું: ${syncState.lastSyncedTime || ''}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Sheets સેવ થઈ ગયું</span>
            </div>
          ) : syncState.spreadsheetUrl ? (
            <a
              href={syncState.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                isDark
                  ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-teal-400'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-teal-700'
              }`}
              title="Google Drive માં સેવ થયેલી Google Sheet ખોલો"
            >
              <Cloud className="w-3.5 h-3.5 text-emerald-500" />
              <span>Google Sheet</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
            </a>
          ) : null}

          {/* Quick Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title={isDark ? 'લાઇટ મોડ ચાલુ કરો' : 'ડાર્ક મોડ ચાલુ કરો'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* PDF & Print Button */}
          <button
            type="button"
            onClick={onOpenPrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
            title="PDF ડાઉનલોડ & પ્રિન્ટ રિપોર્ટ (Weekly/Monthly/Yearly)"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PDF / પ્રિન્ટ</span>
          </button>

          {/* Admin Settings Button */}
          <button
            type="button"
            onClick={onOpenAdminSettings}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
            title="એડમિન સેટિંગ્સ & સ્ટોક સુધારો"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">એડમિન સેટિંગ્સ</span>
          </button>

          <button
            onClick={onOpenStockIn}
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>+ સ્ટોક આવક</span>
          </button>

          <button
            onClick={onOpenVitran}
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>- વિતરણ</span>
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Tabs Bar */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 pb-2.5 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-teal-500 text-slate-950 font-black shadow-md'
                    : isDark
                    ? 'bg-[#111927] text-slate-300 hover:text-white hover:bg-[#162234] border border-slate-800'
                    : 'bg-slate-100 text-slate-700 hover:text-slate-950 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
