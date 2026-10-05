import React from 'react';
import {
  Droplet,
  Pill,
  ArrowDownLeft,
  ArrowUpRight,
  Settings,
  Sun,
  Moon,
  Shield,
  FileSpreadsheet
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
  const { profile, theme, toggleTheme } = useInventory();
  const isDark = theme === 'dark';

  const tabs = [
    { id: 'DASHBOARD', label: 'મુખ્ય ડેશબોર્ડ' },
    { id: 'CHLORINE_POWDER', label: 'ક્લોરિન પાવડર' },
    { id: 'CHLORINE_TAB', label: 'ક્લોરિન ટેબ્લેટ' },
    { id: 'IRON_TABS', label: 'આયર્ન ગોળીઓ' },
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
