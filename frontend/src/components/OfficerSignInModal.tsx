import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  X,
  UserCheck,
  Lock,
  ChevronRight,
  Shield,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  Fingerprint,
} from 'lucide-react';

export interface OfficerUser {
  id: string;
  name: string;
  role: 'Officer' | 'Senior Officer' | 'Admin';
  roleTitle: string;
  badgeId: string;
  jurisdiction: string;
  clearanceLevel: string;
  email: string;
  avatarColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  capabilities: string[];
}

export const DEMO_USERS: OfficerUser[] = [
  {
    id: 'user_officer',
    name: 'Inspector Rajesh Kumar',
    role: 'Officer',
    roleTitle: 'Legal Metrology Field Inspector',
    badgeId: 'LM-OFFICER-402',
    jurisdiction: 'Delhi NCR Enforcement Division',
    clearanceLevel: 'Level 1 — Field Inspection & Sampling',
    email: 'rajesh.kumar@consumer.gov.in',
    avatarColor: 'bg-emerald-700 text-white',
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-300',
    badgeText: 'text-emerald-800',
    capabilities: [
      'Multi-image label OCR inspection',
      'Rule 6(1) statutory compliance scoring',
      'Preservative & nutritional HFSS audit',
      'Export PDF statutory audit scorecards',
    ],
  },
  {
    id: 'user_sr_officer',
    name: 'Smt. Sunita Deshmukh',
    role: 'Senior Officer',
    roleTitle: 'Senior Enforcement Controller & Superintendent',
    badgeId: 'LM-SR-CTRL-108',
    jurisdiction: 'Western Regional Directorate (Maharashtra & Gujarat)',
    clearanceLevel: 'Level 2 — Brand Audits & Repository Sanction',
    email: 'sunita.deshmukh@consumer.gov.in',
    avatarColor: 'bg-amber-700 text-white',
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-300',
    badgeText: 'text-amber-800',
    capabilities: [
      'All Field Officer inspection powers',
      'Brand Repository dossier creation & management',
      'Batch surveillance history & compounding review',
      'Inter-state legal metrology referrals',
    ],
  },
  {
    id: 'user_admin',
    name: 'Dr. Arvind Swaminathan',
    role: 'Admin',
    roleTitle: 'Central Directorate System Administrator',
    badgeId: 'GOV-ADM-ROOT-01',
    jurisdiction: 'Ministry of Consumer Affairs, New Delhi (HQ)',
    clearanceLevel: 'Level 3 — Central Statutory & AI Policy Authority',
    email: 'arvind.swaminathan@nic.in',
    avatarColor: 'bg-indigo-700 text-white',
    badgeBg: 'bg-indigo-50',
    badgeBorder: 'border-indigo-300',
    badgeText: 'text-indigo-800',
    capabilities: [
      'Full administrative & system overseer access',
      'Deterministic rule engine threshold tuning',
      'Officer credentials & jurisdiction delegation',
      'National packaged commodity compliance analytics',
    ],
  },
];

