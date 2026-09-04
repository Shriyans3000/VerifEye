import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Layers, Eye, EyeOff } from 'lucide-react';
import { CheckItem, EvidenceItem } from '../types/api';
import { EvidenceOverlay } from './EvidenceOverlay';
import { EvidencePanel } from './EvidencePanel';

interface EvidenceViewerProps {
  imageFile?: File | null;
  selectedCheck: CheckItem | null;
  selectedCheckIndex: number | null;
  allChecks: CheckItem[];
  showAllRegions: boolean;
  onToggleShowAllRegions: (val: boolean) => void;
  onSelectRegion?: (item: EvidenceItem) => void;
}

export const EvidenceViewer: React.FC<EvidenceViewerProps> = ({
  imageFile,
  selectedCheck,
  selectedCheckIndex,
  allChecks,
  showAllRegions,
  onToggleShowAllRegions,
  onSelectRegion,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Local object URL for the uploaded file with cleanup
  const imageSrc = useMemo(() => {
    if (!imageFile) return null;
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  useEffect(() => {
    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  // Aggregate all unique background OCR evidence items across all checks
  const allEvidenceItems = useMemo(() => {
    const map = new Map<number, EvidenceItem>();
    allChecks.forEach((c) => {
      if (Array.isArray(c.evidence)) {
        c.evidence.forEach((ev) => {
          if (ev && typeof ev.ocr_id === 'number' && !map.has(ev.ocr_id)) {
            map.set(ev.ocr_id, ev);
          }
        });
      }
    });
    return Array.from(map.values());
  }, [allChecks]);

  // Handle image load to extract natural dimensions
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalDimensions({
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
    });
    setImageLoaded(true);
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(2.5, Math.round((prev + 0.25) * 100) / 100));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.5, Math.round((prev - 0.25) * 100) / 100));
  };

  const handleResetZoom = () => {
    setZoom(1);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
      containerRef.current.scrollLeft = 0;
    }
  };

  const handleFitToView = () => {
    if (!containerRef.current || !naturalDimensions.width || !naturalDimensions.height) {
      setZoom(1);
      return;
    }
    const containerWidth = containerRef.current.clientWidth - 32;
    const containerHeight = containerRef.current.clientHeight - 32;
    const scaleX = containerWidth / naturalDimensions.width;
    const scaleY = containerHeight / naturalDimensions.height;
    const fitScale = Math.min(scaleX, scaleY, 1);
    setZoom(Math.max(0.4, Math.round(fitScale * 100) / 100));
  };

  const selectedEvidence = selectedCheck?.evidence || [];
  const selectedRuleName = selectedCheck?.rule_name || selectedCheck?.field;

  return (
    <div id="visual-evidence-viewer" className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
      {/* Top Banner Header */}
      <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Layers className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <h3 className="text-sm font-bold uppercase tracking-wider">
            Evidence-Linked Visual Inspection Viewer
          </h3>
        </div>

        {/* Toolbar: Toggle and Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Show OCR Regions Toggle */}
          <button
            type="button"
            onClick={() => onToggleShowAllRegions(!showAllRegions)}
            className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium border transition ${
              showAllRegions
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
            title="Toggle display of all detected OCR regions"
          >
            {showAllRegions ? (
              <Eye className="h-3.5 w-3.5 mr-1 text-amber-400" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 mr-1 text-slate-400" />
            )}
            <span>Show OCR Regions</span>
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition"
            title="Zoom In (+25%)"
            aria-label="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>

          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition"
            title="Zoom Out (-25%)"
            aria-label="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>

          {/* Zoom Level Indicator & Reset */}
          <button
            type="button"
            onClick={handleResetZoom}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded font-mono text-[11px] transition"
            title="Reset Zoom to 100%"
          >
            <span className="flex items-center">
              <RotateCcw className="h-3 w-3 mr-1" />
              {Math.round(zoom * 100)}%
            </span>
          </button>

          {/* Fit to View */}
          <button
            type="button"
            onClick={handleFitToView}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition"
            title="Fit to View"
            aria-label="Fit to View"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Dual Pane Layout (Desktop: 60/40 Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        {/* Left Column: Image Canvas Viewport */}
        <div className="lg:col-span-7 bg-slate-950 p-4 flex flex-col justify-between min-h-[420px] max-h-[620px]">
          <div
            ref={containerRef}
            className="relative w-full h-full overflow-auto flex items-center justify-center rounded border border-slate-800 bg-slate-900/60 p-2"
          >
            {imageSrc ? (
              /* Transformed rendering container: Both image and overlay scale identically */
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.15s ease-out',
                }}
                className="relative inline-block select-none max-w-full"
              >
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Inspected Package Commodity"
                  onLoad={handleImageLoad}
                  className="max-h-[500px] w-auto object-contain block mx-auto pointer-events-none"
                />

                {imageLoaded && (
                  <EvidenceOverlay
                    naturalWidth={naturalDimensions.width}
                    naturalHeight={naturalDimensions.height}
                    selectedEvidence={selectedEvidence}
                    allEvidence={allEvidenceItems}
                    showAllRegions={showAllRegions}
                    selectedRuleName={selectedRuleName}
                    onSelectRegion={onSelectRegion}
                  />
                )}
              </div>
            ) : (
              <div className="text-center text-slate-500 py-16">
                <p className="text-xs">No package label image available.</p>
              </div>
            )}
          </div>

          {/* Canvas Bottom Legend */}
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <span className="h-2.5 w-2.5 rounded-xs border-2 border-amber-500 bg-amber-500/30 mr-1.5 inline-block animate-pulse"></span>
                Selected Evidence
              </span>
              {showAllRegions && (
                <span className="flex items-center">
                  <span className="h-2.5 w-2.5 rounded-xs border border-slate-400/80 bg-slate-500/20 mr-1.5 inline-block"></span>
                  Background OCR
                </span>
              )}
            </div>

            {naturalDimensions.width > 0 && (
              <span className="font-mono text-[10px] text-slate-500">
                Resolution: {naturalDimensions.width} × {naturalDimensions.height} px
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Selected Check Evidence Details */}
        <div className="lg:col-span-5 p-4 bg-slate-50/50 flex flex-col justify-between">
          <EvidencePanel
            selectedCheck={selectedCheck}
            selectedCheckIndex={selectedCheckIndex}
          />
        </div>
      </div>
    </div>
  );
};
