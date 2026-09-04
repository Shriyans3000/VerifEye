import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useInspection } from '../context/InspectionContext';
import { ResultView } from '../components/ResultView';
import { FileCheck, ArrowLeft, RotateCcw } from 'lucide-react';

export const InspectionResultPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentInspection, imageFile, clearSession } = useInspection();

  if (!currentInspection) {
    return (
      <div className="bg-white rounded-lg border border-slate-300 shadow-xs p-12 text-center space-y-4 max-w-xl mx-auto my-8">
        <div className="h-14 w-14 bg-amber-100 border border-amber-300 rounded-full flex items-center justify-center mx-auto text-amber-700">
          <FileCheck className="h-7 w-7" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">No Active Inspection In Session</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            There is currently no inspection result loaded in this session. Upload and analyze a commodity label image to view its compliance audit and visual evidence.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => navigate('/inspection')}
            className="inline-flex items-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold shadow transition cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Go to New Inspection
          </button>
        </div>
      </div>
    );
  }

  const handleStartNew = () => {
    clearSession();
    navigate('/inspection');
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Bar */}
      <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">
            Active Inspection Audit Result
          </span>
          <h2 className="text-lg font-bold text-slate-900">
            {currentInspection.product?.product_name ||
              currentInspection.product?.manufacturer ||
              'Packaged Commodity Compliance Assessment'}
          </h2>
        </div>

        <button
          type="button"
          onClick={handleStartNew}
          className="inline-flex items-center px-3.5 py-1.5 border border-slate-300 shadow-2xs text-xs font-semibold rounded-md text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
          Start New Inspection
        </button>
      </div>

      {/* Complete ResultView Component */}
      <ResultView data={currentInspection} imageFile={imageFile} />
    </div>
  );
};
