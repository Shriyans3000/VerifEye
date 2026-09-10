import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck,
  FileText,
  Layers,
  Server,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Cpu,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Database,
} from 'lucide-react';
import { useInspection } from '../context/InspectionContext';
import { checkHealth } from '../services/api';
import { InspectionReportModal } from '../components/InspectionReportModal';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentInspection, imageFile } = useInspection();
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      const ok = await checkHealth();
      if (isMounted) setIsOnline(ok);
    };
    check();
    const interval = setInterval(check, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const getStatusBadge = (statusStr?: string) => {
    const s = (statusStr || '').toUpperCase();
    if (s === 'PASS' || s === 'COMPLIANT') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-700" /> COMPLIANT
        </span>
      );
    }
    if (s === 'FAIL' || s === 'NON_COMPLIANT') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
          <XCircle className="h-3.5 w-3.5 mr-1 text-rose-700" /> NON-COMPLIANT
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
        <AlertTriangle className="h-3.5 w-3.5 mr-1 text-amber-700" /> REVIEW REQUIRED
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Enforcement Context Card */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-xs p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            <ShieldCheck className="h-4 w-4" />
            <span>Legal Metrology Division • Enforcement Workspace</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Officer Compliance Workspace
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Automated inspection system assisting authorized enforcement officers in evaluating packaged commodity labels against mandatory statutory declarations under the Legal Metrology (Packaged Commodities) Rules, 2011.
          </p>
        </div>

        {/* System Status Pill */}
        <div className="bg-slate-50 border border-slate-300 rounded-lg p-3.5 flex items-center space-x-3 w-full md:w-auto flex-shrink-0">
          <div className="bg-slate-900 p-2 rounded-md text-amber-400">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Inspection Engine
            </span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              {isOnline === null ? (
                <span className="text-xs font-bold text-slate-500">CHECKING STATUS...</span>
              ) : isOnline ? (
                <span className="text-xs font-bold text-emerald-700 flex items-center">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                  Backend Online (Port 8000)
                </span>
              ) : (
                <span className="text-xs font-bold text-rose-700 flex items-center">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1 text-rose-600" />
                  Backend Offline
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Start New Inspection & Current Session */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: Start New Inspection (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-lg border border-slate-300 shadow-xs p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="h-10 w-10 bg-amber-100 border border-amber-300 rounded-lg flex items-center justify-center text-amber-700 mb-3">
              <FileCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Start New Inspection
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upload or capture a clear photograph of a packaged commodity label. VerifEye runs deep-learning OCR, structured declaration extraction, and deterministic rule assessment.
            </p>
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={() => navigate('/inspection')}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-md text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow transition cursor-pointer"
            >
              <span>START INSPECTION</span>
              <ArrowRight className="h-4 w-4 text-amber-400" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/repository')}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 px-4 rounded-md text-xs uppercase tracking-wider flex items-center justify-center space-x-2 border border-slate-300 transition cursor-pointer"
            >
              <Database className="h-3.5 w-3.5 text-amber-600" />
              <span>INSPECTION REPOSITORY</span>
            </button>
          </div>
        </div>

        {/* Card 2: Current Session Status (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-lg border border-slate-300 shadow-xs p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center space-x-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <span>Current Session Inspection</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                {currentInspection ? 'ACTIVE SESSION DATA' : 'NO ACTIVE AUDIT'}
              </span>
            </div>

            {currentInspection ? (
              <div className="space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50 p-3 rounded border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                      Statutory Assessment Outcome
                    </span>
                    {getStatusBadge(currentInspection.status)}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                      Compliance Score
                    </span>
                    <span className="text-xl font-black text-slate-900">
                      {currentInspection.compliance_score}%
                    </span>
                  </div>
                </div>

                {/* Real Metric Counters from currentInspection */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-emerald-50 border border-emerald-200 rounded p-2">
                    <span className="text-[10px] uppercase font-bold text-emerald-800 block">Passed</span>
                    <span className="text-lg font-black text-emerald-900">
                      {currentInspection.summary?.passed ?? 0}
                    </span>
                  </div>
                  <div className="bg-rose-50 border border-rose-200 rounded p-2">
                    <span className="text-[10px] uppercase font-bold text-rose-800 block">Failed</span>
                    <span className="text-lg font-black text-rose-900">
                      {currentInspection.summary?.failed ?? 0}
                    </span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded p-2">
                    <span className="text-[10px] uppercase font-bold text-amber-800 block">Review</span>
                    <span className="text-lg font-black text-amber-900">
                      {currentInspection.summary?.review_required ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-500 text-xs">
                <p className="font-semibold text-slate-700 mb-1">
                  No active inspection in this session.
                </p>
                <p className="text-slate-400 max-w-md mx-auto text-[11px]">
                  Perform an inspection using the New Inspection module to view compliance breakdown and visual evidence in this session.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons for Current Session */}
          <div className="pt-2 border-t border-slate-200">
            {currentInspection ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/inspection/result')}
                  className="inline-flex items-center px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold shadow transition cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
                  OPEN INSPECTION
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/inspection/result')}
                  className="inline-flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded text-xs font-bold transition cursor-pointer"
                >
                  <Layers className="h-3.5 w-3.5 mr-1.5 text-slate-600" />
                  VIEW EVIDENCE
                </button>
                <button
                  type="button"
                  onClick={() => setIsReportOpen(true)}
                  className="inline-flex items-center px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold shadow transition cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                  GENERATE REPORT
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/inspection')}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold py-2 rounded text-xs transition cursor-pointer"
              >
                START INSPECTION
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Implemented System Capabilities Card */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-xs p-6">
        <div className="border-b border-slate-200 pb-3 mb-4 flex items-center space-x-2">
          <Cpu className="h-5 w-5 text-amber-600" />
          <h3 className="text-base font-bold text-slate-900">
            Implemented System Capabilities
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <span className="font-bold text-slate-900 block text-sm mb-1">
              1. Deep-Learning OCR Extraction
            </span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              GPU-accelerated PaddleOCR detects and recognizes text regions across arbitrary package orientations, font styles, and background textures.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <span className="font-bold text-slate-900 block text-sm mb-1">
              2. Evidence-Linked Visual Viewer
            </span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Every mandatory declaration check links directly to its original OCR pixel bounding box on the package image with responsive percentage scaling.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <span className="font-bold text-slate-900 block text-sm mb-1">
              3. Deterministic Compliance Engine
            </span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Rules evaluate 12 mandatory statutory declaration categories under Rule 6 of the Legal Metrology Rules, 2011 plus mathematical & chronological validations.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <span className="font-bold text-slate-900 block text-sm mb-1">
              4. Statutory 2-Page PDF Report
            </span>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Generates an official, printable 2-page statutory inspection document with formal letterhead, declaration tables, evidence snippets, and officer sign-off.
            </p>
          </div>
        </div>
      </div>

      {/* Official Report Modal (if opened from dashboard) */}
      {currentInspection && (
        <InspectionReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          data={currentInspection}
          imageFile={imageFile}
        />
      )}
    </div>
  );
};
