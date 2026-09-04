import React from 'react';
import { Info, Cpu, ShieldCheck, ArrowDown } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const pipelineSteps = [
    {
      step: 1,
      title: 'Package Label Photograph',
      role: 'Input Acquisition',
      tech: 'High-Resolution JPEG / PNG',
      description: 'The officer uploads or captures a clear commodity label photograph. Local object URLs ensure images remain strictly client-side during review.',
    },
    {
      step: 2,
      title: 'PaddleOCR GPU Text Detection',
      role: 'Optical Character Recognition',
      tech: 'Baidu PaddleOCR (PP-OCRv4) on CUDA GPU',
      description: 'Detects multi-oriented text boxes, recognizes multilingual characters, and outputs bounding box coordinates in natural image space with per-word confidence metrics.',
    },
    {
      step: 3,
      title: 'OCR Normalization & Spatial Hinting',
      role: 'Pre-Processing',
      tech: 'Deterministic Regex & Spatial Grouping',
      description: 'Structures raw OCR results into numbered regions (#0, #1, #2...), generates regex hints for dates, phone numbers, emails, and prices, and filters out visual noise.',
    },
    {
      step: 4,
      title: 'Groq Structured Extraction',
      role: 'Information Extraction (NOT Legal Judgment)',
      tech: 'Groq LLaMA 3.3 70B Versatile with JSON Schema',
      description: 'Extracts 12 mandatory statutory declaration values from the OCR text stream. Crucially, it links each extracted value back to its exact OCR region IDs, bounding boxes, and confidence scores.',
    },
    {
      step: 5,
      title: 'Deterministic Legal Metrology Engine',
      role: 'Statutory Compliance Determination',
      tech: 'Python Rule Engine • Legal Metrology Act 2009',
      description: 'Evaluates each extracted field against codified statutory rules (Rule 6, Legal Metrology Rules 2011). Assigns PASS, FAIL, or REVIEW, calculates composite compliance scores, and runs arithmetic and date checks.',
    },
    {
      step: 6,
      title: 'Evidence-Linked Visual Viewer',
      role: 'Officer Verification UI',
      tech: 'React 18 + Canvas/SVG Coordinate Mapping',
      description: 'Renders the package label with active glowing overlays mapped to the exact natural image percentage coordinates, enabling officers to visually cross-examine OCR evidence.',
    },
    {
      step: 7,
      title: 'Statutory Inspection Report (2 Pages)',
      role: 'Formal Documentation Export',
      tech: 'Browser Print Engine + ReportLab Backend',
      description: 'Generates an official 2-page statutory inspection document with formal letterhead, declaration tables, visual evidence snippets, and an officer sign-off seal line.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            <Info className="h-4 w-4" />
            <span>System Architecture Documentation</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            About VerifEye System Architecture
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent breakdown of the machine vision, neural extraction, and deterministic rule-engine pipeline.
          </p>
        </div>
      </div>

      {/* Critical Architecture Callout: AI vs Deterministic Rules */}
      <div className="bg-slate-900 text-white rounded-lg p-5 shadow-sm space-y-3 border border-slate-800">
        <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="h-4 w-4" />
          <span>Core Design Principle: AI Extraction vs Deterministic Legality</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          In high-stakes legal metrology enforcement, <strong>language models must never independently decide legality</strong>. Hallucinations or subjective heuristics have no standing under statutory law.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
          <div className="bg-slate-800/80 border border-slate-700 p-3 rounded">
            <span className="font-bold text-amber-400 block mb-1">
              What the LLM (Groq) Does:
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Acts strictly as a <strong>structured information extractor</strong>. It reads OCR text, parses declared entities (Manufacturer, MRP, Dates, Net Weight), and maps each declaration to explicit OCR bounding box pointers.
            </p>
          </div>
          <div className="bg-slate-800/80 border border-slate-700 p-3 rounded">
            <span className="font-bold text-emerald-400 block mb-1">
              What the Compliance Engine Does:
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Acts as the <strong>statutory authority</strong>. It executes rigid, deterministic legal rules codified from the Legal Metrology (Packaged Commodities) Rules, 2011 to objectively calculate PASS, FAIL, or REVIEW.
            </p>
          </div>
        </div>
      </div>

      {/* Sequential Pipeline Workflow */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-xs p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center space-x-2">
          <Cpu className="h-4 w-4 text-amber-600" />
          <span>End-to-End Inspection Pipeline</span>
        </h3>

        <div className="space-y-3">
          {pipelineSteps.map((item, idx) => (
            <div key={item.step}>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-slate-100/60 transition">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="h-6 w-6 rounded-full bg-slate-900 text-amber-400 font-bold font-mono text-xs flex items-center justify-center">
                      {item.step}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                    <span className="text-[10px] font-mono bg-white border border-slate-300 text-slate-600 px-2 py-0.5 rounded">
                      {item.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
                    {item.description}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-200/70 px-2.5 py-1 rounded block">
                    {item.tech}
                  </span>
                </div>
              </div>

              {idx < pipelineSteps.length - 1 && (
                <div className="flex justify-center my-1.5 text-slate-400">
                  <ArrowDown className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
