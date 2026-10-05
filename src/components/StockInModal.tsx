import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, CheckCircle2, Calendar, Plus } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface StockInModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedItemId?: string;
}

export const StockInModal: React.FC<StockInModalProps> = ({
  isOpen,
  onClose,
  preselectedItemId,
}) => {
  const { stockItems, addStockIn, getItemTotalStock, theme } = useInventory();
  const isDark = theme === 'dark';

  const [selectedItemId, setSelectedItemId] = useState(preselectedItemId || stockItems[0]?.id || '');
  const [batchNumber, setBatchNumber] = useState('');
  const [mfgDate, setMfgDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2);
    return d.toISOString().split('T')[0];
  });
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    return d.toISOString().split('T')[0];
  });
  const [quantity, setQuantity] = useState<string>('100');
  const [receivedFrom, setReceivedFrom] = useState('તાલુકા આરોગ્ય કચેરી (THO)');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (preselectedItemId) setSelectedItemId(preselectedItemId);
      setSuccessMsg('');
      setReferenceNo(`CH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
      setBatchNumber(`BTH-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`);
    }
  }, [isOpen, preselectedItemId]);

  if (!isOpen) return null;

  const currentItem = stockItems.find((i) => i.id === selectedItemId) || stockItems[0];
  const currentStock = currentItem ? getItemTotalStock(currentItem.id) : 0;
  const qtyNumber = Number(quantity) || 1;
  const newBachatPreview = currentStock + qtyNumber;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentItem) {
      onClose();
      return;
    }

    // No mandatory checks - safe auto fallbacks
    addStockIn({
      itemId: currentItem.id,
      batchNumber: batchNumber.trim() || `BTH-${Date.now().toString().slice(-4)}`,
      mfgDate: mfgDate || new Date().toISOString().split('T')[0],
      expiryDate: expiryDate || new Date().toISOString().split('T')[0],
      quantity: qtyNumber,
      receivedFrom: receivedFrom.trim() || 'સરકારી દવા ભંડાર',
      referenceNo: referenceNo.trim() || `CH-${Date.now().toString().slice(-5)}`,
      notes: notes.trim(),
    });

    setSuccessMsg(`આવક સફળ! ${currentItem.nameGu} માં નવો જથ્થો ${qtyNumber} ${currentItem.unitGu} ઉમેરાયો.`);
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
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-emerald-800 text-white border-emerald-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                નવી સ્ટોક આવક નોંધણી (Stock Inward)
              </h3>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-emerald-200'}`}>
                દવા જથ્થો ઉમેરો (કોઈપણ ફીલ્ડ ફરજિયાત નથી)
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
              દવા / સામગ્રી પસંદ કરો
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
                  {currentStock.toLocaleString()} {currentItem.unitGu}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block font-medium">આવક પછી નવો સ્ટોક:</span>
                <span className="text-sm font-black text-emerald-500 font-mono">
                  {newBachatPreview.toLocaleString()} {currentItem.unitGu}
                </span>
              </div>
            </div>
          )}

          {/* Batch Number & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold mb-1">
                બેચ નંબર (Batch No.)
              </label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="દા.ત. BTH-2026-01"
                className={`w-full px-3 py-2 rounded-xl border font-mono font-bold outline-none ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1">
                આવક જથ્થો ({currentItem?.unitGu || 'જથ્થો'})
              </label>
              <input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="જથ્થો દાખલ કરો"
                className={`w-full px-3 py-2 rounded-xl border font-bold text-emerald-500 text-sm outline-none ${
                  isDark
                    ? 'bg-slate-900 border-slate-700'
                    : 'bg-white border-slate-300'
                }`}
              />
            </div>
          </div>

          {/* MFG & Expiry Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                ઉત્પાદન તારીખ (MFG)
              </label>
              <input
                type="date"
                value={mfgDate}
                onChange={(e) => setMfgDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border outline-none text-xs ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                એક્સપાયરી તારીખ (EXP)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border outline-none text-xs ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* Received From & Reference No */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                ક્યાંથી મળ્યો (Received From)
              </label>
              <input
                type="text"
                value={receivedFrom}
                onChange={(e) => setReceivedFrom(e.target.value)}
                placeholder="દા.ત. તાલુકા હેલ્થ ઓફિસ (THO)"
                className={`w-full px-3 py-2 rounded-xl border outline-none ${
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
                placeholder="CH-2026-XXX"
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
              placeholder="વિશેષ વિગત અથવા કાર્યક્રમનું નામ"
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
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-95"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>+ સ્ટોક આવક સેવ કરો</span>
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
