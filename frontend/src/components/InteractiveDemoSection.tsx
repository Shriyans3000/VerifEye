import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Sparkles,
  Play,
  Pause,
} from 'lucide-react';

interface DemoDeclaration {
  id: string;
  name: string;
  rule: string;
  value: string;
  status: 'COMPLIANT' | 'REVIEW' | 'NON_COMPLIANT';
  ocrRegionId: number;
  bbox: { top: number; left: number; width: number; height: number }; // percentage positions
}

const DEMO_DECLARATIONS: DemoDeclaration[] = [
  {
    id: 'mfg-name',
    name: 'Manufacturer Name & Address',
    rule: 'Rule 6(1)(a)',
    value: 'Nectar Foods Ltd., Plot 14, Sector 62, Noida, UP - 201301',
    status: 'COMPLIANT',
    ocrRegionId: 1,
    bbox: { top: 12, left: 10, width: 80, height: 18 },
  },
  {
    id: 'net-qty',
    name: 'Net Quantity Expression',
    rule: 'Rule 6(1)(c)',
    value: '1 L (1000 ml)',
    status: 'COMPLIANT',
    ocrRegionId: 2,
    bbox: { top: 35, left: 10, width: 42, height: 15 },
  },
  {
    id: 'mrp',
    name: 'Maximum Retail Price (MRP)',
    rule: 'Rule 6(1)(e)',
    value: '₹ 249.00 (Inclusive of all taxes)',
    status: 'COMPLIANT',
    ocrRegionId: 3,
    bbox: { top: 35, left: 55, width: 35, height: 15 },
  },
  {
    id: 'consumer-care',
    name: 'Consumer Care Contact Details',
    rule: 'Rule 6(1)(m)',
    value: 'support@nectarfoods.in | Tel: 1800-11-4224',
    status: 'REVIEW',
    ocrRegionId: 4,
    bbox: { top: 56, left: 10, width: 80, height: 16 },
  },
  {
    id: 'mfg-date',
    name: 'Month & Year of Manufacturing',
    rule: 'Rule 6(1)(d)',
    value: 'MFG DATE: 24/08/2026',
    status: 'COMPLIANT',
    ocrRegionId: 5,
    bbox: { top: 76, left: 10, width: 80, height: 14 },
  },
];

