import React, { useState, useEffect } from 'react';
import { X, ArrowUpRight, CheckCircle2, AlertCircle, Calendar, UserCheck } from 'lucide-react';
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
  const { stockItems, batches, addVitran, getItemTotalStock, getItemBatches } = useInventory();

  const [selectedItemId, setSelectedItemId] = useState(preselectedItemId || stockItems[0]?.id || '');
  const [selectedBatchId, setSelectedBatchId] = useState(preselectedBatchId || '');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState<string>('');
  const [koneAapiyo, setKoneAapiyo] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected item and batches
  const currentItem = stockItems.find((i) => i.id === selectedItemId) || stockItems[0];
  const itemBatches = currentItem ? getItemBatches(currentItem.id) : [];

  useEffect(() => {
    if (isOpen) {
      if (preselectedItemId) setSelectedItemId(preselectedItemId);
      setErrorMsg('');
      setSuccessMsg('');
      setReferenceNo(`VIT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);

      // Auto select first batch with available stock
      if (preselectedBatchId) {
        setSelectedBatchId(preselectedBatchId);
      } else if (itemBatches.length > 0) {
        const active = itemBatches.find(b => b.quantity > 0) || itemBatches[0];
        setSelectedBatchId(active?.id || '');
      }
    }
  }, [isOpen, preselectedItemId, preselectedBatchId]);

  // When selected item changes, auto-pick active batch
  useEffect(() => {
    if (itemBatches.length > 0 && (!selectedBatchId || !itemBatches.some(b => b.id === selectedBatchId))) {
      const active = itemBatches.find(b => b.quantity > 0) || itemBatches[0];
      setSelectedBatchId(active?.id || '');
    }
  }, [selectedItemId, itemBatches]);

  if (!isOpen) return null;

  const currentBatch = itemBatches.find((b) => b.id === selectedBatchId);
  const currentTotalStock = currentItem ? getItemTotalStock(currentItem.id) : 0;
  const remainingBachatPreview = Math.max(0, currentTotalStock - (Number(quantity) || 0));

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
    setErrorMsg('');

    try {
      if (!currentItem) throw new Error('દવા પસંદ કરો.');
      if (!currentBatch) throw new Error('બેચ પસંદ કરો.');
      if (Number(quantity) <= 0) throw new Error('માન્ય જથ્થો દાખલ કરો.');
      if (Number(quantity) > currentBatch.quantity) {
        throw new Error(`પૂરતો સ્ટોક ઉપલબ્ધ નથી. બેચ ${currentBatch.batchNumber} માં માત્ર: ${currentBatch.quantity} ${currentItem.unitGu}`);
      }
      if (!koneAapiyo.trim()) throw new Error('કોને આપ્યો (લાભાર્થી/સ્થળ) નામ દાખલ કરો.');

      addVitran({
        itemId: currentItem.id,
        batchId: currentBatch.id,
        date,
        quantity: Number(quantity),
        koneAapiyo: koneAapiyo.trim(),
        referenceNo: referenceNo.trim(),
        notes: notes.trim(),
      });

      setSuccessMsg(`વિતરણ સફળ! ${quantity} ${currentItem.unitGu} ${koneAapiyo.trim()} ને આપ્યા.`);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'સમસ્યા આવી.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-rose-900 text-white flex items-center justify-between border-b border-rose-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                દવા / સામગ્રી વિતરણ નોંધ (Stock Vitran)
              </h3>
              <p className="text-xs text-rose-200 mt-0.5">
                દર્દી, આંગણવાડી, આશા અથવા પંચાયતને આપેલ જથ્થો નોંધો
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-rose-300 hover:text-white hover:bg-rose-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Item Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              દવા / વસ્તુ પસંદ કરો *
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-rose-600 font-bold text-slate-900 cursor-pointer"
              required
            >
              {stockItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nameGu} ({item.unitGu}) — કુલ હાજર સ્ટોક: {getItemTotalStock(item.id)}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-800">
                બેચ પસંદ કરો (Select Batch) *
              </label>
              {currentBatch && (
                <span className="text-[11px] font-semibold text-rose-800">
                  આ બેચમાં હાજર: <strong>{currentBatch.quantity} {currentItem?.unitGu}</strong>
                </span>
              )}
            </div>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono font-medium text-slate-900 focus:outline-none focus:border-rose-600 cursor-pointer"
              required
            >
              {itemBatches.map((b) => (
                <option key={b.id} value={b.id} disabled={b.quantity <= 0}>
                  બેચ: {b.batchNumber} | EXP: {b.expiryDate} | હાજર: {b.quantity} {currentItem?.unitGu}
                </option>
              ))}
            </select>
          </div>

          {/* Live Register Flow Display (ખુલતો -> વપરાશ -> બચત) */}
          <div className="p-3.5 rounded-xl bg-slate-900/5 border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px]">ખુલતો જથ્થો:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {currentTotalStock.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 block">{currentItem?.unitGu}</span>
            </div>

            <div className="bg-rose-50 p-2 rounded-lg border border-rose-200">
              <span className="text-rose-700 block text-[10px] font-semibold">વિતરણ જથ્થો:</span>
              <span className="font-mono font-bold text-rose-800 text-sm">
                -{quantity || 0}
              </span>
              <span className="text-[10px] text-rose-600 block">{currentItem?.unitGu}</span>
            </div>

            <div className="bg-teal-50 p-2 rounded-lg border border-teal-200">
              <span className="text-teal-800 block text-[10px] font-bold">આખર બચત:</span>
              <span className="font-mono font-black text-teal-950 text-sm">
                {remainingBachatPreview.toLocaleString()}
              </span>
              <span className="text-[10px] text-teal-700 block">{currentItem?.unitGu}</span>
            </div>
          </div>

          {/* Date & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                વિતરણ તારીખ (Distribution Date) *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white font-mono text-slate-900"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-rose-900 mb-1">
                આપેલ જથ્થો ({currentItem?.unitGu || 'એકમ'}) *
              </label>
              <input
                type="number"
                step="any"
                placeholder="દા.ત. 10"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-2.5 py-1.5 border-2 border-rose-400 rounded-lg bg-white font-mono font-bold text-slate-900 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* કોને આપ્યો (Kone Aapiyo) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              કોને આપ્યો (Recipient / Given To / Ward / Anganwadi / Person) *
            </label>
            <input
              type="text"
              value={koneAapiyo}
              onChange={(e) => setKoneAapiyo(e.target.value)}
              placeholder="દા.ત. આંગણવાડી કેન્દ્ર નં. ૧, આશા બહેન, અથવા દર્દીનું નામ"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium text-slate-900 focus:outline-none focus:border-rose-600"
              required
            />
            {/* Quick Suggestions Chips */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              <span className="text-[10px] text-slate-400 py-0.5">ઝડપી પસંદગી:</span>
              {quickRecipients.map((rec) => (
                <button
                  type="button"
                  key={rec}
                  onClick={() => setKoneAapiyo(rec)}
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  {rec}
                </button>
              ))}
            </div>
          </div>

          {/* Reference No & Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                કેસ / પાવતી નંબર
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="દા.ત. OPD-104 અથવા વાઉચર નં."
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                વિશેષ નોંધ (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="દા.ત. WIFS કાર્યક્રમ અંતર્ગત"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-800"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              રદ કરો (Cancel)
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              વિતરણ સાચવો (Save Vitran)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
