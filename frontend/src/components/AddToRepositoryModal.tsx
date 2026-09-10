import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Database,
  Building2,
  FolderPlus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
  Plus,
  Tag,
  Sparkles,
} from 'lucide-react';
import { AnalyzeResponse, BrandRepository } from '../types/api';
import { fetchBrandRepositories, createBrandRepository, addInspectionToRepository } from '../services/api';

interface AddToRepositoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AnalyzeResponse;
  imageFile?: File | null;
}

export const AddToRepositoryModal: React.FC<AddToRepositoryModalProps> = ({
  isOpen,
  onClose,
  data,
  imageFile,
}) => {
  const navigate = useNavigate();
  const [repositories, setRepositories] = useState<BrandRepository[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRepoId, setSelectedRepoId] = useState<string>('');
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    brandName: string;
    repoId: string;
    inspectionId: string;
  } | null>(null);

  // New Repository Form State
  const [newBrandName, setNewBrandName] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCategory, setNewCategory] = useState('Packaged Food');
  const [newJurisdiction, setNewJurisdiction] = useState('National Enforcement');

  const inspectionId = data.inspection_id || `INSP-${Date.now().toString().slice(-6)}`;
  const brandNameDetected = data.product?.brand || '';
  const productName = data.product?.product_name || data.filename || 'Inspected Commodity';

  useEffect(() => {
    if (!isOpen) {
      setSuccessResult(null);
      setErrorMessage(null);
      return;
    }

    const loadRepos = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const repos = await fetchBrandRepositories();
        setRepositories(repos);

        // Auto-detect matching repository
        if (brandNameDetected) {
          const matched = repos.find(
            (r) =>
              r.brand_name.toLowerCase().includes(brandNameDetected.toLowerCase()) ||
              brandNameDetected.toLowerCase().includes(r.brand_name.toLowerCase())
          );
          if (matched) {
            setSelectedRepoId(matched.repository_id);
            setMode('select');
          } else {
            // Suggest creating one
            setNewBrandName(brandNameDetected);
            setNewCompanyName(data.product?.manufacturer || brandNameDetected);
            if (repos.length > 0) {
              setSelectedRepoId(repos[0].repository_id);
            }
          }
        } else if (repos.length > 0) {
          setSelectedRepoId(repos[0].repository_id);
        }
      } catch (err: any) {
        setErrorMessage('Failed to load existing repositories.');
      } finally {
        setLoading(false);
      }
    };

    loadRepos();
  }, [isOpen, brandNameDetected, data.product]);

  if (!isOpen) return null;

  const filteredRepos = repositories.filter(
    (r) =>
      r.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.company_name && r.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedRepo = repositories.find((r) => r.repository_id === selectedRepoId);

  const handleSaveToExisting = async () => {
    if (!selectedRepoId) {
      setErrorMessage('Please select a brand repository to link this inspection.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    try {
      const res = await addInspectionToRepository(selectedRepoId, inspectionId, data);
      setSuccessResult({
        brandName: res.brand_name || selectedRepo?.brand_name || 'Brand Repository',
        repoId: selectedRepoId,
        inspectionId,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to link inspection to repository.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) {
      setErrorMessage('Brand name is required.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    try {
      const created = await createBrandRepository({
        brand_name: newBrandName.trim(),
        company_name: newCompanyName.trim() || newBrandName.trim(),
        category: newCategory,
        jurisdiction: newJurisdiction,
        description: `Enforcement repository for ${newBrandName.trim()} packaged commodities.`,
      });

      // Now link this inspection to the newly created repository
      await addInspectionToRepository(created.repository_id, inspectionId, data);

      setSuccessResult({
        brandName: created.brand_name,
        repoId: created.repository_id,
        inspectionId,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create brand repository.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-2xl w-full overflow-hidden transition-all transform scale-100">
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-md border border-indigo-500/30">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight text-white flex items-center space-x-2">
                <span>Save Inspection to Brand Repository</span>
              </h2>
              <p className="text-xs text-slate-400">
                Organize statutory inspection reports by brand and commodity for future surveillance audits.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Inspection Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                Target Inspection Record • #{inspectionId}
              </span>
              <p className="text-sm font-bold text-slate-900 line-clamp-1">{productName}</p>
              <div className="flex items-center space-x-3 text-xs text-slate-600 mt-1">
                {brandNameDetected && (
                  <span className="inline-flex items-center font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-[11px]">
                    <Tag className="h-3 w-3 mr-1" />
                    {brandNameDetected}
                  </span>
                )}
                <span>
                  Status:{' '}
                  <strong
                    className={
                      data.status === 'PASS' || data.status === 'COMPLIANT'
                        ? 'text-emerald-700'
                        : 'text-amber-700'
                    }
                  >
                    {data.status || 'COMPLETED'}
                  </strong>
                </span>
                <span>
                  Score: <strong>{data.compliance_score ?? 100}%</strong>
                </span>
              </div>
            </div>

            {imageFile && (
              <div className="h-14 w-14 rounded border border-slate-300 bg-white p-1 flex-shrink-0 flex items-center justify-center overflow-hidden">
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="Inspection Thumbnail"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}
          </div>

          {/* Success Result View */}
          {successResult ? (
            <div className="py-6 text-center space-y-4">
              <div className="h-16 w-16 bg-emerald-100 text-emerald-700 border-2 border-emerald-300 rounded-full flex items-center justify-center mx-auto animate-bounce-short">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">
                  Successfully Archived in Brand Repository!
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Inspection <strong>#{successResult.inspectionId}</strong> has been cataloged under{' '}
                  <strong className="text-indigo-700">{successResult.brandName}</strong>. All past surveillance
                  records and audit histories are consolidated.
                </p>
              </div>

              <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/repository');
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-indigo-900 hover:bg-indigo-800 text-white rounded-md text-xs font-bold shadow transition cursor-pointer"
                >
                  <Database className="h-3.5 w-3.5 mr-1.5 text-indigo-300" />
                  <span>Open Brand Repository</span>
                  <ExternalLink className="h-3 w-3 ml-1.5 opacity-70" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold shadow-2xs transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Error Banner */}
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-md text-xs flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Mode Toggle */}
              <div className="flex border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setMode('select')}
                  className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
                    mode === 'select'
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Select Existing Brand Repository</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('create')}
                  className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition flex items-center space-x-1.5 cursor-pointer ${
                    mode === 'create'
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                  <span>Create New Brand Repository</span>
                </button>
              </div>

              {/* Mode 1: Select Existing Repository */}
              {mode === 'select' && (
                <div className="space-y-3">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search existing brand repositories (e.g. Haldiram's, Lay's, Britannia)..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Repository Cards List */}
                  <div className="max-h-56 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-2 bg-slate-50/50">
                    {loading ? (
                      <div className="text-center py-6 text-xs text-slate-500">
                        Loading brand dossiers...
                      </div>
                    ) : filteredRepos.length === 0 ? (
                      <div className="text-center py-6 space-y-2">
                        <p className="text-xs text-slate-500">
                          No matching brand repository found.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setMode('create');
                            setNewBrandName(searchTerm || brandNameDetected);
                          }}
                          className="inline-flex items-center text-xs font-bold text-indigo-700 hover:text-indigo-800"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Create repository for "{searchTerm || brandNameDetected || 'New Brand'}"
                        </button>
                      </div>
                    ) : (
                      filteredRepos.map((repo) => {
                        const isSelected = selectedRepoId === repo.repository_id;
                        const isMatched =
                          brandNameDetected &&
                          repo.brand_name.toLowerCase().includes(brandNameDetected.toLowerCase());

                        return (
                          <div
                            key={repo.repository_id}
                            onClick={() => setSelectedRepoId(repo.repository_id)}
                            className={`p-3 rounded-lg border text-left transition cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-indigo-50/80 border-indigo-500 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-2">
                                <span className="font-bold text-xs text-slate-900">
                                  {repo.brand_name}
                                </span>
                                {isMatched && (
                                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-amber-100 text-amber-800">
                                    <Sparkles className="h-2.5 w-2.5 mr-1 text-amber-600" /> Matched
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500">
                                {repo.company_name} • {repo.category || 'Commodity'}
                              </p>
                            </div>

                            <div className="flex items-center space-x-3 text-right">
                              <div className="text-[11px] text-slate-600">
                                <span className="font-bold text-slate-900 block">
                                  {repo.total_inspections || 0} inspections
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Avg {repo.compliance_score_avg ?? 100}%
                                </span>
                              </div>
                              <div
                                className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                                  isSelected
                                    ? 'border-indigo-600 bg-indigo-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex justify-end items-center space-x-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveToExisting}
                      disabled={saving || !selectedRepoId}
                      className="inline-flex items-center px-4 py-2 bg-indigo-900 hover:bg-indigo-800 disabled:opacity-50 text-white rounded-md text-xs font-bold shadow transition cursor-pointer"
                    >
                      {saving ? (
                        <span>Archiving...</span>
                      ) : (
                        <>
                          <FolderPlus className="h-3.5 w-3.5 mr-1.5 text-indigo-300" />
                          <span>Link to {selectedRepo?.brand_name || 'Selected Repository'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Mode 2: Create New Repository */}
              {mode === 'create' && (
                <form onSubmit={handleCreateAndSave} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Brand Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Haldiram's, Lay's, Amul"
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Parent Company / Manufacturer
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., PepsiCo India Holdings Pvt. Ltd."
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Commodity Category
                      </label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="Packaged Savoury Snacks">Packaged Savoury Snacks</option>
                        <option value="Potato Chips & Crisps">Potato Chips & Crisps</option>
                        <option value="Biscuits & Bakery Products">Biscuits & Bakery Products</option>
                        <option value="Dairy & Milk Products">Dairy & Milk Products</option>
                        <option value="Packaged Beverages">Packaged Beverages</option>
                        <option value="General Packaged Commodity">General Packaged Commodity</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                        Enforcement Jurisdiction
                      </label>
                      <input
                        type="text"
                        value={newJurisdiction}
                        onChange={(e) => setNewJurisdiction(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-tight">
                    * Creating this repository will create a central dossier for{' '}
                    <strong>{newBrandName || 'this brand'}</strong> and automatically attach this inspection as
                    its first official statutory surveillance record.
                  </p>

                  {/* Actions */}
                  <div className="pt-2 flex justify-end items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setMode('select')}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Back to Selection
                    </button>
                    <button
                      type="submit"
                      disabled={saving || !newBrandName.trim()}
                      className="inline-flex items-center px-4 py-2 bg-indigo-900 hover:bg-indigo-800 disabled:opacity-50 text-white rounded-md text-xs font-bold shadow transition cursor-pointer"
                    >
                      {saving ? (
                        <span>Creating & Linking...</span>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5 mr-1.5 text-indigo-300" />
                          <span>Create Brand Repository & Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
