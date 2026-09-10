import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ShieldAlert, CheckCircle2, AlertCircle, FlaskConical, ArrowRight } from 'lucide-react';

export const GuidelinesPage: React.FC = () => {
  const declarationRules = [
    {
      id: 1,
      name: 'Manufacturer / Packer / Importer',
      rule: 'Rule 6(1)(a)',
      description: 'The name and complete address of the manufacturer or packer or importer must be clearly declared on every package.',
      statutoryDetails: 'Must not be abbreviated to an unrecognizable acronym. For imported goods, the name and address of the importer must be declared.',
    },
    {
      id: 2,
      name: 'Manufacturer Address',
      rule: 'Rule 6(1)(a)',
      description: 'The full physical premises address where the commodity was manufactured or packed.',
      statutoryDetails: 'Must provide sufficient geographic specificity (street/area, city, state, pin code) for postal correspondence and regulatory inspection.',
    },
    {
      id: 3,
      name: 'Common / Generic Name of Commodity',
      rule: 'Rule 6(1)(b)',
      description: 'The generic or common commodity name identifying what the package contains.',
      statutoryDetails: 'Brand names, trademarked names, or fanciful marketing designations alone are not sufficient; the standard generic name is mandatory.',
    },
    {
      id: 4,
      name: 'Net Quantity',
      rule: 'Rule 6(1)(c)',
      description: 'The net quantity in terms of standard metric units (mass or measure or count).',
      statutoryDetails: 'Must use standard units (g, kg, ml, l, m, cm, or number). Non-standard units or symbols like "gms", "cc", or "kilos" violate metric standards.',
    },
    {
      id: 5,
      name: 'Maximum Retail Price (MRP)',
      rule: 'Rule 6(1)(e)',
      description: 'The maximum retail price in Indian Rupees at which the package may be sold to the consumer.',
      statutoryDetails: 'Must be clearly stated in Indian Currency (₹ or Rs.). It is illegal to charge more than the declared Maximum Retail Price.',
    },
    {
      id: 6,
      name: 'MRP Tax Inclusion',
      rule: 'Rule 6(1)(e)',
      description: 'Explicit declaration that the MRP is inclusive of all taxes.',
      statutoryDetails: 'Must specify "Inclusive of all taxes" or "Incl. of all taxes". Declaring taxes separately or extra over MRP is strictly prohibited.',
    },
    {
      id: 7,
      name: 'Manufacture / Packing Date',
      rule: 'Rule 6(1)(d)',
      description: 'The month and year (or date) in which the commodity is manufactured or packed.',
      statutoryDetails: 'Recognized prefix labels include "MFG", "MFG DATE", "PKD", or "PACKED ON". Associating an unlabelled date with packing without an explicit prefix requires officer confirmation.',
    },
    {
      id: 8,
      name: 'Best Before / Use By Date',
      rule: 'Rule 6(1)(d) & Applicable Laws',
      description: 'The best-before, use-by, or expiry declaration indicating the period of safe consumption or usage.',
      statutoryDetails: 'Mandatory for perishable or designated food commodities. If the label lacks an explicit declaration, applicability requires inspector assessment.',
    },
    {
      id: 9,
      name: 'Batch / Lot Number',
      rule: 'Rule 6(1)(g)',
      description: 'A distinctive batch code, lot identification, or manufacturing control number.',
      statutoryDetails: 'Enables statutory product traceability and quality recall by enforcement and food safety authorities.',
    },
    {
      id: 10,
      name: 'Consumer Care Contact Details',
      rule: 'Rule 6(1)(m)',
      description: 'Name, telephone number, and email address of the consumer care cell or officer.',
      statutoryDetails: 'Must include active contact phone number and electronic mailing address for consumer grievances and complaints.',
    },
    {
      id: 11,
      name: 'Unit Sale Price (USP)',
      rule: 'Rule 6(1)(n)',
      description: 'Unit sale price expressed per gram, per kilogram, per millilitre, per litre, per centimetre, per metre, or per number.',
      statutoryDetails: 'Mandatory for packages containing more than 1 kg or 1 L (and packages containing multiple units) to allow consumers easy price comparison.',
    },
    {
      id: 12,
      name: 'Country of Origin',
      rule: 'Rule 6(1)(h)',
      description: 'The country where the commodity was produced or assembled.',
      statutoryDetails: 'Mandatory for all imported packages. For domestic products, declaration confirms sovereign manufacturing origin (e.g., "Product of India").',
    },
  ];

  const validationRules = [
    {
      id: 1,
      name: 'MRP ↔ Unit Sale Price Mathematical Consistency',
      type: 'Mathematical Logic',
      description: 'Cross-checks the ratio between declared Maximum Retail Price (MRP), Net Quantity, and Unit Sale Price (USP).',
      logic: 'Formula: USP ≈ MRP / Net Quantity. Detects arithmetic contradictions between declared package price and declared unit pricing.',
    },
    {
      id: 2,
      name: 'Chronological Date Consistency',
      type: 'Chronological Logic',
      description: 'Verifies the timeline relationship between the manufacturing/packing date and the best-before/use-by/expiry date.',
      logic: 'Enforces: Manufacturing Date ≤ Expiry / Use-By Date. Identifies chronologically impossible labels where expiry precedes manufacture.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-300 rounded-lg p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
            <BookOpen className="h-4 w-4" />
            <span>Statutory Guidance Reference</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Legal Metrology Statutory Guidelines
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Reference catalogue of the 12 mandatory statutory declaration categories and automated validation rules evaluated by VerifEye.
          </p>
        </div>
      </div>

      {/* Official Legal Disclaimer Box */}
      <div className="bg-amber-50 border-l-4 border-amber-600 rounded-lg p-4 text-xs text-amber-950 flex items-start space-x-3 shadow-2xs">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-950 uppercase tracking-wider text-[11px]">
            Official Administrative Notice
          </h4>
          <p className="mt-1 leading-relaxed">
            VerifEye provides automated inspection assistance based on implemented Legal Metrology declaration checks. This guidance is provided for enforcement reference and does not constitute formal legal counsel. Final administrative or compounding decisions rest solely with authorized Legal Metrology officers under the Legal Metrology Act, 2009.
          </p>
        </div>
      </div>

      {/* FSSAI Preservatives & Additives Codex Spotlight */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-5 shadow-sm border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="bg-amber-500/20 p-2.5 rounded-lg border border-amber-500/30 text-amber-400 flex-shrink-0 mt-0.5">
            <FlaskConical className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-white text-sm">FSSAI Preservatives & Chemical Additives Codex</span>
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded">
                Banned Chemical Registry
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Explore our full directory of food preservatives, statutory FSSAI permissible ceilings (ppm), toxicological hazards, and international ban cross-references (EU, UK, Japan, US FDA, California AB 418).
            </p>
          </div>
        </div>

        <Link
          to="/preservatives"
          className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2.5 rounded-lg text-xs transition-colors flex-shrink-0 shadow-xs"
        >
          <span>Open Preservatives Codex</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* 12 Mandatory Declaration Checks */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-xs overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-3 border-b border-slate-800 flex items-center justify-between text-xs">
          <h3 className="font-bold uppercase tracking-wider flex items-center space-x-2">
            <ShieldAlert className="h-4 w-4 text-amber-500" />
            <span>12 Mandatory Declarations (Rule 6, Legal Metrology Rules 2011)</span>
          </h3>
          <span className="text-slate-400 font-mono text-[11px]">Central Enforcement Rules</span>
        </div>

        <div className="divide-y divide-slate-200">
          {declarationRules.map((item) => (
            <div key={item.id} className="p-4 hover:bg-slate-50/60 transition text-xs">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-slate-500 font-bold">#{item.id}</span>
                  <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                </div>
                <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                  {item.rule}
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed">{item.description}</p>
              <p className="text-slate-500 text-[11px] mt-1 italic">
                <strong>Enforcement criteria:</strong> {item.statutoryDetails}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 2 Automated Validation Checks */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-xs overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-3 border-b border-slate-800 flex items-center justify-between text-xs">
          <h3 className="font-bold uppercase tracking-wider flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-amber-500" />
            <span>Automated Mathematical & Chronological Validations</span>
          </h3>
          <span className="text-slate-400 font-mono text-[11px]">Consistency Engine</span>
        </div>

        <div className="divide-y divide-slate-200">
          {validationRules.map((item) => (
            <div key={item.id} className="p-4 hover:bg-slate-50/60 transition text-xs">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                <span className="font-mono text-[11px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                  {item.type}
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed">{item.description}</p>
              <p className="text-slate-500 text-[11px] mt-1 font-mono">
                <strong>Logic:</strong> {item.logic}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