export const InteractiveDemoSection: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const userInteractedRef = useRef<boolean>(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Auto-demo rotation loop every 2.2 seconds
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (!userInteractedRef.current) {
        setSelectedIndex((prev) => (prev + 1) % DEMO_DECLARATIONS.length);
      }
    }, 2200);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
    userInteractedRef.current = true;
    setIsPlaying(false);

    // Resume auto play after 7 seconds of inactivity
    setTimeout(() => {
      userInteractedRef.current = false;
      setIsPlaying(true);
    }, 7000);
  };

  const selectedItem = DEMO_DECLARATIONS[selectedIndex];

  const getStatusBadge = (status: DemoDeclaration['status']) => {
    if (status === 'COMPLIANT') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-emerald-600/15 text-emerald-800 border border-emerald-500/40 shadow-2xs">
          <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600 stroke-[2.5]" /> ✓ Compliant
        </span>
      );
    }
    if (status === 'REVIEW') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-amber-500/20 text-amber-900 border border-amber-500/50 shadow-2xs">
          <AlertTriangle className="h-3.5 w-3.5 mr-1 text-amber-700 stroke-[2.5]" /> ⚠ Needs Review
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-rose-600/15 text-rose-800 border border-rose-500/40 shadow-2xs">
        <XCircle className="h-3.5 w-3.5 mr-1 text-rose-600 stroke-[2.5]" /> ✕ Non-Compliant
      </span>
    );
  };

  return (
    <section ref={sectionRef} className="py-12 lg:py-20 border-t border-slate-300 bg-slate-100 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Interactive Product Demonstration</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            See VerifEye in Action
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            From package image to compliance decision — VerifEye connects deep-learning OCR extraction with rule-based validation and instant visual evidence.
          </p>
        </div>

        {/* Interactive 2-Column Product Showcase Frame */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Package Inspection Preview (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-300 p-5 shadow-md space-y-4 relative overflow-hidden">
            
            {/* Top Frame Control Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 text-xs">
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-amber-600 animate-pulse" />
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Package Label Visual Inspection Frame
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded font-bold border border-amber-300">
                  ACTIVE TARGET: #{selectedItem.ocrRegionId}
                </span>
              </div>
            </div>

            {/* Package Label Image Container with Bounding Boxes */}
            <div className="relative w-full min-h-[460px] sm:min-h-[520px] bg-slate-100/90 rounded-xl border border-slate-300 overflow-hidden flex items-center justify-center p-4 sm:p-6">
              
              {/* Background Grid Pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:20px_20px] opacity-40 pointer-events-none" />

              {/* Mock Packaged Commodity Label Graphic Card */}
              <div className="relative w-full max-w-xl sm:max-w-2xl bg-white border-2 border-slate-300 rounded-xl p-5 sm:p-6 shadow-lg space-y-4 select-none my-auto">
                
                {/* Header Badge on Label */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 text-xs font-mono text-slate-500">
                  <span className="font-extrabold text-slate-900 tracking-wider uppercase">PACKAGED COMMODITY LABEL</span>
                  <span className="text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded border border-amber-300 font-bold">OCR TARGET BOUNDS</span>
                </div>

                {/* Package Label Text Blocks / Interactive OCR Bounding Boxes */}
                <div className="space-y-3">
                  
                  {/* Item 1: Mfg Name */}
                  <div
                    onClick={() => handleSelect(0)}
                    className={`relative p-3 sm:p-3.5 rounded-lg border transition-all duration-300 cursor-pointer ${
                      selectedIndex === 0
                        ? 'border-amber-500 bg-amber-50/90 shadow-[0_0_15px_rgba(245,158,11,0.35)] z-20 scale-[1.01] ring-2 ring-amber-400/40'
                        : 'border-slate-200 bg-slate-50/80 hover:border-slate-400 hover:bg-slate-100/80 z-10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] sm:text-xs font-mono uppercase font-semibold ${selectedIndex === 0 ? 'text-amber-900' : 'text-slate-500'}`}>Manufactured &amp; Packed By:</span>
                      <span className={`text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded ${selectedIndex === 0 ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'}`}>
                        #1
                      </span>
                    </div>
                    <strong className={`text-xs sm:text-sm block truncate font-semibold ${selectedIndex === 0 ? 'text-slate-900' : 'text-slate-800'}`}>Nectar Foods Ltd., Plot 14, Sector 62, Noida</strong>
                  </div>

                  {/* Row: Net Qty & MRP */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Item 2: Net Quantity */}
                    <div
                      onClick={() => handleSelect(1)}
                      className={`relative p-3 sm:p-3.5 rounded-lg border transition-all duration-300 cursor-pointer ${
                        selectedIndex === 1
                          ? 'border-amber-500 bg-amber-50/90 shadow-[0_0_15px_rgba(245,158,11,0.35)] z-20 scale-[1.01] ring-2 ring-amber-400/40'
                          : 'border-slate-200 bg-slate-50/80 hover:border-slate-400 hover:bg-slate-100/80 z-10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] sm:text-xs font-mono uppercase font-semibold ${selectedIndex === 1 ? 'text-amber-900' : 'text-slate-500'}`}>Net Quantity:</span>
                        <span className={`text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded ${selectedIndex === 1 ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'}`}>
                          #2
                        </span>
                      </div>
                      <strong className={`text-xs sm:text-sm block font-mono font-semibold ${selectedIndex === 1 ? 'text-amber-900 font-bold' : 'text-amber-800'}`}>1 L (1000 ml)</strong>
                    </div>

                    {/* Item 3: MRP */}
                    <div
                      onClick={() => handleSelect(2)}
                      className={`relative p-3 sm:p-3.5 rounded-lg border transition-all duration-300 cursor-pointer ${
                        selectedIndex === 2
                          ? 'border-amber-500 bg-amber-50/90 shadow-[0_0_15px_rgba(245,158,11,0.35)] z-20 scale-[1.01] ring-2 ring-amber-400/40'
                          : 'border-slate-200 bg-slate-50/80 hover:border-slate-400 hover:bg-slate-100/80 z-10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] sm:text-xs font-mono uppercase font-semibold ${selectedIndex === 2 ? 'text-amber-900' : 'text-slate-500'}`}>MRP (Incl. Taxes):</span>
                        <span className={`text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded ${selectedIndex === 2 ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'}`}>
                          #3
                        </span>
                      </div>
                      <strong className={`text-xs sm:text-sm block font-mono font-semibold ${selectedIndex === 2 ? 'text-emerald-900 font-bold' : 'text-emerald-700'}`}>₹ 249.00</strong>
                    </div>
                  </div>

                  {/* Item 4: Consumer Care */}
                  <div
                    onClick={() => handleSelect(3)}
                    className={`relative p-3 sm:p-3.5 rounded-lg border transition-all duration-300 cursor-pointer ${
                      selectedIndex === 3
                        ? 'border-amber-500 bg-amber-50/90 shadow-[0_0_15px_rgba(245,158,11,0.35)] z-20 scale-[1.01] ring-2 ring-amber-400/40'
                        : 'border-slate-200 bg-slate-50/80 hover:border-slate-400 hover:bg-slate-100/80 z-10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] sm:text-xs font-mono uppercase font-semibold ${selectedIndex === 3 ? 'text-amber-900' : 'text-slate-500'}`}>Consumer Grievance Cell:</span>
                      <span className={`text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded ${selectedIndex === 3 ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'}`}>
                        #4
                      </span>
                    </div>
                    <strong className={`text-xs sm:text-sm block truncate font-semibold ${selectedIndex === 3 ? 'text-slate-900' : 'text-slate-800'}`}>support@nectarfoods.in | 1800-11-4224</strong>
                  </div>

                  {/* Item 5: Mfg Date */}
                  <div
                    onClick={() => handleSelect(4)}
                    className={`relative p-3 sm:p-3.5 rounded-lg border transition-all duration-300 cursor-pointer ${
                      selectedIndex === 4
                        ? 'border-amber-500 bg-amber-50/90 shadow-[0_0_15px_rgba(245,158,11,0.35)] z-20 scale-[1.01] ring-2 ring-amber-400/40'
                        : 'border-slate-200 bg-slate-50/80 hover:border-slate-400 hover:bg-slate-100/80 z-10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] sm:text-xs font-mono uppercase font-semibold ${selectedIndex === 4 ? 'text-amber-900' : 'text-slate-500'}`}>Date of Packing:</span>
                      <span className={`text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded ${selectedIndex === 4 ? 'bg-amber-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'}`}>
                        #5
                      </span>
                    </div>
                    <strong className={`text-xs sm:text-sm block font-mono font-semibold ${selectedIndex === 4 ? 'text-amber-900 font-bold' : 'text-amber-800'}`}>MFG DATE: 24/08/2026</strong>
                  </div>
                </div>

                {/* Statutory Stamp */}
                <div className="pt-2.5 border-t border-slate-200 flex justify-between items-center text-[10px] sm:text-xs font-mono text-slate-500">
                  <span>LM-RULES-2011 COMPLIANT</span>
                  <span className="text-amber-700 font-bold">SIH1637 ENFORCEMENT</span>
                </div>
              </div>
            </div>

            {/* Active Target Banner Below Canvas */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2.5 min-w-0">
                <span className="font-mono text-[10px] bg-amber-100 text-amber-900 px-2.5 py-1 rounded font-bold border border-amber-300 whitespace-nowrap shrink-0">
                  Region #{selectedItem.ocrRegionId}
                </span>
                <span className="text-slate-700 text-xs font-medium leading-snug">
                  Active Highlight: <strong className="text-slate-900 font-semibold">{selectedItem.name}</strong>
                </span>
              </div>

              <span className="text-[10px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-300 shrink-0 self-start sm:self-auto whitespace-nowrap">
                {selectedItem.rule}
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN: Extracted Statutory Declarations Panel (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-300 p-5 shadow-md space-y-3">
              
              {/* Panel Top Control Bar */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">
                    Extracted Statutory Declarations
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Click any declaration card to highlight OCR visual evidence.
                  </p>
                </div>

                {/* Auto Play / Pause Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsPlaying((prev) => !prev)}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold border border-slate-300 flex items-center space-x-1 transition cursor-pointer min-h-[36px]"
                  title={isPlaying ? 'Pause auto-demonstration' : 'Play auto-demonstration'}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3 h-3 text-amber-700" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 text-emerald-700" />
                      <span>Play</span>
                    </>
                  )}
                </button>
              </div>

              {/* Declarations Interactive Cards List */}
              <div className="space-y-2.5">
                {DEMO_DECLARATIONS.map((item, idx) => {
                  const isSelected = selectedIndex === idx;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelect(idx)}
                      className={`p-3.5 rounded-xl border transition-all duration-300 cursor-pointer card-hover-effect flex flex-col justify-between space-y-1.5 ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/80 text-slate-900 shadow-sm translate-x-1.5 ring-2 ring-amber-400/30'
                          : 'border-slate-200 bg-slate-50/70 text-slate-800 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`h-5 w-5 rounded-full font-mono text-[10px] font-bold flex items-center justify-center ${
                              isSelected ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            #{item.ocrRegionId}
                          </span>
                          <h4 className="font-bold text-xs text-slate-900">{item.name}</h4>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>

                      {/* Value & Rule Reference */}
                      <div className="pl-7 space-y-1">
                        <p className="text-xs font-mono font-semibold text-slate-800 leading-snug">
                          {item.value}
                        </p>
                        <span className="text-[10px] font-mono text-slate-500 block">
                          Statutory Basis: <strong className="text-slate-700">{item.rule}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Quick Callout */}
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Rule 6(1) Codified Compliance Engine</span>
                <span className="text-emerald-700 font-bold font-mono">100% Traceable</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
