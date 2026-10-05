import React, { useState } from 'react';
import { X, User, Phone, MapPin, Building, Check, RotateCcw } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface PersonalProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PersonalProfileModal: React.FC<PersonalProfileModalProps> = ({ isOpen, onClose }) => {
  const { profile, updateProfile, resetToDefaults } = useInventory();

  const [ownerName, setOwnerName] = useState(profile.ownerName || 'સિદ્ધાર્થસિંહ મોરી');
  const [centerNameGu, setCenterNameGu] = useState(profile.centerNameGu || 'આરોગ્ય સબસેન્ટર સ્ટોક રજિસ્ટર');
  const [phone, setPhone] = useState(profile.phone || '');
  const [villageTaluka, setVillageTaluka] = useState(profile.villageTaluka || '');
  const [district, setDistrict] = useState(profile.district || 'રાજકોટ');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      ownerName: ownerName.trim(),
      inchargeName: ownerName.trim(),
      centerNameGu: centerNameGu.trim(),
      phone: phone.trim(),
      villageTaluka: villageTaluka.trim(),
      district: district.trim(),
    });

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">વ્યક્તિગત પ્રોફાઈલ અને સેન્ટર સેટિંગ્સ</h3>
              <p className="text-[11px] text-slate-400">Personal Account & Register Details</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          {saved && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>વિગત સફળતાપૂર્વક સાચવી લેવામાં આવી!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              તમારું પૂરું નામ (Your Name)
            </label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="દા.ત. સિદ્ધાર્થસિંહ મોરી"
              className="w-full px-3 py-2 border-2 border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              સેન્ટર / રજિસ્ટર શીર્ષક (Register Name)
            </label>
            <input
              type="text"
              value={centerNameGu}
              onChange={(e) => setCenterNameGu(e.target.value)}
              placeholder="દા.ત. આરોગ્ય સબસેન્ટર સ્ટોક રજિસ્ટર"
              className="w-full px-3 py-2 border-2 border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-teal-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                મોબાઈલ નંબર (Phone)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="૯૮૭૬૫૪૩૨૧૦"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                ગામ / તાલુકો (Village / Area)
              </label>
              <input
                type="text"
                value={villageTaluka}
                onChange={(e) => setVillageTaluka(e.target.value)}
                placeholder="e.g. મોરબી / રાજકોટ"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('શું તમે ડેમો ડેટા પુનઃસ્થાપિત કરવા માંગો છો?')) {
                  resetToDefaults();
                  onClose();
                }
              }}
              className="text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-1 font-bold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ડેમો ડેટા રીસેટ</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 font-medium rounded-lg cursor-pointer"
              >
                રદ કરો
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg cursor-pointer"
              >
                સાચવો (Save)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
