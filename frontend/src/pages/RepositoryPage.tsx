import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInspection } from '../context/InspectionContext';
import { InspectionReportModal } from '../components/InspectionReportModal';
import { fetchInspections } from '../services/api';
import { AnalyzeResponse } from '../types/api';
import {
  Database,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Printer,
  ArrowRight,
  RefreshCw,
  Tag,
  Calendar,
  X,
  Code,
} from 'lucide-react';

export const RepositoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentInspection, imageFile, setInspectionData } = useInspection();

  const [inspections, setInspections] = useState<AnalyzeResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('ALL');
  const [selectedInspection, setSelectedInspection] = useState<AnalyzeResponse | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [viewJsonRecord, setViewJsonRecord] = useState<AnalyzeResponse | null>(null);

  const loadData = async (query?: string) => {
    setLoading(true);
    try {
      const records = await fetchInspections(100, 0, query);
      // If user performed live inspection in current session, ensure it is in the list
      if (currentInspection && currentInspection.inspection_id) {
        const exists = records.some(
          (r) => r.inspection_id === currentInspection.inspection_id
        );
        if (!exists) {
          records.unshift(currentInspection);
        }
      }
      setInspections(records);
    } catch (err) {
      console.error('Failed to load repository records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(searchQuery);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedBrandFilter('ALL');
    loadData('');
  };

  // Quick brand preset selector
  const handleQuickBrandClick = (brandKeyword: string) => {
    if (selectedBrandFilter === brandKeyword) {
      setSelectedBrandFilter('ALL');
      setSearchQuery('');
      loadData('');
    } else {
      setSelectedBrandFilter(brandKeyword);
      setSearchQuery(brandKeyword);
      loadData(brandKeyword);
    }
  };

  // Filter in-memory for instant responsive feedback
  const filteredInspections = useMemo(() => {
    return inspections.filter((item) => {
      // Status filter
      if (statusFilter !== 'ALL') {
        const s = (item.status || '').toUpperCase();
        if (statusFilter === 'PASS' && s !== 'PASS' && s !== 'COMPLIANT') return false;
        if (statusFilter === 'REVIEW' && s !== 'REVIEW' && s !== 'REVIEW_REQUIRED') return false;
        if (statusFilter === 'FAIL' && s !== 'FAIL' && s !== 'NON_COMPLIANT') return false;
      }

      // Keyword query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const prod = (item.product as any) || {};
        const searchable = [
          item.inspection_id || '',
          item.filename || '',
          item.status || '',
          prod.brand || '',
          prod.product_name || '',
          prod.manufacturer || '',
          prod.category || '',
          prod.batch_number || '',
          prod.fssai_license || prod.fssai_number || '',
        ]
          .join(' ')
          .toLowerCase();

        if (!searchable.includes(q)) return false;
      }

      return true;
    });
  }, [inspections, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = inspections.length;
    const passed = inspections.filter(
      (i) => (i.status || '').toUpperCase() === 'PASS' || (i.status || '').toUpperCase() === 'COMPLIANT'
    ).length;
    const review = inspections.filter(
      (i) => (i.status || '').toUpperCase() === 'REVIEW' || (i.status || '').toUpperCase() === 'REVIEW_REQUIRED'
    ).length;
    const failed = inspections.filter(
      (i) => (i.status || '').toUpperCase() === 'FAIL' || (i.status || '').toUpperCase() === 'NON_COMPLIANT'
    ).length;
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    return { total, passed, review, failed, passRate };
  }, [inspections]);

  const getStatusBadge = (statusStr?: string) => {
    const s = (statusStr || '').toUpperCase();
    if (s === 'PASS' || s === 'COMPLIANT') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" /> COMPLIANT
        </span>
      );
    }
    if (s === 'FAIL' || s === 'NON_COMPLIANT') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
          <XCircle className="h-3.5 w-3.5 mr-1 text-rose-600" /> NON-COMPLIANT
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
        <AlertTriangle className="h-3.5 w-3.5 mr-1 text-amber-600" /> REVIEW REQUIRED
      </span>
    );
  };

  const activeReportData = selectedInspection || currentInspection;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            <Database className="h-4 w-4 text-amber-600" />
            <span>Inspection Repository & Historical Database</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Statutory Inspection Records</span>
            <span className="bg-slate-900 text-amber-400 font-mono text-xs px-2 py-0.5 rounded-full">
              {filteredInspections.length} Records
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter, and inspect past Legal Metrology compliance audits by brand (e.g. <strong>Haldiram's</strong>, <strong>Lay's</strong>, <strong>Britannia</strong>, <strong>Amul</strong>) or commodity name.
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => loadData(searchQuery)}
            className="inline-flex items-center px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold border border-slate-300 transition cursor-pointer"
            title="Refresh records"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
            Refresh
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

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Audits
          </span>
          <span className="text-xl font-black text-slate-900">{stats.total}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Archived Records</span>
        </div>
        <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
            Compliant
          </span>
          <span className="text-xl font-black text-emerald-700">{stats.passed}</span>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
            {stats.passRate}% Compliance Rate
          </span>
        </div>
        <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
            Review Required
          </span>
          <span className="text-xl font-black text-amber-700">{stats.review}</span>
          <span className="text-[10px] text-amber-600 block mt-0.5">Officer Verification</span>
        </div>
        <div className="bg-white border border-slate-300 rounded-lg p-3.5 shadow-2xs">
          <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">
            Non-Compliant
          </span>
          <span className="text-xl font-black text-rose-700">{stats.failed}</span>
          <span className="text-[10px] text-rose-600 block mt-0.5">Violations Logged</span>
        </div>
      </div>

      {/* Search & Quick Filter Controls */}
      <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-xs space-y-3">
        {/* Search Bar Form */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Brand (Haldiram, Lay's...), Commodity (Bhujia, Chips...), ID, FSSAI..."
              className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold transition cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search</span>
          </button>
        </form>

        {/* Brand Presets & Status Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Quick Brand Selector Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center mr-1">
              <Tag className="h-3 w-3 mr-1 text-amber-600" />
              Quick Brands:
            </span>
            <button
              type="button"
              onClick={() => handleQuickBrandClick('Haldiram')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer border ${
                selectedBrandFilter === 'Haldiram'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-300'
              }`}
            >
              Haldiram's - Bhujia
            </button>
            <button
              type="button"
              onClick={() => handleQuickBrandClick('Lay')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer border ${
                selectedBrandFilter === 'Lay'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-300'
              }`}
            >
              Lay's - Green Chips
            </button>
            <button
              type="button"
              onClick={() => handleQuickBrandClick('Britannia')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer border ${
                selectedBrandFilter === 'Britannia'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-300'
              }`}
            >
              Britannia
            </button>
            <button
              type="button"
              onClick={() => handleQuickBrandClick('Amul')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer border ${
                selectedBrandFilter === 'Amul'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-300'
              }`}
            >
              Amul
            </button>
            {selectedBrandFilter !== 'ALL' && (
              <button
                type="button"
                onClick={clearSearch}
                className="text-[11px] text-amber-700 font-bold hover:underline ml-1"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-md border border-slate-200">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Statuses
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PASS')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                statusFilter === 'PASS'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-emerald-700'
              }`}
            >
              Compliant
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('REVIEW')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                statusFilter === 'REVIEW'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-amber-700'
              }`}
            >
              Review
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('FAIL')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                statusFilter === 'FAIL'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-500 hover:text-rose-700'
              }`}
            >
              Non-Compliant
            </button>
          </div>
        </div>
      </div>

      {/* Main Records List Area */}
      {loading ? (
        <div className="bg-white rounded-lg border border-slate-300 p-12 text-center space-y-3 shadow-xs">
          <RefreshCw className="h-8 w-8 text-amber-600 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-800">
            Querying Inspection Repository Database...
          </p>
          <p className="text-xs text-slate-500">
            Loading historical packaged commodity records and compliance determinations.
          </p>
        </div>
      ) : filteredInspections.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-300 p-12 text-center space-y-4 max-w-lg mx-auto shadow-xs">
          <div className="h-12 w-12 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              No matching inspection records found.
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              No audit records matched your query "{searchQuery}". Try searching for brands like "Haldiram", "Lay's", "Britannia", or reset filters.
            </p>
          </div>
          <div className="flex justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={clearSearch}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-xs font-semibold transition cursor-pointer"
            >
              Clear Search Query
            </button>
            <button
              type="button"
              onClick={() => navigate('/inspection')}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition cursor-pointer"
            >
              Start New Inspection
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInspections.map((item, idx) => {
            const idStr = item.inspection_id || `INSP_REC_${idx + 1}`;
            const prod = (item.product as any) || {};
            const brand = prod.brand || (item.product?.manufacturer?.split(',')[0] ?? 'Packaged Brand');
            const productName = prod.product_name || item.filename || 'Packaged Commodity Item';
            const timeStr = item.meta?.timestamp || item.timestamp;
            const formattedDate = timeStr
              ? new Date(timeStr).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recent Audit';

            return (
              <div
                key={idStr}
                className="bg-white border border-slate-300 hover:border-slate-400 rounded-lg p-5 shadow-xs hover:shadow-sm transition space-y-4"
              >
                {/* Record Header Strip */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      {idStr}
                    </span>
                    {getStatusBadge(item.status)}
                    <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      Score: {item.compliance_score}%
                    </span>
                  </div>

                  <div className="flex items-center text-xs text-slate-500 space-x-2">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>{formattedDate}</span>
                  </div>
                </div>

                {/* Main Product Info & Summary Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Left: Brand & Product Details (8 Cols) */}
                  <div className="lg:col-span-8 space-y-2">
                    <div className="flex items-baseline space-x-2">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-amber-400 text-[11px] font-black uppercase tracking-wider">
                        {brand}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">
                        {productName}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                      <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Net Quantity
                        </span>
                        <span className="font-semibold text-slate-800">
                          {prod.net_quantity || 'Declared'}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          MRP / Pricing
                        </span>
                        <span className="font-semibold text-slate-800">
                          {prod.mrp || 'Statutory MRP'}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          FSSAI License
                        </span>
                        <span className="font-mono text-slate-800 text-[11px]">
                          {prod.fssai_license || prod.fssai_number || 'Verified'}
                        </span>
                      </div>
                    </div>

                    {prod.manufacturer && (
                      <p className="text-[11px] text-slate-500 leading-tight">
                        <strong>Packer / Mfg:</strong> {prod.manufacturer}
                      </p>
                    )}
                  </div>

                  {/* Right: Actions & Rule Outcomes (4 Cols) */}
                  <div className="lg:col-span-4 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-200 pt-3 lg:pt-0 lg:pl-4 space-y-3">
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between text-slate-600">
                        <span>Legal Metrology Checks:</span>
                        <span className="font-bold text-slate-800">
                          {item.summary?.passed ?? 0} Passed / {item.summary?.total_checks ?? 12} Total
                        </span>
                      </div>
                      {item.summary?.review_required ? (
                        <div className="flex justify-between text-amber-700">
                          <span>Review Required:</span>
                          <span className="font-bold">{item.summary.review_required}</span>
                        </div>
                      ) : null}
                      {item.summary?.failed ? (
                        <div className="flex justify-between text-rose-700">
                          <span>Violations:</span>
                          <span className="font-bold">{item.summary.failed}</span>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setInspectionData(item, new File([], item.filename || 'image.png'));
                          navigate('/inspection/result');
                        }}
                        className="inline-flex items-center px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold shadow-2xs transition cursor-pointer"
                      >
                        <ExternalLink className="h-3 w-3 mr-1 text-amber-400" />
                        VIEW INSPECTION
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedInspection(item);
                          setIsReportModalOpen(true);
                        }}
                        className="inline-flex items-center px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold shadow-2xs transition cursor-pointer"
                      >
                        <Printer className="h-3 w-3 mr-1" />
                        REPORT
                      </button>

                      <button
                        type="button"
                        onClick={() => setViewJsonRecord(item)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded border border-slate-200 transition cursor-pointer"
                        title="View Raw JSON Document"
                      >
                        <Code className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
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

      {/* JSON Record Inspector Modal */}
      {viewJsonRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-300">
            <div className="px-5 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-900 text-white rounded-t-lg">
              <span className="font-mono text-xs font-bold text-amber-400">
                JSON Document: {viewJsonRecord.inspection_id}
              </span>
              <button
                type="button"
                onClick={() => setViewJsonRecord(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 font-mono text-[11px] bg-slate-950 text-slate-200">
              <pre className="whitespace-pre-wrap">{JSON.stringify(viewJsonRecord, null, 2)}</pre>
            </div>
            <div className="p-3 border-t border-slate-200 flex justify-end bg-slate-50 rounded-b-lg">
              <button
                type="button"
                onClick={() => setViewJsonRecord(null)}
                className="px-3.5 py-1.5 bg-slate-800 text-white rounded text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default RepositoryPage;
