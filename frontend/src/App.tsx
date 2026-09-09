import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { InspectionProvider } from './context/InspectionContext';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

import { LandingPage } from './pages/LandingPage';
import { SignInPage } from './pages/SignInPage';
import { DashboardPage } from './pages/DashboardPage';
import { InspectionPage } from './pages/InspectionPage';
import { InspectionResultPage } from './pages/InspectionResultPage';
import { RepositoryPage } from './pages/RepositoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { GuidelinesPage } from './pages/GuidelinesPage';
import { AboutPage } from './pages/AboutPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <InspectionProvider>
        <BrowserRouter>
          <Routes>
            {/* Public National Entry Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<SignInPage />} />

            {/* Officer Enforcement Workspace Routes (Protected Shell) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <DashboardPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inspection"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <InspectionPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/inspection/result"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <InspectionResultPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/repository"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <RepositoryPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <ReportsPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/guidelines"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <GuidelinesPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/about"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <AboutPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </InspectionProvider>
    </AuthProvider>
  );
};

export default App;
