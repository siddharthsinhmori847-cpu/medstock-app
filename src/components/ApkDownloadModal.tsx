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
  HardDrive,
  FolderArchive,
  GitBranch,
  Terminal
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, install } = usePWAInstall();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedGit, setCopiedGit] = useState(false);

  if (!isOpen) return null;

  const aiStudioUrl = `https://ai.studio/apps/b7c51f6e-ccca-4c63-82cb-0646c5de302e?fullscreenApplet=true`;

  const gitCommands = `# ૧. GitHub માં નવું રીપોઝીટરી બનાવીને આ કમાન્ડ ચલાવો:
git remote add origin https://github.com/YOUR_USERNAME/medstock-app.git
git branch -M main
git push -u origin main
# GitHub Actions ઓટોમેટિક APK બનાવીને તૈયાર કરી દેશે!`;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(aiStudioUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyGitCommands = () => {
    navigator.clipboard?.writeText(gitCommands);
    setCopiedGit(true);
    setTimeout(() => setCopiedGit(false), 2000);
  };

  const handleDownloadOfflineApp = () => {
    const link = document.createElement('a');
    link.href = '/MedStock_App.html';
    link.download = 'MedStock_Offline_App.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadProjectZip = () => {
    const link = document.createElement('a');
    link.href = '/medstock-app-project.zip';
    link.download = 'medstock-app-project.zip';
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
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white flex items-center gap-1.5">
                <span>GitHub & Android APK સેટઅપ</span>
              </h3>
              <p className="text-[11px] text-slate-400">GitHub Actions Automated APK Builder</p>
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
          {/* GitHub Actions Highlight Banner */}
          <div className="p-3.5 bg-gradient-to-br from-indigo-950/60 to-purple-950/40 border border-indigo-500/40 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-300 font-bold">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>GitHub Actions દ્વારા ઓટોમેટિક APK બિલ્ડ તૈયાર છે!</span>
              </div>
              <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-700 px-2 py-0.5 rounded-full font-mono">
                Auto-APK
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              તમારા પ્રોજેક્ટમાં <code className="bg-slate-900 px-1 py-0.5 rounded text-indigo-300 font-mono">.github/workflows/build-apk.yml</code> અને <code className="bg-slate-900 px-1 py-0.5 rounded text-indigo-300 font-mono">capacitor.config.json</code> ફાઇલ સેટઅપ કરી દેવામાં આવી છે.
            </p>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              જ્યારે તમે આ કોડને <strong>GitHub</strong> પર મૂકશો, ત્યારે GitHub પોતાની જાતે Android SDK દ્વારા <strong>.apk ફાઇલ</strong> બનાવીને તમને ડાઉનલોડ કરવા આપી દેશે!
            </p>
          </div>

          {/* Action 1: Download Complete Project ZIP */}
          <div className="p-3.5 bg-[#0b131e] border border-slate-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <FolderArchive className="w-4 h-4 text-amber-400" />
                <span>૧. GitHub માટે આખો પ્રોજેક્ટ ZIP ડાઉનલોડ કરો</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">~300 KB</span>
            </div>
            <p className="text-[11px] text-slate-400">
              આ ઝિપ ફાઇલમાં તમામ કોડ, GitHub Actions વર્કફ્લો અને સેટિંગ્સ શામેલ છે.
            </p>
            <button
              onClick={handleDownloadProjectZip}
              className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-xl flex items-center justify-center gap-2 shadow transition-transform active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Project ZIP ડાઉનલોડ કરો (medstock-app-project.zip)</span>
            </button>
          </div>

          {/* Action 2: GitHub Push Instructions */}
          <div className="p-3.5 bg-[#0b131e] border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>૨. GitHub માં અપલોડ કરવાની રીત:</span>
              </span>
              <button
                onClick={handleCopyGitCommands}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold cursor-pointer"
              >
                {copiedGit ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedGit ? 'કોપી થયું!' : 'કમાન્ડ કોપી કરો'}</span>
              </button>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
              <li>
                <a href="https://github.com/new" target="_blank" rel="noopener noreferrer" className="text-teal-400 underline font-bold">github.com/new</a> પર જઈને નવું રીપોઝીટરી બનાવો (e.g. <code>medstock-app</code>).
              </li>
              <li>
                ડાઉનલોડ કરેલ ZIP ફાઇલને GitHub પર અપલોડ કરો અથવા નીચેના ગિટ કમાન્ડ્સ ચલાવો:
              </li>
            </ol>
            <div className="p-2.5 bg-black/60 rounded-lg border border-slate-800 font-mono text-[10px] text-emerald-300 leading-normal overflow-x-auto">
              git remote add origin https://github.com/YOUR_USERNAME/medstock-app.git<br/>
              git branch -M main<br/>
              git push -u origin main
            </div>
            <p className="text-[10px] text-slate-400 pt-1">
              👉 GitHub પેજ પર <strong>"Actions"</strong> ટેબમાં જાઓ, ત્યાં થોડીવારમાં <strong>MedStock-Android-APK (app-debug.apk)</strong> ડાઉનલોડ માટે તૈયાર થઈ જશે!
            </p>
          </div>

          {/* Action 3: Offline Mobile App Alternative */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-950/60 to-teal-950/40 border border-emerald-500/40 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>૩. અથવા સીધી ઓફલાઇન એપ વાપરો (કોઈ સેટઅપ વગર)</span>
              </span>
            </div>
            <button
              onClick={handleDownloadOfflineApp}
              className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-lg flex items-center justify-center gap-1.5 shadow transition-transform active:scale-95 cursor-pointer text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>MedStock_Offline_App.html ડાઉનલોડ કરો</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0b131e] border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Git Commit: Ready on branch `main`
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer text-xs"
          >
            બંધ કરો (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
