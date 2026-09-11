import React, { useEffect, useState, useRef } from 'react';
import {
  Upload,
  ScanText,
  Scale,
  FileCheck,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface StepCard {
  step: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const WORKFLOW_STEPS: StepCard[] = [
  {
    step: '01',
    title: 'Upload',
    description: 'Upload a packaged commodity image from device or camera.',
    icon: <Upload className="h-6 w-6 text-amber-400" />,
  },
  {
    step: '02',
    title: 'Extract',
    description: 'AI OCR extracts key text declarations and spatial locations.',
    icon: <ScanText className="h-6 w-6 text-amber-400" />,
  },
  {
    step: '03',
    title: 'Validate',
    description: 'Legal Metrology rules check MRP, quantity, and mandatory fields.',
    icon: <Scale className="h-6 w-6 text-amber-400" />,
  },
  {
    step: '04',
    title: 'Verify',
    description: 'Review visual evidence overlays and generate inspection reports.',
    icon: <FileCheck className="h-6 w-6 text-amber-400" />,
  },
];

export const WorkflowSection: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for prefers-reduced-motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (sectionRef.current) observer.unobserve(sectionRef.current);
        }
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-12 lg:py-20 border-t border-slate-300 bg-slate-50 text-slate-900 relative overflow-hidden"
    >
      {/* Background Subtle Gradient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-10 relative z-10">
        
        {/* Section Header */}
        <div
          className={`text-center space-y-3 max-w-3xl mx-auto transition-all duration-700 ease-out ${
            isVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-6 motion-reduce:opacity-100 motion-reduce:translate-y-0'
          }`}
        >
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>WORKFLOW ARCHITECTURE</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            From Package Image to Compliance Result
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Turn a package image into a structured compliance assessment in four clear steps.
          </p>
        </div>

        {/* 4 Horizontally Arranged Process Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 items-stretch">
          {WORKFLOW_STEPS.map((card, idx) => {
            const delayStyles = [
              'delay-75',
              'delay-150',
              'delay-225',
              'delay-300',
            ][idx];

            return (
              <div
                key={card.step}
                className={`bg-white border border-slate-300 hover:border-amber-500/80 rounded-2xl p-6 shadow-xs hover:shadow-xl hover:shadow-amber-500/10 hover:bg-amber-50/60 transition-all duration-300 ease-out group relative overflow-hidden backdrop-blur flex flex-col justify-between hover:-translate-y-2 cursor-pointer ${
                  isVisible
                    ? `opacity-100 translate-y-0 ${delayStyles}`
                    : 'opacity-0 translate-y-8 motion-reduce:opacity-100 motion-reduce:translate-y-0'
                }`}
              >
                {/* Top Hover Gradient Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="space-y-4">
                  {/* Top Bar: Step Number & Icon */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 border border-amber-300 group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-600 px-2.5 py-1 rounded-md transition-all duration-300 group-hover:scale-105 shadow-2xs">
                      {card.step}
                    </span>

                    <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-amber-600 group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-600 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                      {React.cloneElement(card.icon as React.ReactElement, {
                        className: "h-6 w-6 transition-colors duration-300 group-hover:text-white"
                      })}
                    </div>
                  </div>

                  {/* Card Title & Description */}
                  <div className="space-y-2 pt-1">
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-amber-900 transition-colors duration-200 flex items-center justify-between">
                      <span>{card.title}</span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 group-hover:translate-x-1.5 transition-all duration-300 opacity-0 group-hover:opacity-100" />
                    </h3>

                    <p className="text-xs text-slate-600 group-hover:text-slate-800 transition-colors duration-200 leading-relaxed font-medium">
                      {card.description}
                    </p>
                  </div>
                </div>

                {/* Step Progress Indicator Bar at Bottom */}
                <div className="mt-6 pt-3 border-t border-slate-200 group-hover:border-amber-300 flex items-center justify-between text-[10px] font-mono text-slate-400 transition-colors duration-300">
                  <span className="group-hover:text-slate-600">STEP {card.step} OF 04</span>
                  <span className="text-amber-700 font-bold group-hover:text-amber-900 transition-colors">
                    PHASE {idx + 1}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
