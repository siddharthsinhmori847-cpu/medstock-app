import React from 'react';
import {
  Droplet,
  Pill,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  Settings,
  Shield,
  BookOpen,
  FileText,
  Smartphone,
  Download
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface NavbarProps {
  onOpenStockIn: () => void;
  onOpenVitran: () => void;
  onOpenPrint: () => void;
  onOpenProfile: () => void;
  onOpenApk: () => void;
  activeTab: string;
  onSelectTab: (tab: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenStockIn,
  onOpenVitran,
  onOpenPrint,
  onOpenProfile,
  onOpenApk,
  activeTab,
  onSelectTab,
}) => {
  const { profile } = useInventory();

  const tabs = [
    { id: 'DASHBOARD', label: 'મુખ્ય ડેશબોર્ડ' },
    { id: 'CHLORINE_POWDER', label: 'ક્લોરિન પાવડર' },
    { id: 'CHLORINE_TAB', label: 'ક્લોરિન ટેબ્લેટ' },
    { id: 'IRON_TABS', label: 'આયર્ન ગોળીઓ' },
    { id: 'TCL_LOG', label: 'કુવા ક્લોરિનેશન રજિસ્ટર' },
    { id: 'VITRAN', label: 'વિતરણ ડાયરી / ખાતાવહી' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0b131e] border-b border-slate-800/90 shadow-md">
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
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight truncate leading-tight">
                {profile.centerNameGu || 'આરોગ્ય સબસેન્ટર સ્ટોક રજિસ્ટર'}
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {profile.ownerName || 'સિદ્ધાર્થસિંહ મોરી'} · <span className="text-emerald-400 font-bold">લાઇવ રજિસ્ટર</span>
            </p>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* APK / Mobile Install Button */}
          <button
            onClick={onOpenApk}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 rounded-xl shadow-xs transition-transform active:scale-95 cursor-pointer"
            title="Android APK / એપ ઇન્સ્ટોલ કરો"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xs:inline">APK ઇન્સ્ટોલ</span>
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
            <span>+ વિતરણ</span>
          </button>

          <button
            onClick={onOpenProfile}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-800 cursor-pointer transition-colors"
            title="પ્રોફાઈલ / સેન્ટર સેટિંગ્સ"
          >
            <Settings className="w-4 h-4" />
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
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                    : 'bg-[#111927] text-slate-300 hover:text-white hover:bg-[#162234] border border-slate-800'
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
