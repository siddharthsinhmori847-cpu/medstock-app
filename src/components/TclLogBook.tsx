import React, { useState } from 'react';
import {
  Droplet,
  Calculator,
  Plus,
  BookOpen,
  Share2,
  Trash2,
  Printer,
  Check,
  Sparkles,
  Circle,
  Square,
  Scale
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { TclLogEntry } from '../types/inventory';
import { AddTclLogModal } from './AddTclLogModal';

export const TclLogBook: React.FC = () => {
  const { tclLogs, deleteTclLog, stockItems, getItemTotalStock } = useInventory();
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Chlorine powder balance
  const chlorinePowderItem = stockItems.find((i) => i.key === 'clorine-powder');
  const currentChlorineStock = chlorinePowderItem ? getItemTotalStock(chlorinePowderItem.id) : 0;

  const handleShareLog = (log: TclLogEntry) => {
    const isCircular = log.shape === 'CIRCULAR' || !log.shape;
    const mapStr = isCircular
      ? `વ્યાસ: ${log.wellDiameter}m, ઊંડાઈ: ${log.waterDepth}m`
      : `લંબાઈ: ${log.length}m, પહોળાઈ: ${log.width}m, ઊંડાઈ: ${log.waterDepth}m`;

    const text = `💧 *કુવા ક્લોરિનેશન રિપોર્ટ*
📅 તારીખ: ${log.date}
👤 કુવા માલિક: *${log.wellOwnerName}*
📍 સ્થળ: ${log.location}
📐 આકાર: ${isCircular ? 'ગોળ કુવો' : 'ચોરસ/લંબચોરસ કુવો'} (${mapStr})
🌊 પાણીનું કદ: *${log.waterVolumeLiters.toLocaleString()} લિટર*
🎯 ઇચ્છિત PPM: ${log.desiredPpm} PPM
🧪 વપરાયેલ TCL પાવડર: *${log.tclUsedGrams} ગ્રામ* (${log.tclUsedKg} કિ.ગ્રા.)
${log.testedPpm ? `🔬 OT ટેસ્ટ PPM: ${log.testedPpm} PPM` : ''}
👨‍⚕️ કામગીરી કરનાર: ${log.operatorName}`;

    navigator.clipboard?.writeText(text);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* 1. Header & Big Add Button */}
      <div className="bg-[#111927] border border-cyan-500/40 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 flex items-center justify-center shrink-0">
            <Droplet className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                TCL કુવા ક્લોરિનેશન રજિસ્ટર
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                જળ શુદ્ધિકરણ
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              પાણીનું કદ (લિટર), PPM ગણતરી અને TCL પાવડર વપરાશ લોગબુક · હાજર TCL: <strong className="text-emerald-400 font-mono">{currentChlorineStock} kg</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Main Action Button */}
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer border border-cyan-400/40"
          >
            <Plus className="w-4 h-4" />
            <span>+ નવું કુવો ક્લોરિનેશન</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
            title="પ્રિન્ટ કરો"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">પ્રિન્ટ</span>
          </button>
        </div>
      </div>

      {/* 2. FORMULA INFO BOX (સત્તાવાર સરકારી ગણતરી સૂત્રો) */}
      <div className="bg-[#0f172a] border border-cyan-500/30 rounded-2xl p-4 text-xs text-slate-300 space-y-2.5">
        <div className="flex items-center gap-2 text-cyan-400 font-bold">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>સત્તાવાર ક્લોરિનેશન ગણતરી સૂત્રો (Official Chlorination Formulas):</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Formula 1: Gol Kuvo */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-500/20 space-y-1">
            <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
              <Circle className="w-3.5 h-3.5 text-cyan-400" />
              <span>૧. ગોળ કૂવો:</span>
            </span>
            <div className="font-mono text-white text-xs bg-black/40 p-2 rounded-lg border border-slate-800">
              કુલ લિટર = <strong>૦.૭૮૫ × d² × h × ૧૦૦૦</strong>
            </div>
            <p className="text-[10px] text-slate-400">
              જ્યાં d = વ્યાસ (મીટર), h = પાણીની ઊંડાઈ (મીટર)
            </p>
          </div>

          {/* Formula 2: Sorash Kuvo */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-500/20 space-y-1">
            <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
              <Square className="w-3.5 h-3.5 text-cyan-400" />
              <span>૨. ચોરસ / લંબચોરસ ટાંકી:</span>
            </span>
            <div className="font-mono text-white text-xs bg-black/40 p-2 rounded-lg border border-slate-800">
              કુલ લિટર = <strong>લંબાઈ × પહોળાઈ × ઊંડાઈ × ૧૦૦૦</strong>
            </div>
            <p className="text-[10px] text-slate-400">
              જ્યાં માપ મીટરમાં છે (L × W × H)
            </p>
          </div>

          {/* Formula 3: TCL Powder */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-500/20 space-y-1">
            <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>૩. જરૂરી TCL પાવડર:</span>
            </span>
            <div className="font-mono text-amber-200 text-xs bg-black/40 p-2 rounded-lg border border-slate-800">
              TCL (ગ્રામ) = <strong>(લિટર × PPM × ૪) ÷ ૧૦૦૦</strong>
            </div>
            <p className="text-[10px] text-slate-400">
              ૨૫% ક્લોરિન શુદ્ધતા ધરાવતા બ્લીચિંગ પાવડર માટે
            </p>
          </div>
        </div>
      </div>

      {/* 3. TCL WELL LOG HISTORY TABLE / CARDS */}
      <div className="bg-[#111927] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <h3 className="font-black text-sm text-white">
              કુવા ક્લોરિનેશન લોગ ડાયરી ({tclLogs.length} કુવાઓ નોંધાયેલ)
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ નવો કુવો</span>
          </button>
        </div>

        {tclLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-3">
            <Droplet className="w-10 h-10 mx-auto text-slate-600" />
            <div>
              <p className="font-bold text-slate-300 text-sm">હજુ સુધી કોઈ કુવા ક્લોરિનેશન નોંધાયેલ નથી</p>
              <p className="text-xs text-slate-500 mt-0.5">ઉપરના બટન પર ક્લિક કરીને પ્રથમ કુવાની વિગત ઉમેરો.</p>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              + પ્રથમ કુવો ઉમેરો
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tclLogs.map((log) => {
              const isCircular = log.shape === 'CIRCULAR' || !log.shape;
              return (
                <div
                  key={log.id}
                  className="bg-[#0b131e] border border-slate-800 hover:border-cyan-500/40 rounded-xl p-3.5 space-y-2.5 transition-all text-xs"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                          {log.date}
                        </span>
                        {/* Shape Badge */}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                          isCircular
                            ? 'bg-blue-950/60 text-blue-300 border border-blue-800'
                            : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                        }`}>
                          {isCircular ? <Circle className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                          <span>{isCircular ? 'ગોળ કૂવો' : 'ચોરસ ટાંકી'}</span>
                        </span>
                        <h4 className="font-black text-sm text-white">
                          {log.wellOwnerName}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        સ્થળ: {log.location}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleShareLog(log)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                        title="WhatsApp શેર કરો"
                      >
                        {copiedId === log.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>કોપી થયું!</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5" />
                            <span>શેર</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm('શું તમે આ કુવા ક્લોરિનેશન એન્ટ્રી ડિલીટ કરવા માંગો છો?')) {
                            deleteTclLog(log.id);
                          }
                        }}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                        title="ડિલીટ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Calculation breakdown row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-semibold">માપ (પરિમાણ):</span>
                      <span className="font-mono font-bold text-white text-xs">
                        {isCircular
                          ? `વ્યાસ: ${log.wellDiameter}m | ઊંડાઈ: ${log.waterDepth}m`
                          : `${log.length}m × ${log.width}m × ${log.waterDepth}m`
                        }
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-900/50">
                      <span className="text-[10px] text-cyan-400 block font-semibold">પાણીનું કુલ કદ:</span>
                      <span className="font-mono font-black text-cyan-200 text-xs">
                        {log.waterVolumeLiters.toLocaleString()} લિટર
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-900/50">
                      <span className="text-[10px] text-amber-400 block font-semibold">વપરાયેલ TCL:</span>
                      <span className="font-mono font-black text-amber-200 text-xs">
                        {log.tclUsedGrams} ગ્રામ ({log.tclUsedKg} kg)
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-900/50">
                      <span className="text-[10px] text-emerald-400 block font-semibold">PPM માત્રા:</span>
                      <span className="font-mono font-bold text-emerald-200 text-xs">
                        ઇચ્છિત: {log.desiredPpm} | ટેસ્ટ: {log.testedPpm || '-'} PPM
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>કામગીરી કરનાર: <strong className="text-slate-200">{log.operatorName}</strong></span>
                    {log.notes && <span>નોંધ: {log.notes}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add TCL Log Modal */}
      <AddTclLogModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};
