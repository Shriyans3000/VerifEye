import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadZone } from '../components/UploadZone';
import { ProcessingState } from '../components/ProcessingState';
import { useInspection } from '../context/InspectionContext';
import { AlertCircle, FileCheck, ArrowRight } from 'lucide-react';

export const InspectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { performAnalysis, isAnalyzing, errorMessage, currentInspection } = useInspection();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFilesSelect = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setSelectedFiles([]);
  };

  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) return;

    const success = await performAnalysis(selectedFiles);
    if (success) {
      navigate('/inspection/result');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Workflow Banner */}
      <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            <FileCheck className="h-4 w-4" />
            <span>Legal Metrology Compliance Workflow</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Package Label Inspection Module
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit packaged commodity photograph(s) for automated statutory declaration audit under the Legal Metrology Rules, 2011.
          </p>
        </div>

        {currentInspection && (
          <button
            type="button"
            onClick={() => navigate('/inspection/result')}
            className="inline-flex items-center px-3.5 py-2 border border-slate-300 shadow-xs text-xs font-bold rounded-md text-slate-800 bg-slate-50 hover:bg-slate-100 transition cursor-pointer"
          >
            <span>View Active Inspection</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1.5 text-amber-600" />
          </button>
        )}
      </div>

      {/* Error Alert Box */}
      {errorMessage && (
        <div className="bg-rose-50 border-l-4 border-rose-600 rounded-lg p-4 shadow-xs text-rose-900 flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-rose-900">Inspection Processing Failed</h4>
            <p className="text-xs text-rose-800 mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Processing State Indicator */}
      {isAnalyzing && <ProcessingState />}

      {/* Upload Zone */}
      {!isAnalyzing && (
        <UploadZone
          onFilesSelect={handleFilesSelect}
          selectedFiles={selectedFiles}
          onRemoveFile={handleRemoveFile}
          onClearAll={handleClearAll}
          onAnalyze={handleAnalyze}
          disabled={isAnalyzing}
        />
      )}
    </div>
  );
};
