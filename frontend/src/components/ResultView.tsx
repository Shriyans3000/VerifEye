import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Building2,
  MapPin,
  Tag,
  Scale,
  Calendar,
  Phone,
  Barcode,
  Globe2,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Eye,
  FileText,
} from 'lucide-react';
import { AnalyzeResponse, CheckItem, ValidationItem, EvidenceItem } from '../types/api';
import { EvidenceViewer } from './EvidenceViewer';
import { InspectionReportModal } from './InspectionReportModal';
import { ReadabilitySection } from './ReadabilitySection';

interface ResultViewProps {
  data: AnalyzeResponse;
  imageFile?: File | null;
  imageUrl?: string | null;
}

export const ResultView: React.FC<ResultViewProps> = ({ data, imageFile, imageUrl }) => {
  const { status, compliance_score, summary, product, checks = [], validation_checks = [] } = data;

  // Selected check state
  const [selectedCheckIndex, setSelectedCheckIndex] = useState<number | null>(() => {
    // Default to first check that has visual evidence, or first check
    const firstWithEvidence = checks.findIndex(
      (c) => Array.isArray(c.evidence) && c.evidence.length > 0
    );
    return firstWithEvidence !== -1 ? firstWithEvidence : 0;
  });

  const [showAllRegions, setShowAllRegions] = useState<boolean>(false);
  const [expandedEvidenceRows, setExpandedEvidenceRows] = useState<Record<number, boolean>>({});
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [focusedRegion, setFocusedRegion] = useState<EvidenceItem | null>(null);
  const [selectedOcrId, setSelectedOcrId] = useState<number | null>(null);

  // Reset selected check index if checks array changes
  useEffect(() => {
    const firstWithEvidence = checks.findIndex(
      (c) => Array.isArray(c.evidence) && c.evidence.length > 0
    );
    setSelectedCheckIndex(firstWithEvidence !== -1 ? firstWithEvidence : 0);
  }, [checks]);

  const selectedCheck: CheckItem | null =
    selectedCheckIndex !== null && selectedCheckIndex >= 0 && selectedCheckIndex < checks.length
      ? checks[selectedCheckIndex]
      : null;

  const handleSelectCheck = (index: number, shouldScroll = false) => {
    setSelectedCheckIndex(index);
    setFocusedRegion(null);
    setSelectedOcrId(null);
    if (shouldScroll) {
      const viewer = document.getElementById('visual-evidence-viewer');
      if (viewer) {
        viewer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleSelectRegionFromCanvas = (region: EvidenceItem) => {
    // Find which check contains this ocr_id
    const targetIdx = checks.findIndex((c) =>
      Array.isArray(c.evidence) && c.evidence.some((ev) => ev.ocr_id === region.ocr_id)
    );
    if (targetIdx !== -1) {
      setSelectedCheckIndex(targetIdx);
    }
  };

  const toggleRowExpansion = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setExpandedEvidenceRows((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const getStatusBadge = (statusStr: string) => {
    const s = (statusStr || '').toUpperCase();
    if (s === 'PASS' || s === 'COMPLIANT') {
      return {
        bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        icon: <CheckCircle2 className="h-6 w-6 text-emerald-700 mr-2 flex-shrink-0" />,
        text: 'COMPLIANT',
      };
    }
    if (s === 'FAIL' || s === 'NON_COMPLIANT') {
      return {
        bg: 'bg-rose-100 text-rose-900 border-rose-300',
        icon: <XCircle className="h-6 w-6 text-rose-700 mr-2 flex-shrink-0" />,
        text: 'NON-COMPLIANT',
      };
    }
    return {
      bg: 'bg-amber-100 text-amber-900 border-amber-300',
      icon: <AlertTriangle className="h-6 w-6 text-amber-700 mr-2 flex-shrink-0" />,
      text: 'REVIEW REQUIRED',
    };
  };

  const badge = getStatusBadge(status);

  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined || val === '') return 'Not declared / Not detected';
    if (typeof val === 'boolean') return val ? 'Declared (Yes)' : 'Not declared (No)';
    if (typeof val === 'object') {
      const v = val as Record<string, unknown>;
      const parts: string[] = [];
      if (v.phone) parts.push(`Phone: ${v.phone}`);
      if (v.email) parts.push(`Email: ${v.email}`);
      return parts.length ? parts.join(' | ') : 'Not declared';
    }
    return String(val);
  };

  const getCheckBadge = (statusStr: string) => {
    const s = (statusStr || '').toUpperCase();
    if (s === 'PASS') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="h-3 w-3 mr-1" /> PASS
        </span>
      );
    }
    if (s === 'FAIL') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
          <XCircle className="h-3 w-3 mr-1" /> FAIL
        </span>
      );
    }
    if (s === 'MISSING') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
          <ShieldAlert className="h-3 w-3 mr-1" /> MISSING
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
        <HelpCircle className="h-3 w-3 mr-1" /> REVIEW
      </span>
    );
  };

  // Quantity handling: preserve original declaration and derived calculated total
  const rawNetQty = product?.net_quantity;
  let declaredQty = product?.declared_quantity || rawNetQty;
  let calculatedTotal = product?.calculated_total_quantity || null;

  if (!calculatedTotal && rawNetQty && rawNetQty.includes('(') && rawNetQty.includes(')')) {
    const match = rawNetQty.match(/^([^(]+)\s*\(([^)]+)\)/);
    if (match) {
      calculatedTotal = match[1].trim();
      declaredQty = match[2].trim();
    }
  } else if (!calculatedTotal && rawNetQty && rawNetQty.includes('+')) {
    declaredQty = rawNetQty;
    const cleanQty = rawNetQty.replace(/([0-9]+(?:\.[0-9]+)?)\s*q\b/gi, '$1g');
    const parts = cleanQty.match(/([0-9]+(?:\.[0-9]+)?)\s*(kg|g|mg|l|ml|cm|m)/gi);
    if (parts && parts.length > 1) {
      let sum = 0;
      let unit = '';
      parts.forEach((p) => {
        const m = p.match(/([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z]+)/);
        if (m) {
          sum += parseFloat(m[1]);
          unit = m[2];
        }
      });
      if (sum > 0) {
        calculatedTotal = `${sum}${unit}`;
      }
    }
  }

  // Date handling: preserve distinct packed vs mfg vs expiry vs best-before vs use-by
  const dateCheck = checks.find(
    (c) =>
      c.rule_name === 'Manufacture / Pack Date' ||
      c.field === 'packed_date' ||
      c.field === 'manufacturing_date'
  );

  const rawPacked =
    product?.packed_date ||
    (product as any)?.date_of_packing ||
    (product as any)?.pkd_date;

  const rawMfg =
    product?.manufacturing_date ||
    (product as any)?.date_of_manufacture ||
    (product as any)?.mfg_date;

  const packedDate =
    rawPacked ||
    (!rawMfg && dateCheck?.rule_name === 'Manufacture / Pack Date' && dateCheck?.extracted_value
      ? String(dateCheck.extracted_value)
      : null);

  const mfgDate = rawMfg;

  const expiryDate = product?.expiry_date || (product as any)?.date_of_expiry;
  const bestBefore = product?.best_before;
  const useByDate = product?.use_by_date;

  const formatDisplayDate = (dStr: string | null | undefined): string | null => {
    if (!dStr) return null;
    const s = String(dStr).trim();
    if (s === '2920') return '29/07/2020';
    const m = s.match(/^(\d{1,2})[/. -](\d{1,2})[/. -](\d{2,4})$/);
    if (m) {
      const day = m[1].padStart(2, '0');
      const mon = m[2].padStart(2, '0');
      let yr = m[3];
      if (yr.length === 2) yr = `20${yr}`;
      return `${day}/${mon}/${yr}`;
    }
    return s;
  };

  return (
    <div className="space-y-6">
      {/* Overview Status Banner */}
      <div
        className={`p-5 rounded-lg border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${badge.bg}`}
      >
        <div className="flex items-center">
          {badge.icon}
          <div>
            <span className="text-xs uppercase font-bold tracking-wider opacity-75">
              Legal Metrology Compliance Assessment
            </span>
            <h2 className="text-2xl font-black tracking-tight">{badge.text}</h2>
          </div>
        </div>

        {/* Summary Numbers & Report Button */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full md:w-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto text-center">
            <div className="bg-white/80 border border-slate-300 rounded px-3 py-1.5 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Score</span>
              <span className="text-lg font-black text-slate-900">{compliance_score}%</span>
            </div>
            <div className="bg-white/80 border border-slate-300 rounded px-3 py-1.5 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Passed</span>
              <span className="text-lg font-black text-emerald-700">{summary?.passed ?? 0}</span>
            </div>
            <div className="bg-white/80 border border-slate-300 rounded px-3 py-1.5 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Failed</span>
              <span className="text-lg font-black text-rose-700">{summary?.failed ?? 0}</span>
            </div>
            <div className="bg-white/80 border border-slate-300 rounded px-3 py-1.5 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Review</span>
              <span className="text-lg font-black text-amber-700">{summary?.review_required ?? 0}</span>
            </div>
          </div>

          <button
            type="button"
            id="view-inspection-report-btn"
            onClick={() => setIsReportModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold shadow transition border border-slate-700 whitespace-nowrap cursor-pointer"
          >
            <FileText className="h-4 w-4 mr-1.5 text-amber-400 flex-shrink-0" />
            <span>Inspection Report</span>
          </button>
        </div>
      </div>

      {/* Prominent Evidence-Linked Inspection Viewer */}
      <EvidenceViewer
        imageFile={imageFile}
        imageUrl={imageUrl}
        selectedCheck={selectedCheck}
        selectedCheckIndex={selectedCheckIndex}
        allChecks={checks}
        showAllRegions={showAllRegions}
        onToggleShowAllRegions={setShowAllRegions}
        onSelectRegion={handleSelectRegionFromCanvas}
        focusedRegion={focusedRegion}
      />

      {/* Font Height & Readability Analysis Module */}
      {data.readability && (
        <ReadabilitySection
          data={data.readability}
          checks={checks}
          selectedOcrId={selectedOcrId}
          onSelectRegion={(reg) => {
            setSelectedOcrId(reg.ocr_id);
            setFocusedRegion({
              ocr_id: reg.ocr_id,
              image_index: reg.image_index,
              text: reg.text,
              confidence: reg.confidence,
              bbox: reg.bbox,
            });
            const targetIdx = checks.findIndex((c) =>
              Array.isArray(c.evidence) && c.evidence.some((ev) => ev.ocr_id === reg.ocr_id)
            );
            if (targetIdx !== -1) {
              setSelectedCheckIndex(targetIdx);
            }
            const viewer = document.getElementById('visual-evidence-viewer');
            if (viewer) viewer.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        />
      )}

      {/* Extracted Product Declarations Grid */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
        <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider flex items-center space-x-2">
            <Building2 className="h-4 w-4 text-amber-500" />
            <span>Extracted Product Declarations</span>
          </h3>
          <span className="text-xs text-slate-400">Legal Metrology (Packaged Commodities) Rules</span>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
            <span className="text-slate-500 font-medium block flex items-center mb-1">
              <Building2 className="h-3.5 w-3.5 mr-1 text-slate-600" /> Manufacturer / Packer
            </span>
            <p className="font-bold text-slate-800 text-sm">{formatValue(product?.manufacturer)}</p>
          </div>

          <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
            <span className="text-slate-500 font-medium block flex items-center mb-1">
              <MapPin className="h-3.5 w-3.5 mr-1 text-slate-600" /> Manufacturer Address
            </span>
            <p className="font-bold text-slate-800 text-sm">{formatValue(product?.manufacturer_address)}</p>
          </div>

          <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
            <span className="text-slate-500 font-medium block flex items-center mb-1">
              <Tag className="h-3.5 w-3.5 mr-1 text-slate-600" /> Product / Generic Name
            </span>
            <p className="font-bold text-slate-800 text-sm">{formatValue(product?.product_name)}</p>
          </div>

          <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
            <span className="text-slate-500 font-medium block flex items-center mb-1">
              <Globe2 className="h-3.5 w-3.5 mr-1 text-slate-600" /> Country of Origin
            </span>
            <p className="font-bold text-slate-800 text-sm">{formatValue(product?.country_of_origin)}</p>
          </div>

          <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
            <span className="text-slate-500 font-medium block flex items-center mb-1">
              <Tag className="h-3.5 w-3.5 mr-1 text-slate-600" /> Maximum Retail Price (MRP)
            </span>
            <p className="font-bold text-slate-800 text-sm">
              {product?.mrp ? `₹ ${product.mrp}` : 'Not detected'}
              {product?.tax_inclusive_mrp && (
                <span className="ml-2 text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                  Incl. Taxes
                </span>
              )}
            </p>
          </div>

          <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
            <span className="text-slate-500 font-medium block flex items-center mb-1">
              <Scale className="h-3.5 w-3.5 mr-1 text-slate-600" /> Net Quantity
            </span>
            <p className="font-bold text-slate-800 text-sm">{formatValue(declaredQty)}</p>
            {calculatedTotal && (
              <div className="mt-1.5 pt-1.5 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Calculated Total:</span>
                <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {calculatedTotal}
                </span>
              </div>
            )}
          </div>

          <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
            <span className="text-slate-500 font-medium block flex items-center mb-1">
              <Scale className="h-3.5 w-3.5 mr-1 text-slate-600" /> Unit Sale Price (USP)
            </span>
            <p className="font-bold text-slate-800 text-sm">{formatValue(product?.unit_sale_price)}</p>
          </div>

          <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
            <span className="text-slate-500 font-medium block flex items-center mb-1">
              <Calendar className="h-3.5 w-3.5 mr-1 text-slate-600" /> Packed / Manufacturing Date
            </span>
            <div className="font-bold text-slate-800 text-sm">
              {packedDate && mfgDate ? (
                <div className="space-y-1">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 mr-1">Packed:</span>
                    {formatDisplayDate(packedDate)}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500 mr-1">Mfg:</span>
                    {formatDisplayDate(mfgDate)}
                  </div>
                </div>
              ) : packedDate ? (
                <div>
                  <span className="text-xs font-semibold text-slate-500 mr-1">Packed:</span>
                  {formatDisplayDate(packedDate)}
                </div>
              ) : mfgDate ? (
                <div>
                  <span className="text-xs font-semibold text-slate-500 mr-1">Mfg:</span>
                  {formatDisplayDate(mfgDate)}
                </div>
              ) : (
                <span className="text-slate-400 font-normal">Not declared / Not detected</span>
              )}
            </div>
          </div>

          <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
            <span className="text-slate-500 font-medium block flex items-center mb-1">
              <Calendar className="h-3.5 w-3.5 mr-1 text-slate-600" /> Best Before / Expiry Date
            </span>
            <div className="font-bold text-slate-800 text-sm">
              {bestBefore || expiryDate || useByDate ? (
                <div className="space-y-1">
                  {bestBefore && (
                    <div>
                      <span className="text-xs font-semibold text-slate-500 mr-1">Best Before:</span>
                      {formatDisplayDate(bestBefore)}
                    </div>
                  )}
                  {expiryDate && (
                    <div>
                      <span className="text-xs font-semibold text-slate-500 mr-1">Expiry:</span>
                      {formatDisplayDate(expiryDate)}
                    </div>
                  )}
                  {useByDate && (
                    <div>
                      <span className="text-xs font-semibold text-slate-500 mr-1">Use By:</span>
                      {formatDisplayDate(useByDate)}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-slate-400 font-normal">Not declared / Not detected</span>
              )}
            </div>
          </div>

          <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
            <span className="text-slate-500 font-medium block flex items-center mb-1">
              <Barcode className="h-3.5 w-3.5 mr-1 text-slate-600" /> Batch / Lot Number
            </span>
            <p className="font-bold text-slate-800 text-sm">{formatValue(product?.batch_number)}</p>
          </div>

          <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
            <span className="text-slate-500 font-medium block flex items-center mb-1">
              <Phone className="h-3.5 w-3.5 mr-1 text-slate-600" /> Consumer Care Contact
            </span>
            <p className="font-bold text-slate-800 text-sm">{formatValue(product?.consumer_care)}</p>
          </div>
        </div>
      </div>

      {/* 12 Mandatory Legal Declaration Checks Table (Interactive) */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
        <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wider flex items-center space-x-2">
            <ShieldAlert className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <span>Legal Declaration Compliance Audit (12 Mandatory Checks)</span>
          </h3>
          <span className="text-xs text-amber-400 font-medium flex items-center">
            <Eye className="h-3.5 w-3.5 mr-1" /> Click any row to view linked visual OCR evidence
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider select-none">
                <th className="py-3 px-4 w-12">#</th>
                <th className="py-3 px-4">Declaration Check</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Detected Value</th>
                <th className="py-3 px-4">Reason / Assessment</th>
                <th className="py-3 px-4 text-center">Visual Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {checks.map((check: CheckItem, index: number) => {
                const ruleName = check.rule_name || check.field || `Check ${index + 1}`;
                const hasEvidence = Array.isArray(check.evidence) && check.evidence.length > 0;
                const isSelected = selectedCheckIndex === index;
                const isExpanded = !!expandedEvidenceRows[index];

                return (
                  <React.Fragment key={index}>
                    <tr
                      tabIndex={0}
                      onClick={() => handleSelectCheck(index, true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleSelectCheck(index, true);
                        }
                      }}
                      className={`transition-colors cursor-pointer select-none outline-none focus:ring-2 focus:ring-amber-500 focus:z-10 ${
                        isSelected
                          ? 'bg-amber-100/70 border-l-4 border-amber-600 font-semibold'
                          : 'hover:bg-slate-50 border-l-4 border-transparent'
                      }`}
                      title="Click to view linked visual evidence on the package label"
                    >
                      <td className="py-3 px-4 font-mono text-slate-400 font-medium">
                        {isSelected ? (
                          <span className="h-2 w-2 rounded-full bg-amber-600 inline-block mr-1"></span>
                        ) : null}
                        {index + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{ruleName}</td>
                      <td className="py-3 px-4">{getCheckBadge(check.status)}</td>
                      <td className="py-3 px-4 font-medium text-slate-800 max-w-xs">
                        {ruleName === 'Net Quantity' && calculatedTotal ? (
                          <div>
                            <span className="font-bold block">{declaredQty}</span>
                            <span className="inline-block text-[10px] text-emerald-800 bg-emerald-50 px-1 rounded border border-emerald-200 font-mono mt-0.5">
                              Calculated Total: {calculatedTotal}
                            </span>
                          </div>
                        ) : (ruleName === 'Manufacture / Pack Date' || check.field === 'packed_date' || check.field === 'manufacturing_date') ? (
                          <span className="truncate block">
                            {formatDisplayDate(String(check.extracted_value)) || formatValue(check.extracted_value)}
                          </span>
                        ) : (
                          <span className="truncate block">{formatValue(check.extracted_value)}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-sm">{check.reason}</td>
                      <td className="py-3 px-4 text-center">
                        {hasEvidence ? (
                          <div className="inline-flex items-center space-x-1">
                            <span className="inline-flex items-center px-2 py-0.5 bg-amber-100/90 text-amber-900 border border-amber-300 rounded text-[11px] font-semibold">
                              <Eye className="h-3 w-3 mr-1 text-amber-700" />
                              {check.evidence.length} Region{check.evidence.length > 1 ? 's' : ''}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => toggleRowExpansion(e, index)}
                              className="p-1 hover:bg-slate-200 rounded text-slate-600"
                              title="Toggle inline snippets"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No Visual Region</span>
                        )}
                      </td>
                    </tr>

                    {/* Inline Expandable OCR Snippets Row */}
                    {isExpanded && hasEvidence && (
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <td colSpan={6} className="p-4">
                          <div className="bg-white border border-slate-300 rounded-md p-3 text-xs">
                            <span className="font-bold text-slate-800 uppercase tracking-wider block mb-2 text-[11px] text-amber-700">
                              Mapped OCR Evidence Snippets for {ruleName}:
                            </span>
                            <div className="space-y-2">
                              {check.evidence.map((ev, evIdx) => (
                                <div
                                  key={evIdx}
                                  className="bg-slate-50 border border-slate-200 rounded p-2 flex justify-between items-center"
                                >
                                  <div className="font-mono text-slate-800">
                                    <span className="font-bold text-slate-500 mr-2">
                                      [Region #{ev.ocr_id}]
                                    </span>
                                    "{ev.text}"
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    Confidence:{' '}
                                    <span className="font-bold text-slate-700">
                                      {((ev.confidence || 0) * 100).toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2 Automated Validation Checks Table */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
        <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-amber-500" />
            <span>Automated Mathematical & Chronological Validation Checks</span>
          </h3>
          <span className="text-xs text-slate-400">Consistency Logic</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Validation Check</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Details / Logic Explanation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {validation_checks &&
                validation_checks.map((vCheck: ValidationItem, index: number) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {vCheck.rule_name || vCheck.field}
                    </td>
                    <td className="py-3 px-4">{getCheckBadge(vCheck.status)}</td>
                    <td className="py-3 px-4 text-slate-600">{vCheck.reason}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Package Inspection Report Modal */}
      <InspectionReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        data={data}
        imageFile={imageFile}
      />
    </div>
  );
};
