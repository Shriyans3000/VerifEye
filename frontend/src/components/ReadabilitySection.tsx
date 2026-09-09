import React, { useState, useMemo } from 'react';
import { ReadabilityData, ReadabilityRegion, CheckItem } from '../types/api';
import {
  Eye,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Info,
  Search,
  Crosshair,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Tag,
  Scale,
  Building2,
  MapPin,
  Calendar,
  Phone,
  Barcode,
  Globe2,
} from 'lucide-react';

interface ReadabilitySectionProps {
  data?: ReadabilityData;
  checks?: CheckItem[];
  onSelectRegion?: (region: ReadabilityRegion) => void;
  selectedOcrId?: number | null;
}

interface DeclarationFinding {
  ruleKey: string;
  label: string;
  icon: React.ReactNode;
  region: ReadabilityRegion;
  status: string;
  isFlagged: boolean;
}

export const ReadabilitySection: React.FC<ReadabilitySectionProps> = ({
  data,
  checks = [],
  onSelectRegion,
  selectedOcrId,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [filter, setFilter] = useState<'ALL' | 'FLAGGED' | 'READABLE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  if (!data || !data.summary) {
    return (
      <div className="bg-white border border-slate-300 rounded-lg p-6 text-center shadow-xs">
        <Eye className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
        <h4 className="text-sm font-bold text-slate-800">Readability & Font Metrics</h4>
        <p className="text-xs text-slate-500 mt-1">Readability analysis is not available for this record.</p>
      </div>
    );
  }

  const { summary, regions } = data;

  // Build OCR ID to Region lookup map
  const regionMap = useMemo(() => {
    const map = new Map<number, ReadabilityRegion>();
    regions.forEach((r) => {
      map.set(r.ocr_id, r);
    });
    return map;
  }, [regions]);

  // Priority statutory declarations order with associated icons and matching rules
  const PRIORITY_DECLARATIONS = useMemo(
    () => [
      {
        key: 'mrp',
        label: 'Maximum Retail Price (MRP)',
        icon: <Tag className="w-3.5 h-3.5 text-slate-600" />,
        matches: ['mrp'],
      },
      {
        key: 'net_quantity',
        label: 'Net Quantity',
        icon: <Scale className="w-3.5 h-3.5 text-slate-600" />,
        matches: ['net quantity', 'quantity'],
      },
      {
        key: 'manufacturer',
        label: 'Manufacturer / Packer',
        icon: <Building2 className="w-3.5 h-3.5 text-slate-600" />,
        matches: ['manufacturer', 'packer', 'importer'],
      },
      {
        key: 'address',
        label: 'Manufacturer Address',
        icon: <MapPin className="w-3.5 h-3.5 text-slate-600" />,
        matches: ['address'],
      },
      {
        key: 'packed_date',
        label: 'Manufacturing / Packing Date',
        icon: <Calendar className="w-3.5 h-3.5 text-slate-600" />,
        matches: ['manufacture / pack date', 'packed_date', 'date'],
      },
      {
        key: 'expiry',
        label: 'Best Before / Expiry Date',
        icon: <Calendar className="w-3.5 h-3.5 text-slate-600" />,
        matches: ['best before', 'expiry', 'use by'],
      },
      {
        key: 'batch',
        label: 'Batch / Lot Number',
        icon: <Barcode className="w-3.5 h-3.5 text-slate-600" />,
        matches: ['batch', 'lot'],
      },
      {
        key: 'consumer_care',
        label: 'Consumer Care Contact',
        icon: <Phone className="w-3.5 h-3.5 text-slate-600" />,
        matches: ['consumer care'],
      },
      {
        key: 'country_of_origin',
        label: 'Country of Origin',
        icon: <Globe2 className="w-3.5 h-3.5 text-slate-600" />,
        matches: ['country of origin', 'origin'],
      },
    ],
    []
  );

  // Extract legibility findings specifically linked to statutory declaration checks
  const declarationFindings: DeclarationFinding[] = useMemo(() => {
    const findings: DeclarationFinding[] = [];
    const usedOcrIds = new Set<number>();

    PRIORITY_DECLARATIONS.forEach((decl) => {
      // Find matching check
      const matchedCheck = checks.find((c) => {
        const name = (c.rule_name || c.field || '').toLowerCase();
        return decl.matches.some((m) => name.includes(m));
      });

      if (matchedCheck && Array.isArray(matchedCheck.evidence) && matchedCheck.evidence.length > 0) {
        // Collect all regions for this check
        const checkRegions: ReadabilityRegion[] = [];
        matchedCheck.evidence.forEach((ev) => {
          if (ev && typeof ev.ocr_id === 'number' && regionMap.has(ev.ocr_id)) {
            checkRegions.push(regionMap.get(ev.ocr_id)!);
          }
        });

        if (checkRegions.length > 0) {
          // Prioritize any flagged region, otherwise first region
          const primaryRegion =
            checkRegions.find((r) => r.readability_status !== 'READABLE') || checkRegions[0];

          usedOcrIds.add(primaryRegion.ocr_id);
          const isFlagged = primaryRegion.readability_status !== 'READABLE';

          findings.push({
            ruleKey: decl.key,
            label: decl.label,
            icon: decl.icon,
            region: primaryRegion,
            status: primaryRegion.readability_status,
            isFlagged,
          });
        }
      }
    });

    // Sort: Attention Required first, then readable
    return findings.sort((a, b) => (a.isFlagged === b.isFlagged ? 0 : a.isFlagged ? -1 : 1));
  }, [checks, regionMap, PRIORITY_DECLARATIONS]);

  // Separate findings into attention required vs compliant
  const attentionRequiredFindings = declarationFindings.filter((f) => f.isFlagged);
  const readableFindings = declarationFindings.filter((f) => !f.isFlagged);

  // Filtered regions for expanded detailed table
  const filteredRegions = regions.filter((r) => {
    if (filter === 'FLAGGED' && r.readability_status === 'READABLE') return false;
    if (filter === 'READABLE' && r.readability_status !== 'READABLE') return false;
    if (searchTerm && !r.text.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'READABLE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" /> READABLE
          </span>
        );
      case 'SMALL TEXT':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-700" /> SMALL TEXT
          </span>
        );
      case 'LOW CONTRAST':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-900 border border-orange-300">
            <AlertCircle className="w-3 h-3 text-orange-700" /> LOW CONTRAST
          </span>
        );
      case 'BLURRY':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-900 border border-rose-300">
            <AlertCircle className="w-3 h-3 text-rose-700" /> BLURRY
          </span>
        );
      case 'LOW OCR CONFIDENCE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-300">
            <Info className="w-3 h-3 text-blue-700" /> LOW CONFIDENCE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-yellow-100 text-yellow-900 border border-yellow-300">
            <AlertTriangle className="w-3 h-3 text-yellow-700" /> REVIEW
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden mb-6">
      {/* 1. Header & Overall Status */}
      <div className="bg-slate-900 text-white px-4 sm:px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Eye className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            Font & Readability Analysis
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                summary.overall_status === 'PASS'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              {summary.overall_status === 'PASS' ? '✓ READABLE' : '⚠ ATTENTION REQUIRED'}
            </span>
          </h3>
        </div>

        {/* Text Regions Analyzed & Quick Stats Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
            <strong className="text-white">{summary.total_regions}</strong> text regions analyzed
          </span>
          <span className="px-2.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 text-[11px]">
            ✓ Readable: <strong>{summary.readable_count}</strong>
          </span>
          {summary.small_text_count > 0 && (
            <span className="px-2.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 text-[11px]">
              ⚠ Small text: <strong>{summary.small_text_count}</strong>
            </span>
          )}
          {summary.low_contrast_count > 0 && (
            <span className="px-2.5 py-0.5 rounded bg-orange-950/60 text-orange-300 border border-orange-800/60 text-[11px]">
              ⚠ Low contrast: <strong>{summary.low_contrast_count}</strong>
            </span>
          )}
          {summary.blurry_count > 0 && (
            <span className="px-2.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/60 text-[11px]">
              ⚠ Blurry: <strong>{summary.blurry_count}</strong>
            </span>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* 2. Statutory Legal Metrology Notice (NOT CALIBRATED) */}
        <div className="bg-amber-50 border-l-4 border-amber-600 rounded-md p-3 text-xs text-amber-950 flex items-start space-x-3 shadow-2xs">
          <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-amber-950 uppercase tracking-wider text-[11px] mb-0.5">
              LEGAL METROLOGY NOTICE — PHYSICAL FONT SIZE: {summary.physical_font_size?.status || 'NOT CALIBRATED'}
            </h4>
            <p className="leading-relaxed text-amber-900 text-[11px]">
              {summary.physical_font_size?.reason ||
                'Photographic pixel coordinates alone cannot establish statutory millimetres without a calibrated physical reference scale. Relative text height and visual contrast metrics are reported for legibility assessment only.'}
            </p>
          </div>
        </div>

        {/* 3. Primary Compact View: Prioritized Statutory Declaration Legibility Findings */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              Statutory Declaration Legibility
            </h4>
            <span className="text-[11px] text-slate-500">
              Showing compliance-relevant declarations linked to visual evidence
            </span>
          </div>

          {/* Attention Required Section (if any statutory declarations have small text or low contrast) */}
          {attentionRequiredFindings.length > 0 && (
            <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-3 space-y-2">
              <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Attention Required ({attentionRequiredFindings.length})
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {attentionRequiredFindings.map((finding) => {
                  const isSelected = selectedOcrId === finding.region.ocr_id;
                  return (
                    <div
                      key={`att-${finding.ruleKey}-${finding.region.ocr_id}`}
                      onClick={() => onSelectRegion && onSelectRegion(finding.region)}
                      className={`p-2.5 rounded border bg-white cursor-pointer transition-all hover:border-amber-500 hover:shadow-xs flex items-start justify-between gap-2 ${
                        isSelected ? 'border-amber-500 ring-1 ring-amber-400 bg-amber-50/40' : 'border-slate-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 flex items-center gap-1">
                            {finding.icon}
                            {finding.label}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            Image {finding.region.image_index + 1} (
                            {finding.region.image_index === 1 ? 'Back' : 'Front'})
                          </span>
                        </div>
                        <p className="font-mono text-[11px] text-slate-700 truncate">
                          &ldquo;{finding.region.text}&rdquo;
                        </p>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2">
                          <span>
                            Rel. height:{' '}
                            <strong className="text-slate-800">{finding.region.height_px} px</strong> (
                            {finding.region.normalized_height_pct}%)
                          </span>
                          <span>&bull;</span>
                          <span>
                            Contrast:{' '}
                            <strong className="text-slate-800">{finding.region.contrast_rating}</strong>
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        {getStatusBadge(finding.status)}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectRegion) onSelectRegion(finding.region);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-600 hover:text-white text-amber-900 text-[10px] font-bold transition-colors border border-amber-300 shadow-2xs"
                          title="Highlight bounding box in Evidence Viewer"
                        >
                          <Crosshair className="w-3 h-3" /> Focus
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Compliant / Readable Declarations */}
          {readableFindings.length > 0 && (
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-2">
              <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Readable Declarations ({readableFindings.length})
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {readableFindings.map((finding) => {
                  const isSelected = selectedOcrId === finding.region.ocr_id;
                  return (
                    <div
                      key={`read-${finding.ruleKey}-${finding.region.ocr_id}`}
                      onClick={() => onSelectRegion && onSelectRegion(finding.region)}
                      className={`p-2 rounded border bg-white cursor-pointer transition-all hover:border-emerald-500 hover:shadow-xs flex items-start justify-between gap-2 ${
                        isSelected ? 'border-emerald-500 ring-1 ring-emerald-400 bg-emerald-50/30' : 'border-slate-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="font-bold text-[11px] text-slate-800 flex items-center gap-1 truncate">
                            {finding.icon}
                            {finding.label}
                          </span>
                        </div>
                        <p className="font-mono text-[10px] text-slate-600 truncate">
                          &ldquo;{finding.region.text}&rdquo;
                        </p>
                        <div className="text-[9.5px] text-slate-500">
                          Image {finding.region.image_index + 1} &bull; {finding.region.height_px} px ({finding.region.normalized_height_pct}%)
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" /> READABLE
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectRegion) onSelectRegion(finding.region);
                          }}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-700 hover:text-white text-slate-600 text-[9.5px] font-bold transition-colors border border-slate-300"
                          title="Highlight bounding box in Evidence Viewer"
                        >
                          <Crosshair className="w-2.5 h-2.5 text-amber-600" /> Focus
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 4. Expandable Detailed Region-Level View Toggle */}
        <div className="pt-1 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors border border-slate-300 shadow-2xs"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 text-slate-600" />
                Hide detailed text regions table
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 text-slate-600" />
                View all {summary.total_regions} text regions analyzed
              </>
            )}
          </button>
          <span className="text-[11px] text-slate-500">
            {isExpanded ? 'Showing complete OCR evidence breakdown' : `${summary.total_regions} underlying bounding boxes preserved`}
          </span>
        </div>

        {/* Expanded Detailed Region-Level View */}
        {isExpanded && (
          <div className="pt-2 space-y-3">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
                <span className="text-slate-500 font-medium block mb-1">Avg Text Height</span>
                <div className="text-lg font-bold text-slate-900 tracking-tight">
                  {summary.average_text_height_px} <span className="text-xs font-normal text-slate-500">px</span>
                </div>
                <span className="text-[10px] text-slate-500">Mean height across regions</span>
              </div>

              <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
                <span className="text-slate-500 font-medium block mb-1">Smallest Detected</span>
                <div className="text-lg font-bold text-amber-700 tracking-tight">
                  {summary.smallest_detected_text_px} <span className="text-xs font-normal text-slate-500">px</span>
                </div>
                <span className="text-[10px] text-slate-500">Minimum line bounding height</span>
              </div>

              <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
                <span className="text-slate-500 font-medium block mb-1">Contrast Issues</span>
                <div className="text-lg font-bold text-slate-900 tracking-tight">
                  {summary.low_contrast_count}
                </div>
                <span className="text-[10px] text-slate-500">Low RMS intensity regions</span>
              </div>

              <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
                <span className="text-slate-500 font-medium block mb-1">Blur / Low Conf</span>
                <div className="text-lg font-bold text-slate-900 tracking-tight">
                  {summary.blurry_count + summary.low_confidence_count}
                </div>
                <span className="text-[10px] text-slate-500">Sub-threshold sharpness</span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilter('ALL')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                    filter === 'ALL'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  All ({regions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('FLAGGED')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                    filter === 'FLAGGED'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  Flagged / Small ({summary.review_count})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('READABLE')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                    filter === 'READABLE'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  Readable ({summary.readable_count})
                </button>
              </div>

              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search text region..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Regions Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-md">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-300">
                  <tr>
                    <th className="py-2 px-3">Region / Text</th>
                    <th className="py-2 px-2.5">Height (px)</th>
                    <th className="py-2 px-2.5">Normalized %</th>
                    <th className="py-2 px-2.5">Contrast</th>
                    <th className="py-2 px-2.5">Sharpness</th>
                    <th className="py-2 px-2.5">Status</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRegions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-500 italic">
                        No text regions match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRegions.map((region) => {
                      const isSelected = selectedOcrId === region.ocr_id;
                      return (
                        <tr
                          key={region.ocr_id}
                          onClick={() => onSelectRegion && onSelectRegion(region)}
                          className={`transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/15 border-l-4 border-l-amber-500'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="py-2 px-3">
                            <div className="font-mono text-slate-900 font-medium line-clamp-1 max-w-xs sm:max-w-md">
                              {region.text || <span className="italic text-slate-400">(unnamed text)</span>}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              OCR ID #{region.ocr_id} &bull; Image {region.image_index + 1} ({region.image_index === 1 ? 'Back' : 'Front'}) &bull; Conf: {(region.confidence * 100).toFixed(0)}%
                            </div>
                          </td>
                          <td className="py-2 px-2.5 font-mono font-bold text-slate-800">
                            {region.height_px} px
                          </td>
                          <td className="py-2 px-2.5 font-mono text-slate-600">
                            {region.normalized_height_pct}%
                          </td>
                          <td className="py-2 px-2.5">
                            <span
                              className={`text-[11px] font-bold ${
                                region.contrast_rating === 'Good'
                                  ? 'text-emerald-700'
                                  : region.contrast_rating === 'Moderate'
                                  ? 'text-amber-700'
                                  : 'text-rose-700'
                              }`}
                            >
                              {region.contrast}{' '}
                              <span className="text-[10px] font-normal text-slate-500">
                                ({region.contrast_rating})
                              </span>
                            </span>
                          </td>
                          <td className="py-2 px-2.5">
                            <span
                              className={`text-[11px] font-bold ${
                                region.sharpness_rating === 'Good'
                                  ? 'text-emerald-700'
                                  : region.sharpness_rating === 'Moderate'
                                  ? 'text-amber-700'
                                  : 'text-rose-700'
                              }`}
                            >
                              {region.sharpness}{' '}
                              <span className="text-[10px] font-normal text-slate-500">
                                ({region.sharpness_rating})
                              </span>
                            </span>
                          </td>
                          <td className="py-2 px-2.5">{getStatusBadge(region.readability_status)}</td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onSelectRegion) onSelectRegion(region);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-amber-600 hover:text-white text-slate-700 text-[10px] font-bold transition-colors border border-slate-300 shadow-2xs"
                              title="Focus bounding box in Evidence Viewer"
                            >
                              <Crosshair className="w-3 h-3 text-amber-600" /> Focus
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
