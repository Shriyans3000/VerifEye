import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

export const ProcessingState: React.FC = () => {
  const stages = [
    'Reading package image',
    'Detecting label text',
    'Extracting declarations',
    'Checking Legal Metrology compliance',
    'Preparing inspection result',
  ];

  const [currentStage, setCurrentStage] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStage((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
    }, 7500);
    return () => clearInterval(timer);
  }, [stages.length]);

  return (
    <div className="bg-white rounded-lg border border-slate-300 shadow-md p-8 text-center my-6 animate-scale-in">
      <div className="relative inline-flex mb-4">
        <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse-glow"></div>
        <div className="relative p-4 bg-slate-900 text-amber-400 rounded-full shadow-lg">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-900 mb-1">
        Automated Inspection in Progress
      </h3>
      <p className="text-xs text-slate-500 mb-2 max-w-md mx-auto">
        VerifEye AI is evaluating the label image against the Legal Metrology (Packaged Commodities) Rules, 2011.
      </p>
      <p className="text-[11px] text-amber-600 font-semibold mb-6">
        High-precision PaddleOCR &amp; AI extraction typically takes 20–40 seconds.
      </p>


      {/* Animated Sheen / Scanning Bar */}
      <div className="max-w-xl mx-auto mb-6 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
        <div 
          className="bg-amber-500 h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${Math.min(100, ((currentStage + 1) / stages.length) * 100)}%` }}
        />
      </div>

      {/* Progress Stages Bar */}
      <div className="max-w-xl mx-auto space-y-2.5 text-left">
        {stages.map((stage, idx) => {
          const isDone = idx < currentStage;
          const isCurrent = idx === currentStage;

          return (
            <div
              key={stage}
              className={`flex items-center justify-between p-2.5 rounded-md border text-xs transition-all duration-300 transform ${
                isCurrent
                  ? 'bg-amber-50/80 border-amber-300 text-amber-900 font-semibold shadow-xs translate-x-1'
                  : isDone
                  ? 'bg-slate-50 border-slate-200 text-slate-700'
                  : 'bg-slate-50/30 border-slate-100 text-slate-400'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 animate-scale-in" />
                ) : isCurrent ? (
                  <Loader2 className="h-4 w-4 text-amber-600 animate-spin flex-shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-slate-300 flex-shrink-0" />
                )}
                <span>Stage {idx + 1}: {stage}</span>
              </div>

              {isDone && <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Done</span>}
              {isCurrent && <span className="text-[10px] text-amber-700 font-bold uppercase tracking-wider animate-pulse">Processing...</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};
