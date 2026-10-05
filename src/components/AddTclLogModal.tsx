import React, { useState, useEffect } from 'react';
import {
  X,
  Droplet,
  Calculator,
  Check,
  Sparkles,
  Scale,
  User,
  MapPin,
  Calendar,
  AlertCircle,
  Circle,
  Square,
  Edit3
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface AddTclLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddTclLogModal: React.FC<AddTclLogModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { addTclLog, profile, stockItems, getItemTotalStock } = useInventory();

  // Basic Info
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [wellOwnerName, setWellOwnerName] = useState('');
  const [location, setLocation] = useState('');

  // Shape Selection: 'CIRCULAR' (ગોળ કૂવો) or 'RECTANGULAR' (ચોરસ/લંબચોરસ ટાંકી)
  const [shape, setShape] = useState<'CIRCULAR' | 'RECTANGULAR'>('CIRCULAR');

  // Dimension Inputs (Editable strings so user can freely type/clear)
  const [wellDiameter, setWellDiameter] = useState<string>(''); // વ્યાસ (મીટર)
  const [length, setLength] = useState<string>(''); // લંબાઈ (મીટર)
  const [width, setWidth] = useState<string>(''); // પહોળાઈ (મીટર)
  const [waterDepth, setWaterDepth] = useState<string>(''); // પાણીની ઊંડાઈ (મીટર)

  // Dosage & Water Volume (Both Auto-calculated & Fully Editable)
  const [desiredPpm, setDesiredPpm] = useState<string>('2.0');
  const [waterVolumeLiters, setWaterVolumeLiters] = useState<string>('');
  const [tclUsedGrams, setTclUsedGrams] = useState<string>('');
  const [testedPpm, setTestedPpm] = useState<string>('');
  const [operatorName, setOperatorName] = useState(profile.ownerName || 'સિદ્ધાર્થસિંહ મોરી');
  const [notes, setNotes] = useState('');
  const [deductFromStock, setDeductFromStock] = useState(true);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-calculate Volume whenever dimensions change, if user hasn't typed manual volume
  useEffect(() => {
    const depthVal = parseFloat(waterDepth) || 0;
    if (depthVal > 0) {
      if (shape === 'CIRCULAR') {
        const diaVal = parseFloat(wellDiameter) || 0;
        if (diaVal > 0) {
          // ગોળ કૂવો: 0.785 * d^2 * h * 1000
          const vol = Math.round(0.785398 * (diaVal * diaVal) * depthVal * 1000);
          setWaterVolumeLiters(vol.toString());
        }
      } else {
        const lenVal = parseFloat(length) || 0;
        const widVal = parseFloat(width) || 0;
        if (lenVal > 0 && widVal > 0) {
          // ચોરસ ટાંકી: L * W * H * 1000
          const vol = Math.round(lenVal * widVal * depthVal * 1000);
          setWaterVolumeLiters(vol.toString());
        }
      }
    }
  }, [shape, wellDiameter, length, width, waterDepth]);

  // Auto-calculate TCL Consumption whenever Volume or PPM changes
  useEffect(() => {
    const volVal = parseFloat(waterVolumeLiters) || 0;
    const ppmVal = parseFloat(desiredPpm) || 0;
    if (volVal > 0 && ppmVal > 0) {
      // TCL Grams = (Liters * PPM * 4) / 1000
      const grams = Math.round((volVal * ppmVal * 4) / 1000);
      setTclUsedGrams(grams.toString());
    }
  }, [waterVolumeLiters, desiredPpm]);

  // Reset or clear on open
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const tclGramsNum = parseFloat(tclUsedGrams) || 0;
  const tclKgNum = Number((tclGramsNum / 1000).toFixed(2));

  // Chlorine powder balance
  const chlorinePowderItem = stockItems.find((i) => i.key === 'clorine-powder');
  const currentChlorineStock = chlorinePowderItem ? getItemTotalStock(chlorinePowderItem.id) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const vol = parseFloat(waterVolumeLiters) || 10000;
    const tclGrams = parseFloat(tclUsedGrams) || 80;
    const effectiveKg = tclKgNum > 0 ? tclKgNum : Number((tclGrams / 1000).toFixed(2));

    try {
      addTclLog({
        date: date || new Date().toISOString().split('T')[0],
        wellOwnerName: wellOwnerName.trim() || 'ગામ પીવાનો કુવો / સંપ',
        location: location.trim() || 'મુખ્ય ગામ',
        shape,
        wellDiameter: shape === 'CIRCULAR' ? (parseFloat(wellDiameter) || undefined) : undefined,
        length: shape === 'RECTANGULAR' ? (parseFloat(length) || undefined) : undefined,
        width: shape === 'RECTANGULAR' ? (parseFloat(width) || undefined) : undefined,
        waterDepth: parseFloat(waterDepth) || 0,
        waterVolumeLiters: vol,
        desiredPpm: parseFloat(desiredPpm) || 2.0,
        tclUsedGrams: tclGrams,
        tclUsedKg: effectiveKg,
        testedPpm: testedPpm ? parseFloat(testedPpm) : undefined,
        operatorName: operatorName.trim() || profile.ownerName || 'સિદ્ધાર્થસિંહ મોરી',
        notes: notes.trim(),
        deductFromStock,
      });

      setSuccessMsg('કુવા ક્લોરિનેશન સફળતાપૂર્વક નોંધાયું!');
      setTimeout(() => {
        setWellOwnerName('');
        setLocation('');
        setNotes('');
        setWaterVolumeLiters('');
        setTclUsedGrams('');
        onClose();
        if (onSuccess) onSuccess();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'એન્ટ્રી સેવ કરવામાં સમસ્યા આવી.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#111927] border-2 border-cyan-500/50 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden my-auto text-white animate-in fade-in zoom-in-95 duration-150 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-cyan-950 via-[#111927] to-teal-950 border-b border-cyan-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 flex items-center justify-center font-bold">
              <Droplet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                <span>+ નવું કુવો ક્લોરિનેશન</span>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.2 rounded-full border border-cyan-500/30">
                  ગોળ / લંબચોરસ
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">પાણીનું કદ અને TCL પાવડર ગણતરી</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Date & Well Owner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                તારીખ (Date) *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#0b131e] border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                કુવા માલિકનું નામ (Kuva Malik) *
              </label>
              <input
                type="text"
                value={wellOwnerName}
                onChange={(e) => setWellOwnerName(e.target.value)}
                placeholder="દા.ત. રમેશભાઈ ગોવિંદભાઈ પટેલ"
                className="w-full px-3 py-2 bg-[#0b131e] border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-500"
                required
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              સ્થળ / ફળિયું (Location)
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="દા.ત. પટેલ ફળિયું, ગામ પંચાયત પાસે"
              className="w-full px-3 py-2 bg-[#0b131e] border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* 1. SHAPE SELECTION: ગોળ કૂવો કે ચોરસ ટાંકી */}
          <div className="p-3.5 rounded-xl bg-[#0b131e] border border-slate-700 space-y-3">
            <span className="text-xs font-black text-cyan-300 block">
              કુવાનો આકાર પસંદ કરો (Select Shape):
            </span>
            <div className="grid grid-cols-2 gap-3">
              {/* Option 1: Gol Kuvo */}
              <label
                className={`p-3 rounded-xl border-2 flex items-center gap-2.5 cursor-pointer transition-all ${
                  shape === 'CIRCULAR'
                    ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 shadow-md ring-1 ring-cyan-400'
                    : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-500'
                }`}
              >
                <input
                  type="radio"
                  name="shape"
                  checked={shape === 'CIRCULAR'}
                  onChange={() => setShape('CIRCULAR')}
                  className="w-4 h-4 accent-cyan-500 cursor-pointer"
                />
                <Circle className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <span className="font-bold text-xs block text-white">૧. ગોળ કૂવો</span>
                  <span className="text-[10px] text-slate-400">વ્યાસ × ઊંડાઈ</span>
                </div>
              </label>

              {/* Option 2: Sorash Kuvo / Taki */}
              <label
                className={`p-3 rounded-xl border-2 flex items-center gap-2.5 cursor-pointer transition-all ${
                  shape === 'RECTANGULAR'
                    ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 shadow-md ring-1 ring-cyan-400'
                    : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-500'
                }`}
              >
                <input
                  type="radio"
                  name="shape"
                  checked={shape === 'RECTANGULAR'}
                  onChange={() => setShape('RECTANGULAR')}
                  className="w-4 h-4 accent-cyan-500 cursor-pointer"
                />
                <Square className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <span className="font-bold text-xs block text-white">૨. ચોરસ / ટાંકી</span>
                  <span className="text-[10px] text-slate-400">લંબાઈ × પહોળાઈ</span>
                </div>
              </label>
            </div>

            {/* Shape-specific Formula Banner */}
            <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800 text-[11px] font-mono text-cyan-300 flex items-center justify-between">
              {shape === 'CIRCULAR' ? (
                <span>સૂત્ર: <strong>પાણી (L) = ૦.૭૮૫ × d² × h × ૧૦૦૦</strong></span>
              ) : (
                <span>સૂત્ર: <strong>પાણી (L) = L × W × H × ૧૦૦૦</strong></span>
              )}
              <span className="text-[10px] text-slate-400">ઓટો-કેલ્ક્યુલેટ સક્રિય</span>
            </div>
          </div>

          {/* 2. DIMENSIONS INPUTS ACCORDING TO SHAPE */}
          <div className="p-3.5 rounded-xl bg-[#0b131e] border border-slate-700 space-y-3">
            <span className="text-xs font-black text-cyan-300 block">
              માપની વિગત દાખલ કરો (મીટરમાં):
            </span>

            {shape === 'CIRCULAR' ? (
              /* Circular inputs: Diameter & Depth */
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    કુવાનો વ્યાસ (મીટરમાં) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="દા.ત. 2.5"
                    value={wellDiameter}
                    onChange={(e) => setWellDiameter(e.target.value)}
                    className="w-full px-3 py-2 bg-[#151f2e] border border-slate-700 rounded-xl text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">મીટર (Diameter)</span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    પાણીની ઊંડાઈ (મીટરમાં) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="દા.ત. 3.0"
                    value={waterDepth}
                    onChange={(e) => setWaterDepth(e.target.value)}
                    className="w-full px-3 py-2 bg-[#151f2e] border border-slate-700 rounded-xl text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">મીટર (Depth)</span>
                </div>
              </div>
            ) : (
              /* Rectangular inputs: Length, Width, Depth */
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">
                    લંબાઈ (L) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="દા.ત. 4.0"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full px-2.5 py-2 bg-[#151f2e] border border-slate-700 rounded-xl text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[9px] text-slate-500 mt-0.5 block">મીટર (L)</span>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">
                    પહોળાઈ (W) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="દા.ત. 3.0"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    className="w-full px-2.5 py-2 bg-[#151f2e] border border-slate-700 rounded-xl text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[9px] text-slate-500 mt-0.5 block">મીટર (W)</span>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 mb-1">
                    ઊંડાઈ (H) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="દા.ત. 2.5"
                    value={waterDepth}
                    onChange={(e) => setWaterDepth(e.target.value)}
                    className="w-full px-2.5 py-2 bg-[#151f2e] border border-slate-700 rounded-xl text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[9px] text-slate-500 mt-0.5 block">મીટર (H)</span>
                </div>
              </div>
            )}
          </div>

          {/* 3. WATER VOLUME & TCL USAGE - AUTO CALCULATED BUT FULLY EDITABLE */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-teal-950/70 border-2 border-cyan-500/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>પાણીનું કદ & TCL (સ્વચાલિત + એડિટ કરો):</span>
              </span>
              <span className="text-[10px] text-slate-400">તમે જાતે પણ બદલી શકો છો</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Desired PPM */}
              <div>
                <label className="block text-[10px] font-bold text-slate-300 mb-1">
                  જરૂરી PPM (ડોઝ)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="2.0"
                  value={desiredPpm}
                  onChange={(e) => setDesiredPpm(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b131e] border-2 border-slate-700 rounded-xl text-amber-300 font-mono font-black focus:outline-none focus:border-amber-400 text-sm"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">સામાન્ય ~૨ PPM</span>
              </div>

              {/* Water Volume (Liters) - AUTO + EDITABLE */}
              <div>
                <label className="block text-[10px] font-bold text-cyan-300 mb-1">
                  પાણીનું કુલ કદ (લિટરમાં) *
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="દા.ત. 14700"
                  value={waterVolumeLiters}
                  onChange={(e) => setWaterVolumeLiters(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b131e] border-2 border-cyan-500 rounded-xl text-white font-mono font-black focus:outline-none focus:border-cyan-300 text-sm"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">કુલ લિટર</span>
              </div>

              {/* TCL Consumption (Grams) - AUTO + EDITABLE */}
              <div>
                <label className="block text-[10px] font-bold text-amber-300 mb-1">
                  જરૂરી TCL (ગ્રામમાં) *
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="દા.ત. 118"
                  value={tclUsedGrams}
                  onChange={(e) => setTclUsedGrams(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b131e] border-2 border-amber-500 rounded-xl text-amber-300 font-mono font-black focus:outline-none focus:border-amber-300 text-sm"
                  required
                />
                <span className="text-[10px] text-teal-300 font-mono font-bold mt-0.5 block">
                  = {tclKgNum} કિ.ગ્રા. (Kg)
                </span>
              </div>
            </div>

            {/* Formula note */}
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
              સૂત્ર: <strong>TCL (ગ્રામ) = (લિટર × PPM × ૪) ÷ ૧૦૦૦</strong>
            </div>
          </div>

          {/* Operator and Tested PPM */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                ઓટી ટેસ્ટ PPM (OT Test)
              </label>
              <input
                type="text"
                value={testedPpm}
                onChange={(e) => setTestedPpm(e.target.value)}
                placeholder="દા.ત. 1.8 PPM"
                className="w-full px-2.5 py-1.5 bg-[#0b131e] border border-slate-700 rounded-lg text-emerald-400 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                કામગીરી કરનાર કાર્યકર
              </label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#0b131e] border border-slate-700 rounded-lg text-white"
              />
            </div>
          </div>

          {/* Auto stock deduction checkbox */}
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
              <input
                type="checkbox"
                checked={deductFromStock}
                onChange={(e) => setDeductFromStock(e.target.checked)}
                className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
              />
              <span className="text-[11px] font-semibold text-slate-200">
                ક્લોરિન પાવડર સ્ટોકમાંથી {tclKgNum} kg આપમેળે બાદ કરો
              </span>
            </label>
            <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">
              હાજર સ્ટોક: {currentChlorineStock} kg
            </span>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
              વિશેષ નોંધ (Remarks)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="દા.ત. પાણી ચોખ્ખું છે, OT ટેસ્ટ ૨ કલાક બાદ લીધો"
              className="w-full px-3 py-1.5 bg-[#0b131e] border border-slate-700 rounded-lg text-white text-xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2 text-xs shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
            >
              રદ કરો
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-black rounded-xl shadow-lg cursor-pointer transition-transform active:scale-95"
            >
              કુવો ક્લોરિનેશન નોંધ સાચવો
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
