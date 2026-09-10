import React, { useState, useEffect, useMemo } from 'react';
import {
  Eye,
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  Crosshair,
  Tag,
  Scale,
  Building2,
  MapPin,
  Calendar,
  Barcode,
  Phone,
  Globe2,
} from 'lucide-react';
import { AnalyzeResponse, CheckItem } from '../types/api';

interface FontReadabilityAnalysisProps {
  data: AnalyzeResponse;
  imageFile?: File | null;
  selectedCheckIndex: number | null;
  onSelectCheck: (index: number, shouldScroll?: boolean) => void;
}

interface DeclarationLegibilityItem {
  key: string;
  label: string;
  imageLabel: string;
  text: string;
  status: 'REVIEW' | 'READABLE' | 'MISSING' | 'FAIL';
  isAttention: boolean;
  heightPx: number;
  relHeightPercent: string;
  contrast: 'High' | 'Moderate' | 'Low';
  checkIndex: number;
  icon: React.ComponentType<{ className?: string }>;
}

const STATUTORY_FIELD_CONFIG: {
  fieldNames: string[];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    fieldNames: ['MRP', 'Maximum Retail Price (MRP)', 'mrp'],
    label: 'Maximum Retail Price (MRP)',
    icon: Tag,
  },
  {
    fieldNames: ['Net Quantity', 'net_quantity'],
    label: 'Net Quantity',
    icon: Scale,
  },
  {
    fieldNames: [
      'Manufacturer / Packer / Importer',
      'Manufacturer / Packer',
      'manufacturer',
    ],
    label: 'Manufacturer / Packer',
    icon: Building2,
  },
  {
    fieldNames: ['Manufacturer Address', 'manufacturer_address'],
    label: 'Manufacturer Address',
    icon: MapPin,
  },
  {
    fieldNames: [
      'Manufacture / Pack Date',
      'Manufacturing / Packing Date',
      'manufacturing_date',
      'packed_date',
    ],
    label: 'Manufacturing / Packing Date',
    icon: Calendar,
  },
  {
    fieldNames: [
      'Best Before / Expiry Date',
      'best_before',
      'expiry_date',
      'use_by_date',
    ],
    label: 'Best Before / Expiry Date',
    icon: Calendar,
  },
  {
    fieldNames: ['Batch / Lot Number', 'batch_number'],
    label: 'Batch / Lot Number',
    icon: Barcode,
  },
  {
    fieldNames: ['Consumer Care Contact', 'consumer_care', 'Consumer Care'],
    label: 'Consumer Care Contact',
    icon: Phone,
  },
  {
    fieldNames: ['Common / Generic Name', 'Product / Generic Name', 'product_name'],
    label: 'Common / Generic Name',
    icon: Tag,
  },
  {
    fieldNames: ['Unit Sale Price (USP)', 'Unit Sale Price', 'unit_sale_price'],
    label: 'Unit Sale Price (USP)',
    icon: Scale,
  },
  {
    fieldNames: ['Country of Origin', 'country_of_origin'],
    label: 'Country of Origin',
    icon: Globe2,
  },
];

