import React, { ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';

interface AppShellProps {
  children?: ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile drawer when location/route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans antialiased text-slate-900 ambient-bg-pattern">
      {/* Responsive Navigation Sidebar / Drawer */}
      <Sidebar
        isOpenOnMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header with Mobile Drawer Trigger */}
        <TopHeader onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)} />

        {/* Scrollable Main Application Content Area with Responsive Padding & Page Fade-In */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-8">
          <div key={location.pathname} className="max-w-7xl mx-auto space-y-4 sm:space-y-6 animate-fade-in max-w-full">
            {children}
          </div>
        </main>

        {/* Subdued Responsive Footer */}
        <footer className="bg-slate-900 text-slate-400 text-[10px] sm:text-[11px] py-2.5 px-4 sm:px-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-1 print:hidden">
          <span className="text-center sm:text-left">© 2026 Legal Metrology Division, Department of Consumer Affairs, Government of India.</span>
          <span className="text-slate-500 font-mono text-[10px]">VerifEye Enforcement Workspace</span>
        </footer>
      </div>
    </div>
  );
};
