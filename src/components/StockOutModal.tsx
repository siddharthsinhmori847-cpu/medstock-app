import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, CheckCircle2, Calendar, UserCheck } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface StockOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedItemId?: string;
  preselectedBatchId?: string;
}

export const StockOutModal: React.FC<StockOutModalProps> = ({
  isOpen,
  onClose,
  preselectedItemId,
  preselectedBatchId,
}) => {
  const { stockItems, batches, addVitran, getItemTotalStock, getItemBatches, theme } = useInventory();
  const isDark = theme === 'dark';

  const [selectedItemId, setSelectedItemId] = useState(preselectedItemId || stockItems[0]?.id || '');
  const [selectedBatchId, setSelectedBatchId] = useState(preselectedBatchId || '');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState<string>('10');
  const [koneAapiyo, setKoneAapiyo] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  const [successMsg, setSuccessMsg] = useState('');

  // Selected item and batches
  const currentItem = stockItems.find((i) => i.id === selectedItemId) || stockItems[0];
  const itemBatches = currentItem ? getItemBatches(currentItem.id) : [];

  useEffect(() => {
    if (isOpen) {
      if (preselectedItemId) setSelectedItemId(preselectedItemId);
      setSuccessMsg('');
      setReferenceNo(`VIT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);

      if (preselectedBatchId) {
        setSelectedBatchId(preselectedBatchId);
      } else if (itemBatches.length > 0) {
        const active = itemBatches.find((b) => b.quantity > 0) || itemBatches[0];
        setSelectedBatchId(active?.id || '');
      }
    }
  }, [isOpen, preselectedItemId, preselectedBatchId]);

  useEffect(() => {
    if (itemBatches.length > 0 && (!selectedBatchId || !itemBatches.some((b) => b.id === selectedBatchId))) {
      const active = itemBatches.find((b) => b.quantity > 0) || itemBatches[0];
      setSelectedBatchId(active?.id || '');
    }
  }, [selectedItemId, itemBatches]);

  if (!isOpen) return null;

  const currentBatch = itemBatches.find((b) => b.id === selectedBatchId);
  const currentTotalStock = currentItem ? getItemTotalStock(currentItem.id) : 0;
  const qtyNumber = Number(quantity) || 1;
  const remainingBachatPreview = Math.max(0, currentTotalStock - qtyNumber);

  const quickRecipients = [
    'ગામ પંચાયત વોટર વર્કસ (કુવા ક્લોરિનેશન)',
    'આશા બહેન (ઘરેલુ વિતરણ)',
    'આંગણવાડી કેન્દ્ર (WIFS કાર્યક્રમ)',
    'FHW / નર્સિંગ સ્ટાફ (મમતા દિવસ)',
    'સબસેન્ટર ઓપીડી કાઉન્ટર',
    'દર્દી સીધું વિતરણ',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentItem) {
      onClose();
      return;
    }

    // Zero mandatory requirements: safe fallbacks
    addVitran({
      itemId: currentItem.id,
      batchId: currentBatch?.id,
      date: date || new Date().toISOString().split('T')[0],
      quantity: qtyNumber,
      koneAapiyo: (koneAapiyo && koneAapiyo.trim()) || 'સામાન્ય વિતરણ / લાભાર્થી',
      referenceNo: (referenceNo && referenceNo.trim()) || `VIT-${Date.now().toString().slice(-5)}`,
      notes: notes.trim(),
    });

    setSuccessMsg(`વિતરણ સફળ! ${qtyNumber} ${currentItem.unitGu} વિતરણ નોંધાયું.`);
    setTimeout(() => {
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden my-auto transition-colors ${
          isDark ? 'bg-[#0f172a] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 flex items-center justify-between border-b ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-rose-800 text-white border-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                દવા વિતરણ નોંધણી (Stock Distribution)
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-rose-200'}`}>
                દવા વિતરણ રજિસ્ટર (કોઈપણ ફીલ્ડ ફરજિયાત નથી)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-white/80 hover:bg-white/10'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 bg-emerald-500/20 border-b border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Select Item */}
          <div>
            <label className="block text-[11px] font-bold mb-1.5">
              વિતરણ માટે દવા પસંદ કરો
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl border outline-none font-bold ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-white'
                  : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            >
              {stockItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nameGu} ({item.unitGu})
                </option>
              ))}
            </select>
          </div>

          {/* Current Stock Preview Banner */}
          {currentItem && (
            <div
              className={`p-3 rounded-xl border flex items-center justify-between ${
                isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">હાલનો ઉપલબ્ધ સ્ટોક:</span>
                <span className="text-sm font-bold text-teal-500 font-mono">
                  {currentTotalStock.toLocaleString()} {currentItem.unitGu}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block font-medium">વિતરણ પછી બાકી સ્ટોક:</span>
                <span className="text-sm font-black text-rose-500 font-mono">
                  {remainingBachatPreview.toLocaleString()} {currentItem.unitGu}
                </span>
              </div>
            </div>
          )}

          {/* Batch Selector & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold mb-1">
                બેચ પસંદ કરો (Batch)
              </label>
              {itemBatches.length > 0 ? (
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border outline-none font-bold font-mono text-xs ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-teal-400'
                      : 'bg-slate-50 border-slate-300 text-teal-700'
                  }`}
                >
                  {itemBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batchNumber} (સ્ટોક: {b.quantity})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  readOnly
                  value="સામાન્ય બેચ (Auto-batch)"
                  className={`w-full px-3 py-2 rounded-xl border text-xs text-slate-400 ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}
                />
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1">
                વિતરણ જથ્થો ({currentItem?.unitGu || 'જથ્થો'})
              </label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="જથ્થો દાખલ કરો"
                className={`w-full px-3 py-2 rounded-xl border font-bold text-rose-500 text-sm outline-none ${
                  isDark
                    ? 'bg-slate-900 border-slate-700'
                    : 'bg-white border-slate-300'
                }`}
              />
            </div>
          </div>

          {/* Recipient & Quick Chips */}
          <div>
            <label className="block text-[11px] font-bold mb-1">
              કોને આપ્યો / લાભાર્થી / સ્થળ
            </label>
            <input
              type="text"
              value={koneAapiyo}
              onChange={(e) => setKoneAapiyo(e.target.value)}
              placeholder="દા.ત. આશા બહેન (પટેલ ફળિયું) / દર્દીનું નામ"
              className={`w-full px-3 py-2 rounded-xl border font-bold outline-none ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickRecipients.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setKoneAapiyo(chip)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border cursor-pointer transition-colors ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                વિતરણ તારીખ
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border outline-none text-xs ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                ચલન / રેફરન્સ નંબર
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="VIT-2026-XXX"
                className={`w-full px-3 py-2 rounded-xl border font-mono outline-none ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              નોંધ (Notes)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="વિશેષ હેતુ અથવા કાર્યક્રમની નોંધ"
              className={`w-full px-3 py-2 rounded-xl border outline-none ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>- દવા વિતરણ સેવ કરો</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              બંધ કરો
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
