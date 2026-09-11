import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileCheck,
  Database,
  FileText,
  BookOpen,
  FlaskConical,
  Info,
  ShieldCheck,
  Server,
  AlertTriangle,
  Globe,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { checkHealth } from '../../services/api';

interface SidebarProps {
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpenOnMobile = false, onCloseMobile }) => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  
  // Persist desktop sidebar collapse preference in localStorage
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('verifeye_sidebar_collapsed') === 'true';
    }
    return false;
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('verifeye_sidebar_collapsed', String(next));
      return next;
    });
  };

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
    { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { to: '/inspection', label: 'New Inspection', icon: <FileCheck className="h-4 w-4" /> },
    { to: '/repository', label: 'Repository', icon: <Database className="h-4 w-4 text-amber-400" /> },
    { to: '/reports', label: 'Reports', icon: <FileText className="h-4 w-4" /> },
    { to: '/guidelines', label: 'Guidelines', icon: <BookOpen className="h-4 w-4" /> },
    { to: '/preservatives', label: 'Preservatives Codex', icon: <FlaskConical className="h-4 w-4 text-amber-400" /> },
    { to: '/about', label: 'About', icon: <Info className="h-4 w-4" /> },
    { to: '/', label: 'Landing Portal', icon: <Globe className="h-4 w-4 text-slate-400" /> },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpenOnMobile && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 lg:hidden modal-backdrop-animate"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`bg-slate-900 text-white flex flex-col justify-between border-r border-slate-800 flex-shrink-0 min-h-screen z-50 transition-all duration-300 ease-in-out ${
          isOpenOnMobile
            ? 'fixed inset-y-0 left-0 w-64 translate-x-0 shadow-2xl'
            : `hidden lg:flex ${isCollapsed ? 'w-20' : 'w-64'}`
        }`}
      >
        <div>
          {/* Portal Branding Header & Toggle Controls */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between min-h-[73px]">
            {/* Expanded Header View */}
            {!isCollapsed && (
              <div className="flex items-center space-x-3 min-w-0 pr-2">
                <div className="bg-amber-600/20 p-2 rounded-lg border border-amber-500/40 text-amber-400 shrink-0">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-xl font-black tracking-tight text-white block leading-none">
                    Verif<span className="text-amber-500">Eye</span>
                  </span>
                  <p className="text-[10px] text-slate-400 font-medium leading-tight mt-1">
                    Government Compliance System
                  </p>
                </div>
              </div>
            )}

            {/* Collapsed Compact Logo View */}
            {isCollapsed && (
              <div className="mx-auto flex flex-col items-center justify-center space-y-1">
                <div className="bg-amber-600/20 p-2 rounded-lg border border-amber-500/40 text-amber-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <span className="text-[9px] font-black text-amber-400 tracking-tighter">VE</span>
              </div>
            )}

            {/* Desktop Toggle Collapse / Expand Button */}
            <button
              type="button"
              onClick={toggleCollapse}
              className="hidden lg:flex p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer min-h-[32px] min-w-[32px] items-center justify-center shrink-0"
              title={isCollapsed ? 'Expand sidebar (▶)' : 'Collapse sidebar (◀)'}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-amber-400" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-slate-300" />
              )}
            </button>

            {/* Mobile Close Button */}
            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition"
                aria-label="Close Mobile Drawer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Section Label */}
          {!isCollapsed ? (
            <div className="px-5 pt-4 pb-2 text-[10px] uppercase font-bold text-slate-500 tracking-wider transition-opacity duration-200">
              Enforcement Navigation
            </div>
          ) : (
            <div className="py-2 text-center text-[9px] uppercase font-bold text-slate-600 tracking-widest border-b border-slate-800/40 my-1" title="Enforcement Navigation">
              • • •
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1.5 px-2 sm:px-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onCloseMobile}
                tabIndex={0}
                className={({ isActive }) =>
                  `group relative flex items-center ${
                    isCollapsed ? 'justify-center px-0 py-2.5' : 'px-3.5 py-2.5'
                  } rounded-md text-xs transition-all duration-200 ease-out transform min-h-[44px] ${
                    isActive
                      ? 'bg-slate-800 text-amber-400 border-l-4 border-amber-500 font-bold shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border-l-4 border-transparent font-medium'
                  }`
                }
              >
                <div className={`flex items-center justify-center shrink-0 ${isCollapsed ? '' : 'mr-3'}`}>
                  {item.icon}
                </div>

                {!isCollapsed && (
                  <span className="truncate transition-opacity duration-200 opacity-100">
                    {item.label}
                  </span>
                )}

                {/* Floating Hover & Keyboard Focus Tooltip when Collapsed */}
                {isCollapsed && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-800 text-amber-400 font-bold text-xs rounded-md shadow-2xl border border-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                    {item.label}
                  </div>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer: Health Status */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/60 space-y-2">
          {!isCollapsed ? (
            <>
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
            </>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-1 py-1" title={isOnline ? "Backend: ONLINE" : "Backend: OFFLINE"}>
              <Server className="h-4 w-4 text-slate-400" />
              {isOnline ? (
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Backend Engine ONLINE" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-rose-500" title="Backend Engine OFFLINE" />
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

