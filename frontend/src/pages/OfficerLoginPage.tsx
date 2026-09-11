import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  UserCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Loader2,
  UserPlus,
} from 'lucide-react';
import { loginOfficer, registerOfficer } from '../services/api';

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

export const PRESET_OFFICERS = [
  {
    name: 'Inspector Rajesh Kumar',
    role: 'Officer' as const,
    roleTitle: 'Legal Metrology Field Inspector',
    badgeId: 'LM-OFFICER-402',
    jurisdiction: 'Delhi NCR Enforcement Division',
    clearanceLevel: 'Level 1 — Field Inspection & Sampling',
    email: 'rajesh.kumar@consumer.gov.in',
    demoPassword: 'Officer@123',
    avatarColor: 'bg-emerald-700 text-white',
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-300',
    badgeText: 'text-emerald-800',
  },
  {
    name: 'Smt. Sunita Deshmukh',
    role: 'Senior Officer' as const,
    roleTitle: 'Senior Enforcement Controller & Superintendent',
    badgeId: 'LM-SR-CTRL-108',
    jurisdiction: 'Western Regional Directorate (Maharashtra & Gujarat)',
    clearanceLevel: 'Level 2 — Brand Audits & Repository Sanction',
    email: 'sunita.deshmukh@consumer.gov.in',
    demoPassword: 'Officer@123',
    avatarColor: 'bg-amber-700 text-white',
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-300',
    badgeText: 'text-amber-800',
  },
  {
    name: 'Dr. Arvind Swaminathan',
    role: 'Admin' as const,
    roleTitle: 'Central Directorate System Administrator',
    badgeId: 'GOV-ADM-ROOT-01',
    jurisdiction: 'Ministry of Consumer Affairs, New Delhi (HQ)',
    clearanceLevel: 'Level 3 — Central Statutory & AI Policy Authority',
    email: 'arvind.swaminathan@nic.in',
    demoPassword: 'Admin@123',
    avatarColor: 'bg-indigo-700 text-white',
    badgeBg: 'bg-indigo-50',
    badgeBorder: 'border-indigo-300',
    badgeText: 'text-indigo-800',
  },
];

