import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  UserCheck, 
  ArrowRight, 
  BadgeAlert
} from 'lucide-react';
import { useAuth, UserRole, MOCK_USERS } from '../context/AuthContext';

export const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [selectedRole, setSelectedRole] = useState<UserRole>('Enforcement Officer');
  const [email, setEmail] = useState<string>(MOCK_USERS['Enforcement Officer'].email);
  const [badgeId, setBadgeId] = useState<string>(MOCK_USERS['Enforcement Officer'].badgeId);
  const [password, setPassword] = useState<string>('••••••••••••');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setEmail(MOCK_USERS[role].email);
    setBadgeId(MOCK_USERS[role].badgeId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await login(selectedRole, email);
    setIsSubmitting(false);

    const destination = (location.state as any)?.from?.pathname || '/dashboard';
    navigate(destination, { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-amber-600 selection:text-white">
      
      {/* Background Subtle Amber Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Brand & Portal Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white shadow-xl shadow-amber-500/20 mb-1">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-mono">
            Verif<span className="text-amber-500">Eye</span> Officer Portal
          </h1>
          <p className="text-xs text-slate-400">
            Government of India &bull; Legal Metrology Enforcement Division
          </p>
        </div>

        {/* Demo Prototype Shell Safeguard Notice */}
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/40 text-xs text-amber-200/90 leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-1">
            <BadgeAlert className="w-4 h-4 text-amber-400" />
            <span>AUTHENTICATION UI SHELL &bull; DEMO MODE</span>
          </div>
          <p className="text-[11px] text-amber-300/80">
            For frictionless hackathon evaluation, security enforcement is mocked (<code className="bg-amber-900/60 px-1 py-0.5 rounded text-white font-mono">AUTH_ENABLED = false</code>). No credentials or passwords are saved in localStorage. Select any official role below to test role-based UI capabilities.
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur">
          
          {/* Quick Role Selection Tabs */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Select Officer Role to Sign In:
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
              {(['Enforcement Officer', 'Senior Officer', 'Administrator'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleSelect(r)}
                  className={`py-2 px-1 rounded-lg text-[11px] font-bold transition-colors text-center cursor-pointer ${
                    selectedRole === r
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {r.split(' ')[0]}
                </button>
              ))}
            </div>
            <div className="mt-2 text-[11px] text-slate-400 text-center font-medium">
              Profile: <span className="text-slate-200">{MOCK_USERS[selectedRole].name}</span> &bull; Badge: <span className="font-mono text-amber-400">{MOCK_USERS[selectedRole].badgeId}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Official Government Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Badge / Service ID
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Secure Password / OTP
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center space-x-2 mt-2 cursor-pointer"
            >
              <span>Sign In as {selectedRole}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Bypass */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 text-center">
            <button
              onClick={() => {
                login('Enforcement Officer');
                navigate('/dashboard');
              }}
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors underline cursor-pointer"
            >
              Quick Demo: Enter Dashboard Directly &rarr;
            </button>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-slate-500 hover:text-slate-400 transition-colors cursor-pointer"
          >
            &larr; Back to Official Portal Home
          </button>
        </div>

      </div>
    </div>
  );
};
