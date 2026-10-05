import React from 'react';
import {
  Droplet,
  Pill,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Check,
  ArrowLeft
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { StockItem } from '../types/inventory';

interface SingleItemDetailViewProps {
  itemKey: 'clorine-powder' | 'clorine-tablet' | 'iron-tablet';
  onBack: () => void;
  onOpenStockIn: (itemId: string) => void;
  onOpenVitran: (itemId: string) => void;
}

export const SingleItemDetailView: React.FC<SingleItemDetailViewProps> = ({
  itemKey,
  onBack,
  onOpenStockIn,
  onOpenVitran,
}) => {
  const { stockItems, vitranEntries, getItemStats, getItemBatches } = useInventory();

  // Find relevant item(s)
  const items = itemKey === 'iron-tablet'
    ? stockItems.filter((i) => i.key.includes('iron'))
    : stockItems.filter((i) => i.key === itemKey);

  const primaryItem = items[0];
  if (!primaryItem) return null;

  return (
    <div className="space-y-4 text-white pb-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111927] hover:bg-[#162234] border border-slate-800 rounded-xl text-xs font-bold text-slate-300 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>મુખ્ય ડેશબોર્ડ પર પાછા જાઓ</span>
        </button>
      </div>

      {/* Render Cards for each matching item (e.g. Iron Small + Iron Big) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => {
          const stats = getItemStats(item.id);
          const itemBatches = getItemBatches(item.id);
          const isPowder = item.key === 'clorine-powder';
          const isIron = item.key.includes('iron');

          return (
            <div
              key={item.id}
              className="bg-[#111927] border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isPowder ? 'bg-blue-500/20 text-blue-400' : isIron ? 'bg-amber-500/20 text-amber-400' : 'bg-teal-500/20 text-teal-400'
                  }`}>
                    {isPowder ? <Droplet className="w-6 h-6" /> : <Pill className="w-6 h-6" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">{item.nameGu}</h2>
                    <p className="text-xs text-slate-400">{item.nameEn}</p>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  stats.isLowStock
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {stats.isLowStock ? 'ઓછો સ્ટોક' : 'પૂરતો સ્ટોક'}
                </span>
              </div>

              {/* Big Bachat Display */}
              <div className="p-4 rounded-xl bg-[#0b131e] border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">
                    ઉપલબ્ધ બચત સ્ટોક (Available Stock):
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-3xl font-black font-mono text-white">
                      {stats.totalStock.toLocaleString()}
                    </span>
                    <span className="text-sm font-bold text-teal-400">{item.unitGu}</span>
                  </div>
                </div>
                <div className="text-right text-xs space-y-0.5">
                  <div className="text-emerald-400 font-mono font-bold">+{stats.totalReceived.toLocaleString()} આવક</div>
                  <div className="text-rose-400 font-mono font-bold">-{stats.totalDistributed.toLocaleString()} વિતરણ</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => onOpenStockIn(item.id)}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-xs transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>+ સ્ટોક આવક</span>
                </button>
                <button
                  onClick={() => onOpenVitran(item.id)}
                  disabled={stats.totalStock === 0}
                  className={`py-2.5 px-3 font-black text-xs rounded-xl transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                    stats.totalStock === 0
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>- દવા વિતરણ</span>
                </button>
              </div>

              {/* Active Batches List */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">સક્રિય બેચ વિગત ({itemBatches.length} બેચ):</span>
                  <span className="text-[11px] text-slate-500">FEFO ક્રમ</span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {itemBatches.map((b) => (
                    <div
                      key={b.id}
                      className="p-2.5 rounded-xl bg-[#0b131e] border border-slate-800 flex items-center justify-between text-xs font-mono"
                    >
                      <div>
                        <div className="font-bold text-white">બેચ: {b.batchNumber}</div>
                        <div className="text-[10px] text-slate-500">
                          MFG: {b.mfgDate} | EXP: <strong className="text-slate-300">{b.expiryDate}</strong>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-sm text-teal-300">
                          {b.quantity} {item.unitGu}
                        </span>
                        <div className="text-[9px] text-slate-500">હાજર સ્ટોક</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Item-specific Vitran History */}
      <div className="bg-[#111927] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
        <h3 className="font-black text-sm text-white">
          તાજેતરની વિતરણ હિસ્ટ્રી (Recent Activity)
        </h3>
        <div className="space-y-2">
          {vitranEntries
            .filter((e) => items.some((i) => i.id === e.itemId))
            .slice(0, 5)
            .map((entry) => {
              const isInward = entry.action === 'INWARD';
              return (
                <div
                  key={entry.id}
                  className="bg-[#0b131e] p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-400">{entry.date}</span>
                      <span className="font-black text-white">{entry.koneAapiyo}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      બેચ: {entry.batchNumber} · બચત: {entry.bachat} {entry.unitGu}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-black text-sm ${
                      isInward ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isInward ? `+${entry.malelJatho}` : `-${entry.vaprashJatho}`} {entry.unitGu}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
