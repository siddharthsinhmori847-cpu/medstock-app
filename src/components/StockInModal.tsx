import React, { useState, useEffect } from 'react';
import { X, ArrowDownLeft, CheckCircle2, AlertCircle, Calendar, Plus } from 'lucide-react';
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
  const { stockItems, addStockIn, getItemTotalStock } = useInventory();

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
  const [quantity, setQuantity] = useState<string>('');
  const [receivedFrom, setReceivedFrom] = useState('તાલુકા આરોગ્ય કચેરી (THO)');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (preselectedItemId) setSelectedItemId(preselectedItemId);
      setErrorMsg('');
      setSuccessMsg('');
      setReferenceNo(`CH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
      setBatchNumber(`BTH-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`);
    }
  }, [isOpen, preselectedItemId]);

  if (!isOpen) return null;

  const currentItem = stockItems.find((i) => i.id === selectedItemId) || stockItems[0];
  const currentStock = currentItem ? getItemTotalStock(currentItem.id) : 0;
  const newBachatPreview = currentStock + (Number(quantity) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      if (!currentItem) throw new Error('દવા પસંદ કરો.');
      if (!batchNumber.trim()) throw new Error('બેચ નંબર દાખલ કરો.');
      if (!expiryDate) throw new Error('એક્સપાયરી તારીખ દાખલ કરો.');
      if (new Date(expiryDate) <= new Date(mfgDate)) {
        throw new Error('એક્સપાયરી તારીખ ઉત્પાદન (MFG) તારીખ પછીની હોવી જોઈએ.');
      }
      if (Number(quantity) <= 0) throw new Error('માન્ય જથ્થો દાખલ કરો.');

      addStockIn({
        itemId: currentItem.id,
        batchNumber: batchNumber.trim().toUpperCase(),
        mfgDate,
        expiryDate,
        quantity: Number(quantity),
        receivedFrom: receivedFrom.trim(),
        referenceNo: referenceNo.trim(),
        notes: notes.trim(),
      });

      setSuccessMsg(`આવક સફળ! ${currentItem.nameGu} માં નવો જથ્થો ${quantity} ${currentItem.unitGu} ઉમેરાયો.`);
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
        <div className="px-5 py-4 bg-emerald-900 text-white flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                નવી સ્ટોક આવક નોંધણી (Stock Inward)
              </h3>
              <p className="text-xs text-emerald-200 mt-0.5">
                સરકારી ડેપો અથવા ખરીદીમાંથી મળેલ જથ્થો ઉમેરો
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition-colors cursor-pointer"
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
              દવા / વસ્તુ પસંદ કરો (Select Stock Item) *
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-emerald-600 font-bold text-slate-900 cursor-pointer"
              required
            >
              {stockItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nameGu} ({item.unitGu})
                </option>
              ))}
            </select>
          </div>

          {/* Current Stock Preview Card */}
          {currentItem && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">હાજર સ્ટોક (ખુલતો):</span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  {currentStock.toLocaleString()} {currentItem.unitGu}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block text-[11px]">આવક બાદ નવી બચત:</span>
                <span className="text-base font-black text-emerald-800 font-mono">
                  {newBachatPreview.toLocaleString()} {currentItem.unitGu}
                </span>
              </div>
            </div>
          )}

          {/* Batch Number & MFG/EXP */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                બેચ નંબર (Batch No.) *
              </label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value.toUpperCase())}
                placeholder="e.g. CLP-2026-02"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 bg-white uppercase"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                ઉત્પાદન તારીખ (MFG) *
              </label>
              <input
                type="date"
                value={mfgDate}
                onChange={(e) => setMfgDate(e.target.value)}
                className="w-full px-2 py-1.5 border border-slate-300 rounded-lg bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                એક્સપાયરી (EXP) *
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-2 py-1.5 border border-emerald-400 rounded-lg bg-white font-bold text-slate-900"
                required
              />
            </div>
          </div>

          {/* Quantity & Received From */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-emerald-900 mb-1">
                મળેલ જથ્થો ({currentItem?.unitGu || 'એકમ'}) *
              </label>
              <input
                type="number"
                step="any"
                placeholder="દા.ત. 100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 text-base font-black border-2 border-emerald-500 rounded-xl bg-white text-emerald-950 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ક્યાંથી મળ્યો (Received From)
              </label>
              <input
                type="text"
                value={receivedFrom}
                onChange={(e) => setReceivedFrom(e.target.value)}
                placeholder="દા.ત. જિલ્લા સ્ટોર, CDHO, PHC સ્ટોર"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium text-slate-900"
              />
            </div>
          </div>

          {/* Challan No & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                ચલન / વાઉચર નંબર
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="ચલન નં."
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
                placeholder="કોઈ ખાસ નોંધ..."
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
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              + સ્ટોક આવક સાચવો (Save Stock In)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
