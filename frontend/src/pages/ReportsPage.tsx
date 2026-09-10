import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInspection } from '../context/InspectionContext';
import { InspectionReportModal } from '../components/InspectionReportModal';
import { fetchInspections } from '../services/api';
import { AnalyzeResponse } from '../types/api';
import {
  FileText,
  Printer,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Database,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentInspection, imageFile, setInspectionData } = useInspection();
  const [storedInspections, setStoredInspections] = useState<AnalyzeResponse[]>([]);
  const [selectedInspection, setSelectedInspection] = useState<AnalyzeResponse | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadInspections = async () => {
      try {
        const records = await fetchInspections(50);
        if (isMounted) {
          setStoredInspections(records);
        }
      } catch (err) {
        console.error('Failed to load stored inspections:', err);
      }
    };
    loadInspections();
  }, [currentInspection]);

  const displayInspections: AnalyzeResponse[] = storedInspections.length > 0 
    ? storedInspections 
    : (currentInspection ? [currentInspection] : []);

  const activeReportData = selectedInspection || currentInspection;

  const getStatusBadge = (statusStr?: string) => {
    const s = (statusStr || '').toUpperCase();
    if (s === 'PASS' || s === 'COMPLIANT') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
          <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-700" /> COMPLIANT
        </span>
      );
    }
    if (s === 'FAIL' || s === 'NON_COMPLIANT') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
          <XCircle className="h-3 w-3 mr-1 text-rose-700" /> NON-COMPLIANT
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
        <AlertTriangle className="h-3 w-3 mr-1 text-amber-700" /> REVIEW REQUIRED
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            <FileText className="h-4 w-4" />
            <span>Inspection Reports Workspace</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Statutory Inspection Records
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            View, generate, and print formal Legal Metrology compliance reports produced in the current active session.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => navigate('/repository')}
            className="inline-flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded text-xs font-bold transition cursor-pointer"
          >
            <Database className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
            <span>Search Repository</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/inspection')}
            className="inline-flex items-center px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold shadow transition cursor-pointer"
          >
            <span>New Inspection</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1.5 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Reports Listing Area */}
      {displayInspections.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-lg border border-slate-300 shadow-xs p-12 text-center space-y-4 max-w-xl mx-auto my-8">
          <div className="h-14 w-14 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <FileText className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              No inspection reports available.
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Statutory reports are stored upon completed label analyses. Perform an inspection to view and export official records.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/inspection')}
              className="inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold shadow transition cursor-pointer"
            >
              START INSPECTION
            </button>
          </div>
        </div>
      ) : (
        /* Stored MongoDB Inspection Records List */
        <div className="bg-white rounded-lg border border-slate-300 shadow-xs overflow-hidden divide-y divide-slate-200">
          <div className="bg-slate-900 text-white px-5 py-3 border-b border-slate-800 flex justify-between items-center text-xs">
            <span className="font-bold uppercase tracking-wider flex items-center space-x-1.5">
              <ShieldCheck className="h-4 w-4 text-amber-500" />
              <span>Persisted Statutory Records ({displayInspections.length} Total)</span>
            </span>
            <span className="text-slate-400 font-mono text-[11px] flex items-center space-x-1">
              <Database className="h-3 w-3 text-emerald-400 inline mr-1" />
              MongoDB Atlas Persisted
            </span>
          </div>

          {displayInspections.map((item, idx) => {
            const idStr = item.inspection_id || `insp_${idx + 1}`;
            const timeStr = item.meta?.timestamp || item.timestamp;
            const formattedDate = timeStr
              ? new Date(timeStr).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recent';

            return (
              <div key={idStr} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/60 transition">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      {idStr}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>

                  <h4 className="text-base font-bold text-slate-900">
                    Package Commodity Inspection Report: {item.product?.product_name || item.filename || item.product?.manufacturer || 'Packaged Commodity'}
                  </h4>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-0.5">
                    <span>
                      <strong>Date:</strong> {formattedDate}
                    </span>
                    <span>•</span>
                    <span>
                      <strong>Compliance Score:</strong> {item.compliance_score}%
                    </span>
                    <span>•</span>
                    <span>
                      <strong>Summary:</strong> {item.summary?.passed ?? 0} Passed, {item.summary?.failed ?? 0} Failed, {item.summary?.review_required ?? 0} Review
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setInspectionData(item, new File([], item.filename || 'image.png'));
                      navigate('/inspection/result');
                    }}
                    className="inline-flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded text-xs font-bold transition cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5 text-slate-600" />
                    VIEW INSPECTION
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedInspection(item);
                      setIsReportModalOpen(true);
                    }}
                    className="inline-flex items-center px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold shadow transition cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5 mr-1.5" />
                    GENERATE REPORT
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Modal */}
      {activeReportData && (
        <InspectionReportModal
          isOpen={isReportModalOpen}
          onClose={() => {
            setIsReportModalOpen(false);
            setSelectedInspection(null);
          }}
          data={activeReportData}
          imageFile={imageFile}
        />
      )}
    </div>
  );
};
