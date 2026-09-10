import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Eye, 
  FolderArchive, 
  ChevronRight, 
  Sparkles, 
  CheckCircle2, 
  Scale, 
  ArrowRight, 
  Award
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const user = { name: 'Inspector Rajesh Kumar' };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-600 selection:text-white">
      
      {/* Top Official National Identity Header */}
      <div className="bg-slate-900/90 border-b border-slate-800 text-xs py-2 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-slate-300">
              Government of India &bull; Ministry of Consumer Affairs, Food & Public Distribution
            </span>
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>Legal Metrology (Packaged Commodities) Rules, 2011</span>
          </div>
        </div>
      </div>

      {/* Hero Navigation Bar */}
      <nav className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-50 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center shadow-md shadow-amber-500/20">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-lg font-bold tracking-tight text-white font-mono">
                  Verif<span className="text-amber-500">Eye</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase tracking-wider">
                  GOV
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-none">
                Department of Consumer Affairs
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-3.5 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Officer Console
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/30 transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Launch Console</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-12 lg:py-20 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart India Hackathon &bull; Problem Statement SIH1637</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
              Autonomous Enforcement for <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-emerald-400">Packaged Commodities</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              VerifEye empowers Legal Metrology enforcement officers with high-precision OCR verification, deterministic rule compliance checking across 12 mandatory statutory declarations, character readability analysis, and a structured product repository.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => navigate('/inspection')}
                className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-lg shadow-amber-600/30 transition-all flex items-center space-x-2 cursor-pointer"
              >
                <span>Start Label Inspection</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigate('/repository')}
                className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm transition-colors flex items-center space-x-2 cursor-pointer"
              >
                <FolderArchive className="w-4 h-4 text-amber-400" />
                <span>Browse Product Repository</span>
              </button>
            </div>

            {/* Official Feature Highlights */}
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-slate-800/80">
              <div className="flex items-center space-x-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>12 Statutory Checks</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Evidence-Linked Canvas</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Readability & Contrast</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Multi-Image (Front/Back)</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>MongoDB Atlas History</span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Statutory PDF Notices</span>
              </div>
            </div>
          </div>

          {/* Right Column: Portal Showcase Card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Enforcement Officer Console
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  ACTIVE
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Scale className="w-4 h-4 text-amber-400" />
                    <div>
                      <strong className="text-white block">Rule 6(1) Compliance</strong>
                      <span className="text-slate-400 text-[11px]">Deterministic rule engine</span>
                    </div>
                  </div>
                  <span className="text-emerald-400 font-bold font-mono">100% Passed</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Eye className="w-4 h-4 text-amber-400" />
                    <div>
                      <strong className="text-white block">Character Readability</strong>
                      <span className="text-slate-400 text-[11px]">Sub-pixel & contrast analysis</span>
                    </div>
                  </div>
                  <span className="text-amber-400 font-bold font-mono">Calibrated Safe</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FolderArchive className="w-4 h-4 text-amber-400" />
                    <div>
                      <strong className="text-white block">Product Repository</strong>
                      <span className="text-slate-400 text-[11px]">Brand SKU digital archive</span>
                    </div>
                  </div>
                  <span className="text-amber-400 font-bold font-mono">6 Core Brands</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  Officer: <strong className="text-slate-200">{user?.name || 'Inspector Rajesh Kumar'}</strong>
                </div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
                >
                  Enter Dashboard <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Enforcement Console Access Widget */}
            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 text-xs flex items-center justify-between">
              <span className="text-slate-400">Legal Metrology enforcement workspace:</span>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-white font-bold transition cursor-pointer"
              >
                Open Dashboard &rarr;
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-4 text-center text-xs text-slate-500">
        <p>VerifEye &bull; Legal Metrology Packaged Commodities Digital Enforcement System &bull; SIH 2024</p>
      </footer>
    </div>
  );
};
