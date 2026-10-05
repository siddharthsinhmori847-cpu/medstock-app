import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Share2,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  FileCode,
  HardDrive
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const aiStudioUrl = `https://ai.studio/apps/b7c51f6e-ccca-4c63-82cb-0646c5de302e?fullscreenApplet=true`;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(aiStudioUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      alert('તમારા એન્ડ્રોઇડ ફોનમાં Google Chrome બ્રાઉઝરના મેનૂ (ત્રણ ટપકાં ⋮) પર ક્લિક કરીને "Install app" અથવા "Add to Home screen" (હોમ સ્ક્રીન પર ઉમેરો) પસંદ કરો.');
    }
  };

  const handleDownloadOfflineApp = () => {
    const link = document.createElement('a');
    link.href = '/MedStock_App.html';
    link.download = 'MedStock_Offline_App.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#111927] border-2 border-emerald-500/50 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-auto text-white animate-in fade-in zoom-in-95 duration-150 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-950 via-[#111927] to-teal-950 border-b border-emerald-500/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-1.5">
                <span>Android APK & મોબાઇલ એપ મેળવો</span>
              </h3>
              <p className="text-[11px] text-slate-400">Mobile Installation & Download Center</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Important Explanation about the 404 Error from Screenshot */}
          <div className="p-3.5 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-start gap-2.5 text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-black text-xs block text-amber-300">
                "Error: Page not found" શા માટે આવ્યું?
              </span>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                AI Studio માં Shared Link ચાલુ કરવા માટે ઉપર જમણી બાજુ આપેલા <strong>"Share" (શેર)</strong> બટન પર ક્લિક કરીને પબ્લિશ કરવું જરૂરી છે. ત્યાં સુધી નીચેની સરળ રીતોથી એપ વાપરી શકો છો:
              </p>
            </div>
          </div>

          {/* Solution 1: Direct Offline App Download (Zero Server / No 404!) */}
          <div className="p-4 bg-gradient-to-br from-emerald-950/60 to-teal-950/40 border-2 border-emerald-500/50 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>રીત ૧: સંપૂર્ણ ઓફલાઇન મોબાઇલ એપ ડાઉનલોડ (૧૦૦% કાર્યરત)</span>
              </div>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                સૌથી સરળ
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              આ બટન દબાવવાથી તમારા ફોનમાં <strong>MedStock_Offline_App.html</strong> ડાઉનલોડ થઈ જશે. તેને ખોલવાથી ઇન્ટરનેટ વગર પણ તમામ રજિસ્ટર, સ્ટોક અને કુવા ક્લોરિનેશન ચાલશે!
            </p>

            <button
              onClick={handleDownloadOfflineApp}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>ઓફલાઇન મોબાઇલ એપ ડાઉનલોડ કરો (Download App)</span>
            </button>
          </div>

          {/* Solution 2: Chrome "Install app" (PWA onto Phone Home Screen) */}
          <div className="p-3.5 rounded-xl bg-[#0b131e] border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-teal-400 font-bold">
              <Smartphone className="w-4 h-4" />
              <span>રીત ૨: એન્ડ્રોઇડ હોમ સ્ક્રીન પર APK ની જેમ સેવ કરો</span>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
              <li>
                નીચેનું બટન દબાવીને <strong>લિંક કોપી કરો</strong> અને તમારા ફોનના <strong>Google Chrome</strong> માં ખોલો.
              </li>
              <li>
                Chrome ના ઉપર જમણી બાજુના <strong>ત્રણ ટપકાં (⋮)</strong> પર ક્લિક કરો.
              </li>
              <li>
                મેનૂમાંથી <strong>"Install app"</strong> અથવા <strong>"Add to Home screen" (હોમ સ્ક્રીન પર ઉમેરો)</strong> પસંદ કરો.
              </li>
              <li>
                તમારા ફોનમાં <strong className="text-emerald-400">મેડસ્ટોક રજિસ્ટર</strong> નું આઇકન આવી જશે!
              </li>
            </ol>

            <div className="pt-1 flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copied ? 'લિંક કોપી થઈ ગઈ!' : 'ફોન માટે લિંક કોપી કરો (Copy Link)'}</span>
              </button>
            </div>
          </div>

          {/* Solution 3: Fullscreen AI Studio Launcher */}
          <div className="p-3 rounded-xl bg-[#0b131e] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-300">રીત ૩: ફૂલસ્ક્રીન મોડમાં સીધું ખોલો:</span>
              <a
                href={aiStudioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>ખોલો ↗</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal font-mono bg-black/40 p-2 rounded border border-slate-800 break-all select-all">
              {aiStudioUrl}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0b131e] border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            મેડસ્ટોક લેજર v3.0 (ઓફલાઇન સક્રિય)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
          >
            બંધ કરો (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
