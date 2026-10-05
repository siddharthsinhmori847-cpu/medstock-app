/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Navbar } from './components/Navbar';
import { DarkDashboard } from './components/DarkDashboard';
import { SingleItemDetailView } from './components/SingleItemDetailView';
import { TclLogBook } from './components/TclLogBook';
import { VitranRegister } from './components/VitranRegister';
import { StockInModal } from './components/StockInModal';
import { StockOutModal } from './components/StockOutModal';
import { AddItemModal } from './components/AddItemModal';
import { PrintRegisterModal } from './components/PrintRegisterModal';
import { PersonalProfileModal } from './components/PersonalProfileModal';
import { AddTclLogModal } from './components/AddTclLogModal';
import { AdminSettingsModal } from './components/AdminSettingsModal';
import {
  Home,
  Droplet,
  Pill,
  ArrowUpRight,
  Plus,
  Settings,
  Sun,
  Moon
} from 'lucide-react';

export type AppTab =
  | 'DASHBOARD'
  | 'CHLORINE_POWDER'
  | 'CHLORINE_TAB'
  | 'IRON_TABS'
  | 'TCL_LOG'
  | 'VITRAN';

const MainAppContent: React.FC = () => {
  const { profile, theme } = useInventory();
  const [activeTab, setActiveTab] = useState<AppTab>('DASHBOARD');

  // Modals
  const [stockInOpen, setStockInOpen] = useState(false);
  const [vitranOpen, setVitranOpen] = useState(false);
  const [addTclOpen, setAddTclOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | undefined>();

  const isDark = theme === 'dark';

  const handleOpenStockIn = (itemId?: string) => {
    setActiveItemId(itemId);
    setStockInOpen(true);
  };

  const handleOpenVitran = (itemId?: string) => {
    setActiveItemId(itemId);
    setVitranOpen(true);
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans antialiased transition-colors duration-200 selection:bg-teal-500 selection:text-slate-950 ${
        isDark ? 'bg-[#070d18] text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* 1. App Header with Tabs & Admin Button */}
      <Navbar
        onOpenStockIn={() => handleOpenStockIn()}
        onOpenVitran={() => handleOpenVitran()}
        onOpenPrint={() => setPrintOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenAdminSettings={() => setAdminOpen(true)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* 2. Main Page Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-5 lg:p-6 pb-24">
        {/* Tab 1: Dashboard */}
        {activeTab === 'DASHBOARD' && (
          <DarkDashboard
            onOpenStockIn={handleOpenStockIn}
            onOpenVitran={handleOpenVitran}
            onOpenAddTcl={() => setAddTclOpen(true)}
            onOpenAdminSettings={() => setAdminOpen(true)}
            onNavigateTab={setActiveTab}
          />
        )}

        {/* Tab 2: Chlorine Powder View */}
        {activeTab === 'CHLORINE_POWDER' && (
          <SingleItemDetailView
            itemKey="clorine-powder"
            onBack={() => setActiveTab('DASHBOARD')}
            onOpenStockIn={handleOpenStockIn}
            onOpenVitran={handleOpenVitran}
          />
        )}

        {/* Tab 3: Chlorine Tablet View */}
        {activeTab === 'CHLORINE_TAB' && (
          <SingleItemDetailView
            itemKey="clorine-tablet"
            onBack={() => setActiveTab('DASHBOARD')}
            onOpenStockIn={handleOpenStockIn}
            onOpenVitran={handleOpenVitran}
          />
        )}

        {/* Tab 4: Iron Tablets (Small & Big) View */}
        {activeTab === 'IRON_TABS' && (
          <SingleItemDetailView
            itemKey="iron-tablet"
            onBack={() => setActiveTab('DASHBOARD')}
            onOpenStockIn={handleOpenStockIn}
            onOpenVitran={handleOpenVitran}
          />
        )}

        {/* Tab 5: TCL Log Book & Chlorination Calculator */}
        {activeTab === 'TCL_LOG' && <TclLogBook />}

        {/* Tab 6: Vitran Diary / Ledger */}
        {activeTab === 'VITRAN' && (
          <VitranRegister
            onOpenStockIn={handleOpenStockIn}
            onOpenVitran={handleOpenVitran}
            onOpenPrint={() => setPrintOpen(true)}
            selectedFilterId="ALL"
            onSelectFilterId={() => {}}
          />
        )}
      </main>

      {/* 3. Mobile Bottom Navigation Bar */}
      <div
        className={`fixed bottom-0 inset-x-0 backdrop-blur-md border-t px-3 py-2 sm:hidden flex items-center justify-around z-30 shadow-2xl transition-colors ${
          isDark
            ? 'bg-[#0b131e]/95 border-slate-800 text-slate-100'
            : 'bg-white/95 border-slate-200 text-slate-900'
        }`}
      >
        <button
          onClick={() => setActiveTab('DASHBOARD')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'DASHBOARD'
              ? 'text-teal-500 font-black'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>મુખ્ય</span>
        </button>

        <button
          onClick={() => setActiveTab('TCL_LOG')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'TCL_LOG'
              ? 'text-cyan-500 font-black'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Droplet className="w-4 h-4" />
          <span>TCL કુવો</span>
        </button>

        {/* Direct Add Kuvo Chlorination Button in Bottom Bar */}
        <button
          onClick={() => setAddTclOpen(true)}
          className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 shadow-lg transition-transform active:scale-95 cursor-pointer border border-cyan-400/40"
        >
          <Plus className="w-4 h-4" />
          <span>+ કુવો</span>
        </button>

        <button
          onClick={() => handleOpenVitran()}
          className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-3 py-2 rounded-xl flex items-center gap-1 shadow-md transition-transform active:scale-95 cursor-pointer border border-rose-500"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>- વિતરણ</span>
        </button>

        {/* Mobile Admin Settings Button */}
        <button
          onClick={() => setAdminOpen(true)}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold py-1 px-2 rounded-xl transition-all cursor-pointer ${
            adminOpen
              ? 'text-teal-500 font-black'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Settings className="w-4 h-4 text-teal-500" />
          <span>એડમિન</span>
        </button>
      </div>

      {/* Modals */}
      <AdminSettingsModal
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
        onOpenAddItem={() => setAddItemOpen(true)}
      />

      <AddTclLogModal
        isOpen={addTclOpen}
        onClose={() => setAddTclOpen(false)}
        onSuccess={() => {
          setActiveTab('TCL_LOG');
        }}
      />

      <StockInModal
        isOpen={stockInOpen}
        onClose={() => setStockInOpen(false)}
        preselectedItemId={activeItemId}
      />

      <StockOutModal
        isOpen={vitranOpen}
        onClose={() => setVitranOpen(false)}
        preselectedItemId={activeItemId}
      />

      <AddItemModal
        isOpen={addItemOpen}
        onClose={() => setAddItemOpen(false)}
      />

      <PrintRegisterModal
        isOpen={printOpen}
        onClose={() => setPrintOpen(false)}
      />

      <PersonalProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <InventoryProvider>
      <MainAppContent />
    </InventoryProvider>
  );
}
