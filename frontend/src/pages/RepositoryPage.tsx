import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInspection } from '../context/InspectionContext';
import { InspectionReportModal } from '../components/InspectionReportModal';
import {
  fetchBrandRepositories,
  fetchBrandRepositoryById,
  createBrandRepository,
} from '../services/api';
import { AnalyzeResponse, BrandRepository } from '../types/api';
import {
  Database,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  FileText,
  ArrowRight,
  RefreshCw,
  Tag,
  Calendar,
  X,
  Code,
  Plus,
  ArrowLeft,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';

export const RepositoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentInspection, imageFile, setInspectionData } = useInspection();

  // Repositories State
  const [repositories, setRepositories] = useState<BrandRepository[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<BrandRepository | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [brandSearchQuery, setBrandSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Drilldown Reports Filter State
  const [reportSearchQuery, setReportSearchQuery] = useState<string>('');
  const [reportStatusFilter, setReportStatusFilter] = useState<string>('ALL');

  // Modals State
  const [isAddRepoModalOpen, setIsAddRepoModalOpen] = useState<boolean>(false);
  const [selectedInspectionForReport, setSelectedInspectionForReport] = useState<AnalyzeResponse | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [viewJsonRecord, setViewJsonRecord] = useState<AnalyzeResponse | null>(null);

  // New Repository Form State
  const [newBrandName, setNewBrandName] = useState<string>('');
  const [newCompanyName, setNewCompanyName] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('Packaged Savoury Snacks');
  const [newJurisdiction, setNewJurisdiction] = useState<string>('Delhi NCR Enforcement Division');
  const [newFssaiLicense, setNewFssaiLicense] = useState<string>('');
  const [newMonitoringStatus, setNewMonitoringStatus] = useState<string>('Active Surveillance');
  const [newOfficerNotes, setNewOfficerNotes] = useState<string>('');
  const [newInitialProduct, setNewInitialProduct] = useState<string>('');
  const [newInitialNetQty, setNewInitialNetQty] = useState<string>('100 g');
  const [newInitialMrp, setNewInitialMrp] = useState<string>('₹50.00');
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load Brand Repositories
  const loadRepositories = async (query?: string) => {
    setLoading(true);
    try {
      const data = await fetchBrandRepositories(query);
      setRepositories(data);

      // If a brand repository was currently selected, refresh its details
      if (selectedRepo) {
        const updated = await fetchBrandRepositoryById(selectedRepo.repository_id);
        if (updated) {
          setSelectedRepo(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load brand repositories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepositories(brandSearchQuery);
  }, []);

  // Handle clicking on a Brand Repository to drill down
  const handleSelectBrandRepo = async (repo: BrandRepository) => {
    setLoading(true);
    try {
      const fullRepo = await fetchBrandRepositoryById(repo.repository_id);
      setSelectedRepo(fullRepo || repo);
      setReportSearchQuery('');
      setReportStatusFilter('ALL');
    } catch (err) {
      console.error('Failed to fetch full brand repository:', err);
      setSelectedRepo(repo);
    } finally {
      setLoading(false);
    }
  };

  // Handle creating a new Brand Repository
  const handleCreateRepoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) {
      setFormError('Please enter a Brand Name.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);
    try {
      const payload: any = {
        brand_name: newBrandName.trim(),
        company_name: newCompanyName.trim() || newBrandName.trim(),
        category: newCategory.trim(),
        jurisdiction: newJurisdiction.trim(),
        fssai_license: newFssaiLicense.trim() || 'Pending Verification',
        monitoring_status: newMonitoringStatus,
        officer_notes: newOfficerNotes.trim(),
      };

      if (newInitialProduct.trim()) {
        payload.initial_product = {
          product_name: newInitialProduct.trim(),
          net_quantity: newInitialNetQty.trim() || '100 g',
          mrp: newInitialMrp.trim() || '₹50.00',
        };
      }

      const created = await createBrandRepository(payload);
      setIsAddRepoModalOpen(false);
      // Reset form
      setNewBrandName('');
      setNewCompanyName('');
      setNewOfficerNotes('');
      setNewInitialProduct('');
      setNewFssaiLicense('');

      // Refresh list and immediately open the newly created repo
      await loadRepositories();
      if (created && created.repository_id) {
        handleSelectBrandRepo(created);
      }
    } catch (err: any) {
      setFormError(err.message || 'Failed to create brand repository.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Filter brand repositories for the main grid
  const filteredRepositories = useMemo(() => {
    return repositories.filter((repo) => {
      if (categoryFilter !== 'ALL') {
        if (!repo.category?.toLowerCase().includes(categoryFilter.toLowerCase())) {
          return false;
        }
      }
      if (brandSearchQuery.trim()) {
        const q = brandSearchQuery.toLowerCase();
        const str = [
          repo.brand_name,
          repo.company_name,
          repo.category,
          repo.jurisdiction,
          repo.fssai_license,
          repo.description,
        ]
          .join(' ')
          .toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [repositories, categoryFilter, brandSearchQuery]);

  // Filter reports inside the selected brand repository
  const filteredReportsInSelectedRepo = useMemo(() => {
    if (!selectedRepo || !selectedRepo.inspections) return [];
    return selectedRepo.inspections.filter((insp) => {
      if (reportStatusFilter !== 'ALL') {
        const s = (insp.status || '').toUpperCase();
        if (reportStatusFilter === 'PASS' && s !== 'PASS' && s !== 'COMPLIANT') return false;
        if (reportStatusFilter === 'REVIEW' && s !== 'REVIEW' && s !== 'REVIEW_REQUIRED') return false;
        if (reportStatusFilter === 'FAIL' && s !== 'FAIL' && s !== 'NON_COMPLIANT') return false;
      }
      if (reportSearchQuery.trim()) {
        const q = reportSearchQuery.toLowerCase();
        const prod = (insp.product as any) || {};
        const str = [
          insp.inspection_id,
          insp.filename,
          prod.product_name,
          prod.net_quantity,
          prod.mrp,
          prod.batch_number,
        ]
          .join(' ')
          .toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [selectedRepo, reportStatusFilter, reportSearchQuery]);

  const getStatusBadge = (statusStr?: string) => {
    const s = (statusStr || '').toUpperCase();
    if (s === 'PASS' || s === 'COMPLIANT') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" /> COMPLIANT
        </span>
      );
    }
    if (s === 'FAIL' || s === 'NON_COMPLIANT') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
          <XCircle className="h-3 w-3 mr-1 text-rose-600" /> NON-COMPLIANT
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
        <AlertTriangle className="h-3 w-3 mr-1 text-amber-600" /> REVIEW REQUIRED
      </span>
    );
  };

  const activeReportData = selectedInspectionForReport || currentInspection;

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          TOP BANNER & NAVIGATION
         ───────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            <Database className="h-4 w-4 text-amber-600" />
            <span>Official Brand Compliance Repositories</span>
          </div>

          {selectedRepo ? (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setSelectedRepo(null)}
                className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 transition mr-1"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                All Repositories
              </button>
              <span className="text-slate-300">/</span>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>{selectedRepo.brand_name}</span>
                <span className="bg-amber-100 text-amber-900 text-xs font-mono font-bold px-2 py-0.5 rounded border border-amber-300">
                  {selectedRepo.total_inspections} Audits
                </span>
              </h2>
            </div>
          ) : (
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>Inspection Repositories & Brand Dossiers</span>
              <span className="bg-slate-900 text-amber-400 font-mono text-xs px-2 py-0.5 rounded-full">
                {repositories.length} Brands Registered
              </span>
            </h2>
          )}

          <p className="text-xs text-slate-500 mt-1">
            {selectedRepo
              ? `Historical inspection records and commodity compliance dossier for ${selectedRepo.brand_name} (${selectedRepo.company_name}).`
              : 'Select a brand repository below to review its past inspection records, or register a new brand portfolio dossier for surveillance.'}
          </p>
        </div>

        {/* Top Header Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
          {selectedRepo && (
            <button
              type="button"
              onClick={() => setSelectedRepo(null)}
              className="inline-flex items-center justify-center px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold border border-slate-300 btn-interactive cursor-pointer min-h-[44px]"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              <span>Back to Brands</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsAddRepoModalOpen(true)}
            className="inline-flex items-center justify-center px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold shadow-xs btn-interactive cursor-pointer min-h-[44px] flex-1 sm:flex-none"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5 stroke-[2.5]" />
            <span>Add New Repository</span>
          </button>

          <button
            type="button"
            onClick={() => loadRepositories(brandSearchQuery)}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 btn-interactive cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Refresh repository database"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          VIEW A: ALL BRAND REPOSITORIES GRID (WHEN NO REPO SELECTED)
         ───────────────────────────────────────────────────────────── */}
      {!selectedRepo ? (
        <div className="space-y-6">
          {/* Search & Category Filter Bar */}
          <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={brandSearchQuery}
                  onChange={(e) => {
                    setBrandSearchQuery(e.target.value);
                    loadRepositories(e.target.value);
                  }}
                  placeholder="Search Brand Repositories (e.g. Haldiram, Lay's, Britannia, Amul, Parle...)"
                  className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-md text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-medium"
                />
                {brandSearchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setBrandSearchQuery('');
                      loadRepositories('');
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Category Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center">
                <Tag className="h-3 w-3 mr-1 text-amber-600" /> Categories:
              </span>
              {['ALL', 'Snacks', 'Chips', 'Bakery', 'Dairy'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer border ${
                    categoryFilter === cat
                      ? 'bg-slate-900 text-amber-400 border-slate-900 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-300'
                  }`}
                >
                  {cat === 'ALL' ? 'All Commodities' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Dossier Cards Grid */}
          {loading && repositories.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-300 p-12 text-center space-y-3 shadow-xs">
              <RefreshCw className="h-8 w-8 text-amber-600 animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-800">
                Loading Official Brand Repositories...
              </p>
            </div>
          ) : filteredRepositories.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-300 p-12 text-center space-y-4 max-w-lg mx-auto shadow-xs">
              <div className="h-12 w-12 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  No brand repository found.
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  No registered brand matched "{brandSearchQuery}". You can register this brand dossier now.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewBrandName(brandSearchQuery);
                  setIsAddRepoModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold transition shadow cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                <span>Add "{brandSearchQuery}" as New Repository</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRepositories.map((repo, idx) => {
                const passRate = repo.compliance_score_avg ?? 100;
                return (
                  <div
                    key={repo.repository_id}
                    onClick={() => handleSelectBrandRepo(repo)}
                    className="bg-white border border-slate-300 hover:border-amber-500 rounded-lg p-5 shadow-xs card-hover-effect cursor-pointer flex flex-col justify-between space-y-4 group animate-fade-in"
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <div>
                      {/* Top Brand Tag & Status */}
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className="px-2.5 py-0.5 bg-slate-900 text-amber-400 font-mono text-[11px] font-bold rounded uppercase tracking-wider shadow-2xs">
                          {repo.category}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded shadow-2xs">
                          {repo.monitoring_status || 'Surveillance'}
                        </span>
                      </div>

                      {/* Brand Title */}
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-amber-600 transition-colors flex items-center justify-between">
                        <span>{repo.brand_name}</span>
                        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-transform" />
                      </h3>

                      <p className="text-xs text-slate-600 font-medium line-clamp-1 mt-0.5">
                        {repo.company_name}
                      </p>

                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                        {repo.description}
                      </p>
                    </div>

                    {/* Quick Stats Strip */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 p-2 rounded border border-slate-200">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Past Audits
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {repo.total_inspections} Records
                          </span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded border border-slate-200">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Compliance Score
                          </span>
                          <span
                            className={`text-sm font-bold ${
                              passRate >= 95 ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {passRate}% Avg
                          </span>
                        </div>
                      </div>

                      {/* Recent Products Peek */}
                      {repo.recent_products && repo.recent_products.length > 0 && (
                        <div className="text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700">Audited Commodities: </span>
                          <span>{repo.recent_products.join(', ')}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[11px] text-amber-700 font-bold group-hover:underline pt-1">
                        <span>Open {repo.brand_name} Repository</span>
                        <span>{repo.total_inspections} inspection reports →</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            VIEW B: BRAND DRILLDOWN (REPORTS FOR THE CLICKED BRAND)
           ───────────────────────────────────────────────────────────── */
        <div className="space-y-6">
          {/* Brand Dossier Header Card */}
          <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-xs">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="bg-slate-900 text-amber-400 font-black text-sm px-2.5 py-0.5 rounded uppercase tracking-wider">
                    {selectedRepo.brand_name}
                  </span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                    {selectedRepo.monitoring_status || 'Active Surveillance'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedRepo.company_name}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span>
                    <strong>Jurisdiction:</strong> {selectedRepo.jurisdiction}
                  </span>
                  <span>•</span>
                  <span>
                    <strong>Category:</strong> {selectedRepo.category}
                  </span>
                  <span>•</span>
                  <span>
                    <strong>FSSAI License:</strong>{' '}
                    <code className="font-mono text-slate-800 font-bold">
                      {selectedRepo.fssai_license || 'Verified'}
                    </code>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/inspection')}
                  className="inline-flex items-center px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold shadow transition cursor-pointer"
                >
                  <FileCheck className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
                  <span>Run New Audit for {selectedRepo.brand_name}</span>
                </button>
              </div>
            </div>

            {/* Officer Surveillance Dossier Note */}
            {selectedRepo.officer_notes && (
              <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200 rounded text-xs text-amber-900 flex items-start space-x-2">
                <ShieldCheck className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Enforcement Officer Surveillance Notes: </strong>
                  <span>{selectedRepo.officer_notes}</span>
                </div>
              </div>
            )}
          </div>

          {/* Search & Filter within this Brand's Reports */}
          <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={reportSearchQuery}
                onChange={(e) => setReportSearchQuery(e.target.value)}
                placeholder={`Search ${selectedRepo.brand_name} reports (Bhujia, Chips, Batch)...`}
                className="w-full pl-8 pr-7 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
              {reportSearchQuery && (
                <button
                  type="button"
                  onClick={() => setReportSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setReportStatusFilter('ALL')}
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                  reportStatusFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All ({selectedRepo.inspections?.length ?? 0})
              </button>
              <button
                type="button"
                onClick={() => setReportStatusFilter('PASS')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                  reportStatusFilter === 'PASS'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-emerald-700'
                }`}
              >
                Compliant
              </button>
              <button
                type="button"
                onClick={() => setReportStatusFilter('REVIEW')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                  reportStatusFilter === 'REVIEW'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-amber-700'
                }`}
              >
                Review
              </button>
              <button
                type="button"
                onClick={() => setReportStatusFilter('FAIL')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                  reportStatusFilter === 'FAIL'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-rose-700'
                }`}
              >
                Violations
              </button>
            </div>
          </div>

          {/* Reports Listing under this Brand */}
          {filteredReportsInSelectedRepo.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-300 p-12 text-center space-y-4 max-w-md mx-auto shadow-xs">
              <div className="h-12 w-12 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <FileCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  No inspection reports found for {selectedRepo.brand_name}.
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Upload a packaged commodity label to register this brand's first official inspection report.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/inspection')}
                className="inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition shadow cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
                <span>Perform First Inspection</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReportsInSelectedRepo.map((item, idx) => {
                const idStr = item.inspection_id || `INSP_${idx + 1}`;
                const prod = (item.product as any) || {};
                const productName =
                  prod.product_name || item.filename || `${selectedRepo.brand_name} Commodity`;
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
                    {/* Header Strip */}
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

                    {/* Info & Summary Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                      <div className="lg:col-span-8 space-y-2">
                        <div className="flex items-baseline space-x-2">
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-amber-400 text-[11px] font-black uppercase tracking-wider">
                            {selectedRepo.brand_name}
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
                              MRP / Sale Price
                            </span>
                            <span className="font-semibold text-slate-800">
                              {prod.mrp || 'Statutory MRP'}
                            </span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded border border-slate-200">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">
                              Batch / Mfg Date
                            </span>
                            <span className="font-mono text-slate-800 text-[11px]">
                              {prod.batch_number || prod.mfg_date || 'Standard'}
                            </span>
                          </div>
                        </div>

                        {prod.manufacturer && (
                          <p className="text-[11px] text-slate-500 leading-tight">
                            <strong>Packer / Mfg:</strong> {prod.manufacturer}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="lg:col-span-4 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-200 pt-3 lg:pt-0 lg:pl-4 space-y-3">
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between text-slate-600">
                            <span>Legal Metrology Checks:</span>
                            <span className="font-bold text-slate-800">
                              {item.summary?.passed ?? 0} Passed /{' '}
                              {item.summary?.total_checks ?? 12} Total
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
                              <span>Violations Flagged:</span>
                              <span className="font-bold">{item.summary.failed}</span>
                            </div>
                          ) : null}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setInspectionData(
                                item,
                                new File([], item.filename || 'image.png')
                              );
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
                              setSelectedInspectionForReport(item);
                              setIsReportModalOpen(true);
                            }}
                            className="inline-flex items-center px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold shadow-2xs transition cursor-pointer"
                          >
                            <FileText className="h-3 w-3 mr-1" />
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
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ADD NEW BRAND REPOSITORY
         ───────────────────────────────────────────────────────────── */}
      {isAddRepoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col border border-slate-300">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-900 text-white rounded-t-lg">
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-amber-400" />
                <span className="font-bold text-sm">Register New Brand Repository</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddRepoModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateRepoSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 font-semibold">
                  {formError}
                </div>
              )}

              {/* Brand Name & Parent Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Brand Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    placeholder="e.g. Tata Tea, Cadbury, Parle..."
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Parent Manufacturer / Company
                  </label>
                  <input
                    type="text"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="e.g. Tata Consumer Products Ltd."
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Category & Jurisdiction */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Commodity Category
                  </label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="e.g. Packaged Savoury Snacks, Dairy..."
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Enforcement Jurisdiction
                  </label>
                  <input
                    type="text"
                    value={newJurisdiction}
                    onChange={(e) => setNewJurisdiction(e.target.value)}
                    placeholder="e.g. Delhi NCR, Maharashtra, Gujarat..."
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* FSSAI License & Surveillance Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    FSSAI Central / State License No.
                  </label>
                  <input
                    type="text"
                    value={newFssaiLicense}
                    onChange={(e) => setNewFssaiLicense(e.target.value)}
                    placeholder="14-digit FSSAI Number"
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Surveillance Level
                  </label>
                  <select
                    value={newMonitoringStatus}
                    onChange={(e) => setNewMonitoringStatus(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium bg-white"
                  >
                    <option value="Active Surveillance">Active Surveillance</option>
                    <option value="Routine Surveillance">Routine Surveillance</option>
                    <option value="High Priority Retail Audit">High Priority Retail Audit</option>
                    <option value="Under Notice Investigation">Under Notice Investigation</option>
                  </select>
                </div>
              </div>

              {/* Officer Surveillance Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Surveillance Notes & Inspection Guidelines
                </label>
                <textarea
                  rows={2}
                  value={newOfficerNotes}
                  onChange={(e) => setNewOfficerNotes(e.target.value)}
                  placeholder="Specific compliance checks (e.g. check for metric unit spacing, net quantity font height, preservative limits)..."
                  className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Optional Initial Commodity */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
                <span className="font-bold text-slate-800 block text-xs">
                  Initial Commodity Track Record (Optional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <input
                      type="text"
                      value={newInitialProduct}
                      onChange={(e) => setNewInitialProduct(e.target.value)}
                      placeholder="Product Name (e.g. Classic Salted 50g)"
                      className="w-full p-1.5 border border-slate-300 rounded text-xs focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={newInitialNetQty}
                      onChange={(e) => setNewInitialNetQty(e.target.value)}
                      placeholder="Net Qty (e.g. 50 g)"
                      className="w-full p-1.5 border border-slate-300 rounded text-xs focus:outline-none bg-white"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      value={newInitialMrp}
                      onChange={(e) => setNewInitialMrp(e.target.value)}
                      placeholder="MRP (e.g. ₹20.00)"
                      className="w-full p-1.5 border border-slate-300 rounded text-xs focus:outline-none bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddRepoModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold shadow transition cursor-pointer flex items-center space-x-1.5"
                >
                  {formSubmitting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      <span>Register Brand Repository</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {activeReportData && (
        <InspectionReportModal
          isOpen={isReportModalOpen}
          onClose={() => {
            setIsReportModalOpen(false);
            setSelectedInspectionForReport(null);
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
