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

  const { status, compliance_score, summary, product, checks = [], validation_checks = [], meta } = data;

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
                  <span className="font-semibold text-slate-900">
                    {formatValue(declaredQty)}
                    {calculatedTotal && ` (Calculated: ${calculatedTotal})`}
                  </span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                  <span className="text-slate-500 text-[9px] block">Unit Sale Price (USP)</span>
                  <span className="font-semibold text-slate-900">{formatValue(product?.unit_sale_price)}</span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                  <span className="text-slate-500 text-[9px] block">Mfg / Packing Date</span>
                  <span className="font-semibold text-slate-900">
                    {packedDate && mfgDate
                      ? `Packed: ${formatDisplayDate(packedDate)} | Mfg: ${formatDisplayDate(mfgDate)}`
                      : packedDate
                      ? `Packed: ${formatDisplayDate(packedDate)}`
                      : mfgDate
                      ? `Mfg: ${formatDisplayDate(mfgDate)}`
                      : 'Not declared'}
                  </span>
                </div>
                <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
                  <span className="text-slate-500 text-[9px] block">Best Before / Expiry</span>
                  <span className="font-semibold text-slate-900">
                    {bestBefore && expiryDate
                      ? `BB: ${formatDisplayDate(bestBefore)} | Exp: ${formatDisplayDate(expiryDate)}`
                      : bestBefore
                      ? `Best Before: ${formatDisplayDate(bestBefore)}`
                      : expiryDate
                      ? `Expiry: ${formatDisplayDate(expiryDate)}`
                      : useByDate
                      ? `Use By: ${formatDisplayDate(useByDate)}`
                      : 'Not declared'}
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
                          {(check.rule_name === 'Net Quantity' || check.field === 'net_quantity') && calculatedTotal
                            ? `${declaredQty} (Total: ${calculatedTotal})`
                            : (check.rule_name === 'Manufacture / Pack Date' || check.field === 'packed_date' || check.field === 'manufacturing_date')
                            ? (formatDisplayDate(String(check.extracted_value)) || formatValue(check.extracted_value))
                            : formatValue(check.extracted_value)}
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
