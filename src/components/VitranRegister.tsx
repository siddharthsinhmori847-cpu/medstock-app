import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Printer,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Share2,
  LayoutList,
  Table as TableIcon,
  Check,
  UserCheck,
  MessageSquare
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { VitranEntry } from '../types/inventory';
import { downloadOrShareFile } from '../utils/pdfGenerator';

interface VitranRegisterProps {
  onOpenStockIn: (itemId?: string) => void;
  onOpenVitran: (itemId?: string) => void;
  onOpenPrint: () => void;
  selectedFilterId: string;
  onSelectFilterId: (id: string) => void;
}

export const VitranRegister: React.FC<VitranRegisterProps> = ({
  onOpenStockIn,
  onOpenVitran,
  onOpenPrint,
  selectedFilterId,
  onSelectFilterId,
}) => {
  const { vitranEntries, stockItems, profile } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<'ALL' | 'VITRAN' | 'INWARD'>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'THIS_MONTH'>('ALL');
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS'); // default CARDS for mobile
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const monthPrefix = todayStr.slice(0, 7);

    return vitranEntries.filter((entry) => {
      // Item filter
      if (selectedFilterId !== 'ALL' && entry.itemId !== selectedFilterId) {
        return false;
      }

      // Action filter
      if (actionFilter !== 'ALL' && entry.action !== actionFilter) {
        return false;
      }

      // Date filter
      if (dateFilter === 'TODAY' && entry.date !== todayStr) {
        return false;
      }
      if (dateFilter === 'THIS_MONTH' && !entry.date.startsWith(monthPrefix)) {
        return false;
      }

      // Search query
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesName = entry.itemNameGu.toLowerCase().includes(q) || entry.itemNameEn.toLowerCase().includes(q);
        const matchesParty = entry.koneAapiyo.toLowerCase().includes(q);
        const matchesBatch = entry.batchNumber.toLowerCase().includes(q);
        const matchesRef = (entry.referenceNo || '').toLowerCase().includes(q);
        if (!matchesName && !matchesParty && !matchesBatch && !matchesRef) {
          return false;
        }
      }

      return true;
    });
  }, [vitranEntries, selectedFilterId, actionFilter, dateFilter, searchQuery]);

  // CSV Export
  const handleExportCSV = async () => {
    const headers = [
      'તારીખ (Date)',
      'દવાનું નામ (Item)',
      'બેચ નંબર (Batch No)',
      'ઉત્પાદન તારીખ (MFG)',
      'એક્સપાયરી તારીખ (EXP)',
      'ખુલતો જથ્થો (Opening Stock)',
      'મળેલ જથ્થો (Received / Inward)',
      'વિતરણ જથ્થો (Dispensed / Outward)',
      'કોને આપ્યો (Recipient / Given To)',
      'બચત જથ્થો (Closing Balance)',
      'એકમ (Unit)',
      'ચલન/રેફરન્સ નંબર',
      'વિશેષ નોંધ'
    ];

    const rows = filteredEntries.map((e) => [
      e.date,
      `"${e.itemNameGu}"`,
      e.batchNumber,
      e.mfgDate,
      e.expiryDate,
      e.khultoJatho,
      e.malelJatho > 0 ? e.malelJatho : '',
      e.vaprashJatho > 0 ? e.vaprashJatho : '',
      `"${e.koneAapiyo}"`,
      e.bachat,
      e.unitGu,
      `"${e.referenceNo || ''}"`,
      `"${e.notes || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const fileName = `Stock_Vitran_Register_${new Date().toISOString().split('T')[0]}.csv`;
    const file = new File([blob], fileName, { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    await downloadOrShareFile(file, url, `${profile.centerNameGu || 'સ્ટોક રજિસ્ટર'} વિતરણ CSV`);

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 60000);
  };

  // WhatsApp Share
  const handleWhatsAppShare = (entry: VitranEntry) => {
    const isInward = entry.action === 'INWARD';
    const text = `📋 *${profile.centerNameGu}*
📅 *તારીખ:* ${entry.date}
💊 *દવાનું નામ:* ${entry.itemNameGu}
🏷️ *બેચ નંબર:* ${entry.batchNumber} (EXP: ${entry.expiryDate})
${isInward ? `📥 *મળેલ જથ્થો (આવક):* +${entry.malelJatho} ${entry.unitGu}` : `📤 *વિતરણ જથ્થો:* -${entry.vaprashJatho} ${entry.unitGu}`}
👤 *${isInward ? 'ક્યાંથી મળ્યો:' : 'કોને આપ્યો:'}* ${entry.koneAapiyo}
📊 *ખુલતો જથ્થો:* ${entry.khultoJatho} ${entry.unitGu}
✅ *આજની બચત (Bachat):* ${entry.bachat} ${entry.unitGu}
${entry.referenceNo ? `📑 *રેફરન્સ નં:* ${entry.referenceNo}` : ''}
✍️ *સંચાલક:* ${profile.ownerName || profile.inchargeName}`;

    navigator.clipboard?.writeText(text);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const totalInwardQty = filteredEntries.reduce((sum, e) => sum + e.malelJatho, 0);
  const totalVitranQty = filteredEntries.reduce((sum, e) => sum + e.vaprashJatho, 0);

  return (
    <div className="space-y-3.5 text-white pb-6">
      {/* 1. Header Bar */}
      <div className="bg-[#111927] p-4 rounded-2xl border border-slate-800 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></span>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              દવા વિતરણ રજિસ્ટર (Stock Vitran Register)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            ખુલતો જથ્થો, મળેલ જથ્થો, વિતરણ અને આખર બચતનું સરકારી રજિસ્ટર
          </p>
        </div>

        {/* View Toggle (Cards vs Table) & Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="bg-[#0b131e] p-0.5 rounded-xl border border-slate-800 flex items-center text-xs">
            <button
              onClick={() => setViewMode('CARDS')}
              className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                viewMode === 'CARDS'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>કાર્ડ વ્યુ</span>
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                viewMode === 'TABLE'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>ટેબલ વ્યુ</span>
            </button>
          </div>

          <button
            onClick={onOpenPrint}
            className="px-3 py-1.5 bg-[#162234] hover:bg-[#1d2d44] border border-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">પ્રિન્ટ</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-[#162234] hover:bg-[#1d2d44] border border-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="bg-[#111927] p-3 rounded-2xl border border-slate-800 space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="દવાનું નામ, કોને આપ્યો, બેચ નંબર અથવા રેફરન્સ શોધો..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#0b131e] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-6">
            <select
              value={selectedFilterId}
              onChange={(e) => onSelectFilterId(e.target.value)}
              className="w-full px-3 py-2 bg-[#0b131e] border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">બધી દવાઓ (All Items)</option>
              {stockItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nameGu} ({item.unitGu})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action pills & date filter */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActionFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                actionFilter === 'ALL'
                  ? 'bg-slate-700 text-white'
                  : 'bg-[#0b131e] text-slate-400 hover:text-white'
              }`}
            >
              બધા રેકોર્ડ્સ
            </button>
            <button
              onClick={() => setActionFilter('VITRAN')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                actionFilter === 'VITRAN'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-950/40 text-rose-300 border border-rose-900/50'
              }`}
            >
              માત્ર વિતરણ (-)
            </button>
            <button
              onClick={() => setActionFilter('INWARD')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                actionFilter === 'INWARD'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-950/40 text-emerald-300 border border-emerald-900/50'
              }`}
            >
              માત્ર આવક (+)
            </button>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <span>કુલ એન્ટ્રી: <strong className="text-white font-mono">{filteredEntries.length}</strong></span>
            <span>·</span>
            <span>કુલ વિતરણ: <strong className="text-rose-400 font-mono">-{totalVitranQty}</strong></span>
          </div>
        </div>
      </div>

      {/* 3. Cards View (Mobile-Friendly) */}
      {viewMode === 'CARDS' ? (
        <div className="space-y-3">
          {filteredEntries.length === 0 ? (
            <div className="bg-[#111927] rounded-2xl p-8 text-center border border-slate-800 text-slate-500">
              <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="font-bold text-slate-400 text-sm">કોઈ વિતરણ એન્ટ્રી મળી નથી</p>
              <p className="text-xs text-slate-600 mt-1">નવી વિતરણ એન્ટ્રી કરવા માટે ઉપરના બટનનો ઉપયોગ કરો.</p>
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const isInward = entry.action === 'INWARD';
              return (
                <div
                  key={entry.id}
                  className={`bg-[#111927] border rounded-2xl p-4 shadow-md space-y-3 transition-all ${
                    isInward ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-slate-800'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isInward
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          }`}
                        >
                          {isInward ? 'આવક (Inward)' : 'વિતરણ (Vitran)'}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 font-bold">
                          {entry.date}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-white mt-1 leading-snug">
                        {entry.itemNameGu}
                      </h3>
                      <p className="text-[11px] text-slate-400">{entry.itemNameEn}</p>
                    </div>

                    {/* WhatsApp Share Button */}
                    <button
                      onClick={() => handleWhatsAppShare(entry)}
                      className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-transform active:scale-95 shrink-0"
                      title="WhatsApp પર શેર કરો"
                    >
                      {copiedId === entry.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span className="text-[10px]">શેર થયું!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" />
                          <span className="text-[10px]">શેર</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Stock Calculation Flow (ખુલતો -> વપરાશ -> બચત) */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-[#0b131e] border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-semibold block">ખુલતો જથ્થો:</span>
                      <span className="font-mono font-bold text-slate-200 text-sm">
                        {entry.khultoJatho.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-500 block">{entry.unitGu}</span>
                    </div>

                    <div
                      className={`p-2 rounded-xl border ${
                        isInward
                          ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300'
                          : 'bg-rose-950/40 border-rose-900/60 text-rose-300'
                      }`}
                    >
                      <span className="text-[10px] font-bold block">
                        {isInward ? 'મળેલ જથ્થો:' : 'વિતરણ જથ્થો:'}
                      </span>
                      <span className="font-mono font-black text-sm">
                        {isInward ? `+${entry.malelJatho}` : `-${entry.vaprashJatho}`}
                      </span>
                      <span className="text-[9px] opacity-80 block">{entry.unitGu}</span>
                    </div>

                    <div className="p-2 rounded-xl bg-[#0b131e] border border-slate-800">
                      <span className="text-[10px] text-teal-400 font-bold block">આખર બચત:</span>
                      <span className="font-mono font-black text-sm text-teal-300">
                        {entry.bachat.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-slate-500 block">{entry.unitGu}</span>
                    </div>
                  </div>

                  {/* Recipient & Details */}
                  <div className="space-y-1.5 pt-1 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-semibold text-[11px] shrink-0">
                        {isInward ? 'ક્યાંથી મળ્યો:' : 'કોને આપ્યો:'}
                      </span>
                      <span className="font-bold text-white truncate">
                        {entry.koneAapiyo}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 bg-[#0b131e] p-2 rounded-xl border border-slate-800">
                      <div>
                        બેચ નં: <strong className="font-mono text-slate-200 font-bold">{entry.batchNumber}</strong>
                      </div>
                      <div>
                        MFG: <span className="font-mono">{entry.mfgDate}</span>
                      </div>
                      <div>
                        EXP: <strong className="font-mono text-slate-200">{entry.expiryDate}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Classic Table View */
        <div className="bg-[#111927] border border-slate-800 rounded-2xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0b131e] text-slate-400 font-black uppercase text-[10px] border-b border-slate-800">
                  <th className="py-2.5 px-3 border-r border-slate-800">તારીખ</th>
                  <th className="py-2.5 px-3 border-r border-slate-800">દવાનું નામ</th>
                  <th className="py-2.5 px-3 border-r border-slate-800">બેચ & EXP</th>
                  <th className="py-2.5 px-3 text-right border-r border-slate-800">ખુલતો જથ્થો</th>
                  <th className="py-2.5 px-3 text-right border-r border-slate-800 text-emerald-400">આવક</th>
                  <th className="py-2.5 px-3 text-right border-r border-slate-800 text-rose-400">વિતરણ</th>
                  <th className="py-2.5 px-3 border-r border-slate-800">કોને આપ્યો</th>
                  <th className="py-2.5 px-3 text-right border-r border-slate-800 text-teal-300 font-black">બચત</th>
                  <th className="py-2.5 px-2 text-center">શેર</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[#162234]">
                    <td className="py-2.5 px-3 font-mono font-bold whitespace-nowrap border-r border-slate-800">
                      {entry.date}
                    </td>
                    <td className="py-2.5 px-3 font-bold border-r border-slate-800 text-white">
                      {entry.itemNameGu}
                    </td>
                    <td className="py-2.5 px-3 font-mono border-r border-slate-800 text-[11px]">
                      <div>{entry.batchNumber}</div>
                      <div className="text-slate-500">EXP: {entry.expiryDate}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono border-r border-slate-800">
                      {entry.khultoJatho}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 border-r border-slate-800">
                      {entry.malelJatho > 0 ? `+${entry.malelJatho}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400 border-r border-slate-800">
                      {entry.vaprashJatho > 0 ? `-${entry.vaprashJatho}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 border-r border-slate-800 font-medium">
                      {entry.koneAapiyo}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-black text-sm text-teal-300 border-r border-slate-800">
                      {entry.bachat} {entry.unitGu}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        onClick={() => handleWhatsAppShare(entry)}
                        className="p-1 rounded-lg text-emerald-400 hover:bg-emerald-950/60 cursor-pointer"
                        title="WhatsApp શેર કરો"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