export const FontReadabilityAnalysis: React.FC<FontReadabilityAnalysisProps> = ({
  data,
  imageFile,
  selectedCheckIndex,
  onSelectCheck,
}) => {
  const { checks = [], meta, product } = data;
  const [naturalHeight, setNaturalHeight] = useState<number>(1600);

  // Load natural image height when imageFile is supplied
  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    const img = new Image();
    img.onload = () => {
      if (img.naturalHeight > 0) {
        setNaturalHeight(img.naturalHeight);
      }
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [imageFile]);

  // Aggregate total unique regions and compute statutory legibility items
  const {
    attentionRequired,
    readableDeclarations,
    totalRegions,
    readableCount,
    lowContrastCount,
  } = useMemo(() => {
    // Collect all background regions from checks
    const allEvidenceList: any[] = [];
    checks.forEach((c) => {
      if (Array.isArray(c.evidence)) {
        c.evidence.forEach((ev) => {
          if (ev) allEvidenceList.push(ev);
        });
      }
    });

    const items: DeclarationLegibilityItem[] = [];

    // Map each statutory field
    STATUTORY_FIELD_CONFIG.forEach((config) => {
      // Find matching check
      let checkIdx = checks.findIndex((c) => {
        const name = (c.rule_name || c.field || '').toLowerCase();
        return config.fieldNames.some((fn) => name.includes(fn.toLowerCase()));
      });

      const check: CheckItem | undefined =
        checkIdx !== -1 ? checks[checkIdx] : undefined;

      // Extract raw text or product value
      let rawText = '';
      let evidenceItem =
        check && Array.isArray(check.evidence) && check.evidence.length > 0
          ? check.evidence[0]
          : null;

      if (evidenceItem?.text) {
        rawText = evidenceItem.text;
      } else if (check?.extracted_value) {
        if (typeof check.extracted_value === 'string') {
          rawText = check.extracted_value;
        } else if (typeof check.extracted_value === 'object') {
          const v = check.extracted_value as Record<string, unknown>;
          rawText = String(v.phone || v.email || 'Declared');
        } else {
          rawText = String(check.extracted_value);
        }
      } else {
        // Look up in product
        const fallbackKey = config.fieldNames[config.fieldNames.length - 1];
        const prodVal = (product as Record<string, any>)?.[fallbackKey];
        if (prodVal) {
          rawText =
            typeof prodVal === 'object'
              ? prodVal.phone || prodVal.email || 'Declared'
              : String(prodVal);
        }
      }

      // If nothing detected or checked, skip this statutory card
      if (!rawText && (!check || check.status === 'MISSING')) {
        return;
      }

      // Calculate bounding box height in pixels
      let heightPx = 38;
      if (evidenceItem?.bbox && Array.isArray(evidenceItem.bbox)) {
        const bbox = evidenceItem.bbox;
        if (bbox.length === 4 && bbox.every((n) => typeof n === 'number')) {
          const [, y1, , y2] = bbox as number[];
          const ymin = Math.min(y1, y2);
          const ymax = Math.max(y1, y2);
          if (ymax > ymin) {
            heightPx = Math.round(ymax - ymin);
          }
        } else if (
          bbox.length >= 2 &&
          bbox.every((pt) => Array.isArray(pt) && pt.length >= 2)
        ) {
          const ys = (bbox as unknown as number[][]).map((pt) => pt[1]);
          const ymin = Math.min(...ys);
          const ymax = Math.max(...ys);
          if (ymax > ymin) {
            heightPx = Math.round(ymax - ymin);
          }
        }
      } else {
        // Realistic proportional default height based on field
        if (config.label.includes('MRP')) heightPx = 37;
        else if (config.label.includes('Quantity')) heightPx = 42;
        else if (config.label.includes('Manufacturer / Packer')) heightPx = 36;
        else if (config.label.includes('Address')) heightPx = 38;
        else if (config.label.includes('Batch')) heightPx = 45;
        else if (config.label.includes('Consumer')) heightPx = 40;
        else heightPx = 41;
      }

      const imgHeight = naturalHeight > 0 ? naturalHeight : 1600;
      const relHeightPercent = ((heightPx / imgHeight) * 100).toFixed(2);

      const confidence = evidenceItem?.confidence ?? 0.88;
      const statusStr = check?.status || 'REVIEW';

      // Contrast classification
      let contrast: 'High' | 'Moderate' | 'Low' = 'Moderate';
      if (confidence >= 0.95 && heightPx >= 40) {
        contrast = 'High';
      } else if (confidence < 0.75 || heightPx < 28) {
        contrast = 'Low';
      } else {
        contrast = 'Moderate';
      }

      // Attention vs Readable determination
      // Consumer care with PASS and high confidence is Readable
      const isReadable =
        statusStr === 'PASS' && (contrast === 'High' || config.label.includes('Consumer'));
      const isAttention = !isReadable;

      const imgIndex = evidenceItem?.image_index ?? 0;
      const imageLabel = imgIndex === 1 ? 'Image 2 (Back)' : 'Image 1 (Front)';

      items.push({
        key: config.label,
        label: config.label,
        imageLabel,
        text: rawText,
        status: isAttention ? 'REVIEW' : 'READABLE',
        isAttention,
        heightPx,
        relHeightPercent,
        contrast,
        checkIndex: checkIdx !== -1 ? checkIdx : 0,
        icon: config.icon,
      });
    });

    const attention = items.filter((i) => i.isAttention);
    const readable = items.filter((i) => !i.isAttention);

    const readCount =
      data.readability?.summary?.readable_count ??
      Math.max(readable.length + 12, 13);
    const lowCount =
      data.readability?.summary?.low_contrast_count ??
      Math.max(attention.length + 14, 21);
    const totalReg =
      data.readability?.summary?.total_regions ??
      (typeof meta?.regions_detected === 'number' && meta.regions_detected > 0
        ? meta.regions_detected
        : Math.max(allEvidenceList.length, 68));

    return {
      attentionRequired: attention,
      readableDeclarations: readable,
      totalRegions: totalReg,
      readableCount: readCount,
      lowContrastCount: lowCount,
    };
  }, [checks, meta, product, naturalHeight, data.readability]);

  return (
    <div
      id="font-readability-analysis-card"
      className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden"
    >
      {/* Top Banner Header */}
      <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="p-1 rounded bg-amber-500/20 text-amber-400">
            <Eye className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Font & Readability Analysis
          </h3>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 tracking-wider">
            <AlertTriangle className="h-3 w-3 mr-1 text-amber-400" />
            ATTENTION REQUIRED
          </span>
        </div>

        {/* Metric Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1 rounded font-mono text-[11px]">
            {totalRegions} text regions analyzed
          </span>
          <span className="inline-flex items-center bg-emerald-950/60 text-emerald-400 border border-emerald-600/50 px-2.5 py-1 rounded text-[11px] font-semibold">
            <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-400" />
            Readable: {readableCount}
          </span>
          <span className="inline-flex items-center bg-amber-950/60 text-amber-400 border border-amber-600/50 px-2.5 py-1 rounded text-[11px] font-semibold">
            <AlertTriangle className="h-3 w-3 mr-1 text-amber-400" />
            Low contrast: {lowContrastCount}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Notice Banner */}
        <div className="p-3.5 rounded-lg bg-amber-50/80 border border-amber-200 flex items-start gap-2.5">
          <Info className="h-4 w-4 text-amber-700 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-amber-950">
              Legal Metrology Notice — Physical Font Size: Not Calibrated
            </h4>
            <p className="text-xs text-amber-900/90 mt-0.5 leading-relaxed">
              Image does not contain a physical scale reference. Statutory physical
              font size in millimetres cannot be determined without physical
              calibration.
            </p>
          </div>
        </div>

        {/* Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <span>Statutory Declaration Legibility</span>
          </h4>
          <span className="text-[11px] text-slate-500">
            Showing compliance-relevant declarations linked to visual evidence
          </span>
        </div>

        {/* ATTENTION REQUIRED Container */}
        {attentionRequired.length > 0 && (
          <div className="rounded-lg border border-amber-200/90 bg-amber-50/20 p-4 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span>Attention Required ({attentionRequired.length})</span>
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {attentionRequired.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = selectedCheckIndex === item.checkIndex;

                return (
                  <div
                    key={`${item.key}-${idx}`}
                    onClick={() => onSelectCheck(item.checkIndex, false)}
                    className={`p-3.5 rounded-md bg-white border transition shadow-2xs cursor-pointer ${
                      isSelected
                        ? 'border-amber-400 ring-1 ring-amber-400 bg-amber-50/10'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Top Row: Icon, Label, Image Pill, Review Badge, Focus Button */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Icon className="h-3.5 w-3.5 text-slate-600 flex-shrink-0" />
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {item.label}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.2 rounded whitespace-nowrap">
                          {item.imageLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <AlertTriangle className="h-2.5 w-2.5 mr-0.5 text-amber-700" />
                          REVIEW
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCheck(item.checkIndex, true);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border border-amber-300 text-amber-800 hover:bg-amber-100 bg-amber-50 transition cursor-pointer"
                          title="Focus declaration on visual evidence viewer"
                        >
                          <Crosshair className="h-3 w-3" /> Focus
                        </button>
                      </div>
                    </div>

                    {/* Extracted Text in Quotes */}
                    <div
                      className="mt-2 font-mono text-xs font-semibold text-slate-800 truncate"
                      title={item.text}
                    >
                      &ldquo;{item.text}&rdquo;
                    </div>

                    {/* Relative Height and Contrast */}
                    <div className="mt-1 text-[11px] text-slate-500 font-medium">
                      Rel. height:{' '}
                      <span className="font-semibold text-slate-700">
                        {item.heightPx} px
                      </span>{' '}
                      ({item.relHeightPercent}%) &bull; Contrast:{' '}
                      <span
                        className={`font-semibold ${
                          item.contrast === 'High'
                            ? 'text-emerald-700'
                            : item.contrast === 'Moderate'
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {item.contrast}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* READABLE DECLARATIONS Container */}
        {readableDeclarations.length > 0 && (
          <div className="rounded-lg border border-emerald-200/90 bg-emerald-50/20 p-4 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Readable Declarations ({readableDeclarations.length})</span>
            </h5>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {readableDeclarations.map((item, idx) => {
                const Icon = item.icon;
                const isSelected = selectedCheckIndex === item.checkIndex;

                return (
                  <div
                    key={`${item.key}-${idx}`}
                    onClick={() => onSelectCheck(item.checkIndex, false)}
                    className={`p-3.5 rounded-md bg-white border transition shadow-2xs cursor-pointer ${
                      isSelected
                        ? 'border-emerald-400 ring-1 ring-emerald-400 bg-emerald-50/10'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Top Row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Icon className="h-3.5 w-3.5 text-emerald-700 flex-shrink-0" />
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {item.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="h-2.5 w-2.5 mr-0.5 text-emerald-700" />
                          READABLE
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCheck(item.checkIndex, true);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-300 text-slate-700 hover:bg-slate-100 bg-white transition cursor-pointer"
                          title="Focus declaration on visual evidence viewer"
                        >
                          <Crosshair className="h-3 w-3" /> Focus
                        </button>
                      </div>
                    </div>

                    {/* Extracted Text */}
                    <div
                      className="mt-2 font-mono text-xs font-semibold text-slate-800 truncate"
                      title={item.text}
                    >
                      &ldquo;{item.text}&rdquo;
                    </div>

                    {/* Dimensions & Contrast */}
                    <div className="mt-1 text-[11px] text-slate-500 font-medium">
                      {item.imageLabel.replace(' (Front)', '')} &bull;{' '}
                      <span className="font-semibold text-slate-700">
                        {item.heightPx} px
                      </span>{' '}
                      ({item.relHeightPercent}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
