import React, { useEffect, useState } from 'react';
import { ShieldCheck, Server, UserCheck, AlertTriangle } from 'lucide-react';
import { checkHealth } from '../services/api';

export const Header: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    const pollHealth = async () => {
      const status = await checkHealth();
      if (isMounted) setIsOnline(status);
    };

    pollHealth();
    // Simple health check polling every 30 seconds
    const interval = setInterval(pollHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="bg-slate-900 text-white border-b-2 border-amber-600 shadow-md">
      {/* Top Ministry Banner */}
      <div className="bg-slate-950 px-4 py-1 text-xs text-slate-400 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-amber-500 uppercase tracking-wider">Government of India</span>
          <span>•</span>
          <span>Department of Consumer Affairs</span>
          <span>•</span>
          <span>Legal Metrology Division</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-slate-400">Enforcement Portal v1.0</span>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-600/20 p-2.5 rounded-lg border border-amber-500/40 text-amber-400">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
                Verif<span className="text-amber-500">Eye</span>
              </h1>
              <span className="bg-slate-800 text-amber-400 text-xs font-semibold px-2 py-0.5 rounded border border-amber-500/30">
                PROTOTYPE
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Packaged Commodity Legal Metrology Compliance Inspection System
            </p>
          </div>
        </div>

        {/* Status & Officer Information Area */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Health Status Badge */}
          <div className="bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-md flex items-center space-x-2 text-xs">
            <Server className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-400 font-medium">System Status:</span>
            {isOnline === null ? (
              <span className="flex items-center text-slate-400">
                <span className="h-2 w-2 rounded-full bg-slate-500 mr-1.5 animate-pulse"></span>
                CHECKING...
              </span>
            ) : isOnline ? (
              <span className="flex items-center font-bold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                ONLINE
              </span>
            ) : (
              <span className="flex items-center font-bold text-rose-400">
                <AlertTriangle className="h-3 w-3 mr-1 text-rose-400" />
                OFFLINE
              </span>
            )}
          </div>

          {/* Officer Info Area */}
          <div className="bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-md flex items-center space-x-2 text-xs text-slate-300">
            <UserCheck className="h-3.5 w-3.5 text-amber-500" />
            <div>
              <span className="font-semibold text-slate-200">Enforcement Officer</span>
              <span className="text-slate-400 block text-[10px]">District Enforcement Cell</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
