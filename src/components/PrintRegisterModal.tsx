import React, { useState, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  FileText,
  Calendar,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
  Droplet,
  Package,
  Layers,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { generatePdfFromElement } from '../utils/pdfGenerator';
import { exportStockDataToCsv } from '../utils/exportCsv';

interface PrintRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultReportType?: 'VITRAN' | 'TCL' | 'STOCK';
}

export type TimePeriod = 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'ALL' | 'CUSTOM';
export type ReportType = 'VITRAN' | 'TCL' | 'STOCK' | 'CONSOLIDATED';

export const PrintRegisterModal: React.FC<PrintRegisterModalProps> = ({
  isOpen,
  onClose,
  defaultReportType = 'VITRAN',
}) => {
  const {
    vitranEntries,
    stockItems,
    batches,
    tclLogs,
    profile,
    getItemTotalStock,
  } = useInventory();

  const printDocumentRef = useRef<HTMLDivElement>(null);

  // States
  const [reportType, setReportType] = useState<ReportType>(defaultReportType);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('MONTHLY');
  const [selectedMedicineId, setSelectedMedicineId] = useState<string>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate Date Boundaries
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  let startDateStr = '';
  let periodLabelGu = '';

  if (timePeriod === 'WEEKLY') {
    const d = new Date(today);
    d.setDate(d.getDate() - 7);
    startDateStr = d.toISOString().split('T')[0];
    periodLabelGu = `સાપ્તાહિક રિપોર્ટ (${startDateStr} થી ${todayStr})`;
  } else if (timePeriod === 'MONTHLY') {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    startDateStr = `${y}-${m}-01`;
    const monthNameGu = today.toLocaleDateString('gu-IN', { month: 'long', year: 'numeric' });
    periodLabelGu = `માસિક રિપોર્ટ - ${monthNameGu} (${startDateStr} થી ${todayStr})`;
  } else if (timePeriod === 'YEARLY') {
    const y = today.getFullYear();
    startDateStr = `${y}-01-01`;
    periodLabelGu = `વાર્ષિક રિપોર્ટ (વર્ષ ${y}: ${startDateStr} થી ${todayStr})`;
  } else if (timePeriod === 'CUSTOM') {
    startDateStr = customStartDate;
    periodLabelGu = `કસ્ટમ સમયગાળો (${customStartDate} થી ${customEndDate})`;
  } else {
    startDateStr = '1970-01-01';
    periodLabelGu = 'સમગ્ર રજિસ્ટર (તમામ રેકોર્ડ્સ)';
  }

  // Filter Vitran Entries
  const filteredVitran = vitranEntries.filter((e) => {
    if (selectedMedicineId !== 'ALL' && e.itemId !== selectedMedicineId) return false;
    if (timePeriod === 'ALL') return true;
    if (timePeriod === 'CUSTOM') {
      return e.date >= customStartDate && e.date <= customEndDate;
    }
    return e.date >= startDateStr && e.date <= todayStr;
  });

  // Filter TCL logs
  const filteredTcl = tclLogs.filter((t) => {
    if (timePeriod === 'ALL') return true;
    if (timePeriod === 'CUSTOM') {
      return t.date >= customStartDate && t.date <= customEndDate;
    }
    return t.date >= startDateStr && t.date <= todayStr;
  });

  // Calculate Vitran Totals
  const totalVitranQty = filteredVitran.reduce((sum, e) => sum + (e.vaprashJatho || 0), 0);
  const totalMalelQty = filteredVitran.reduce((sum, e) => sum + (e.malelJatho || 0), 0);
  const totalTclUsedGrams = filteredTcl.reduce((sum, t) => sum + (t.tclUsedGrams || 0), 0);
  const totalWellsTreated = filteredTcl.length;

  // 1. PDF Download Handler
  const handleDownloadPdf = async () => {
    if (!printDocumentRef.current) return;
    setIsGeneratingPdf(true);
    setStatusMessage('PDF જનરેટ થઈ રહ્યું છે...');

    try {
      const fileName = `MedStock_${reportType}_${timePeriod}_${todayStr}.pdf`;
      const res = await generatePdfFromElement(printDocumentRef.current, {
        fileName,
        title: `${profile.centerNameGu} - ${periodLabelGu}`,
        orientation: reportType === 'VITRAN' || reportType === 'CONSOLIDATED' ? 'landscape' : 'portrait',
      });

      if (res.success) {
        if (res.action === 'shared') {
          setStatusMessage('PDF શેર / ઓપન કરવા તૈયાર છે!');
        } else {
          setStatusMessage('PDF સફળતાપૂર્વક ડાઉનલોડ થઈ ગયું!');
        }
      } else {
        setStatusMessage(res.error || 'PDF બનાવવામાં ભૂલ આવી.');
      }
    } catch (err: any) {
      console.error('PDF error:', err);
      setStatusMessage('PDF બનાવવામાં સમસ્યા આવી. કૃપા કરીને ફરી પ્રયાસ કરો.');
    } finally {
      setIsGeneratingPdf(false);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  // 2. High-Fidelity Print Handler (iframe on PC/Browser, fallback on mobile)
  const handlePrint = () => {
    try {
      const printIframe = document.createElement('iframe');
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      document.body.appendChild(printIframe);

      const content = printDocumentRef.current?.innerHTML || '';
      const doc = printIframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${profile.centerNameGu || 'સ્ટોક રજિસ્ટર'}</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; margin: 15px; color: #000; background: #fff; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th, td { border: 1px solid #333; padding: 5px 6px; font-size: 11px; }
              th { background-color: #f1f5f9; font-weight: bold; }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              @media print {
                body { margin: 0; }
                @page { size: A4 landscape; margin: 8mm; }
              }
            </style>
          </head>
          <body>
            ${content}
          </body>
          </html>
        `);
        doc.close();
        setTimeout(() => {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(printIframe);
          }, 3000);
        }, 500);
        return;
      }
    } catch (e) {
      console.warn('Iframe print failed, falling back to window.print():', e);
    }
    window.print();
  };

  // 3. WhatsApp / Native Share Summary Handler
  const handleShareSummary = () => {
    let summaryText = `📋 *${profile.centerNameGu || 'આરોગ્ય સબસેન્ટર'}*\n`;
    summaryText += `📅 *${periodLabelGu}*\n`;
    if (reportType === 'VITRAN') {
      summaryText += `💊 *દવા વિતરણ રજિસ્ટર રિપોર્ટ*\n`;
      summaryText += `• કુલ આવક જથ્થો: +${totalMalelQty}\n`;
      summaryText += `• કુલ વિતરણ જથ્થો: -${totalVitranQty}\n`;
      summaryText += `• કુલ એન્ટ્રીઓ: ${filteredVitran.length}\n`;
    } else if (reportType === 'TCL') {
      summaryText += `💧 *TCL કુવા ક્લોરિનેશન રિપોર્ટ*\n`;
      summaryText += `• ક્લોરિનેટ થયેલ કુવાઓ: ${totalWellsTreated}\n`;
      summaryText += `• કુલ વપરાયેલ TCL પાવડર: ${totalTclUsedGrams} ગ્રામ\n`;
    } else {
      summaryText += `📦 *સ્ટોક સ્થિતિ રિપોર્ટ*\n`;
      stockItems.slice(0, 6).forEach((item) => {
        summaryText += `• ${item.nameGu}: ${getItemTotalStock(item.id)} ${item.unitGu}\n`;
      });
    }
    summaryText += `✍️ સંચાલક: ${profile.ownerName || profile.inchargeName}`;

    if (navigator.share) {
      navigator.share({
        title: `${profile.centerNameGu} રિપોર્ટ`,
        text: summaryText,
      }).catch(() => {});
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(summaryText)}`, '_blank');
    }
  };

  // 4. Excel Export
  const handleExcelExport = () => {
    exportStockDataToCsv(
      stockItems,
      batches,
      vitranEntries,
      tclLogs,
      profile,
      getItemTotalStock
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 text-slate-100 rounded-3xl shadow-2xl w-full max-w-6xl border border-slate-700/80 overflow-hidden flex flex-col max-h-[96vh]">
        {/* Top Header & Settings Control Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 space-y-4 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                <FileText className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>પ્રિન્ટ અને PDF રિપોર્ટ સેન્ટર</span>
                  <span className="text-[10px] bg-teal-500/20 text-teal-300 font-bold px-2 py-0.5 rounded-full border border-teal-500/30">
                    APK & Web સપોર્ટ
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  સાપ્તાહિક, માસિક અથવા વાર્ષિક રજિસ્ટર ૧-ક્લિકમાં PDF ડાઉનલોડ અથવા પ્રિન્ટ કરો.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filter Controls Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
            {/* 1. Report Type */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-teal-400" />
                <span>રિપોર્ટ પ્રકાર (Report Type)</span>
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setReportType('VITRAN')}
                  className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reportType === 'VITRAN'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  દવા વિતરણ
                </button>
                <button
                  type="button"
                  onClick={() => setReportType('TCL')}
                  className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reportType === 'TCL'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  કુવા TCL
                </button>
                <button
                  type="button"
                  onClick={() => setReportType('STOCK')}
                  className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reportType === 'STOCK'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  સ્ટોક સ્થિતિ
                </button>
              </div>
            </div>

            {/* 2. Time Period Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-400" />
                <span>સમયગાળો (Weekly / Monthly / Yearly)</span>
              </label>
              <div className="grid grid-cols-4 gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setTimePeriod('WEEKLY')}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    timePeriod === 'WEEKLY'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  સાપ્તાહિક
                </button>
                <button
                  type="button"
                  onClick={() => setTimePeriod('MONTHLY')}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    timePeriod === 'MONTHLY'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  માસિક
                </button>
                <button
                  type="button"
                  onClick={() => setTimePeriod('YEARLY')}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    timePeriod === 'YEARLY'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  વાર્ષિક
                </button>
                <button
                  type="button"
                  onClick={() => setTimePeriod('ALL')}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    timePeriod === 'ALL'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  બધા
                </button>
              </div>
            </div>

            {/* 3. Specific Item Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-teal-400" />
                <span>ચોક્કસ દવા પસંદ કરો</span>
              </label>
              <select
                value={selectedMedicineId}
                onChange={(e) => setSelectedMedicineId(e.target.value)}
                disabled={reportType === 'TCL'}
                className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-hidden focus:border-teal-500 disabled:opacity-50"
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

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="font-semibold text-teal-400">{periodLabelGu}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">
                કુલ રેકોર્ડ્સ: <strong className="text-white">{reportType === 'TCL' ? filteredTcl.length : filteredVitran.length}</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 ml-auto">
              {/* Primary PDF Download / Share Button */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>PDF બની રહ્યું છે...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-white" />
                    <span>PDF ડાઉનલોડ (Download PDF)</span>
                  </>
                )}
              </button>

              {/* Direct Print Button */}
              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <Printer className="w-4 h-4 text-teal-400" />
                <span>પ્રિન્ટ (Print)</span>
              </button>

              {/* WhatsApp Share Button */}
              <button
                type="button"
                onClick={handleShareSummary}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                title="આ રિપોર્ટ WhatsApp પર શેર કરો"
              >
                <Share2 className="w-4 h-4 text-white" />
                <span>WhatsApp શેર</span>
              </button>

              {/* Excel / CSV Button */}
              <button
                type="button"
                onClick={handleExcelExport}
                className="px-3.5 py-2 bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4 text-white" />
                <span>Excel શીટ</span>
              </button>
            </div>
          </div>

          {/* Status Alert Notification */}
          {statusMessage && (
            <div className="p-2.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Paper Document Preview Area (Renders to PDF via html2canvas & jsPDF) */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-100 dark:bg-slate-950 flex justify-center print:p-0 print:overflow-visible print:bg-white">
          <div
            ref={printDocumentRef}
            className="w-full max-w-[950px] bg-white text-slate-900 font-sans p-6 sm:p-10 shadow-2xl rounded-sm border border-slate-300 print:shadow-none print:border-none print:p-4 print:max-w-none"
            style={{ minHeight: '1120px' }}
          >
            {/* 1. Official Letterhead */}
            <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-600 font-bold uppercase tracking-wider pb-1">
                <span>આરોગ્ય અને પરિવાર કલ્યાણ વિભાગ - ગુજરાત સરકાર</span>
                <span>સ્વાસ્થ્ય સબસેન્ટર સ્ટોક રજિસ્ટર</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 font-sans">
                {profile.centerNameGu || 'આરોગ્ય સબસેન્ટર'}
              </h1>
              <p className="text-xs text-slate-700 font-medium">
                {profile.villageTaluka} {profile.district ? `, જિલ્લો: ${profile.district}` : ''}
              </p>

              <div className="pt-2 text-center">
                <span className="inline-block bg-slate-900 text-white font-sans text-xs font-black uppercase tracking-widest px-5 py-1.5 rounded-xs">
                  {reportType === 'VITRAN' && 'દવા સ્ટોક અને વિતરણ રજિસ્ટર (STOCK & VITRAN LEDGER)'}
                  {reportType === 'TCL' && 'TCL કુવા ક્લોરિનેશન રજિસ્ટર (WELL CHLORINATION LOG)'}
                  {reportType === 'STOCK' && 'હાલનો ઉપલબ્ધ સ્ટોક અને બેચ સ્થિતિ (CURRENT STOCK REGISTER)'}
                </span>
              </div>
            </div>

            {/* 2. Subheader Meta Info */}
            <div className="py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-700 font-medium border-b border-slate-300 gap-2">
              <div>
                <span>સમયગાળો: <strong className="text-slate-900">{periodLabelGu}</strong></span>
              </div>
              <div className="flex items-center gap-4">
                <span>પ્રિન્ટ તારીખ: <strong className="text-slate-900">{new Date().toLocaleDateString('gu-IN')}</strong></span>
                <span>રજિસ્ટર ઇન્ચાર્જ: <strong className="text-slate-900">{profile.inchargeName || profile.ownerName}</strong></span>
              </div>
            </div>

            {/* 3. Report Specific Content */}
            {/* VIEW A: VITRAN REGISTER TABLE */}
            {reportType === 'VITRAN' && (
              <div className="mt-4 space-y-4">
                <table className="w-full text-left text-[11px] font-sans border border-slate-600 border-collapse">
                  <thead>
                    <tr className="bg-slate-200 border-b border-slate-600 text-slate-950 font-black text-center">
                      <th className="p-1.5 border-r border-slate-400 w-8">ક્રમ</th>
                      <th className="p-1.5 border-r border-slate-400 w-20">તારીખ</th>
                      <th className="p-1.5 border-r border-slate-400 text-left">દવાનું નામ</th>
                      <th className="p-1.5 border-r border-slate-400 w-20">બેચ નં.</th>
                      <th className="p-1.5 border-r border-slate-400 text-right w-14">ખુલતો</th>
                      <th className="p-1.5 border-r border-slate-400 text-right w-14 text-emerald-800">મળેલ (+)</th>
                      <th className="p-1.5 border-r border-slate-400 text-right w-14 text-rose-800">વિતરણ (-)</th>
                      <th className="p-1.5 border-r border-slate-400 text-left">કોને આપ્યો (લાભાર્થી/સંસ્થા)</th>
                      <th className="p-1.5 border-r border-slate-400 text-right w-16 font-black">બાકી સ્ટોક</th>
                      <th className="p-1.5 w-16">વાઉચર</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {filteredVitran.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-6 text-center text-slate-500 font-medium">
                          આ સમયગાળામાં કોઈ વિતરણ એન્ટ્રી ઉપલબ્ધ નથી.
                        </td>
                      </tr>
                    ) : (
                      filteredVitran.map((e, idx) => (
                        <tr key={e.id} className="border-b border-slate-300 hover:bg-slate-50 text-[10px]">
                          <td className="p-1.5 border-r border-slate-300 text-center font-mono font-bold">{idx + 1}</td>
                          <td className="p-1.5 border-r border-slate-300 font-mono whitespace-nowrap">{e.date}</td>
                          <td className="p-1.5 border-r border-slate-300 font-bold">{e.itemNameGu}</td>
                          <td className="p-1.5 border-r border-slate-300 font-mono font-bold text-center">{e.batchNumber}</td>
                          <td className="p-1.5 border-r border-slate-300 text-right font-mono font-semibold">{e.khultoJatho}</td>
                          <td className="p-1.5 border-r border-slate-300 text-right font-mono font-bold text-emerald-800">
                            {e.malelJatho > 0 ? `+${e.malelJatho}` : '-'}
                          </td>
                          <td className="p-1.5 border-r border-slate-300 text-right font-mono font-bold text-rose-800">
                            {e.vaprashJatho > 0 ? `-${e.vaprashJatho}` : '-'}
                          </td>
                          <td className="p-1.5 border-r border-slate-300 font-medium">{e.koneAapiyo || '-'}</td>
                          <td className="p-1.5 border-r border-slate-300 text-right font-mono font-black text-slate-950 bg-slate-50">
                            {e.bachat} {e.unitGu}
                          </td>
                          <td className="p-1.5 text-center font-mono text-[9px] text-slate-600">{e.referenceNo || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Summary Box */}
                <div className="p-3 bg-slate-100 rounded border border-slate-300 flex flex-wrap items-center justify-between text-xs">
                  <div>
                    <span>કુલ એન્ટ્રીઓ: <strong>{filteredVitran.length}</strong></span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-emerald-800">
                      કુલ આવક જથ્થો: <strong>+{totalMalelQty}</strong>
                    </span>
                    <span className="text-rose-800">
                      કુલ વિતરણ જથ્થો: <strong>-{totalVitranQty}</strong>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW B: TCL WELL CHLORINATION LOG TABLE */}
            {reportType === 'TCL' && (
              <div className="mt-4 space-y-4">
                <table className="w-full text-left text-[11px] font-sans border border-slate-600 border-collapse">
                  <thead>
                    <tr className="bg-slate-200 border-b border-slate-600 text-slate-950 font-black text-center">
                      <th className="p-1.5 border-r border-slate-400 w-8">ક્રમ</th>
                      <th className="p-1.5 border-r border-slate-400 w-20">તારીખ</th>
                      <th className="p-1.5 border-r border-slate-400 text-left">સ્થળ / ગામ</th>
                      <th className="p-1.5 border-r border-slate-400 text-left">કુવા માલિકનું નામ</th>
                      <th className="p-1.5 border-r border-slate-400 w-16">આકાર</th>
                      <th className="p-1.5 border-r border-slate-400 text-right w-24">પાણી જથ્થો (Ltr)</th>
                      <th className="p-1.5 border-r border-slate-400 text-right w-24 font-black">TCL વપરાશ</th>
                      <th className="p-1.5 border-r border-slate-400 text-left w-28">કાર્યકર</th>
                      <th className="p-1.5 w-16">રિમાર્ક</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {filteredTcl.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-6 text-center text-slate-500 font-medium">
                          આ સમયગાળામાં કોઈ કુવા ક્લોરિનેશન રેકોર્ડ ઉપલબ્ધ નથી.
                        </td>
                      </tr>
                    ) : (
                      filteredTcl.map((t, idx) => (
                        <tr key={t.id} className="border-b border-slate-300 hover:bg-slate-50 text-[10px]">
                          <td className="p-1.5 border-r border-slate-300 text-center font-mono font-bold">{idx + 1}</td>
                          <td className="p-1.5 border-r border-slate-300 font-mono whitespace-nowrap">{t.date}</td>
                          <td className="p-1.5 border-r border-slate-300 font-bold">{t.location}</td>
                          <td className="p-1.5 border-r border-slate-300 font-medium">{t.wellOwnerName}</td>
                          <td className="p-1.5 border-r border-slate-300 text-center">
                            {t.shape === 'CIRCULAR' ? 'ગોળ' : 'લંબચોરસ'}
                          </td>
                          <td className="p-1.5 border-r border-slate-300 text-right font-mono font-semibold">
                            {t.waterVolumeLiters.toLocaleString()} L
                          </td>
                          <td className="p-1.5 border-r border-slate-300 text-right font-mono font-black text-cyan-900 bg-cyan-50">
                            {t.tclUsedGrams} ગ્રામ
                          </td>
                          <td className="p-1.5 border-r border-slate-300 font-medium">{t.operatorName}</td>
                          <td className="p-1.5 text-center text-[9px] text-slate-500">{t.testedPpm ? `${t.testedPpm} PPM` : '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* TCL Summary Box */}
                <div className="p-3 bg-cyan-50 rounded border border-cyan-200 flex flex-wrap items-center justify-between text-xs text-cyan-950">
                  <div>
                    <span>કુલ ક્લોરિનેટ થયેલ કુવાઓ: <strong>{totalWellsTreated}</strong></span>
                  </div>
                  <div>
                    <span>
                      કુલ વપરાયેલ TCL પાવડર: <strong>{totalTclUsedGrams} ગ્રામ ({(totalTclUsedGrams / 1000).toFixed(2)} કિલો)</strong>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW C: CURRENT STOCK LEDGER TABLE */}
            {reportType === 'STOCK' && (
              <div className="mt-4 space-y-4">
                <table className="w-full text-left text-[11px] font-sans border border-slate-600 border-collapse">
                  <thead>
                    <tr className="bg-slate-200 border-b border-slate-600 text-slate-950 font-black text-center">
                      <th className="p-1.5 border-r border-slate-400 w-8">ક્રમ</th>
                      <th className="p-1.5 border-r border-slate-400 text-left">દવા / આઇટમનું નામ</th>
                      <th className="p-1.5 border-r border-slate-400 w-24">કેટેગરી</th>
                      <th className="p-1.5 border-r border-slate-400 text-right w-24 font-black">હાલનો સ્ટોક</th>
                      <th className="p-1.5 border-r border-slate-400 w-16">યુનિટ</th>
                      <th className="p-1.5 border-r border-slate-400 text-right w-20">મિનિમમ એલર્ટ</th>
                      <th className="p-1.5 border-r border-slate-400 text-center w-24">સ્થિતિ</th>
                      <th className="p-1.5 text-left">સક્રિય બેચ નં.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {stockItems.map((item, idx) => {
                      const stock = getItemTotalStock(item.id);
                      const isLow = stock <= item.minThreshold;
                      const itemBatches = batches.filter((b) => b.itemId === item.id && b.quantity > 0);
                      const batchStr = itemBatches.map((b) => `${b.batchNumber} (${b.quantity})`).join(', ') || 'કોઈ બેચ નથી';

                      return (
                        <tr key={item.id} className="border-b border-slate-300 hover:bg-slate-50 text-[10px]">
                          <td className="p-1.5 border-r border-slate-300 text-center font-mono font-bold">{idx + 1}</td>
                          <td className="p-1.5 border-r border-slate-300 font-bold">{item.nameGu}</td>
                          <td className="p-1.5 border-r border-slate-300 text-slate-600">{item.category || 'જનરલ'}</td>
                          <td className="p-1.5 border-r border-slate-300 text-right font-mono font-black text-slate-950 bg-slate-50">
                            {stock}
                          </td>
                          <td className="p-1.5 border-r border-slate-300 text-center">{item.unitGu}</td>
                          <td className="p-1.5 border-r border-slate-300 text-right font-mono">{item.minThreshold}</td>
                          <td className="p-1.5 border-r border-slate-300 text-center font-bold">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] ${
                                isLow ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isLow ? 'ઓછો સ્ટોક' : 'પર્યાપ્ત સ્ટોક'}
                            </span>
                          </td>
                          <td className="p-1.5 font-mono text-[9px] text-slate-700">{batchStr}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* 4. Official Signatures Section */}
            <div className="mt-14 pt-6 border-t-2 border-slate-800 flex justify-between items-end text-xs font-sans">
              <div className="space-y-1.5 text-center">
                <div className="w-48 border-b border-slate-900 mb-1"></div>
                <p className="font-bold text-slate-950">આરોગ્ય કાર્યકર / ઇન્ચાર્જની સહી</p>
                <p className="text-[10px] text-slate-600 font-medium">MPHW / FHW / CHO</p>
              </div>

              <div className="space-y-1.5 text-center">
                <div className="w-48 border-b border-slate-900 mb-1"></div>
                <p className="font-bold text-slate-950">મેડિકલ ઓફિસર (MO) / THO</p>
                <p className="text-[10px] text-slate-600 font-medium">પ્રાથમિક આરોગ્ય કેન્દ્ર (PHC/CHC)</p>
              </div>
            </div>

            {/* 5. Document Footer Stamp */}
            <div className="mt-6 pt-2 border-t border-slate-300 flex justify-between text-[9px] text-slate-500 font-mono">
              <span>તૈયાર તારીખ: {new Date().toLocaleString('gu-IN')}</span>
              <span>MedStock Digital Health Register • Gujarat</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
