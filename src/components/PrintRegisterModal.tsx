import React, { useState } from 'react';
import { X, Printer, Download, Filter } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface PrintRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrintRegisterModal: React.FC<PrintRegisterModalProps> = ({ isOpen, onClose }) => {
  const { vitranEntries, stockItems, profile } = useInventory();
  const [selectedFilterId, setSelectedFilterId] = useState<string>('ALL');

  if (!isOpen) return null;

  const filtered = vitranEntries.filter((e) => {
    if (selectedFilterId !== 'ALL' && e.itemId !== selectedFilterId) return false;
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Controls Bar (hidden during print) */}
        <div className="p-3 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-bold text-white">પ્રિન્ટ રજિસ્ટર વ્યુ</span>
            <select
              value={selectedFilterId}
              onChange={(e) => setSelectedFilterId(e.target.value)}
              className="bg-slate-800 text-white border border-slate-700 rounded px-2.5 py-1 text-xs"
            >
              <option value="ALL">બધી દવાઓ</option>
              {stockItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nameGu}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>પ્રિન્ટ કરો (Print)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Document */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white text-slate-900 font-serif print:p-0 print:overflow-visible">
          {/* Official Letterhead */}
          <div className="border-b-2 border-slate-900 pb-3 text-center space-y-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 font-sans">
              {profile.centerNameGu}
            </h1>
            <p className="text-xs text-slate-700 font-sans">
              {profile.villageTaluka}, જિલ્લો: {profile.district}
            </p>
            <div className="pt-2 text-center">
              <span className="inline-block bg-slate-100 text-slate-950 font-sans text-xs font-black uppercase tracking-widest px-4 py-1 border border-slate-900">
                દૈનિક દવા સ્ટોક વિતરણ રજિસ્ટર (DAILY STOCK VITRAN LEDGER)
              </span>
            </div>
          </div>

          {/* Subheader */}
          <div className="py-2 flex items-center justify-between text-[11px] text-slate-700 font-sans border-b border-slate-300">
            <div>
              <span>પ્રિન્ટ તારીખ: <strong>{new Date().toLocaleDateString('gu-IN')}</strong></span>
            </div>
            <div>
              <span>રજિસ્ટર ઇન્ચાર્જ: <strong>{profile.inchargeName}</strong></span>
            </div>
          </div>

          {/* Register Table */}
          <div className="mt-4">
            <table className="w-full text-left text-[10px] font-sans border border-slate-500 border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-500 text-slate-950 font-black text-center">
                  <th className="p-1.5 border-r border-slate-400 w-6">ક્રમ</th>
                  <th className="p-1.5 border-r border-slate-400 w-16">તારીખ</th>
                  <th className="p-1.5 border-r border-slate-400 text-left">દવાનું નામ</th>
                  <th className="p-1.5 border-r border-slate-400 w-16">બેચ નં.</th>
                  <th className="p-1.5 border-r border-slate-400 w-14">MFG</th>
                  <th className="p-1.5 border-r border-slate-400 w-14">EXP</th>
                  <th className="p-1.5 border-r border-slate-400 text-right w-14">ખુલતો</th>
                  <th className="p-1.5 border-r border-slate-400 text-right w-14">મળેલ</th>
                  <th className="p-1.5 border-r border-slate-400 text-right w-14">વપરાશ</th>
                  <th className="p-1.5 border-r border-slate-400 text-left">કોને આપ્યો (Kone Aapiyo)</th>
                  <th className="p-1.5 border-r border-slate-400 text-right w-14 font-black">બચત</th>
                  <th className="p-1.5 w-14">સહી</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {filtered.map((e, idx) => (
                  <tr key={e.id} className="border-b border-slate-300">
                    <td className="p-1.5 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                    <td className="p-1.5 border-r border-slate-300 font-mono whitespace-nowrap">{e.date}</td>
                    <td className="p-1.5 border-r border-slate-300 font-bold">{e.itemNameGu}</td>
                    <td className="p-1.5 border-r border-slate-300 font-mono font-bold text-center">{e.batchNumber}</td>
                    <td className="p-1.5 border-r border-slate-300 font-mono text-center">{e.mfgDate}</td>
                    <td className="p-1.5 border-r border-slate-300 font-mono text-center">{e.expiryDate}</td>
                    <td className="p-1.5 border-r border-slate-300 text-right font-mono font-semibold">{e.khultoJatho}</td>
                    <td className="p-1.5 border-r border-slate-300 text-right font-mono font-bold text-emerald-800">
                      {e.malelJatho > 0 ? `+${e.malelJatho}` : '-'}
                    </td>
                    <td className="p-1.5 border-r border-slate-300 text-right font-mono font-bold text-rose-800">
                      {e.vaprashJatho > 0 ? `-${e.vaprashJatho}` : '-'}
                    </td>
                    <td className="p-1.5 border-r border-slate-300 font-medium">{e.koneAapiyo}</td>
                    <td className="p-1.5 border-r border-slate-300 text-right font-mono font-black text-slate-950 bg-slate-50">
                      {e.bachat} {e.unitGu}
                    </td>
                    <td className="p-1.5 text-center text-[9px] text-slate-400"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className="mt-12 pt-4 border-t border-slate-400 flex justify-between items-end text-xs font-sans">
            <div className="space-y-1 text-center">
              <div className="w-44 border-b border-slate-900 mb-1"></div>
              <p className="font-bold text-slate-900">આરોગ્ય કાર્યકરની સહી</p>
              <p className="text-[10px] text-slate-500">FHW / MPHW / CHC</p>
            </div>
            <div className="space-y-1 text-center">
              <div className="w-44 border-b border-slate-900 mb-1"></div>
              <p className="font-bold text-slate-900">મેડિકલ ઓફિસર (MO)</p>
              <p className="text-[10px] text-slate-500">પ્રાથમિક આરોગ્ય કેન્દ્ર</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
