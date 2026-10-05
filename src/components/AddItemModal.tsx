import React, { useState } from 'react';
import { X, Plus, PackageCheck, Pill } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose }) => {
  const { addNewStockItem, theme } = useInventory();
  const isDark = theme === 'dark';

  const [nameGu, setNameGu] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState('જનરલ દવાઓ');
  const [unitGu, setUnitGu] = useState('ગોળી (Tabs)');
  const [minThreshold, setMinThreshold] = useState(50);
  const [description, setDescription] = useState('');

  const commonUnits = [
    'ગોળી (Tabs)',
    'કેપ્સ્યુલ (Caps)',
    'બોટલ (Bottle)',
    'પેકેટ (Pkt)',
    'કિ.ગ્રા. (Kg)',
    'લિટર (Ltr)',
    'પીસ / નંગ (Pcs)',
    'એમ્પ્યુલ / વાયલ (Vial)',
  ];

  const commonCategories = [
    'જનરલ દવાઓ',
    'તાવ / દર્દશામક (Analgesic)',
    'એન્ટિબાયોટિક (Antibiotics)',
    'ઓઆરએસ અને ઝિંક (ORS/Zinc)',
    'વિટામિન્સ અને પોષણ',
    'પ્રાથમિક સારવાર / ફર્સ્ટ એઇડ',
    'મેડિકલ સાધન સામગ્રી',
  ];

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const safeNameGu = nameGu.trim() || 'નવી દવા';
    const safeNameEn = nameEn.trim() || 'New Medicine';

    addNewStockItem({
      key: `custom-${Date.now()}`,
      nameGu: safeNameGu,
      nameEn: safeNameEn,
      category: category.trim() || 'જનરલ દવાઓ',
      unitGu: unitGu.trim() || 'ગોળી (Tabs)',
      unitEn: unitGu.trim() || 'Tabs',
      minThreshold: Number(minThreshold) || 20,
      description: description.trim(),
    });

    // Reset fields
    setNameGu('');
    setNameEn('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden transition-colors ${
          isDark ? 'bg-[#0f172a] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Pill className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <h3 className="font-black text-sm">નવી દવા / સ્ટોક ટેબ ઉમેરો</h3>
              <p className="text-[11px] text-slate-400">અન્ય સ્ટોક કેટેગરીમાં નવી આઇટમ દાખલ કરો</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-200'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <div>
            <label className="block text-[11px] font-bold mb-1">
              દવા / સાધનનું નામ (ગુજરાતી)
            </label>
            <input
              type="text"
              value={nameGu}
              onChange={(e) => setNameGu(e.target.value)}
              placeholder="દા.ત. પેરાસીટામોલ ૫૦૦ mg / ORS પેકેટ / કોટન રોલ"
              className={`w-full px-3 py-2 border rounded-xl font-bold outline-none ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-white focus:border-purple-500'
                  : 'bg-white border-slate-300 text-slate-900 focus:border-purple-500'
              }`}
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              English Name (વૈકલ્પિક)
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Paracetamol 500mg Tablets"
              className={`w-full px-3 py-2 border rounded-xl outline-none ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold mb-1">
                કેટેગરી (Category)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full px-3 py-2 border rounded-xl outline-none font-medium ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                {commonCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold mb-1">
                એકમ / યુનિટ (Unit) *
              </label>
              <select
                value={unitGu}
                onChange={(e) => setUnitGu(e.target.value)}
                className={`w-full px-3 py-2 border rounded-xl outline-none font-medium ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                {commonUnits.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold mb-1">
              લઘુત્તમ સ્ટોક એલર્ટ લિમિટ (Low Stock Alert Limit)
            </label>
            <input
              type="number"
              min="1"
              value={minThreshold}
              onChange={(e) => setMinThreshold(Number(e.target.value))}
              placeholder="50"
              className={`w-full px-3 py-2 border rounded-xl outline-none font-bold ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
            <p className="text-[10px] text-slate-400 mt-1">
              આનાથી ઓછો જથ્થો થશે ત્યારે સિસ્ટમ લાલ એલર્ટ બતાવશે.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              વિશેષ વિગત / નોંધ (Description)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="દા.ત. શરદી-તાવ અને માથાના દુખાવા માટે"
              className={`w-full px-3 py-2 border rounded-xl outline-none ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>દવા સ્ટોક ટેબ ઉમેરો</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
                isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
              }`}
            >
              રદ્દ કરો
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
