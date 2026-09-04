import React, { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';

interface AppShellProps {
  children?: ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans antialiased text-slate-900">
      {/* Persistent Left Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Persistent Top Header */}
        <TopHeader />

        {/* Scrollable Main Application Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>

        {/* Subdued Footer */}
        <footer className="bg-slate-900 text-slate-400 text-[11px] py-2.5 px-6 border-t border-slate-800 flex justify-between items-center print:hidden">
          <span>© 2026 Legal Metrology Division, Department of Consumer Affairs, Government of India.</span>
          <span className="text-slate-500 font-mono">VerifEye Enforcement Workspace • Confidential System</span>
        </footer>
      </div>
    </div>
  );
};
