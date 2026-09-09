import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileCheck,
  FolderArchive,
  FileText,
  BookOpen,
  Info,
  ShieldCheck,
  Server,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { checkHealth } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const { user } = useAuth();

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

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4 mr-3" /> },
    { to: '/inspection', label: 'New Inspection', icon: <FileCheck className="h-4 w-4 mr-3" /> },
    { to: '/repository', label: 'Repository', icon: <FolderArchive className="h-4 w-4 mr-3 text-amber-400" /> },
    { to: '/reports', label: 'Reports', icon: <FileText className="h-4 w-4 mr-3" /> },
    { to: '/guidelines', label: 'Guidelines', icon: <BookOpen className="h-4 w-4 mr-3" /> },
    { to: '/about', label: 'About', icon: <Info className="h-4 w-4 mr-3" /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between border-r border-slate-800 flex-shrink-0 min-h-screen">
      <div>
        {/* Portal Branding Header */}
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="bg-amber-600/20 p-2 rounded-lg border border-amber-500/40 text-amber-400 flex-shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-lg font-black tracking-tight text-white font-mono">
                Verif<span className="text-amber-500">Eye</span>
              </span>
              <span className="bg-slate-800 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                GOV
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Department of Consumer Affairs
            </p>
          </div>
        </div>

        {/* Section Label */}
        <div className="px-5 pt-4 pb-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
          Enforcement Navigation
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center px-3.5 py-2.5 rounded-md text-xs transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-amber-400 border-l-4 border-amber-500 font-bold shadow-2xs'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border-l-4 border-transparent font-medium'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer: Active Officer Profile + Health Status */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-3">
        {/* Officer Card */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg flex items-center gap-2.5 text-xs">
          <div className="w-8 h-8 rounded-full bg-amber-600/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <div className="text-slate-200 font-bold text-[11px] truncate">
              {user?.name || 'Inspection Officer'}
            </div>
            <div className="text-slate-500 text-[10px] flex items-center gap-1">
              <span className="text-amber-400 font-semibold">{user?.role || 'Officer'}</span>
              <span>&bull;</span>
              <span className="font-mono text-slate-400">{user?.badgeId || 'LM-DEL-8921'}</span>
            </div>
          </div>
        </div>

        {/* Real Health Status */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
            <Server className="h-3.5 w-3.5 text-slate-400" />
            <span>Backend Engine</span>
          </div>
          {isOnline === null ? (
            <span className="flex items-center text-[10px] text-slate-400 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-500 mr-1 animate-pulse" />
              CONNECTING
            </span>
          ) : isOnline ? (
            <span className="flex items-center text-[10px] text-emerald-400 font-mono font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
              HEALTHY
            </span>
          ) : (
            <span className="flex items-center text-[10px] text-rose-400 font-mono font-bold">
              <AlertTriangle className="h-2.5 w-2.5 mr-1" />
              DISCONNECTED
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};
