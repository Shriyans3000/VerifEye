import React from 'react';
import { EvidenceItem } from '../types/api';
import { parseBBox } from '../utils/bbox';

export interface ParsedRegion {
  ocr_id: number;
  text: string;
  confidence: number;
  bbox: number[];
  leftPercent: number;
  topPercent: number;
  widthPercent: number;
  heightPercent: number;
  isSelected: boolean;
  label?: string;
}

interface EvidenceOverlayProps {
  naturalWidth: number;
  naturalHeight: number;
  selectedEvidence: EvidenceItem[];
  allEvidence: EvidenceItem[];
  showAllRegions: boolean;
  selectedRuleName?: string;
  onSelectRegion?: (item: EvidenceItem) => void;
}

export const EvidenceOverlay: React.FC<EvidenceOverlayProps> = ({
  naturalWidth,
  naturalHeight,
  selectedEvidence,
  allEvidence,
  showAllRegions,
  selectedRuleName,
  onSelectRegion,
}) => {
  if (naturalWidth <= 0 || naturalHeight <= 0) {
    return null;
  }

  // Find set of selected OCR IDs for fast lookup
  const selectedOcrIds = new Set(
    selectedEvidence
      .filter((e) => e && typeof e.ocr_id === 'number')
      .map((e) => e.ocr_id)
  );

  // Parse background regions if showAllRegions toggle is ON
  const backgroundRegions: ParsedRegion[] = [];
  if (showAllRegions) {
    for (const item of allEvidence) {
      if (!item || selectedOcrIds.has(item.ocr_id)) continue;
      const parsed = parseBBox(item.bbox, naturalWidth, naturalHeight);
      if (parsed) {
        backgroundRegions.push({
          ...item,
          ...parsed,
          isSelected: false,
        });
      }
    }
  }

  // Parse selected regions
  const activeRegions: ParsedRegion[] = [];
  selectedEvidence.forEach((item) => {
    if (!item) return;
    const parsed = parseBBox(item.bbox, naturalWidth, naturalHeight);
    if (parsed) {
      activeRegions.push({
        ...item,
        ...parsed,
        isSelected: true,
        label: selectedRuleName ? `${selectedRuleName} (Region #${item.ocr_id})` : `Region #${item.ocr_id}`,
      });
    }
  });

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Background OCR regions (subtle) */}
      {backgroundRegions.map((region, idx) => (
        <div
          key={`bg-${region.ocr_id}-${idx}`}
          style={{
            left: `${region.leftPercent}%`,
            top: `${region.topPercent}%`,
            width: `${region.widthPercent}%`,
            height: `${region.heightPercent}%`,
          }}
          className="absolute border border-slate-400/60 bg-slate-500/10 pointer-events-auto cursor-pointer transition-opacity hover:border-slate-600 hover:bg-slate-400/20"
          title={`[OCR Region #${region.ocr_id}] "${region.text}" (${((region.confidence || 0) * 100).toFixed(1)}%)`}
          onClick={() => onSelectRegion?.(region)}
        >
          <span className="absolute -top-3.5 left-0 text-[8px] bg-slate-800 text-slate-200 px-1 py-0.2 rounded font-mono select-none opacity-80">
            #{region.ocr_id}
          </span>
        </div>
      ))}

      {/* Selected Evidence Regions (prominent amber highlight) */}
      {activeRegions.map((region, idx) => (
        <div
          key={`active-${region.ocr_id}-${idx}`}
          style={{
            left: `${region.leftPercent}%`,
            top: `${region.topPercent}%`,
            width: `${region.widthPercent}%`,
            height: `${region.heightPercent}%`,
          }}
          className="absolute border-2 border-amber-500 bg-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.65)] pointer-events-auto transition-all animate-pulse"
        >
          {/* Label tag above box */}
          <div className="absolute -top-5 left-0 z-20 whitespace-nowrap bg-amber-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-md flex items-center space-x-1 select-none">
            <span>#{region.ocr_id}</span>
            {region.label && <span className="text-[9px] font-medium opacity-90">• {region.label}</span>}
          </div>
        </div>
      ))}
    </div>
  );
};
