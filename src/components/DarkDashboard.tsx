import React from 'react';
import {
  Droplet,
  Pill,
  Activity,
  CheckCircle2,
  Clock,
  Shield,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  ChevronRight,
  Plus,
  Settings,
  Package,
  Layers,
  Printer,
  Download
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface DarkDashboardProps {
  onOpenStockIn: (itemId?: string) => void;
  onOpenVitran: (itemId?: string) => void;
  onOpenAddTcl: () => void;
  onOpenAdminSettings?: () => void;
  onOpenAddItem?: () => void;
  onOpenPrint?: (type?: 'VITRAN' | 'TCL' | 'STOCK') => void;
  onNavigateTab: (tab: any) => void;
}

export const DarkDashboard: React.FC<DarkDashboardProps> = ({
  onOpenStockIn,
  onOpenVitran,
  onOpenAddTcl,
  onOpenAdminSettings,
  onOpenAddItem,
  onOpenPrint,
  onNavigateTab,
}) => {
  const { stockItems, tclLogs, profile, getItemStats, theme } = useInventory();
  const isDark = theme === 'dark';

  // Stats
  const chlorinePowder = stockItems.find((i) => i.key === 'clorine-powder');
  const chlorineTab = stockItems.find((i) => i.key === 'clorine-tablet');
  const ironSmall = stockItems.find((i) => i.key === 'iron-tablet-small');
  const ironBig = stockItems.find((i) => i.key === 'iron-tablet-big');

  const cpStats = chlorinePowder ? getItemStats(chlorinePowder.id) : { totalStock: 0 };
  const ctStats = chlorineTab ? getItemStats(chlorineTab.id) : { totalStock: 0 };
  const isStats = ironSmall ? getItemStats(ironSmall.id) : { totalStock: 0 };
  const ibStats = ironBig ? getItemStats(ironBig.id) : { totalStock: 0 };

  // Other Stock Items
  const essentialKeys = ['clorine-powder', 'clorine-tablet', 'iron-tablet-small', 'iron-tablet-big'];
  const otherItems = stockItems.filter((i) => !essentialKeys.includes(i.key));
  const otherTotalStock = otherItems.reduce((sum, item) => sum + getItemStats(item.id).totalStock, 0);

  const now = new Date();
  const dateFormatted = now.toLocaleDateString('gu-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className={`space-y-6 pb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
      {/* 1. Header */}
      <div className="flex items-start justify-between gap-3 pt-1">
        <div>
          <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            નમસ્તે, {profile.ownerName || 'સિદ્ધાર્થસિંહ મોરી'}
          </p>
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            સ્ટોક ડેશબોર્ડ (Stock Care)
          </h1>
          <p className="text-sm font-bold text-teal-500 mt-1">
            {dateFormatted || 'સોમવાર, ૫ ઓક્ટોબર ૨૦૨૬'}
          </p>
        </div>

        {/* Top Right Buttons: Admin Settings & Badge */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenAdminSettings && (
            <button
              type="button"
              onClick={onOpenAdminSettings}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs cursor-pointer ${
                isDark
                  ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-teal-400'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-teal-600'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>એડમિન સેટિંગ્સ</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-bold text-xs shadow-xs shrink-0">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-mono uppercase tracking-wider text-[11px]">ADMIN</span>
          </div>
        </div>
      </div>

      {/* 2. OVERVIEW SECTION (Stock Cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            OVERVIEW (મુખ્ય સ્ટોક વિગત)
          </h2>
          <button
            onClick={() => onNavigateTab('OTHER_STOCK')}
            className="text-xs text-purple-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>+ અન્ય સ્ટોક / દવાઓ</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Card 1: Chlorine Powder (Blue accent) */}
          <div
            onClick={() => onNavigateTab('CHLORINE_POWDER')}
            className={`border-l-4 border-l-blue-500 border rounded-2xl p-4 sm:p-5 cursor-pointer transition-all shadow-md group flex flex-col justify-between ${
              isDark
                ? 'bg-[#111927] border-slate-800 hover:border-blue-500/50'
                : 'bg-white border-slate-200 hover:border-blue-500/50 shadow-slate-200'
            }`}
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center mb-3">
                <Droplet className="w-5 h-5 text-blue-500" />
              </div>
              <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {cpStats.totalStock.toLocaleString()}
              </div>
              <div className={`text-xs font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                ક્લોરિન પાવડર (Kg)
              </div>
            </div>
            <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[11px] font-bold text-blue-500 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <span>બેચ & વિગત જુઓ</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 2: Chlorine Tablets (Cyan/Teal accent) */}
          <div
            onClick={() => onNavigateTab('CHLORINE_TAB')}
            className={`border-l-4 border-l-teal-500 border rounded-2xl p-4 sm:p-5 cursor-pointer transition-all shadow-md group flex flex-col justify-between ${
              isDark
                ? 'bg-[#111927] border-slate-800 hover:border-teal-500/50'
                : 'bg-white border-slate-200 hover:border-teal-500/50 shadow-slate-200'
            }`}
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-500 flex items-center justify-center mb-3">
                <Activity className="w-5 h-5 text-teal-500" />
              </div>
              <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {ctStats.totalStock.toLocaleString()}
              </div>
              <div className={`text-xs font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                ક્લોરિન ટેબ્લેટ (Tabs)
              </div>
            </div>
            <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[11px] font-bold text-teal-500 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <span>બેચ & વિગત જુઓ</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 3: Iron Tab Small (Amber/Orange accent) */}
          <div
            onClick={() => onNavigateTab('IRON_TABS')}
            className={`border-l-4 border-l-amber-500 border rounded-2xl p-4 sm:p-5 cursor-pointer transition-all shadow-md group flex flex-col justify-between ${
              isDark
                ? 'bg-[#111927] border-slate-800 hover:border-amber-500/50'
                : 'bg-white border-slate-200 hover:border-amber-500/50 shadow-slate-200'
            }`}
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center mb-3">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {isStats.totalStock.toLocaleString()}
              </div>
              <div className={`text-xs font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                આયર્ન ગોળી નાની (Pink)
              </div>
            </div>
            <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[11px] font-bold text-amber-500 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <span>બેચ & વિગત જુઓ</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 4: Iron Tab Big (Green accent) */}
          <div
            onClick={() => onNavigateTab('IRON_TABS')}
            className={`border-l-4 border-l-emerald-500 border rounded-2xl p-4 sm:p-5 cursor-pointer transition-all shadow-md group flex flex-col justify-between ${
              isDark
                ? 'bg-[#111927] border-slate-800 hover:border-emerald-500/50'
                : 'bg-white border-slate-200 hover:border-emerald-500/50 shadow-slate-200'
            }`}
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {ibStats.totalStock.toLocaleString()}
              </div>
              <div className={`text-xs font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                આયર્ન ગોળી મોટી (Blue)
              </div>
            </div>
            <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[11px] font-bold text-emerald-500 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <span>બેચ & વિગત જુઓ</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 5: OTHER STOCK (Purple Accent - Dynamically shows added items & allows adding tabs) */}
          <div
            onClick={() => onNavigateTab('OTHER_STOCK')}
            className={`col-span-2 sm:col-span-1 border-l-4 border-l-purple-500 border rounded-2xl p-4 sm:p-5 cursor-pointer transition-all shadow-md group flex flex-col justify-between ${
              isDark
                ? 'bg-[#111927] border-slate-800 hover:border-purple-500/50'
                : 'bg-white border-slate-200 hover:border-purple-500/50 shadow-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Package className="w-5 h-5 text-purple-500" />
                </div>
                {onOpenAddItem && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAddItem();
                    }}
                    className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ દવા ટેબ</span>
                  </button>
                )}
              </div>
              <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {otherItems.length}{' '}
                <span className="text-xs font-normal text-slate-400">દવાઓ / આઇટમ</span>
              </div>
              <div className={`text-xs font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                અન્ય દવા & સાધન સામગ્રી (Other Stock)
              </div>
            </div>
            <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[11px] font-bold text-purple-500 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <span>અન્ય સ્ટોક ટેબ જુઓ</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* Card 6: TCL Well Chlorination Log Book (Rose/Pink accent) */}
          <div
            onClick={() => onNavigateTab('TCL_LOG')}
            className={`col-span-2 sm:col-span-1 border-l-4 border-l-rose-500 border rounded-2xl p-4 sm:p-5 cursor-pointer transition-all shadow-md group flex flex-col justify-between ${
              isDark
                ? 'bg-[#111927] border-slate-800 hover:border-rose-500/50'
                : 'bg-white border-slate-200 hover:border-rose-500/50 shadow-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center">
                  <Droplet className="w-5 h-5 text-rose-500" />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenAddTcl();
                  }}
                  className="p-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ કુવો</span>
                </button>
              </div>
              <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {tclLogs.length}{' '}
                <span className="text-xs font-normal text-slate-400">કુવા રજિસ્ટર</span>
              </div>
              <div className={`text-xs font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                કુવા ક્લોરિનેશન રજિસ્ટર (Wells Treated)
              </div>
            </div>
            <div className={`mt-3 pt-2 border-t flex items-center justify-between text-[11px] font-bold text-rose-500 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <span>કુવા લોગબુક જુઓ</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. MAIN MENU SECTION */}
      <div className="space-y-3 pt-1">
        <h2 className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          MAIN MENU (મુખ્ય મેનૂ)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Menu 1: Stock In */}
          <button
            onClick={() => onOpenStockIn()}
            className={`border rounded-2xl p-3.5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all shadow-xs group active:scale-95 ${
              isDark
                ? 'bg-[#111927] hover:bg-[#162234] border-slate-800 hover:border-teal-500/50'
                : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-teal-500/50 shadow-slate-100'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-teal-500/20 text-teal-500 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <span className={`text-xs font-bold text-center leading-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              + સ્ટોક આવક
            </span>
          </button>

          {/* Menu 2: Vitran */}
          <button
            onClick={() => onOpenVitran()}
            className={`border rounded-2xl p-3.5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all shadow-xs group active:scale-95 ${
              isDark
                ? 'bg-[#111927] hover:bg-[#162234] border-slate-800 hover:border-rose-500/50'
                : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-rose-500/50 shadow-slate-100'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-rose-500/20 text-rose-500 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <span className={`text-xs font-bold text-center leading-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              - દવા વિતરણ
            </span>
          </button>

          {/* Menu 3: Other Stock */}
          <button
            onClick={() => onNavigateTab('OTHER_STOCK')}
            className={`border rounded-2xl p-3.5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all shadow-xs group active:scale-95 ${
              isDark
                ? 'bg-[#111927] hover:bg-[#162234] border-slate-800 hover:border-purple-500/50'
                : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-purple-500/50 shadow-slate-100'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-purple-500/20 text-purple-500 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <span className={`text-xs font-bold text-center leading-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              અન્ય સ્ટોક ટેબ
            </span>
          </button>

          {/* Menu 4: Vitran Ledger */}
          <button
            onClick={() => onNavigateTab('VITRAN')}
            className={`border rounded-2xl p-3.5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all shadow-xs group active:scale-95 ${
              isDark
                ? 'bg-[#111927] hover:bg-[#162234] border-slate-800 hover:border-cyan-500/50'
                : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-cyan-500/50 shadow-slate-100'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-cyan-500/20 text-cyan-500 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <span className={`text-xs font-bold text-center leading-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              વિતરણ રજિસ્ટર
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
