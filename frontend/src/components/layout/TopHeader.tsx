import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Server, UserCheck, AlertTriangle } from 'lucide-react';
import { checkHealth } from '../../services/api';

export const TopHeader: React.FC = () => {
  const location = useLocation();
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const poll = async () => {
      const status = await checkHealth();
      if (isMounted) setIsOnline(status);
    };

    poll();
    const interval = setInterval(poll, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const getSectionTitle = (pathname: string): { title: string; subtitle: string } => {
    switch (pathname) {
      case '/':
        return {
          title: 'Officer Dashboard',
          subtitle: 'Enforcement overview and active session inspection state',
        };
      case '/inspection':
        return {
          title: 'New Package Inspection',
          subtitle: 'Upload and evaluate commodity label against Legal Metrology rules',
        };
      case '/inspection/result':
        return {
          title: 'Current Inspection Result',
          subtitle: 'Evidence-linked compliance audit and statutory verification details',
        };
      case '/repository':
        return {
          title: 'Statutory Inspection Repository',
          subtitle: 'Search and inspect archived brand compliance records (Haldiram, Lay\'s, etc.)',
        };
      case '/reports':
        return {
          title: 'Inspection Reports Workspace',
          subtitle: 'Generate and review formal statutory inspection records',
        };
      case '/guidelines':
        return {
          title: 'Legal Metrology Statutory Guidelines',
          subtitle: '12 Mandatory Legal Declarations and Automated Validation Rules',
        };
      case '/about':
        return {
          title: 'About VerifEye System Architecture',
          subtitle: 'Deep-learning OCR, LLM extraction, and deterministic rule engine pipeline',
        };
      default:
        return {
          title: 'Compliance Workspace',
          subtitle: 'Packaged commodity inspection management',
        };
    }
  };

  const { title, subtitle } = getSectionTitle(location.pathname);

  return (
    <header className="bg-white border-b border-slate-300 shadow-xs flex-shrink-0">
      {/* Top Official Ministry Banner */}
      <div className="bg-slate-950 px-4 py-1 text-[11px] text-slate-400 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-amber-500 uppercase tracking-wider">Government of India</span>
          <span>•</span>
          <span>Department of Consumer Affairs</span>
          <span>•</span>
          <span>Legal Metrology Division</span>
        </div>
        <div className="flex items-center space-x-3 text-slate-400">
          <span>Enforcement Workspace</span>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="px-6 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-900 leading-tight">{title}</h1>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>

        {/* Right Status & Officer Info (Neutral) */}
        <div className="flex items-center space-x-3 text-xs">
          {/* Real Backend Status */}
          <div className="bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-md flex items-center space-x-2">
            <Server className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-slate-600 font-medium text-[11px]">System:</span>
            {isOnline === null ? (
              <span className="flex items-center font-bold text-slate-500 font-mono text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400 mr-1 animate-pulse" />
                CHECKING...
              </span>
            ) : isOnline ? (
              <span className="flex items-center font-bold text-emerald-700 font-mono text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                ONLINE
              </span>
            ) : (
              <span className="flex items-center font-bold text-rose-700 font-mono text-[11px]">
                <AlertTriangle className="h-3 w-3 mr-1 text-rose-600" />
                OFFLINE
              </span>
            )}
          </div>

          {/* Neutral Officer Identity (Strictly no fake IDs or personal names) */}
          <div className="bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-md flex items-center space-x-2 text-slate-700">
            <UserCheck className="h-4 w-4 text-amber-600" />
            <div className="text-left">
              <span className="font-bold text-slate-900 block text-[11px] leading-tight">
                INSPECTION OFFICER
              </span>
              <span className="text-[10px] text-slate-500 block leading-tight">
                District Enforcement Cell
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
