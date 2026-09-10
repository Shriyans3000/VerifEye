import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileCheck,
  FileText,
  BookOpen,
  FlaskConical,
  Info,
  ShieldCheck,
  Server,
  AlertTriangle,
} from 'lucide-react';
import { checkHealth } from '../../services/api';

export const Sidebar: React.FC = () => {
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

  const navItems = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4 mr-3" /> },
    { to: '/inspection', label: 'New Inspection', icon: <FileCheck className="h-4 w-4 mr-3" /> },
    { to: '/reports', label: 'Reports', icon: <FileText className="h-4 w-4 mr-3" /> },
    { to: '/guidelines', label: 'Guidelines', icon: <BookOpen className="h-4 w-4 mr-3" /> },
    { to: '/preservatives', label: 'Preservatives Codex', icon: <FlaskConical className="h-4 w-4 mr-3 text-amber-400" /> },
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
              <span className="text-lg font-black tracking-tight text-white">
                Verif<span className="text-amber-500">Eye</span>
              </span>
              <span className="bg-slate-800 text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-500/30">
                PROTOTYPE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Government Compliance Inspection System
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
              end={item.to === '/'}
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

      {/* Sidebar Footer: Real Health Status */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
            <Server className="h-3.5 w-3.5 text-slate-400" />
            <span>Backend Engine</span>
          </div>
          {isOnline === null ? (
            <span className="flex items-center text-[10px] text-slate-400 font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-500 mr-1 animate-pulse" />
              CHECKING
            </span>
          ) : isOnline ? (
            <span className="flex items-center text-[10px] text-emerald-400 font-bold font-mono">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
              ONLINE
            </span>
          ) : (
            <span className="flex items-center text-[10px] text-rose-400 font-bold font-mono">
              <AlertTriangle className="h-3 w-3 mr-0.5 text-rose-400" />
              OFFLINE
            </span>
          )}
        </div>
        <p className="text-[9px] text-slate-500 leading-tight">
          Legal Metrology (Packaged Commodities) Rules, 2011
        </p>
      </div>
    </aside>
  );
};