interface OfficerSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfficerSignInModal: React.FC<OfficerSignInModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [selectedUserIndex, setSelectedUserIndex] = useState<number>(0);
  const [password, setPassword] = useState<string>('••••••••••••');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [captchaInput, setCaptchaInput] = useState<string>('LM7K9');
  const [captchaCode, setCaptchaCode] = useState<string>('LM7K9');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentUser = DEMO_USERS[selectedUserIndex];

  const handleRefreshCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 5; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(res);
    setCaptchaInput(res);
  };

  const handleSelectUser = (idx: number) => {
    setSelectedUserIndex(idx);
    setPassword('••••••••••••');
  };

  const handleSignIn = () => {
    setIsSubmitting(true);
    try {
      localStorage.setItem('verifeye_active_user', JSON.stringify(currentUser));
      // Dispatch storage event for other components to react immediately
      window.dispatchEvent(new Event('verifeye_user_changed'));
    } catch {
      // Ignore storage errors
    }

    setTimeout(() => {
      setIsSubmitting(false);
      onClose();
      navigate('/dashboard');
    }, 400);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="officer-signin-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden my-6">
        {/* Top Official Government Band */}
        <div className="bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="h-7 w-7 rounded-md bg-amber-600 flex items-center justify-center shadow-xs">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-white tracking-tight font-mono">
                  GOVERNMENT OF INDIA
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wider">
                  OFFICIAL PORTAL
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-none">
                Ministry of Consumer Affairs &bull; Legal Metrology Division
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close officer sign in modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Header */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2 text-amber-700 text-xs font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span>Authorized Enforcement Access</span>
          </div>
          <h2 id="officer-signin-modal-title" className="text-xl font-bold text-slate-900 mt-0.5">
            Officer Authentication Shell
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select an authorized user role to enter the Legal Metrology packaged commodity compliance workspace.
          </p>
        </div>

        {/* 3 User Personas Switcher */}
        <div className="p-6 space-y-5">
          <div>
            <label className="text-[11px] uppercase font-bold text-slate-500 tracking-wider block mb-2">
              Select Operating User Role (3 Demo Accounts Available)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {DEMO_USERS.map((u, idx) => {
                const isSelected = selectedUserIndex === idx;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectUser(idx)}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/70 shadow-sm ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-start justify-between w-full mb-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${u.badgeBg} ${u.badgeBorder} ${u.badgeText}`}
                      >
                        {u.role}
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                      )}
                    </div>
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block leading-snug">
                        {u.name}
                      </strong>
                      <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                        {u.badgeId}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Profile Dossier Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-start justify-between flex-wrap gap-2 pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs ${currentUser.avatarColor}`}
                >
                  {currentUser.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-900">{currentUser.name}</h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${currentUser.badgeBg} ${currentUser.badgeBorder} ${currentUser.badgeText}`}
                    >
                      {currentUser.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{currentUser.roleTitle}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Jurisdiction
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  {currentUser.jurisdiction}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  Official Email / Gov ID
                </span>
                <span className="font-mono text-slate-800 text-[11px] font-medium">
                  {currentUser.email}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  Statutory Clearance
                </span>
                <span className="text-slate-800 font-medium text-[11px]">
                  {currentUser.clearanceLevel}
                </span>
              </div>
            </div>

            <div className="pt-1">
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                Authorized Operational Scope
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {currentUser.capabilities.map((cap, i) => (
                  <div key={i} className="flex items-center space-x-1.5 text-[11px] text-slate-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                    <span>{cap}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Credential Inputs (Pre-filled Shell Interface) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                Official Identifier / Badge
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={currentUser.badgeId}
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none"
                />
                <Fingerprint className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                Security PIN / Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-amber-600 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Gov Captcha Verification Widget */}
          <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <div className="px-3.5 py-1.5 bg-slate-900 text-amber-400 font-mono font-bold tracking-widest text-sm rounded border border-slate-700 select-none shadow-inner">
                {captchaCode}
              </div>
              <button
                type="button"
                onClick={handleRefreshCaptcha}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-200 transition cursor-pointer"
                title="Refresh Captcha"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] text-slate-500">Official Anti-Bot Verification</span>
            </div>

            <div className="w-full sm:w-36">
              <input
                type="text"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Enter Code"
                className="w-full px-2.5 py-1.5 text-xs text-center font-mono bg-white border border-slate-300 rounded text-slate-800 focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          {/* Statutory Security Disclaimer */}
          <div className="text-[10px] text-slate-500 leading-relaxed bg-amber-50/70 border border-amber-200/80 p-2.5 rounded-lg flex items-start space-x-2">
            <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              <strong>Statutory Notice:</strong> Authorized enforcement access only under Section 15 of the Legal Metrology Act, 2009.
              All actions are digitally logged and verifiable by the Central Metrology Directorate.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSignIn}
              className="w-full sm:w-auto px-6 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold shadow-md shadow-amber-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              <span>Sign In as {currentUser.role}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
