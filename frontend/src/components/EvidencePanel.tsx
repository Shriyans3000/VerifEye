import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  Info,
  FileSearch,
  Hash,
  Percent,
} from 'lucide-react';
import { CheckItem, EvidenceItem } from '../types/api';

interface EvidencePanelProps {
  selectedCheck: CheckItem | null;
  selectedCheckIndex: number | null;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  selectedCheck,
  selectedCheckIndex,
}) => {
  if (!selectedCheck) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center text-slate-500 h-full flex flex-col items-center justify-center">
        <FileSearch className="h-8 w-8 text-slate-400 mb-2" />
        <p className="text-sm font-semibold">No Compliance Check Selected</p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Select a declaration check from the table below to inspect its visual OCR evidence on the package label.
        </p>
      </div>
    );
  }

  const { rule_name, field, status, extracted_value, reason, evidence = [] } = selectedCheck;
  const displayName = rule_name || field || `Declaration Check ${selectedCheckIndex !== null ? selectedCheckIndex + 1 : ''}`;

  const getStatusBadge = (statusStr: string) => {
    const s = (statusStr || '').toUpperCase();
    if (s === 'PASS') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> PASS
        </span>
      );
    }
    if (s === 'FAIL') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
          <XCircle className="h-3.5 w-3.5 mr-1" /> FAIL
        </span>
      );
    }
    if (s === 'MISSING') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
          <ShieldAlert className="h-3.5 w-3.5 mr-1" /> MISSING
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
        <AlertTriangle className="h-3.5 w-3.5 mr-1" /> REVIEW REQUIRED
      </span>
    );
  };

  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined || val === '') return 'Not declared / Not detected';
    if (typeof val === 'boolean') return val ? 'Declared (Yes / True)' : 'Not declared (No / False)';
    if (typeof val === 'object') {
      const v = val as Record<string, unknown>;
      const parts: string[] = [];
      if (v.phone) parts.push(`Phone: ${v.phone}`);
      if (v.email) parts.push(`Email: ${v.email}`);
      return parts.length ? parts.join(' | ') : 'Not declared';
    }
    return String(val);
  };

  const hasEvidence = Array.isArray(evidence) && evidence.length > 0;

  return (
    <div className="bg-white border border-slate-300 rounded-lg shadow-sm p-4 h-full flex flex-col justify-between text-xs space-y-4">
      <div className="space-y-3">
        {/* Header with Title & Status */}
        <div className="border-b border-slate-200 pb-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Selected Legal Check #{selectedCheckIndex !== null ? selectedCheckIndex + 1 : ''}
            </span>
            {getStatusBadge(status)}
          </div>
          <h3 className="text-base font-bold text-slate-900">{displayName}</h3>
        </div>

        {/* Extracted Value */}
        <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
            Detected Label Declaration
          </span>
          <p className="font-semibold text-slate-800 text-sm">{formatValue(extracted_value)}</p>
        </div>

        {/* Assessment Reason */}
        <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5 flex items-center">
            <Info className="h-3 w-3 mr-1 text-slate-500" /> Inspector Assessment & Reason
          </span>
          <p className="text-slate-700 leading-relaxed">{reason || 'No specific assessment notes.'}</p>
        </div>

        {/* Visual Evidence Breakdown */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">
              Supporting Visual Evidence ({evidence.length} Region{evidence.length !== 1 ? 's' : ''})
            </span>
          </div>

          {!hasEvidence ? (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded text-amber-900 text-xs">
              <p className="font-medium">
                {status === 'REVIEW'
                  ? 'Insufficient visual evidence available for automated assessment.'
                  : 'No visual evidence available for this assessment.'}
              </p>
              <p className="text-[11px] text-amber-800/80 mt-1">
                Absence of OCR evidence does not independently constitute a legal violation. Manual visual inspection by the enforcement officer is required.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {evidence.map((item: EvidenceItem, idx: number) => {
                const hasValidBBox =
                  item.bbox &&
                  Array.isArray(item.bbox) &&
                  item.bbox.length === 4 &&
                  item.bbox.every((n) => typeof n === 'number');

                return (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-50 border-l-4 border-amber-500 rounded border border-slate-200 shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                        <span className="flex items-center">
                          <Hash className="h-3 w-3 mr-0.5 text-amber-600" />
                          Region #{item.ocr_id}
                        </span>
                        <span className="px-1.5 py-0.5 bg-amber-100 border border-amber-300 text-amber-800 text-[9px] font-bold rounded">
                          {item.image_index === 1 ? 'Image 2 (Back)' : 'Image 1 (Front)'}
                        </span>
                      </span>
                      {item.confidence !== undefined && item.confidence !== null && (
                        <span className="font-mono text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded flex items-center">
                          <Percent className="h-2.5 w-2.5 mr-0.5 text-slate-500" />
                          {(item.confidence * 100).toFixed(1)}% Conf.
                        </span>
                      )}
                    </div>

                    <div className="bg-white border border-slate-200 p-2 rounded font-mono text-[11px] text-slate-900 leading-snug">
                      "{item.text}"
                    </div>

                    {!hasValidBBox && (
                      <p className="text-[10px] text-slate-500 italic">
                        Note: Visual coordinates format unavailable for this snippet; textual evidence preserved.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-400 flex items-center justify-between">
        <span>Deterministic Rule Engine Assessment</span>
        <span>Legal Metrology Act, 2009</span>
      </div>
    </div>
  );
};
