import React, { useState } from 'react';
import {
  PackagePlus,
  Plus,
  Search,
  Pill,
  Droplet,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Trash2,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { StockItem } from '../types/inventory';

interface OtherStockViewProps {
  onOpenStockIn: (itemId: string) => void;
  onOpenVitran: (itemId: string) => void;
  onOpenAddItem: () => void;
  onSelectDetailItem?: (itemId: string) => void;
}

export const OtherStockView: React.FC<OtherStockViewProps> = ({
  onOpenStockIn,
  onOpenVitran,
  onOpenAddItem,
  onSelectDetailItem,
}) => {
  const {
    stockItems,
    getItemStats,
    getItemBatches,
    deleteStockItem,
    theme,
  } = useInventory();

  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeDetailItem, setActiveDetailItem] = useState<StockItem | null>(null);

  // Core essential 4 keys
  const essentialKeys = [
    'clorine-powder',
    'clorine-tablet',
    'iron-tablet-small',
    'iron-tablet-big',
  ];

  // Other items are those that are NOT in the essential 4 keys, OR user can view all
  const otherItems = stockItems.filter((i) => !essentialKeys.includes(i.key));

  // Extract unique categories from other items
  const categories = Array.from(new Set(otherItems.map((i) => i.category || 'જનરલ દવાઓ')));

  const filteredItems = otherItems.filter((item) => {
    const matchesSearch =
      item.nameGu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nameEn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = (item: StockItem) => {
    if (window.confirm(`શું તમે '${item.nameGu}' દવા રજિસ્ટરમાંથી કાઢી નાખવા માંગો છો?`)) {
      deleteStockItem(item.id);
      if (activeDetailItem?.id === item.id) {
        setActiveDetailItem(null);
      }
    }
  };

  // If a specific item is selected for full detail view:
  if (activeDetailItem) {
    const stats = getItemStats(activeDetailItem.id);
    const batches = getItemBatches(activeDetailItem.id);

    return (
      <div className={`space-y-5 pb-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setActiveDetailItem(null)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
              isDark
                ? 'bg-[#111927] hover:bg-[#162234] border-slate-800 text-slate-300'
                : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>અન્ય સ્ટોક યાદી પર પાછા જાઓ</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenStockIn(activeDetailItem.id)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>+ સ્ટોક આવક</span>
            </button>
            <button
              onClick={() => onOpenVitran(activeDetailItem.id)}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>- વિતરણ</span>
            </button>
          </div>
        </div>

        {/* Item Card */}
        <div
          className={`p-5 rounded-2xl border shadow-lg space-y-4 ${
            isDark ? 'bg-[#111927] border-slate-800' : 'bg-white border-slate-200 shadow-slate-100'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                <Pill className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-bold border border-purple-500/30">
                  {activeDetailItem.category}
                </span>
                <h2 className="text-xl font-black mt-0.5">{activeDetailItem.nameGu}</h2>
                <p className="text-xs text-slate-400">{activeDetailItem.nameEn}</p>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                stats.isLowStock
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              }`}
            >
              {stats.isLowStock ? '⚠️ ઓછો સ્ટોક' : '✅ પૂરતો સ્ટોક'}
            </span>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div
              className={`p-3 rounded-xl border ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-[10px] text-slate-400 block font-bold uppercase">ઉપલબ્ધ જથ્થો</span>
              <div className="text-2xl font-black text-teal-500 font-mono mt-0.5">
                {stats.totalStock.toLocaleString()} <span className="text-xs font-normal">{activeDetailItem.unitGu}</span>
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-[10px] text-slate-400 block font-bold uppercase">કુલ આવક</span>
              <div className="text-2xl font-black text-emerald-500 font-mono mt-0.5">
                +{stats.totalReceived.toLocaleString()}
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-[10px] text-slate-400 block font-bold uppercase">કુલ વિતરણ</span>
              <div className="text-2xl font-black text-rose-500 font-mono mt-0.5">
                -{stats.totalDistributed.toLocaleString()}
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-[10px] text-slate-400 block font-bold uppercase">એલર્ટ મર્યાદા</span>
              <div className="text-2xl font-black text-amber-500 font-mono mt-0.5">
                {activeDetailItem.minThreshold}
              </div>
            </div>
          </div>

          {/* Batches Table */}
          <div className="pt-3 space-y-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
              સક્રિય બેચ વિગત (Active Batches)
            </h3>
            {batches.length === 0 ? (
              <div
                className={`p-4 rounded-xl text-center text-xs ${
                  isDark ? 'bg-slate-900/40 text-slate-400' : 'bg-slate-50 text-slate-500'
                }`}
              >
                હાલમાં આ દવાની કોઈ બેચ ઉપલબ્ધ નથી. ઉપર <strong>"+ સ્ટોક આવક"</strong> બટન પરથી નવો સ્ટોક દાખલ કરો.
              </div>
            ) : (
              <div className="space-y-2">
                {batches.map((batch) => (
                  <div
                    key={batch.id}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <span className="font-mono font-bold text-teal-400">બેચ: {batch.batchNumber}</span>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Exp: {batch.expiryDate || 'N/A'} • મળેલ: {batch.receivedFrom || '-'}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black font-mono">
                        {batch.quantity.toLocaleString()} {activeDetailItem.unitGu}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-5 pb-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>
      {/* 1. Header with Add Tab/Item Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight">અન્ય સ્ટોક (Other Medicines & Stock)</h1>
            <span className="text-xs bg-purple-500/20 text-purple-400 font-bold px-2.5 py-0.5 rounded-full border border-purple-500/30">
              {otherItems.length} દવાઓ
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            અહીં તમે કોઈપણ નવી દવા, સીરપ, ઇન્જેક્શન કે સાધનનો સ્ટોક ટેબ બનાવીને તેનું રજિસ્ટર રાખી શકો છો.
          </p>
        </div>

        {/* Big Add New Stock Tab Button */}
        <button
          type="button"
          onClick={onOpenAddItem}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer shrink-0 border border-purple-400/30"
        >
          <Plus className="w-4 h-4" />
          <span>+ નવી દવા / ટેબ ઉમેરો</span>
        </button>
      </div>

      {/* 2. Search & Category Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="દવાનું નામ શોધો (Search by medicine name)..."
            className={`w-full pl-9 pr-3.5 py-2 text-xs font-bold rounded-xl border outline-none transition-colors ${
              isDark
                ? 'bg-[#111927] border-slate-800 text-white placeholder-slate-500 focus:border-purple-500'
                : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-purple-500'
            }`}
          />
        </div>

        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                selectedCategory === 'ALL'
                  ? 'bg-purple-600 text-white font-black shadow-xs'
                  : isDark
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              બધી ({otherItems.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                  selectedCategory === cat
                    ? 'bg-purple-600 text-white font-black shadow-xs'
                    : isDark
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Empty State vs Items Grid */}
      {filteredItems.length === 0 ? (
        <div
          className={`p-8 sm:p-12 rounded-3xl border text-center space-y-4 ${
            isDark ? 'bg-[#111927]/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
            <PackagePlus className="w-8 h-8 text-purple-500" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-black">કોઈ અન્ય દવા મળી નથી</h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              તમે તમારા સબસેન્ટર કે દવાખાનાની કોઈપણ દવા (જેમ કે પેરાસીટામોલ, ORS, સિરીંજ, એન્ટિસેપ્ટિક વગેરે) અહીં ઉમેરી શકો છો.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAddItem}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black inline-flex items-center gap-2 shadow-md cursor-pointer transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ પહેલી દવા / સ્ટોક ટેબ ઉમેરો</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {filteredItems.map((item) => {
            const stats = getItemStats(item.id);

            return (
              <div
                key={item.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 group ${
                  isDark
                    ? 'bg-[#111927] border-slate-800 hover:border-purple-500/50 shadow-md'
                    : 'bg-white border-slate-200 hover:border-purple-500/50 shadow-sm'
                }`}
              >
                <div>
                  {/* Top Row: Category & Low stock status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-bold border border-purple-500/20">
                      {item.category || 'જનરલ'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        stats.isLowStock
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {stats.isLowStock ? '⚠️ ઓછો સ્ટોક' : '✅ પૂરતો'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-black text-base leading-tight group-hover:text-purple-400 transition-colors">
                    {item.nameGu}
                  </h3>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{item.nameEn}</p>

                  {/* Available Stock Counter */}
                  <div
                    className={`mt-3 p-3 rounded-xl border flex items-baseline justify-between ${
                      isDark ? 'bg-[#0b131e] border-slate-800/80' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[11px] text-slate-400 font-bold uppercase">ઉપલબ્ધ જથ્થો:</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black font-mono text-teal-400">
                        {stats.totalStock.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-slate-400">{item.unitGu}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="space-y-2 pt-2 border-t dark:border-slate-800/80 border-slate-100">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenStockIn(item.id)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-transform active:scale-95"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>+ આવક</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenVitran(item.id)}
                      className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-xs cursor-pointer transition-transform active:scale-95"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>- વિતરણ</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveDetailItem(item)}
                      className="text-xs text-purple-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>બેચ & ખાતાવહી વિગત</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded-md cursor-pointer transition-colors"
                      title="આઇટમ કાઢી નાખો"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
