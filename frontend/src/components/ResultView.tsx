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
  ShieldCheck,
  Eye,
  FileText,
  AlertOctagon,
  Ban,
  Info,
  FlaskConical,
  BookOpen,
  FolderPlus,
  Activity,
  Flame,
  HeartPulse,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnalyzeResponse, CheckItem, ValidationItem, EvidenceItem } from '../types/api';
import { EvidenceViewer } from './EvidenceViewer';
import { FontReadabilityAnalysis } from './FontReadabilityAnalysis';
import { InspectionReportModal } from './InspectionReportModal';
import { AddToRepositoryModal } from './AddToRepositoryModal';

interface ResultViewProps {
  data: AnalyzeResponse;
  imageFile?: File | null;
}

export const ResultView: React.FC<ResultViewProps> = ({ data, imageFile }) => {
  const { status, compliance_score, summary, product, checks = [], validation_checks = [] } = data;
  const preservativeAnalysis = data.preservative_analysis;
  const nutritionAnalysis = data.nutrition_analysis;

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
  const [isAddToRepoModalOpen, setIsAddToRepoModalOpen] = useState<boolean>(false);

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

  const getCodexId = (name?: string | null, ins?: string | null): string => {
    const insLower = String(ins || '').toLowerCase();
    const nameLower = String(name || '').toLowerCase();

    if (insLower.includes('924') || nameLower.includes('bromate')) return 'potassium-bromate';
    if (insLower.includes('917') || nameLower.includes('iodate')) return 'potassium-iodate';
    if (insLower.includes('443') || nameLower.includes('brominated') || nameLower.includes('bvo')) return 'brominated-vegetable-oil';
    if (nameLower.includes('formal') || nameLower.includes('formalin')) return 'formaldehyde-formalin';
    if (insLower.includes('284') || insLower.includes('285') || nameLower.includes('boric') || nameLower.includes('borax')) return 'boric-acid-borax';
    if (insLower.includes('319') || nameLower.includes('tbhq')) return 'tbhq';
    if (insLower.includes('216') || insLower.includes('217') || nameLower.includes('propylparaben')) return 'propylparaben';
    if (insLower.includes('218') || insLower.includes('219') || nameLower.includes('methylparaben')) return 'propylparaben';
    if (insLower.includes('320') || insLower.includes('321') || nameLower.includes('bha') || nameLower.includes('bht')) return 'bha-bht';
    if (insLower.includes('211') || insLower.includes('210') || nameLower.includes('benzoate') || nameLower.includes('benzoic')) return 'sodium-benzoate';
    if (insLower.includes('220') || insLower.includes('223') || insLower.includes('224') || nameLower.includes('sulph') || nameLower.includes('sulf')) return 'sulphur-dioxide-sulphites';
    if (insLower.includes('250') || insLower.includes('251') || nameLower.includes('nitrite') || nameLower.includes('nitrate')) return 'sodium-nitrite-nitrate';
    if (insLower.includes('202') || insLower.includes('200') || nameLower.includes('sorbate') || nameLower.includes('sorbic')) return 'potassium-sorbate';
    if (insLower.includes('282') || insLower.includes('280') || nameLower.includes('propionate') || nameLower.includes('propionic')) return 'calcium-propionate';
    if (insLower.includes('234') || nameLower.includes('nisin')) return 'nisin';
    if (insLower.includes('330') || nameLower.includes('citric')) return 'citric-acid';
    if (insLower.includes('170') || nameLower.includes('calcium carbonate')) return 'calcium-carbonate';
    if (insLower.includes('627') || nameLower.includes('guanylate')) return 'disodium-guanylate';
    if (insLower.includes('631') || nameLower.includes('inosinate')) return 'disodium-inosinate';
    if (insLower.includes('160') || nameLower.includes('paprika')) return 'paprika-oleoresin';
    if (insLower.includes('621') || nameLower.includes('msg') || nameLower.includes('glutamate')) return 'monosodium-glutamate';
    if (insLower.includes('322') || nameLower.includes('lecithin')) return 'lecithin';
    if (insLower.includes('500') || nameLower.includes('baking soda')) return 'sodium-bicarbonate';
    if (insLower.includes('503') || nameLower.includes('ammonium')) return 'ammonium-bicarbonate';

    return 'all';
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

        {/* Summary Numbers with Animated SVG Score Gauge Ring & Report Button */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full md:w-auto">
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 w-full sm:w-auto text-center items-center">
            {/* Animated Dynamic Circular Gauge Ring */}
            <div className="bg-white/90 border border-slate-300 rounded px-3 py-1.5 shadow-2xs flex items-center space-x-2">
              <div className="relative w-9 h-9 flex items-center justify-center flex-shrink-0">
                <svg className="w-9 h-9 transform -rotate-90">
                  <circle cx="18" cy="18" r="14" stroke="currentColor" strokeWidth="3" className="text-slate-200" fill="transparent" />
                  <circle 
                    cx="18" cy="18" r="14" 
                    stroke="currentColor" 
                    strokeWidth="3.5" 
                    className={`score-circle-ring ${compliance_score >= 80 ? 'text-emerald-600' : compliance_score >= 50 ? 'text-amber-500' : 'text-rose-600'}`} 
                    fill="transparent" 
                    strokeDasharray={88}
                    strokeDashoffset={88 - (88 * (compliance_score || 0)) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-[10px] font-black text-slate-900 font-mono">
                  {compliance_score}
                </span>
              </div>
              <div className="text-left">
                <span className="text-[9px] uppercase font-bold text-slate-400 block leading-none">Score</span>
                <span className="text-xs font-black text-slate-900 font-mono">{compliance_score}%</span>
              </div>
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
            <a
              href="#preservative-safety-analysis-card"
              className={`rounded px-2.5 py-1.5 shadow-2xs transition block border ${
                preservativeAnalysis?.has_banned_preservative
                  ? 'bg-rose-100 border-rose-400 text-rose-800 hover:bg-rose-200 animate-pulse'
                  : preservativeAnalysis?.has_limit_exceeded
                  ? 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
                  : (preservativeAnalysis?.preservatives_found?.length || 0) > 0
                  ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
              }`}
            >
              <span className="text-[10px] uppercase font-bold block opacity-75">Additives</span>
              <span className="text-xs font-black block">
                {preservativeAnalysis?.has_banned_preservative
                  ? '🚨 BANNED'
                  : preservativeAnalysis?.has_limit_exceeded
                  ? 'OVER LIMIT'
                  : (preservativeAnalysis?.preservatives_found?.length || 0) > 0
                  ? `${preservativeAnalysis?.preservatives_found?.length} Found`
                  : 'Clean Label'}
              </span>
            </a>
            <a
              href="#fssai-nutrition-warnings-card"
              className={`rounded px-2.5 py-1.5 shadow-2xs transition block border ${
                nutritionAnalysis?.has_warning
                  ? 'bg-rose-100 border-rose-400 text-rose-800 hover:bg-rose-200 animate-pulse'
                  : nutritionAnalysis?.indicators_list?.every((i) => i.status === 'REVIEW')
                  ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
              }`}
            >
              <span className="text-[10px] uppercase font-bold block opacity-75">FSSAI FOP</span>
              <span className="text-xs font-black block truncate max-w-[85px]">
                {nutritionAnalysis?.has_warning
                  ? `🚨 ${nutritionAnalysis.warnings[0]}`
                  : nutritionAnalysis?.indicators_list?.every((i) => i.status === 'REVIEW')
                  ? 'HFSS Review'
                  : 'FOPNL Safe'}
              </span>
            </a>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              id="add-to-repository-btn"
              onClick={() => setIsAddToRepoModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-3.5 py-2.5 bg-indigo-900 hover:bg-indigo-800 text-indigo-100 rounded text-xs font-bold shadow transition border border-indigo-700 whitespace-nowrap cursor-pointer"
            >
              <FolderPlus className="h-4 w-4 mr-1.5 text-indigo-300 flex-shrink-0" />
              <span>Add to Repository</span>
            </button>

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
      </div>

      {/* Prominent Evidence-Linked Inspection Viewer */}
      <EvidenceViewer
        imageFile={imageFile}
        imageUrl={
          data.image_urls && data.image_urls.length > 0
            ? data.image_urls[0]
            : data.image_file_ids && data.image_file_ids.length > 0
            ? `/api/images/${data.image_file_ids[0]}`
            : '/samples/test_label.jpeg'
        }
        selectedCheck={selectedCheck}
        selectedCheckIndex={selectedCheckIndex}
        allChecks={checks}
        showAllRegions={showAllRegions}
        onToggleShowAllRegions={setShowAllRegions}
        onSelectRegion={handleSelectRegionFromCanvas}
      />

      {/* Font & Readability Analysis (Statutory Declaration Legibility) */}
      <FontReadabilityAnalysis
        data={data}
        imageFile={imageFile}
        selectedCheckIndex={selectedCheckIndex}
        onSelectCheck={handleSelectCheck}
      />

      {/* Preservative safety analysis (High Priority Audit) */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden" id="preservative-safety-analysis-card">
        <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wider flex items-center space-x-2">
            {preservativeAnalysis?.has_banned_preservative ? (
              <Ban className="h-4 w-4 text-rose-500 animate-pulse" />
            ) : preservativeAnalysis?.has_limit_exceeded ? (
              <AlertOctagon className="h-4 w-4 text-rose-400" />
            ) : preservativeAnalysis?.preservatives_found && preservativeAnalysis.preservatives_found.length > 0 ? (
              <ShieldAlert className="h-4 w-4 text-amber-500" />
            ) : (
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            )}
            <span>Preservatives & Chemical Additives Audit (FSSAI)</span>
          </h3>
          <div className="flex items-center space-x-3 text-xs">
            <Link
              to="/preservatives"
              className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 hover:underline bg-slate-800 px-2.5 py-1 rounded border border-amber-500/40 text-[11px]"
            >
              <FlaskConical className="h-3.5 w-3.5" />
              <span>Full Preservative Codex →</span>
            </Link>
            <span className="text-slate-400 font-mono text-[11px]">
              {preservativeAnalysis?.food_category || product?.food_category || 'General Packaged Food'}
            </span>
          </div>
        </div>

        {/* Global Critical Alert Banners */}
        {preservativeAnalysis?.has_banned_preservative && (
          <div className="bg-rose-600 text-white p-4 border-b border-rose-700 flex items-start space-x-3">
            <Ban className="h-5 w-5 text-white flex-shrink-0 mt-0.5 animate-bounce" />
            <div>
              <h4 className="font-black text-sm uppercase tracking-wide">
                CRITICAL STATUTORY ALERT: Banned Food Substance Detected
              </h4>
              <p className="text-xs text-rose-100 mt-0.5 leading-relaxed">
                {preservativeAnalysis.critical_alert || 'A prohibited chemical additive was detected in this package. Sale or manufacture is illegal under FSSAI regulations.'}
              </p>
            </div>
          </div>
        )}

        {!preservativeAnalysis?.has_banned_preservative && preservativeAnalysis?.has_limit_exceeded && (
          <div className="bg-rose-500 text-white p-3.5 border-b border-rose-600 flex items-start space-x-2.5">
            <AlertOctagon className="h-5 w-5 text-white flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wide">
                FSSAI Maximum Permissible Limit Exceeded
              </h4>
              <p className="text-xs text-rose-100 mt-0.5">
                {preservativeAnalysis.critical_alert || 'One or more declared preservatives exceed statutory category limits established by FSSAI.'}
              </p>
            </div>
          </div>
        )}

        <div className="p-4 space-y-4">
          {preservativeAnalysis?.preservatives_found && preservativeAnalysis.preservatives_found.length > 0 ? (
            preservativeAnalysis.preservatives_found.map((item, index) => {
              const isBanned = item.is_banned_in_india || item.status === 'BANNED_SUBSTANCE';
              const exceeded = item.status === 'LIMIT_EXCEEDED';
              const flagged = item.risk_flag;

              return (
                <div
                  key={`${item.name || 'preservative'}-${index}`}
                  className={`border-l-4 p-4 rounded-r shadow-xs ${
                    isBanned
                      ? 'border-rose-700 bg-rose-50/90'
                      : exceeded
                      ? 'border-rose-600 bg-rose-50/70'
                      : flagged
                      ? 'border-amber-500 bg-amber-50/70'
                      : 'border-emerald-600 bg-emerald-50/70'
                  }`}
                >
                  {/* Top Bar: Name, INS, and Status Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-slate-900 text-sm">{item.name || 'Unidentified preservative'}</span>
                      {item.ins_number && (
                        <span className="text-xs text-slate-800 font-mono bg-white px-2 py-0.5 rounded border border-slate-300 font-bold shadow-2xs">
                          INS {item.ins_number}
                        </span>
                      )}
                    </div>
                    <div>
                      {isBanned ? (
                        <span className="bg-rose-700 text-white font-extrabold px-2.5 py-1 rounded text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-xs animate-pulse">
                          <Ban className="h-3 w-3" /> PROHIBITED / BANNED IN INDIA
                        </span>
                      ) : exceeded ? (
                        <span className="bg-rose-600 text-white font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                          LIMIT EXCEEDED
                        </span>
                      ) : flagged ? (
                        <span className="bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                          FLAGGED FOR REVIEW
                        </span>
                      ) : (
                        <span className="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                          WITHIN FSSAI LIMIT
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Brief Explanation Callout Box */}
                  <div className="mt-2.5 p-2.5 bg-white/90 rounded-md border border-slate-200 text-xs shadow-2xs">
                    <span className="font-black text-amber-950 uppercase text-[10px] tracking-wider flex items-center gap-1.5 mb-0.5">
                      <FlaskConical className="h-3.5 w-3.5 text-amber-600" />
                      Brief Explanation & Functional Purpose:
                    </span>
                    <p className="text-slate-800 leading-relaxed text-xs">
                      {item.description || item.reason}
                    </p>
                  </div>

                  {/* FSSAI Statutory Limit & Declared Quantity Comparison */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-slate-200/70 text-xs">
                    <div className="bg-white/80 p-2 rounded border border-slate-200">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Declared on Label:</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {item.amount_mg_per_kg == null
                          ? 'Not explicitly declared on package'
                          : `${item.amount_mg_per_kg} mg/kg (ppm)`}
                      </span>
                    </div>
                    <div className="bg-white/80 p-2 rounded border border-slate-200">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">FSSAI Permissible Limit:</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">
                        {isBanned
                          ? '0 mg/kg (COMPLETELY BANNED / PROHIBITED)'
                          : item.fssai_limit_mg_per_kg == null
                          ? (item.status === 'WITHIN_LIMIT' ? 'GMP (Good Manufacturing Practice) — Permitted' : 'Category schedule not established')
                          : `${item.fssai_limit_mg_per_kg} mg/kg (ppm)`}
                      </span>
                    </div>
                  </div>

                  {/* Global Bans & Countries Where Prohibited */}
                  {item.banned_countries && item.banned_countries.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/70">
                      <span className="text-[10.5px] font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                        <Globe2 className="h-3.5 w-3.5 text-rose-700" />
                        Countries Where Banned or Strictly Prohibited:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {item.banned_countries.map((country, cIdx) => (
                          <span
                            key={cIdx}
                            className="bg-rose-100 text-rose-950 border border-rose-300 rounded px-2 py-0.5 text-[11px] font-semibold flex items-center gap-1 shadow-2xs"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-600 inline-block"></span>
                            {country}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Health & Toxicology Notice */}
                  {item.health_concerns && (
                    <div className="mt-2.5 p-2 bg-amber-50/90 rounded border border-amber-200 text-xs text-slate-800">
                      <span className="font-bold text-amber-900 flex items-center gap-1 mb-0.5 text-[11px]">
                        <Info className="h-3 w-3 text-amber-700" /> Health & Toxicological Profile:
                      </span>
                      <p className="text-[11px] text-slate-700 leading-snug">
                        {item.health_concerns}
                      </p>
                    </div>
                  )}

                  {/* Redirect to Specific Codex Entry Button */}
                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-600 font-medium">
                      Need statutory regulation, global bans, or clean alternatives?
                    </span>
                    <Link
                      to={`/preservatives?id=${getCodexId(item.name, item.ins_number)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-amber-300 font-bold text-xs shadow-2xs border border-amber-500/40 transition cursor-pointer"
                    >
                      <BookOpen className="h-3.5 w-3.5 text-amber-400" />
                      <span>Learn More in Preservatives Codex →</span>
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="border-l-4 border-emerald-500 bg-emerald-50/80 p-4 rounded-r space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-700 flex-shrink-0" />
                <span className="font-bold text-emerald-900 text-sm">No Synthetic Preservatives Declared</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 ml-auto">
                  Clean Label / Safe
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ingredients declaration was audited against FSSAI reference additives (Class II chemical preservatives: Benzoates, Sorbates, Sulphites, Nitrites) and banned substances (Potassium Bromate, Borax, Formaldehyde, BVO). No added chemical preservatives were detected in the OCR declarations.
              </p>
              <div className="pt-2 border-t border-emerald-200/80 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-emerald-900 font-medium">
                  Want to verify which chemicals are banned or restricted under FSSAI regulations?
                </span>
                <Link
                  to="/preservatives"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-2xs transition cursor-pointer"
                >
                  <BookOpen className="h-3.5 w-3.5 text-emerald-200" />
                  <span>Browse Full Preservatives Codex →</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FSSAI Front-of-Pack Nutrition Warnings Audit (HFSS: High Fat, Sugar, Salt) */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden" id="fssai-nutrition-warnings-card">
        <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wider flex items-center space-x-2">
            <Activity className="h-4 w-4 text-amber-500" />
            <span>FSSAI Front-of-Pack Nutrition Warnings (HFSS Audit)</span>
          </h3>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-mono text-[11px]">
              FSSAI FOPNL • Basis: {nutritionAnalysis?.basis_unit || '100g'}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                nutritionAnalysis?.has_warning
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : nutritionAnalysis?.indicators_list?.every((i) => i.status === 'REVIEW')
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
            >
              {nutritionAnalysis?.has_warning
                ? `${nutritionAnalysis.warnings_count} Warning(s) Mandated`
                : nutritionAnalysis?.indicators_list?.every((i) => i.status === 'REVIEW')
                ? 'Review Mandated'
                : 'Compliant Profile'}
            </span>
          </div>
        </div>

        {/* Warning Banner if applicable */}
        {nutritionAnalysis?.has_warning && (
          <div className="bg-rose-600 text-white p-4 border-b border-rose-700 flex items-start space-x-3">
            <AlertOctagon className="h-5 w-5 text-white flex-shrink-0 mt-0.5 animate-bounce" />
            <div>
              <h4 className="font-black text-sm uppercase tracking-wide">
                STATUTORY ALERT: FRONT-OF-PACK NUTRITION WARNING REQUIRED ({nutritionAnalysis.warnings.join(' • ')})
              </h4>
              <p className="text-xs text-rose-100 mt-0.5 leading-relaxed">
                This product exceeds statutory front-of-pack nutrient thresholds under FSSAI Front-of-Pack Labelling regulations. A high-visibility cautionary warning label must be displayed on the principal display panel.
              </p>
            </div>
          </div>
        )}

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* FAT INDICATOR CARD */}
            {(() => {
              const ind = nutritionAnalysis?.indicators?.fat || {
                id: 'indicator_fat',
                name: 'Fat Content',
                warning_title: 'HIGH FAT',
                status: 'REVIEW',
                warning_triggered: false,
                declared_value: 'Not detected in OCR',
                threshold: 'Total Fat > 15g or Sat Fat > 4g per 100g',
                reason: 'Nutrition declaration not detected on label to determine fat status.',
              };
              const isHigh = ind.status === 'HIGH' || ind.warning_triggered;
              const isReview = ind.status === 'REVIEW';

              return (
                <div
                  className={`rounded-lg border p-3.5 space-y-2 transition shadow-xs flex flex-col justify-between ${
                    isHigh
                      ? 'border-rose-300 bg-rose-50/50'
                      : isReview
                      ? 'border-amber-300 bg-amber-50/40'
                      : 'border-emerald-200 bg-emerald-50/40'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Flame className={`h-3.5 w-3.5 ${isHigh ? 'text-rose-600' : 'text-slate-500'}`} />
                        <span>Fat / Saturated Fat</span>
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                          isHigh
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : isReview
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {isHigh ? '🚨 HIGH FAT' : isReview ? 'REVIEW' : 'MODERATE'}
                      </span>
                    </div>

                    <div className="bg-white/80 rounded p-2 border border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Declared Content</span>
                      <span className="text-xs font-black text-slate-900 font-mono block mt-0.5">
                        {ind.declared_value}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-snug">
                      {ind.reason}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="font-mono truncate">Limit: {ind.threshold}</span>
                    {ind.evidence && (
                      <span className="text-amber-700 font-semibold cursor-pointer underline flex-shrink-0">
                        Evidence #{ind.evidence.ocr_id}
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* SUGAR INDICATOR CARD */}
            {(() => {
              const ind = nutritionAnalysis?.indicators?.sugar || {
                id: 'indicator_sugar',
                name: 'Sugar Content',
                warning_title: 'HIGH SUGAR',
                status: 'REVIEW',
                warning_triggered: false,
                declared_value: 'Not detected in OCR',
                threshold: 'Total Sugars > 10g per 100g',
                reason: 'Nutrition declaration not detected on label to determine sugar status.',
              };
              const isHigh = ind.status === 'HIGH' || ind.warning_triggered;
              const isReview = ind.status === 'REVIEW';

              return (
                <div
                  className={`rounded-lg border p-3.5 space-y-2 transition shadow-xs flex flex-col justify-between ${
                    isHigh
                      ? 'border-rose-300 bg-rose-50/50'
                      : isReview
                      ? 'border-amber-300 bg-amber-50/40'
                      : 'border-emerald-200 bg-emerald-50/40'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <HeartPulse className={`h-3.5 w-3.5 ${isHigh ? 'text-rose-600' : 'text-slate-500'}`} />
                        <span>Sugar / Added Sugars</span>
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                          isHigh
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : isReview
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {isHigh ? '🚨 HIGH SUGAR' : isReview ? 'REVIEW' : 'MODERATE'}
                      </span>
                    </div>

                    <div className="bg-white/80 rounded p-2 border border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Declared Content</span>
                      <span className="text-xs font-black text-slate-900 font-mono block mt-0.5">
                        {ind.declared_value}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-snug">
                      {ind.reason}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="font-mono truncate">Limit: {ind.threshold}</span>
                    {ind.evidence && (
                      <span className="text-amber-700 font-semibold cursor-pointer underline flex-shrink-0">
                        Evidence #{ind.evidence.ocr_id}
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* SALT / SODIUM INDICATOR CARD */}
            {(() => {
              const ind = nutritionAnalysis?.indicators?.salt || {
                id: 'indicator_salt',
                name: 'Salt / Sodium Content',
                warning_title: 'HIGH SALT',
                status: 'REVIEW',
                warning_triggered: false,
                declared_value: 'Not detected in OCR',
                threshold: 'Sodium > 400mg (or Salt > 1g) per 100g',
                reason: 'Nutrition declaration not detected on label to determine salt status.',
              };
              const isHigh = ind.status === 'HIGH' || ind.warning_triggered;
              const isReview = ind.status === 'REVIEW';

              return (
                <div
                  className={`rounded-lg border p-3.5 space-y-2 transition shadow-xs flex flex-col justify-between ${
                    isHigh
                      ? 'border-rose-300 bg-rose-50/50'
                      : isReview
                      ? 'border-amber-300 bg-amber-50/40'
                      : 'border-emerald-200 bg-emerald-50/40'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Scale className={`h-3.5 w-3.5 ${isHigh ? 'text-rose-600' : 'text-slate-500'}`} />
                        <span>Salt / Sodium (NaCl)</span>
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                          isHigh
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : isReview
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        {isHigh ? '🚨 HIGH SALT' : isReview ? 'REVIEW' : 'MODERATE'}
                      </span>
                    </div>

                    <div className="bg-white/80 rounded p-2 border border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Declared Content</span>
                      <span className="text-xs font-black text-slate-900 font-mono block mt-0.5">
                        {ind.declared_value}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-snug">
                      {ind.reason}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="font-mono truncate">Limit: {ind.threshold}</span>
                    {ind.evidence && (
                      <span className="text-amber-700 font-semibold cursor-pointer underline flex-shrink-0">
                        Evidence #{ind.evidence.ocr_id}
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
            <span>
              <strong>FSSAI Regulatory Standard:</strong> Food Safety and Standards (Labelling and Display) Regulations, 2020 & Draft FOPNL Guidelines.
            </span>
            <span className="italic font-mono text-[10px]">
              Portion Basis: Standard Metric 100g / 100ml
            </span>
          </div>
        </div>
      </div>

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
            <p className="font-bold text-slate-800 text-sm">{formatValue(product?.net_quantity)}</p>
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
            <p className="font-bold text-slate-800 text-sm">
              {formatValue(product?.packed_date || product?.manufacturing_date)}
            </p>
          </div>

          <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
            <span className="text-slate-500 font-medium block flex items-center mb-1">
              <Calendar className="h-3.5 w-3.5 mr-1 text-slate-600" /> Best Before / Expiry Date
            </span>
            <p className="font-bold text-slate-800 text-sm">
              {formatValue(product?.best_before || product?.use_by_date || product?.expiry_date)}
            </p>
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

          <div className="border border-slate-200 rounded-md p-3 bg-slate-50 md:col-span-2 lg:col-span-3">
            <span className="text-slate-500 font-medium block flex items-center mb-1">
              <Tag className="h-3.5 w-3.5 mr-1 text-slate-600" /> Ingredients Declaration
            </span>
            <p className="font-medium text-slate-800 text-xs leading-relaxed">
              {formatValue(product?.ingredients)}
            </p>
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
                      className={`transition-all duration-200 cursor-pointer select-none outline-hidden focus:ring-2 focus:ring-amber-500 focus:z-10 animate-fade-in ${
                        isSelected
                          ? 'bg-amber-100/80 border-l-4 border-amber-600 font-semibold shadow-2xs'
                          : 'hover:bg-slate-50 border-l-4 border-transparent'
                      }`}
                      style={{ animationDelay: `${index * 45}ms` }}
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
                      <td className="py-3 px-4 font-medium text-slate-800 max-w-xs truncate">
                        {formatValue(check.extracted_value)}
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

      {/* Add Inspection to Brand Repository Modal */}
      <AddToRepositoryModal
        isOpen={isAddToRepoModalOpen}
        onClose={() => setIsAddToRepoModalOpen(false)}
        data={data}
        imageFile={imageFile}
      />
    </div>
  );
};
