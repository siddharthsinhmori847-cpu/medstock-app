import React, { useState } from 'react';
import { X, Plus, PackageCheck } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose }) => {
  const { addNewStockItem } = useInventory();
  const [nameGu, setNameGu] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState('દવા / સામગ્રી');
  const [unitGu, setUnitGu] = useState('ગોળી (Tabs)');
  const [unitEn, setUnitEn] = useState('Tabs');
  const [minThreshold, setMinThreshold] = useState(100);
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameGu.trim()) return;

    addNewStockItem({
      key: `custom-${Date.now()}`,
      nameGu: nameGu.trim(),
      nameEn: nameEn.trim() || nameGu.trim(),
      category: category.trim(),
      unitGu: unitGu.trim(),
      unitEn: unitEn.trim(),
      minThreshold: Number(minThreshold) || 50,
      description: description.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-sm text-white">નવી આઇટમ ઉમેરો (Add New Item)</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3 text-xs">
          <div>
            <label className="block text-[11px] font-bold text-slate-800 mb-1">
              દવા / વસ્તુનું નામ (ગુજરાતી) *
            </label>
            <input
              type="text"
              value={nameGu}
              onChange={(e) => setNameGu(e.target.value)}
              placeholder="e.g. ઝિંક ટેબ્લેટ / ORS પેકેટ"
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              English Name
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Zinc Tablets 20mg"
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                એકમ (Unit Gujarati) *
              </label>
              <input
                type="text"
                value={unitGu}
                onChange={(e) => setUnitGu(e.target.value)}
                placeholder="e.g. પેકેટ, બોટલ, ગોળી"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                લઘુત્તમ સ્ટોક (Min Alert)
              </label>
              <input
                type="number"
                min="0"
                value={minThreshold}
                onChange={(e) => setMinThreshold(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              વર્ણન / ઉપયોગ (Description)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="ઉપયોગિતા વિગત..."
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg cursor-pointer"
            >
              રદ કરો
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg cursor-pointer"
            >
              ઉમેરો
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
