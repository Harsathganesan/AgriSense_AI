import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { FarmProvider } from './contexts/FarmContext';

import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import MyFarmPage from './pages/MyFarmPage';
import SoilHealthPage from './pages/SoilHealthPage';
import CropExplorerPage from './pages/CropExplorerPage';
import AgriTrackerPage from './pages/AgriTrackerPage';
import CropRotationPlannerPage from './pages/CropRotationPlannerPage';
import AiAssistantPage from './pages/AiAssistantPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-emerald-800 font-bold text-sm">
          <span className="w-3 h-3 rounded-full bg-[#238636] animate-ping" />
          Loading AgriSense AI platform...
        </div>
      </div>
    );
  }
  // If not authenticated and not in demo mode, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <FarmProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              
              {/* Main Application with App Layout */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="my-farm" element={<MyFarmPage />} />
                <Route path="soil-health" element={<SoilHealthPage />} />
                <Route path="crop-explorer" element={<CropExplorerPage />} />
                <Route path="agri-tracker" element={<AgriTrackerPage />} />
                <Route path="rotation-planner" element={<CropRotationPlannerPage />} />
                <Route path="ai-assistant" element={<AiAssistantPage />} />
                <Route path="history" element={<HistoryPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </FarmProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

