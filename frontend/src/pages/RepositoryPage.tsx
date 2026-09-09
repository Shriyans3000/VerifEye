import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Folder, 
  Package, 
  History, 
  FileText, 
  Search, 
  ChevronRight, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  User, 
  ArrowLeft, 
  Building2, 
  Calendar, 
  Sparkles
} from 'lucide-react';
import { MOCK_REPOSITORY_DATA, RepositoryBrand, RepositoryProductInspection } from '../data/mockRepository';
import { ResultView } from '../components/ResultView';

export const RepositoryPage: React.FC = () => {
  const navigate = useNavigate();

  // Navigation hierarchy state
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);

  // Live database inspections merged with repository
  const [liveInspections, setLiveInspections] = useState<any[]>([]);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASS' | 'REVIEW_REQUIRED' | 'NON_COMPLIANT'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Fetch live inspections from backend MongoDB
  useEffect(() => {
    const fetchLive = async () => {
      try {
        const res = await fetch('/api/inspections?limit=50');
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json)) {
            setLiveInspections(json);
          }
        }
      } catch (err) {
        console.warn('Could not fetch live inspections for repository:', err);
      }
    };
    fetchLive();
  }, []);

  // Merge live database inspections into brands structure
  const repositoryBrands = useMemo(() => {
    const brands: RepositoryBrand[] = JSON.parse(JSON.stringify(MOCK_REPOSITORY_DATA));

    if (liveInspections.length > 0) {
      liveInspections.forEach((insp) => {
        const prodName = insp.product?.product_name || 'Uncategorized Inspected Product';
        const brandName = insp.product?.manufacturer || 'Field Inspected Brand';
        const brandKey = brandName.toLowerCase().replace(/[^a-z0-9]/g, '');

        let targetBrand = brands.find(
          (b) => b.name.toLowerCase().includes(brandKey.slice(0, 5)) || brandKey.includes(b.id)
        );

        if (!targetBrand) {
          targetBrand = {
            id: `brand_${brandKey.slice(0, 10) || 'field'}`,
            name: brandName,
            manufacturer: insp.product?.manufacturer || brandName,
            headquarters: insp.product?.manufacturer_address || 'Regional Jurisdiction',
            fssaiLicense: insp.product?.fssai_number || '10000000000000',
            category: 'Packaged Commodities',
            totalInspections: 0,
            complianceRate: 90.0,
            products: [],
          };
          brands.unshift(targetBrand);
        }

        let targetProduct = targetBrand.products.find(
          (p) => p.name.toLowerCase() === prodName.toLowerCase()
        );

        const inspItem: RepositoryProductInspection = {
          inspection_id: insp.inspection_id || `insp_${Math.random().toString(36).slice(2, 8)}`,
          timestamp: insp.timestamp || insp.meta?.timestamp || new Date().toISOString(),
          officer_name: 'Field Enforcement Officer',
          badge_id: 'LM-FLD-01',
          status: insp.status === 'PASS' ? 'PASS' : insp.status === 'FAIL' ? 'NON_COMPLIANT' : 'REVIEW_REQUIRED',
          compliance_score: insp.compliance_score || 0,
          filename: insp.filename || 'package.png',
          summary: insp.summary || { total_checks: 12, passed: 0, failed: 0, review_required: 12 },
          product: insp.product || {},
          checks: insp.checks || [],
          validation_checks: insp.validation_checks || [],
          readability: insp.readability,
        };

        if (!targetProduct) {
          targetProduct = {
            id: `prod_${Math.random().toString(36).slice(2, 8)}`,
            name: prodName,
            category: targetBrand.category,
            netQuantity: insp.product?.net_quantity || 'Standard',
            mrp: insp.product?.mrp ? `₹${insp.product.mrp}` : 'Declared',
            fssaiNumber: insp.product?.fssai_number || targetBrand.fssaiLicense,
            inspections: [inspItem],
          };
          targetBrand.products.push(targetProduct);
        } else {
          if (!targetProduct.inspections.some((i) => i.inspection_id === inspItem.inspection_id)) {
            targetProduct.inspections.unshift(inspItem);
          }
        }
        targetBrand.totalInspections = targetBrand.products.reduce((acc, p) => acc + p.inspections.length, 0);
      });
    }

    return brands;
  }, [liveInspections]);

  const currentBrand = useMemo(
    () => repositoryBrands.find((b) => b.id === selectedBrandId) || null,
    [repositoryBrands, selectedBrandId]
  );

  const currentProduct = useMemo(
    () => currentBrand?.products.find((p) => p.id === selectedProductId) || null,
    [currentBrand, selectedProductId]
  );

  const currentInspection = useMemo(() => {
    if (!currentProduct) return null;
    return currentProduct.inspections.find((i) => i.inspection_id === selectedInspectionId) || null;
  }, [currentProduct, selectedInspectionId]);

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    repositoryBrands.forEach((b) => {
      set.add(b.category);
    });
    return Array.from(set);
  }, [repositoryBrands]);

  const filteredBrands = useMemo(() => {
    return repositoryBrands.filter((b) => {
      if (selectedCategory !== 'ALL' && b.category !== selectedCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesBrand = b.name.toLowerCase().includes(q) || b.manufacturer.toLowerCase().includes(q) || b.fssaiLicense.includes(q);
        const matchesProducts = b.products.some(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.inspections.some((i) => i.product.batch_number?.toLowerCase().includes(q))
        );
        if (!matchesBrand && !matchesProducts) return false;
      }
      return true;
    });
  }, [repositoryBrands, selectedCategory, searchQuery]);

  const filteredProducts = useMemo(() => {
    if (!currentBrand) return [];
    return currentBrand.products.filter((p) => {
      if (statusFilter !== 'ALL') {
        const latest = p.inspections[0];
        if (!latest || latest.status !== statusFilter) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBatch = p.inspections.some((i) => i.product.batch_number?.toLowerCase().includes(q));
        if (!matchesName && !matchesBatch) return false;
      }
      return true;
    });
  }, [currentBrand, statusFilter, searchQuery]);

  const handleSelectBrand = (brandId: string) => {
    setSelectedBrandId(brandId);
    setSelectedProductId(null);
    setSelectedInspectionId(null);
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    setSelectedInspectionId(null);
  };

  const handleSelectInspection = (inspectionId: string) => {
    setSelectedInspectionId(inspectionId);
  };

  const resetToBrands = () => {
    setSelectedBrandId(null);
    setSelectedProductId(null);
    setSelectedInspectionId(null);
  };

  const resetToBrand = () => {
    setSelectedProductId(null);
    setSelectedInspectionId(null);
  };

  const resetToProduct = () => {
    setSelectedInspectionId(null);
  };

  return (
    <div className="space-y-6">

      {/* Top Banner Card (Consistent with Dashboard & Reports) */}
      <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            <Folder className="h-4 w-4" />
            <span>Digital Enforcement Archive</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Product & Brand Repository
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Statutory hierarchy of inspected packaged commodities, manufacturer licenses, and historical compliance audits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            MongoDB Atlas Synced
          </span>
          <button
            type="button"
            onClick={() => navigate('/inspection')}
            className="px-3.5 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" /> Inspect New SKU
          </button>
        </div>
      </div>

      {/* Interactive Breadcrumb Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5 flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <button
          type="button"
          onClick={resetToBrands}
          className={`hover:text-amber-700 transition-colors flex items-center gap-1 font-bold cursor-pointer ${
            !selectedBrandId ? 'text-amber-700 underline' : 'text-slate-700'
          }`}
        >
          <Folder className="w-3.5 h-3.5 text-amber-600" />
          Repository Root
        </button>

        {currentBrand && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <button
              type="button"
              onClick={resetToBrand}
              className={`hover:text-amber-700 transition-colors flex items-center gap-1 font-bold cursor-pointer ${
                !selectedProductId ? 'text-amber-700 underline' : 'text-slate-700'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              {currentBrand.name}
            </button>
          </>
        )}

        {currentProduct && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <button
              type="button"
              onClick={resetToProduct}
              className={`hover:text-amber-700 transition-colors flex items-center gap-1 font-bold cursor-pointer ${
                !selectedInspectionId ? 'text-amber-700 underline' : 'text-slate-700'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-slate-500" />
              {currentProduct.name}
            </button>
          </>
        )}

        {currentInspection && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-900 font-bold flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              Audit Record #{currentInspection.inspection_id}
            </span>
          </>
        )}
      </div>

      {/* ====================================================== */}
      {/* VIEW LEVEL 4: INSPECTION DETAIL VIEW */}
      {/* ====================================================== */}
      {currentInspection ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-300 shadow-xs">
            <button
              type="button"
              onClick={resetToProduct}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors border border-slate-300 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-600" /> Back to {currentProduct?.name} History
            </button>

            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-600" />
                {currentInspection.officer_name} ({currentInspection.badge_id})
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {new Date(currentInspection.timestamp).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Mount Full ResultView */}
          <ResultView
            data={{
              inspection_id: currentInspection.inspection_id,
              filename: currentInspection.filename,
              timestamp: currentInspection.timestamp,
              success: true,
              status: currentInspection.status,
              compliance_score: currentInspection.compliance_score,
              summary: currentInspection.summary,
              product: currentInspection.product as any,
              checks: currentInspection.checks as any,
              validation_checks: currentInspection.validation_checks as any,
              readability: currentInspection.readability as any,
              meta: {
                regions_detected: currentInspection.checks.reduce((acc, c) => acc + (c.evidence?.length || 0), 0),
                timestamp: currentInspection.timestamp,
              },
            }}
            imageUrl={`/test_images/test_image2.png`}
          />
        </div>
      ) : selectedProductId && currentProduct ? (
        /* ====================================================== */
        /* VIEW LEVEL 3: PRODUCT INSPECTION HISTORY TIMELINE */
        /* ====================================================== */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={resetToBrand}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors border border-slate-300 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-600" /> Back to {currentBrand?.name} Products
            </button>

            <span className="text-xs text-slate-500 font-medium">
              Total SKUs Audited: <strong className="text-slate-800">{currentProduct.inspections.length}</strong>
            </span>
          </div>

          {/* Product Profile Banner */}
          <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{currentProduct.name}</h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>Category: <strong className="text-slate-800">{currentProduct.category}</strong></span>
                  <span>&bull;</span>
                  <span>Net Qty: <strong className="text-slate-800">{currentProduct.netQuantity}</strong></span>
                  <span>&bull;</span>
                  <span>Standard MRP: <strong className="text-slate-800">{currentProduct.mrp}</strong></span>
                  <span>&bull;</span>
                  <span>FSSAI: <strong className="text-slate-800 font-mono">{currentProduct.fssaiNumber}</strong></span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/inspection')}
              className="px-4 py-2 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Audit This Product
            </button>
          </div>

          {/* Inspections Timeline List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <History className="w-4 h-4 text-amber-600" /> Inspection History & Audit Trail
            </h4>

            <div className="grid grid-cols-1 gap-3">
              {currentProduct.inspections.map((insp) => (
                <div
                  key={insp.inspection_id}
                  onClick={() => handleSelectInspection(insp.inspection_id)}
                  className="bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-lg p-4 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group shadow-xs"
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      insp.status === 'PASS'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}>
                      {insp.status === 'PASS' ? (
                        <ShieldCheck className="w-5 h-5" />
                      ) : (
                        <ShieldAlert className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          #{insp.inspection_id}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          insp.status === 'PASS'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {insp.status}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-800">
                          Score: {insp.compliance_score.toFixed(1)}%
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(insp.timestamp).toLocaleDateString()} at {new Date(insp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          {insp.officer_name} ({insp.badge_id})
                        </span>
                        {insp.product.batch_number && (
                          <>
                            <span>&bull;</span>
                            <span className="font-mono text-slate-700 font-bold">
                              Batch: {insp.product.batch_number}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right hidden sm:block">
                      <span className="text-[11px] text-slate-500 block">Passed Checks</span>
                      <span className="text-xs font-bold text-slate-900">
                        {insp.summary?.passed || 0} / {insp.summary?.total_checks || 12}
                      </span>
                    </div>

                    <div className="p-1.5 rounded bg-slate-100 text-slate-600 group-hover:bg-amber-600 group-hover:text-white transition">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : selectedBrandId && currentBrand ? (
        /* ====================================================== */
        /* VIEW LEVEL 2: BRAND PRODUCT CATALOG */
        /* ====================================================== */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={resetToBrands}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors border border-slate-300 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-600" /> Back to All Brands
            </button>

            <span className="text-xs text-slate-500 font-medium">
              Products in Brand: <strong className="text-slate-900">{currentBrand.products.length}</strong>
            </span>
          </div>

          {/* Brand Header Banner */}
          <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900">{currentBrand.name}</h3>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {currentBrand.category}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                {currentBrand.manufacturer} &bull; {currentBrand.headquarters}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-2 font-mono">
                <span>Central FSSAI: <strong className="text-slate-900">{currentBrand.fssaiLicense}</strong></span>
                <span>&bull;</span>
                <span>Compliance Rate: <strong className="text-emerald-700 font-bold">{currentBrand.complianceRate}%</strong></span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/inspection')}
              className="px-4 py-2 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Inspect New SKU
            </button>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-300 shadow-xs">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search product SKU name or batch number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:bg-white transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-amber-600"
              >
                <option value="ALL">All Statuses</option>
                <option value="PASS">Pass (Compliant)</option>
                <option value="REVIEW_REQUIRED">Review Required</option>
                <option value="NON_COMPLIANT">Non-Compliant</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white rounded-lg border border-slate-300 text-slate-500 shadow-xs">
                <Package className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="text-xs italic">No products found matching your filter criteria.</p>
              </div>
            ) : (
              filteredProducts.map((prod) => {
                const latestInsp = prod.inspections[0];
                return (
                  <div
                    key={prod.id}
                    onClick={() => handleSelectProduct(prod.id)}
                    className="bg-white hover:bg-slate-50 border border-slate-300 hover:border-amber-500 rounded-lg p-5 transition cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {prod.category}
                        </span>
                        {latestInsp && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            latestInsp.status === 'PASS'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}>
                            {latestInsp.status}
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors line-clamp-2">
                        {prod.name}
                      </h4>

                      <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span>Net Quantity:</span>
                          <strong className="text-slate-900">{prod.netQuantity}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Declared MRP:</span>
                          <strong className="text-slate-900">{prod.mrp}</strong>
                        </div>
                        <div className="flex justify-between font-mono text-[11px]">
                          <span>FSSAI Lic:</span>
                          <span className="text-slate-700 font-bold">{prod.fssaiNumber}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1 text-[11px] font-medium">
                        <History className="w-3.5 h-3.5 text-slate-400" />
                        {prod.inspections.length} {prod.inspections.length === 1 ? 'Audit' : 'Audits'}
                      </span>

                      <span className="text-amber-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-bold text-[11px]">
                        View History <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* ====================================================== */
        /* VIEW LEVEL 1: ALL BRANDS (ROOT REPOSITORY) */
        /* ====================================================== */
        <div className="space-y-6">
          {/* Search & Filter Toolbar */}
          <div className="bg-white border border-slate-300 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search brand, manufacturer, product SKU or FSSAI license..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:bg-white transition-colors"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                All Categories
              </button>
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Brands Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredBrands.map((brand) => (
              <div
                key={brand.id}
                onClick={() => handleSelectBrand(brand.id)}
                className="bg-white hover:bg-slate-50 border border-slate-300 hover:border-amber-500 rounded-lg p-5 transition cursor-pointer flex flex-col justify-between group shadow-xs hover:shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 group-hover:scale-105 transition-transform">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      {brand.complianceRate}% Compliant
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                    {brand.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {brand.manufacturer} &bull; {brand.headquarters}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Catalog SKUs</span>
                      <strong className="text-slate-800 font-bold">{brand.products.length} Products</strong>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Total Audits</span>
                      <strong className="text-slate-800 font-bold">{brand.totalInspections} Recorded</strong>
                    </div>
                  </div>

                  <div className="mt-3 text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                    FSSAI Lic: <span className="text-slate-900 font-bold">{brand.fssaiLicense}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-amber-700 font-bold">
                  <span>Open Brand Archive</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-amber-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
