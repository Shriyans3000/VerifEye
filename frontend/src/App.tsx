import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { InspectionProvider } from './context/InspectionContext';
import { AppShell } from './components/layout/AppShell';

import { DashboardPage } from './pages/DashboardPage';
import { InspectionPage } from './pages/InspectionPage';
import { InspectionResultPage } from './pages/InspectionResultPage';
import { RepositoryPage } from './pages/RepositoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { GuidelinesPage } from './pages/GuidelinesPage';
import { PreservativesGuidePage } from './pages/PreservativesGuidePage';
import { AboutPage } from './pages/AboutPage';

export const App: React.FC = () => {
  return (
    <InspectionProvider>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/inspection" element={<InspectionPage />} />
            <Route path="/inspection/result" element={<InspectionResultPage />} />
            <Route path="/repository" element={<RepositoryPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/guidelines" element={<GuidelinesPage />} />
            <Route path="/preservatives" element={<PreservativesGuidePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </InspectionProvider>
  );
};

export default App;