export const OfficerLoginPage: React.FC = () => {
  const navigate = useNavigate();

  // Active Tab: 'signin' | 'register'
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');

  // Sign-in form state (Email + Password)
  const [email, setEmail] = useState<string>('rajesh.kumar@consumer.gov.in');
  const [password, setPassword] = useState<string>('Officer@123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);

  // Registration form state
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regRole, setRegRole] = useState<'Officer' | 'Senior Officer' | 'Admin'>('Officer');
  const [regBadgeId, setRegBadgeId] = useState<string>('');
  const [regJurisdiction, setRegJurisdiction] = useState<string>('Northern Regional Enforcement Cell');

  // Captcha state
  const [captchaCode, setCaptchaCode] = useState<string>('LM7K9');
  const [captchaInput, setCaptchaInput] = useState<string>('LM7K9');

  // Status & Feedback
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Generate a random 5-char alphanumeric captcha
  const refreshCaptcha = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setCaptchaInput('');
  };

  const handleSelectPreset = (idx: number) => {
    setSelectedPresetIndex(idx);
    const p = PRESET_OFFICERS[idx];
    setEmail(p.email);
    setPassword(p.demoPassword);
    setErrorMessage(null);
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid official email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    if (captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setErrorMessage('Anti-Bot security captcha code mismatch. Please re-enter.');
      refreshCaptcha();
      return;
    }

    setLoading(true);
    try {
      const response = await loginOfficer({
        email: cleanEmail,
        password: password,
      });

      if (response.success && response.user) {
        const user = response.user;
        localStorage.setItem('verifeye_active_user', JSON.stringify(user));
        window.dispatchEvent(new Event('verifeye_user_changed'));

        setSuccessMessage(`Welcome, ${user.name}! Database authentication confirmed.`);
        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      } else {
        setErrorMessage('Authentication response was invalid.');
      }
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        'Authentication failed. Please verify credentials.';
      setErrorMessage(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanName = regName.trim();
    const cleanEmail = regEmail.trim();
    const cleanPass = regPassword.trim();

    if (!cleanName) {
      setErrorMessage('Please enter your full official name.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Please enter a valid official email address.');
      return;
    }
    if (cleanPass.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setErrorMessage('Anti-Bot security captcha code mismatch. Please re-enter.');
      refreshCaptcha();
      return;
    }

    setLoading(true);
    try {
      const response = await registerOfficer({
        name: cleanName,
        email: cleanEmail,
        password: cleanPass,
        role: regRole,
        badge_id: regBadgeId.trim() || undefined,
        jurisdiction: regJurisdiction.trim() || undefined,
      });

      if (response.success && response.user) {
        const user = response.user;
        localStorage.setItem('verifeye_active_user', JSON.stringify(user));
        window.dispatchEvent(new Event('verifeye_user_changed'));

        setSuccessMessage(`Officer ${user.name} successfully registered in MongoDB! Redirecting...`);
        setTimeout(() => {
          navigate('/dashboard');
        }, 900);
      } else {
        setErrorMessage('Registration response was invalid.');
      }
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail ||
        err?.message ||
        'Registration failed. Please check your details.';
      setErrorMessage(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between font-sans antialiased text-slate-900 ambient-bg-pattern selection:bg-amber-200">
      {/* Top Government Strip */}
      <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-amber-600 flex items-center justify-center shadow-md">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-white tracking-wider font-mono">
                  GOVERNMENT OF INDIA
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase tracking-wider">
                  OFFICIAL PORTAL
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Department of Consumer Affairs &bull; Legal Metrology Division
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="inline-flex items-center text-xs text-slate-300 hover:text-white transition py-1 px-2.5 rounded hover:bg-slate-800 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1 text-slate-400" />
              <span>Back to Public Portal</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-300 overflow-hidden">
          {/* Top Title Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950 px-6 py-6 sm:px-8 sm:py-7 text-white border-b border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-1.5">
                  <div className="p-1 rounded bg-amber-500/20 border border-amber-500/30 text-amber-400">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Statutory Enforcement Authentication
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Legal Metrology Officer Access Portal
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                  Sign in with your registered official email and password to access the AI-assisted commodity inspection engine.
                </p>
              </div>

              {/* Tab Switcher */}
              <div className="inline-flex p-1 bg-slate-950/80 rounded-xl border border-slate-700/80 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signin');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                    activeTab === 'signin'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Officer Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                    activeTab === 'register'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>New Registration</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Feedback Alerts */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 flex items-start space-x-3 text-xs animate-shake">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <strong className="block font-bold text-rose-950 mb-0.5">Authentication Failed</strong>
                  <span>{errorMessage}</span>
                  {errorMessage.includes('not registered') && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRegEmail(email);
                          setActiveTab('register');
                          setErrorMessage(null);
                        }}
                        className="inline-flex items-center px-2.5 py-1 rounded bg-rose-700 hover:bg-rose-800 text-white font-bold text-[11px] transition shadow-xs cursor-pointer"
                      >
                        <UserPlus className="w-3 h-3 mr-1" />
                        <span>Register this officer account in database</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {successMessage && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center space-x-3 text-xs animate-fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-bold text-sm">{successMessage}</span>
              </div>
            )}

            {/* TAB 1: SIGN IN (EMAIL + PASSWORD) */}
            {activeTab === 'signin' && (
              <div className="space-y-6">
                {/* Demo Quick-Autofill Cards */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Pre-Registered Official Database Accounts (Click to Fill)</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Database Verified &bull; SHA-256 Secured
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {PRESET_OFFICERS.map((officer, idx) => {
                      const isSelected = selectedPresetIndex === idx && email === officer.email;
                      return (
                        <button
                          key={officer.email}
                          type="button"
                          onClick={() => handleSelectPreset(idx)}
                          className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'border-amber-600 bg-amber-50/80 ring-2 ring-amber-500/20 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between w-full mb-1.5">
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${officer.badgeBg} ${officer.badgeBorder} ${officer.badgeText}`}
                            >
                              {officer.role}
                            </span>
                            {isSelected ? (
                              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                            )}
                          </div>
                          <div>
                            <strong className="text-xs font-bold text-slate-900 block leading-tight">
                              {officer.name}
                            </strong>
                            <span className="text-[11px] text-slate-500 block truncate font-mono mt-0.5">
                              {officer.email}
                            </span>
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-400">
                            <span className="font-mono">{officer.badgeId}</span>
                            <span className="text-amber-700 font-semibold font-mono">
                              Pass: {officer.demoPassword}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSignInSubmit} className="space-y-4 pt-2 border-t border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Official Email */}
                    <div>
                      <label
                        htmlFor="officer-email-input"
                        className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                      >
                        Official Email Address <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Mail className="h-4 w-4" />
                        </div>
                        <input
                          id="officer-email-input"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            setErrorMessage(null);
                          }}
                          placeholder="officer@consumer.gov.in"
                          className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Account must be registered in the Legal Metrology database.
                      </span>
                    </div>

                    {/* Password */}
                    <div>
                      <label
                        htmlFor="officer-password-input"
                        className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                      >
                        Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Lock className="h-4 w-4" />
                        </div>
                        <input
                          id="officer-password-input"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setErrorMessage(null);
                          }}
                          placeholder="Enter your registered password"
                          className="w-full pl-9 pr-10 py-2.5 border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Enforcement credentials encrypted with salted SHA-256.
                      </span>
                    </div>
                  </div>

                  {/* Anti-Bot Verification Section */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                      <div className="bg-slate-900 text-amber-400 px-3.5 py-2 rounded-lg font-mono font-extrabold text-sm tracking-widest select-none border border-slate-700 shadow-inner">
                        {captchaCode}
                      </div>
                      <button
                        type="button"
                        onClick={refreshCaptcha}
                        className="p-2 rounded-lg border border-slate-300 hover:bg-white text-slate-600 transition cursor-pointer"
                        title="Refresh Captcha"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                        Enter anti-bot verification code:
                      </span>
                    </div>

                    <div className="w-full sm:w-48">
                      <input
                        type="text"
                        required
                        value={captchaInput}
                        onChange={(e) => setCaptchaInput(e.target.value)}
                        placeholder="Captcha Code"
                        maxLength={6}
                        className="w-full text-center uppercase tracking-widest font-mono font-bold text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-500">
                      Not yet registered?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('register');
                          setErrorMessage(null);
                        }}
                        className="text-amber-700 hover:text-amber-800 font-bold underline cursor-pointer"
                      >
                        Register new officer in database
                      </button>
                    </span>

                    <button
                      type="submit"
                      id="officer-signin-btn"
                      disabled={loading}
                      className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold shadow-md shadow-amber-600/30 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-75"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying with Database...</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-4 h-4" />
                          <span>Sign In to Enforcement Console</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 2: NEW OFFICER REGISTRATION (WRITE TO MONGODB) */}
            {activeTab === 'register' && (
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs">
                  <strong className="block font-bold mb-1 flex items-center">
                    <UserPlus className="w-4 h-4 mr-1.5 text-amber-700" />
                    New Legal Metrology Officer Registration
                  </strong>
                  Submitting this form registers a new enforcement officer profile into the active MongoDB database. You will immediately be authenticated and authorized to perform statutory inspections.
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Full Officer Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Inspector Amit Sharma"
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      />
                    </div>

                    {/* Official Email */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Official Email ID <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="e.g. amit.sharma@consumer.gov.in"
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      />
                    </div>

                    {/* Officer Role */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Enforcement Role <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value as any)}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      >
                        <option value="Officer">Officer (Field Inspector / Sampling)</option>
                        <option value="Senior Officer">Senior Officer (Regional Controller)</option>
                        <option value="Admin">Admin (Directorate Administrator)</option>
                      </select>
                    </div>

                    {/* Badge ID */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Official Badge ID / Station Code
                      </label>
                      <input
                        type="text"
                        value={regBadgeId}
                        onChange={(e) => setRegBadgeId(e.target.value)}
                        placeholder="e.g. LM-OFFICER-512 (Auto-generated if blank)"
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      />
                    </div>

                    {/* Jurisdiction */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Enforcement Jurisdiction
                      </label>
                      <input
                        type="text"
                        value={regJurisdiction}
                        onChange={(e) => setRegJurisdiction(e.target.value)}
                        placeholder="e.g. Northern Regional Enforcement Cell (Delhi, Haryana, Punjab)"
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      />
                    </div>

                    {/* Password */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Password (Min. 6 Characters) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Create a secure password for your officer account"
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                      />
                    </div>
                  </div>

                  {/* Anti-Bot Verification Section */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 w-full sm:w-auto">
                      <div className="bg-slate-900 text-amber-400 px-3.5 py-2 rounded-lg font-mono font-extrabold text-sm tracking-widest select-none border border-slate-700 shadow-inner">
                        {captchaCode}
                      </div>
                      <button
                        type="button"
                        onClick={refreshCaptcha}
                        className="p-2 rounded-lg border border-slate-300 hover:bg-white text-slate-600 transition cursor-pointer"
                        title="Refresh Captcha"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                        Anti-bot code:
                      </span>
                    </div>

                    <div className="w-full sm:w-48">
                      <input
                        type="text"
                        required
                        value={captchaInput}
                        onChange={(e) => setCaptchaInput(e.target.value)}
                        placeholder="Captcha Code"
                        maxLength={6}
                        className="w-full text-center uppercase tracking-widest font-mono font-bold text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-slate-500">
                      Already registered?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('signin');
                          setErrorMessage(null);
                        }}
                        className="text-amber-700 hover:text-amber-800 font-bold underline cursor-pointer"
                      >
                        Sign in with email & password
                      </button>
                    </span>

                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold shadow-md shadow-amber-600/30 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-75"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Registering in Database...</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>Register & Sign In to Database</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Official Legal Metrology Disclaimer */}
            <div className="rounded-xl border border-amber-300/80 bg-amber-50/50 p-4 text-[11px] text-amber-950 flex items-start space-x-3">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="block font-bold">
                  Statutory Notice under Section 15, Legal Metrology Act, 2009
                </strong>
                <p className="text-amber-900/90 leading-relaxed">
                  Authorized government enforcement personnel only. Access to commodity packaging audit intelligence, brand repositories, and statutory non-compliance registries is strictly monitored and digitally logged in accordance with national legal metrology standards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Official Institutional Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-4 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>
            &copy; 2026 Department of Consumer Affairs &bull; Legal Metrology Division, Government of India.
          </span>
          <span className="font-mono text-[11px] text-slate-500">
            VerifEye Official Officer Authentication Portal &bull; v1.0.0
          </span>
        </div>
      </footer>
    </div>
  );
};

export default OfficerLoginPage;
