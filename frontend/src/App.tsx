import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { InspectionProvider } from './context/InspectionContext';
import { AppShell } from './components/layout/AppShell';

import { LandingPage } from './pages/LandingPage';
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
        <Routes>
          {/* Public National Landing Page */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />

          {/* Officer Enforcement Workspace Routes (Inside AppShell) */}
          <Route
            path="/dashboard"
            element={
              <AppShell>
                <DashboardPage />
              </AppShell>
            }
          />
          <Route
            path="/inspection"
            element={
              <AppShell>
                <InspectionPage />
              </AppShell>
            }
          />
          <Route
            path="/inspection/result"
            element={
              <AppShell>
                <InspectionResultPage />
              </AppShell>
            }
          />
          <Route
            path="/repository"
            element={
              <AppShell>
                <RepositoryPage />
              </AppShell>
            }
          />
          <Route
            path="/reports"
            element={
              <AppShell>
                <ReportsPage />
              </AppShell>
            }
          />
          <Route
            path="/guidelines"
            element={
              <AppShell>
                <GuidelinesPage />
              </AppShell>
            }
          />
          <Route
            path="/preservatives"
            element={
              <AppShell>
                <PreservativesGuidePage />
              </AppShell>
            }
          />
          <Route
            path="/about"
            element={
              <AppShell>
                <AboutPage />
              </AppShell>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </InspectionProvider>
  );
};

export default App;
