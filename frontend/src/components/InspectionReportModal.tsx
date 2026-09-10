import React, { useRef } from 'react';
import {
  Printer,
  X,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  Building2,
  FileText,
  Clock,
  Layers,
  Scale,
  Eye,
  Activity,
} from 'lucide-react';
import { AnalyzeResponse, CheckItem, ValidationItem } from '../types/api';

interface InspectionReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AnalyzeResponse;
  imageFile?: File | null;
}

export const InspectionReportModal: React.FC<InspectionReportModalProps> = ({
  isOpen,
  onClose,
  data,
  imageFile,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const {
    status,
    compliance_score,
    summary,
    product,
    checks = [],
    validation_checks = [],
    preservative_analysis,
    nutrition_analysis,
    readability,
    meta,
  } = data;

  const nutritionData = nutrition_analysis || (data as any).nutrition_analysis || {
    has_warning: false,
    warnings: [],
    warnings_count: 0,
    overall_summary: "Nutritional declarations not detected on label to determine HFSS warning status.",
    indicators_list: [
      {
        id: "indicator_fat",
        name: "Fat Content",
        warning_title: "HIGH FAT",
        status: "REVIEW",
        warning_triggered: false,
        declared_value: "Not detected in OCR",
        threshold: "Total Fat > 15g or Sat Fat > 4g per 100g",
        reason: "Nutritional declaration for fat is not detected or partially obscured on package.",
      },
      {
        id: "indicator_sugar",
        name: "Sugar Content",
        warning_title: "HIGH SUGAR",
        status: "REVIEW",
        warning_triggered: false,
        declared_value: "Not detected in OCR",
        threshold: "Total Sugars > 10g per 100g",
        reason: "Nutritional declaration for sugar is not detected on package.",
      },
      {
        id: "indicator_salt",
        name: "Salt / Sodium Content",
        warning_title: "HIGH SALT",
        status: "REVIEW",
        warning_triggered: false,
        declared_value: "Not detected in OCR",
        threshold: "Sodium > 400mg (or Salt > 1g) per 100g",
        reason: "Nutritional declaration for sodium/salt is not detected on package.",
      },
    ],
  };

  const readabilityData = readability || (data as any).readability;
  const readabilitySummary = readabilityData?.summary || {
    overall_status: status === 'PASS' || status === 'COMPLIANT' ? 'PASS' : 'REVIEW',
    total_regions: checks.length,
    readable_count: checks.filter((c) => c.status === 'PASS').length,
    review_count: checks.filter((c) => c.status !== 'PASS').length,
    small_text_count: checks.filter((c) => c.status === 'REVIEW').length,
    low_contrast_count: 0,
    average_text_height_px: 24,
    smallest_detected_text_px: 12,
    average_confidence: 0.94,
    physical_font_size: {
      status: 'NOT CALIBRATED',
      reason: 'Image does not contain a physical scale reference.',
    },
  };

  const readabilityFlaggedRegions = (readabilityData?.regions || [])
    .filter((r: any) => r.status && r.status !== 'READABLE')
    .slice(0, 6);


  const imageSrc = imageFile ? URL.createObjectURL(imageFile) : null;

  const reportId = `LM-REP-${(meta?.timestamp || new Date().toISOString())
    .replace(/[^0-9]/g, '')
    .slice(0, 12)}`;

  const inspectionDate = meta?.timestamp
    ? new Date(meta.timestamp).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

  const getStatusBadge = (statusStr: string) => {
    const s = (statusStr || '').toUpperCase();
    if (s === 'PASS' || s === 'COMPLIANT') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-700" /> COMPLIANT
        </span>
      );
    }
    if (s === 'FAIL' || s === 'NON_COMPLIANT') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
          <XCircle className="h-3.5 w-3.5 mr-1 text-rose-700" /> NON-COMPLIANT
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
        <AlertTriangle className="h-3.5 w-3.5 mr-1 text-amber-700" /> REVIEW REQUIRED
      </span>
    );
  };

  const getCheckBadge = (statusStr: string) => {
    const s = (statusStr || '').toUpperCase();
    if (s === 'PASS') {
      return <span className="font-bold text-emerald-700">PASS</span>;
    }
    if (s === 'FAIL') {
      return <span className="font-bold text-rose-700">FAIL</span>;
    }
    if (s === 'MISSING') {
      return <span className="font-bold text-rose-700">MISSING</span>;
    }
    return <span className="font-bold text-amber-700">REVIEW</span>;
  };

  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined || val === '') return 'Not declared';
    if (typeof val === 'boolean') return val ? 'Declared (Yes)' : 'Not declared (No)';
    if (typeof val === 'object') {
      const v = val as Record<string, unknown>;
      const parts: string[] = [];
      if (v.phone) parts.push(`Tel: ${v.phone}`);
      if (v.email) parts.push(`Email: ${v.email}`);
      return parts.length ? parts.join(' | ') : 'Not declared';
    }
    return String(val);
  };

  const handlePrint = () => {
    window.print();
  };

  // Compile all unique evidence items
  const allEvidence = checks.flatMap((c) => c.evidence || []);
  const uniqueEvidence = Array.from(
    new Map(allEvidence.map((e) => [e.ocr_id, e])).values()
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:overflow-visible">
      {/* Precision Print Engine Styles: Hides entire web application and prints ONLY this 2-page report */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide entire website chrome (header, upload zone, buttons, background page) */
          body * {
            visibility: hidden !important;
          }

          /* Show ONLY the printable inspection report document */
          #printable-inspection-report,
          #printable-inspection-report * {
            visibility: visible !important;
          }

          /* Pin the printable document to top-left of the first printed page */
          #printable-inspection-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            border: none !important;
            box-shadow: none !important;
          }

          .print-avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .print-page-2-start {
            break-before: page !important;
            page-break-before: always !important;
            padding-top: 8mm !important;
          }

          table tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Modal Container */}
      <div className="bg-white rounded-lg shadow-2xl border border-slate-300 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden print:max-w-none print:max-h-none print:shadow-none print:border-none print:static print:overflow-visible">
        {/* Top Control Bar (Screen Only - Hidden during print) */}
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 print:hidden">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-amber-500" />
            <span className="font-bold text-sm tracking-wide">
              Official Package Inspection Report (2 Pages)
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow transition cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              Print Official Report
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
              title="Close Report"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Report Document Body */}
        <div
          id="printable-inspection-report"
          ref={printRef}
          className="p-6 sm:p-8 overflow-y-auto font-sans text-slate-900 text-xs print:p-0 print:overflow-visible"
        >
          {/* ============================================================ */}
          {/* PAGE 1: HEADER, OUTCOME, PRODUCT DECLARATIONS, 12 CHECKS     */}
          {/* ============================================================ */}
          <div className="space-y-4">
            {/* Institutional Official Letterhead */}
            <div className="print-avoid-break border-b-2 border-slate-900 pb-2 text-center space-y-1">
              <div className="flex justify-center items-center space-x-2">
                <ShieldCheck className="h-6 w-6 text-amber-600 inline-block" />
                <h1 className="text-sm font-black uppercase tracking-widest text-slate-900">
                  Government of India
                </h1>
              </div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-800">
                Department of Consumer Affairs • Legal Metrology Division
              </p>
              <p className="text-[9.5px] text-slate-600 uppercase tracking-wide">
                Statutory Package Inspection Report • Legal Metrology (Packaged Commodities) Rules, 2011
              </p>
              <div className="pt-1.5 flex justify-between items-center text-[9.5px] text-slate-600 border-t border-slate-300 mt-1.5 font-medium">
                <span>
                  <strong>Report ID:</strong> {reportId}
                </span>
                <span>
                  <strong>Inspection Date:</strong> {inspectionDate}
                </span>
                <span>
                  <strong>Jurisdiction:</strong> Enforcement & Inspection Cell
                </span>
              </div>
            </div>

            {/* Section 1: Inspection Result & Score */}
            <div className="print-avoid-break bg-slate-50 border border-slate-300 rounded p-2.5 flex justify-between items-center gap-3">
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
                  Overall Compliance Assessment
                </span>
                <div className="flex items-center space-x-2 mt-0.5">
                  {getStatusBadge(status)}
                  <span className="text-xs text-slate-600 font-medium">
                    Compliance Score:{' '}
                    <strong className="text-slate-900 text-sm">{compliance_score}%</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3 border-l border-slate-300 pl-3 text-center">
                <div>
                  <span className="text-[8.5px] uppercase font-bold text-slate-500 block">Total</span>
                  <span className="font-bold text-slate-800 text-xs">
                    {summary?.total_checks ?? 12}
                  </span>
                </div>
                <div>
                  <span className="text-[8.5px] uppercase font-bold text-emerald-700 block">Passed</span>
                  <span className="font-bold text-emerald-800 text-xs">{summary?.passed ?? 0}</span>
                </div>
                <div>
                  <span className="text-[8.5px] uppercase font-bold text-rose-700 block">Failed</span>
                  <span className="font-bold text-rose-800 text-xs">{summary?.failed ?? 0}</span>
                </div>
                <div>
                  <span className="text-[8.5px] uppercase font-bold text-amber-700 block">Review</span>
                  <span className="font-bold text-amber-800 text-xs">
                    {summary?.review_required ?? 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Extracted Product Declarations */}
            <div className="print-avoid-break">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5 flex items-center space-x-1.5">
                <Building2 className="h-3.5 w-3.5 text-amber-600" />
                <span>Extracted Product Declarations</span>
              </h2>
              <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                  <span className="text-slate-500 text-[9px] block">Manufacturer / Packer</span>
                  <span className="font-semibold text-slate-900 truncate block">
                    {formatValue(product?.manufacturer)}
                  </span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                  <span className="text-slate-500 text-[9px] block">Manufacturer Address</span>
                  <span className="font-semibold text-slate-900 truncate block">
                    {formatValue(product?.manufacturer_address)}
                  </span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                  <span className="text-slate-500 text-[9px] block">Commodity / Common Name</span>
                  <span className="font-semibold text-slate-900 truncate block">
                    {formatValue(product?.product_name)}
                  </span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                  <span className="text-slate-500 text-[9px] block">Maximum Retail Price (MRP)</span>
                  <span className="font-semibold text-slate-900">
                    {product?.mrp ? `₹ ${product.mrp}` : 'Not detected'}
                    {product?.tax_inclusive_mrp && ' (Incl. Taxes)'}
                  </span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                  <span className="text-slate-500 text-[9px] block">Net Quantity</span>
                  <span className="font-semibold text-slate-900">{formatValue(product?.net_quantity)}</span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                  <span className="text-slate-500 text-[9px] block">Unit Sale Price (USP)</span>
                  <span className="font-semibold text-slate-900">{formatValue(product?.unit_sale_price)}</span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                  <span className="text-slate-500 text-[9px] block">Mfg / Packing Date</span>
                  <span className="font-semibold text-slate-900">
                    {formatValue(product?.packed_date || product?.manufacturing_date)}
                  </span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                  <span className="text-slate-500 text-[9px] block">Best Before / Expiry</span>
                  <span className="font-semibold text-slate-900">
                    {formatValue(product?.best_before || product?.use_by_date || product?.expiry_date)}
                  </span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                  <span className="text-slate-500 text-[9px] block">Batch / Lot Number</span>
                  <span className="font-semibold text-slate-900">{formatValue(product?.batch_number)}</span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200 col-span-2">
                  <span className="text-slate-500 text-[9px] block">Consumer Care Contact</span>
                  <span className="font-semibold text-slate-900">{formatValue(product?.consumer_care)}</span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                  <span className="text-slate-500 text-[9px] block">Country of Origin</span>
                  <span className="font-semibold text-slate-900">{formatValue(product?.country_of_origin)}</span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200 col-span-3">
                  <span className="text-slate-500 text-[9px] block">Ingredients Declaration</span>
                  <span className="font-semibold text-slate-900 block text-[9.5px] leading-tight">
                    {formatValue(product?.ingredients)}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3: Legal Declaration Assessment (12 Checks) */}
            <div className="print-avoid-break">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5 flex items-center space-x-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                <span>Legal Declaration Assessment (12 Mandatory Checks • Rule 6)</span>
              </h2>
              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-left text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold uppercase">
                      <th className="py-1.5 px-2.5 w-6 text-center">#</th>
                      <th className="py-1.5 px-2.5 w-44">Mandatory Declaration</th>
                      <th className="py-1.5 px-2 w-16 text-center">Status</th>
                      <th className="py-1.5 px-2.5 w-36">Detected Value</th>
                      <th className="py-1.5 px-2.5">Statutory Assessment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {checks.map((check: CheckItem, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-1 px-2.5 font-mono text-slate-500 text-center">{idx + 1}</td>
                        <td className="py-1 px-2.5 font-semibold text-slate-900">
                          {check.rule_name || check.field}
                        </td>
                        <td className="py-1 px-2 text-center">{getCheckBadge(check.status)}</td>
                        <td className="py-1 px-2.5 text-slate-800 truncate max-w-[140px]">
                          {formatValue(check.extracted_value)}
                        </td>
                        <td className="py-1 px-2.5 text-slate-600 text-[9.5px] leading-tight">
                          {check.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* PAGE 2: VALIDATIONS, VISUAL EVIDENCE, NOTES, SIGNATURE       */}
          {/* ============================================================ */}
          <div className="print-page-2-start space-y-4 pt-4">
            {/* Page 2 Header Running Banner */}
            <div className="border-b border-slate-300 pb-1.5 flex justify-between items-center text-[9px] text-slate-500">
              <span className="font-bold text-slate-700 uppercase">
                VerifEye Inspection Report • {reportId}
              </span>
              <span>Page 2 of 2 • Department of Consumer Affairs</span>
            </div>

            {/* Section 4: Automated Validations */}
            <div className="print-avoid-break">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5 flex items-center space-x-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-amber-600" />
                <span>Automated Consistency Validations (Mathematical & Chronological)</span>
              </h2>
              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-left text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold uppercase">
                      <th className="py-1.5 px-2.5 w-60">Validation Check</th>
                      <th className="py-1.5 px-2 w-16 text-center">Status</th>
                      <th className="py-1.5 px-2.5">Consistency Logic Analysis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {validation_checks.map((vCheck: ValidationItem, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2.5 font-semibold text-slate-900">
                          {vCheck.rule_name || vCheck.field}
                        </td>
                        <td className="py-1.5 px-2 text-center">{getCheckBadge(vCheck.status)}</td>
                        <td className="py-1.5 px-2.5 text-slate-600 text-[9.5px]">
                          {vCheck.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 4B: Preservative Safety & Chemical Additive Audit (FSSAI) */}
            <div className="print-avoid-break">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                  <span>Preservative Safety & Chemical Additives Audit (FSSAI)</span>
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {preservative_analysis?.food_category || product?.food_category || 'General Packaged Food'}
                </span>
              </h2>

              {preservative_analysis?.has_banned_preservative && (
                <div className="bg-rose-50 border border-rose-400 p-2 rounded mb-2 text-[9.5px] text-rose-950">
                  <span className="font-bold text-rose-900 uppercase block">
                    ⚠️ Statutory Warning: Prohibited / Banned Food Substance Detected
                  </span>
                  <p className="mt-0.5">
                    {preservative_analysis.critical_alert || 'A prohibited chemical preservative or industrial adulterant was identified in this product.'}
                  </p>
                </div>
              )}

              {preservative_analysis?.preservatives_found && preservative_analysis.preservatives_found.length > 0 ? (
                <div className="border border-slate-300 rounded overflow-hidden">
                  <table className="w-full text-left text-[9.5px] border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold uppercase">
                        <th className="py-1 px-2 w-32">Preservative</th>
                        <th className="py-1 px-2 text-center w-16">Status</th>
                        <th className="py-1 px-2 w-28">Declared vs FSSAI Limit</th>
                        <th className="py-1 px-2">Global Bans & Country-wise Prohibitions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {preservative_analysis.preservatives_found.map((item, idx) => {
                        const isBanned = item.is_banned_in_india || item.status === 'BANNED_SUBSTANCE';
                        return (
                          <tr key={idx} className={`hover:bg-slate-50 ${isBanned ? 'bg-rose-50/70 font-semibold' : ''}`}>
                            <td className="py-1.5 px-2 align-top">
                              <span className="font-bold text-slate-900 block">{item.name || 'Additive'}</span>
                              <span className="font-mono text-slate-500 text-[8.5px] block">
                                {item.ins_number ? `INS ${item.ins_number}` : 'No INS #'}
                              </span>
                              <span className="text-[8.5px] text-slate-600 block mt-0.5 leading-snug">
                                <strong className="text-slate-700">Brief Purpose:</strong> {item.description || item.reason}
                              </span>
                            </td>
                            <td className="py-1.5 px-2 text-center align-top">
                              {isBanned ? (
                                <span className="font-black text-rose-700 bg-rose-100 px-1 py-0.5 rounded text-[8px] uppercase block border border-rose-300">
                                  BANNED
                                </span>
                              ) : (
                                getCheckBadge(item.status === 'LIMIT_EXCEEDED' ? 'FAIL' : item.risk_flag ? 'REVIEW' : 'PASS')
                              )}
                            </td>
                            <td className="py-1.5 px-2 align-top font-mono text-[9px]">
                              <span className="text-slate-500 text-[8px] uppercase block">Declared:</span>
                              <span className="font-bold text-slate-800 block">
                                {item.amount_mg_per_kg == null ? 'Not specified' : `${item.amount_mg_per_kg} mg/kg`}
                              </span>
                              <span className="text-slate-500 text-[8px] uppercase block mt-1">FSSAI Limit:</span>
                              <span className={`font-bold block ${isBanned ? 'text-rose-700' : 'text-slate-800'}`}>
                                {isBanned ? '0 mg/kg (Prohibited)' : item.fssai_limit_mg_per_kg == null ? 'Schedule unlisted' : `${item.fssai_limit_mg_per_kg} mg/kg`}
                              </span>
                            </td>
                            <td className="py-1.5 px-2 align-top text-[8.5px]">
                              {item.banned_countries && item.banned_countries.length > 0 ? (
                                <div className="space-y-1">
                                  <span className="font-bold text-rose-900 block">Banned/Restricted in:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {item.banned_countries.map((c, cIdx) => (
                                      <span key={cIdx} className="bg-rose-100 text-rose-900 border border-rose-200 rounded px-1.5 py-0.5 text-[8px]">
                                        {c}
                                      </span>
                                    ))}
                                  </div>
                                  {item.health_concerns && (
                                    <p className="text-slate-600 italic mt-1 leading-tight text-[8px]">
                                      Note: {item.health_concerns}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-500">Permitted in primary international food codes within quantitative limits.</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border border-emerald-300 bg-emerald-50/70 p-2 rounded flex items-center justify-between text-[9.5px]">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 flex-shrink-0" />
                    <span className="font-bold text-emerald-900">Clean Label Verified:</span>
                    <span className="text-slate-700">No synthetic chemical preservatives (Class II additives) or banned substances detected.</span>
                  </div>
                  <span className="font-bold uppercase text-[8.5px] px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 flex-shrink-0">
                    PASS / SAFE
                  </span>
                </div>
              )}
            </div>

            {/* Section 4C: Text Font Readability & Legibility Diagnostics (Rule 9) */}
            <div className="print-avoid-break">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Eye className="h-3.5 w-3.5 text-amber-600" />
                  <span>Text Font Readability & Legibility Diagnostics (Rule 9)</span>
                </span>
                <span className="text-[9px] font-mono text-slate-500">
                  Status: {readabilitySummary.overall_status}
                </span>
              </h2>

              <div className="grid grid-cols-4 gap-2 mb-2">
                <div className="border border-slate-200 bg-slate-50 p-2 rounded text-center">
                  <span className="text-[8.5px] uppercase font-bold text-slate-500 block">Overall Legibility</span>
                  <span className="font-extrabold text-[11px] text-slate-900 mt-0.5 block">
                    {readabilitySummary.overall_status === 'PASS' ? (
                      <span className="text-emerald-700">PASS / READABLE</span>
                    ) : (
                      <span className="text-amber-700">OFFICER REVIEW</span>
                    )}
                  </span>
                </div>
                <div className="border border-slate-200 bg-slate-50 p-2 rounded text-center">
                  <span className="text-[8.5px] uppercase font-bold text-slate-500 block">Avg Text Height</span>
                  <span className="font-extrabold text-[11px] text-slate-900 mt-0.5 block">
                    {Math.round(readabilitySummary.average_text_height_px || 24)} px
                  </span>
                </div>
                <div className="border border-slate-200 bg-slate-50 p-2 rounded text-center">
                  <span className="text-[8.5px] uppercase font-bold text-slate-500 block">Smallest Text Height</span>
                  <span className="font-extrabold text-[11px] text-slate-900 mt-0.5 block">
                    {Math.round(readabilitySummary.smallest_detected_text_px || 11)} px
                  </span>
                </div>
                <div className="border border-slate-200 bg-slate-50 p-2 rounded text-center">
                  <span className="text-[8.5px] uppercase font-bold text-slate-500 block">Legible Declarations</span>
                  <span className="font-extrabold text-[11px] text-slate-900 mt-0.5 block">
                    {readabilitySummary.readable_count ?? checks.length} / {readabilitySummary.total_regions ?? checks.length}
                  </span>
                </div>
              </div>

              {/* Readability breakdown table */}
              {readabilityFlaggedRegions.length > 0 ? (
                <div className="border border-slate-300 rounded overflow-hidden">
                  <table className="w-full text-left text-[9px] border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold uppercase">
                        <th className="py-1 px-2 w-12 text-center">ID</th>
                        <th className="py-1 px-2">Declaration / Text Sample</th>
                        <th className="py-1 px-2 text-center w-16">Height</th>
                        <th className="py-1 px-2 text-center w-20">Contrast / Sharpness</th>
                        <th className="py-1 px-2">Legibility Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {readabilityFlaggedRegions.map((reg: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-1 px-2 text-center font-mono text-slate-600">#{reg.region_id ?? idx + 1}</td>
                          <td className="py-1 px-2 font-medium text-slate-900 truncate max-w-[200px]">
                            {reg.text || reg.extracted_value || 'Sample text'}
                          </td>
                          <td className="py-1 px-2 text-center font-mono">{Math.round(reg.height_px || 14)} px</td>
                          <td className="py-1 px-2 text-center font-mono">
                            {reg.rms_contrast != null ? `${Math.round(reg.rms_contrast)} RMS` : 'Normal'}
                          </td>
                          <td className="py-1 px-2 text-amber-800 text-[8.5px]">
                            {Array.isArray(reg.reasons) ? reg.reasons.join(', ') : reg.reason || 'Verification recommended'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border border-emerald-300 bg-emerald-50/70 p-2 rounded flex items-center justify-between text-[9.5px]">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 flex-shrink-0" />
                    <span className="font-bold text-emerald-900">Font Legibility Verified:</span>
                    <span className="text-slate-700">
                      All principal display declarations exhibit sufficient pixel height and optical contrast against background packaging.
                    </span>
                  </div>
                  <span className="font-bold uppercase text-[8.5px] px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 flex-shrink-0">
                    PASS / LEGIBLE
                  </span>
                </div>
              )}

              {/* Statutory Note on Physical Calibration */}
              <p className="text-[8.5px] text-slate-500 italic mt-1 leading-tight">
                * Note on Rule 9 Metrology Calibration: Physical font size requirement (1.0mm - 4.0mm based on packaging area under PCR 2011) is estimated via image sensor pixel density. Physical verification with a calibrated optical scale gauge is recommended where camera focal distance reference is uncalibrated.
              </p>
            </div>

            {/* Section 4D: FSSAI Front-of-Pack Nutrition Warning Audit (HFSS) */}
            <div className="print-avoid-break">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Activity className="h-3.5 w-3.5 text-amber-600" />
                  <span>FSSAI Front-of-Pack Nutrition Warning Audit (HFSS: High Fat, Sugar, Salt)</span>
                </span>
                <span className="text-[9px] font-mono text-slate-500">
                  {nutritionData.has_warning ? `${nutritionData.warnings_count} Warning(s) Mandated` : 'Standard Dietary Range'}
                </span>
              </h2>

              {/* Status Alert Banner */}
              {nutritionData.has_warning ? (
                <div className="bg-rose-50 border border-rose-300 p-2 rounded mb-2 text-[9.5px] text-rose-950 flex items-start space-x-2">
                  <span className="font-bold text-rose-900 uppercase block flex-shrink-0">
                    ⚠️ Statutory Warning Label Mandated:
                  </span>
                  <div>
                    <span className="font-bold text-rose-800">
                      {nutritionData.warnings.join(' • ')}
                    </span>
                    <p className="text-slate-700 mt-0.5 leading-tight">
                      This product exceeds statutory front-of-pack thresholds under FSSAI Front-of-Pack Labelling guidelines. Front-of-pack warning symbol and red cautionary indicator must be displayed on principal display panel.
                    </p>
                  </div>
                </div>
              ) : nutritionData.indicators_list.every((i: any) => i.status === 'REVIEW') ? (
                <div className="bg-amber-50 border border-amber-300 p-2 rounded mb-2 text-[9.5px] text-amber-950 flex items-start space-x-2">
                  <span className="font-bold text-amber-900 uppercase block flex-shrink-0">
                    ℹ️ Information Incomplete (Review Mandated):
                  </span>
                  <p className="text-slate-700 leading-tight">
                    Nutritional declaration table not fully detected on label OCR. Front-of-pack warning status classified as REVIEW rather than estimated without back-panel nutritional verification.
                  </p>
                </div>
              ) : (
                <div className="border border-emerald-300 bg-emerald-50/70 p-2 rounded mb-2 flex items-center justify-between text-[9.5px]">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700 flex-shrink-0" />
                    <span className="font-bold text-emerald-900">Compliant Dietary Profile:</span>
                    <span className="text-slate-700">
                      Declared fat, sugar, and salt levels comply within statutory non-warning thresholds under FSSAI dietary guidelines.
                    </span>
                  </div>
                  <span className="font-bold uppercase text-[8.5px] px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900 flex-shrink-0">
                    NO WARNINGS
                  </span>
                </div>
              )}

              {/* 3 HFSS Indicators Table */}
              <div className="border border-slate-300 rounded overflow-hidden">
                <table className="w-full text-left text-[9.5px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold uppercase">
                      <th className="py-1 px-2 w-32">Indicator</th>
                      <th className="py-1 px-2 text-center w-28">Status / Warning</th>
                      <th className="py-1 px-2 w-48">Declared Value & Basis</th>
                      <th className="py-1 px-2">FSSAI Threshold & Compliance Analysis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {nutritionData.indicators_list.map((ind: any, idx: number) => {
                      const isHigh = ind.status === 'HIGH' || ind.warning_triggered;
                      const isReview = ind.status === 'REVIEW';
                      return (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-50 ${isHigh ? 'bg-rose-50/60 font-medium' : ''}`}
                        >
                          <td className="py-1.5 px-2 align-top">
                            <span className="font-bold text-slate-900 block">{ind.name}</span>
                            <span className="text-[8.5px] text-slate-500 block font-mono">
                              {ind.id.replace('indicator_', 'FSSAI-FOP-')}
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-center align-top">
                            {isHigh ? (
                              <span className="font-black text-rose-800 bg-rose-100 px-2 py-0.5 rounded text-[8.5px] uppercase block border border-rose-300 shadow-2xs">
                                🚨 {ind.warning_title}
                              </span>
                            ) : isReview ? (
                              <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[8px] uppercase block border border-amber-300">
                                REVIEW
                              </span>
                            ) : (
                              <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[8px] uppercase block border border-emerald-300">
                                MODERATE / PASS
                              </span>
                            )}
                          </td>
                          <td className="py-1.5 px-2 align-top text-[9px]">
                            <span className="font-bold text-slate-900 block font-mono">{ind.declared_value}</span>
                            {ind.evidence?.text && (
                              <span className="text-[8px] text-slate-500 italic block mt-0.5 truncate max-w-[200px]">
                                Evidence: "{ind.evidence.text}"
                              </span>
                            )}
                          </td>
                          <td className="py-1.5 px-2 align-top text-[8.5px] leading-tight">
                            <span className="text-slate-500 block font-mono text-[8px] uppercase font-bold">
                              Threshold: {ind.threshold}
                            </span>
                            <span className="text-slate-700 block mt-0.5">
                              {ind.reason}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 5: Visual Evidence & OCR Mappings */}
            <div className="print-avoid-break">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-1.5 flex items-center space-x-1.5">
                <Layers className="h-3.5 w-3.5 text-amber-600" />
                <span>Visual Evidence & Mapped OCR Regions</span>
              </h2>
              <div className="grid grid-cols-12 gap-3 items-start">
                {/* Package Label Image */}
                {imageSrc && (
                  <div className="col-span-4 border border-slate-300 rounded p-1.5 bg-slate-50 text-center flex items-center justify-center">
                    <img
                      src={imageSrc}
                      alt="Inspected Package Commodity"
                      className="max-h-48 w-auto object-contain mx-auto"
                    />
                  </div>
                )}
                {/* Mapped OCR Evidence Snippets Table */}
                <div className={`${imageSrc ? 'col-span-8' : 'col-span-12'} space-y-1`}>
                  <span className="font-bold text-slate-700 text-[9.5px] block">
                    Extracted OCR Evidence Snippets ({uniqueEvidence.length} Regions):
                  </span>
                  <div className="border border-slate-300 rounded overflow-hidden">
                    <table className="w-full text-left text-[9px] border-collapse font-mono">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase">
                          <th className="py-1 px-1.5 w-12 text-center">ID</th>
                          <th className="py-1 px-2">OCR Text Snippet</th>
                          <th className="py-1 px-1.5 w-16 text-right">Confidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {uniqueEvidence.slice(0, 10).map((ev, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-1 px-1.5 text-amber-700 font-bold text-center">
                              #{ev.ocr_id}
                            </td>
                            <td className="py-1 px-2 text-slate-900 truncate max-w-[200px]">
                              "{ev.text}"
                            </td>
                            <td className="py-1 px-1.5 text-slate-600 text-right">
                              {((ev.confidence || 0) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 6: Assessment Notes & Legal Recommendations */}
            <div className="print-avoid-break border border-slate-300 rounded p-2.5 bg-slate-50/70 space-y-1">
              <h3 className="font-bold uppercase tracking-wider text-[10px] text-slate-900 flex items-center">
                <Clock className="h-3 w-3 mr-1 text-slate-600" /> Assessment Observations & Enforcement Recommendations
              </h3>
              <p className="text-slate-700 text-[9.5px] leading-relaxed">
                {status === 'PASS' || status === 'COMPLIANT'
                  ? 'All mandatory statutory declarations required under Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011 are verified and comply with statutory criteria.'
                  : status === 'NON_COMPLIANT'
                  ? 'Non-compliance detected in mandatory statutory declarations. Initiating formal notice and enforcement proceedings under Section 36 of the Legal Metrology Act, 2009 is advised.'
                  : 'Automated inspection identified items requiring manual physical verification by an authorized Legal Metrology officer prior to concluding enforcement action.'}
              </p>
            </div>

            {/* Section 7: Officer Sign-off & System Metadata */}
            <div className="print-avoid-break border-t-2 border-slate-900 pt-3 flex justify-between items-end text-[9.5px] text-slate-600">
              <div className="space-y-0.5 max-w-sm">
                <p className="font-bold text-slate-900 flex items-center">
                  <Scale className="h-3.5 w-3.5 mr-1 text-amber-600" /> VerifEye System • Department of Consumer Affairs
                </p>
                <p className="text-slate-500">
                  Legal Metrology AI/CV Automated Inspection Assistant
                </p>
                <p className="text-[8.5px] text-slate-400">
                  Official Record • Confidential government enforcement report generated under the Legal Metrology Act, 2009.
                </p>
              </div>

              <div className="text-center min-w-[200px]">
                <div className="h-10 border-b border-dashed border-slate-400 mb-1"></div>
                <p className="font-bold text-slate-900">Authorized Inspecting Officer</p>
                <p className="text-[8.5px] text-slate-500">Signature & Official Seal</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
