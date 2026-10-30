import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { api, User, Project } from './services/api';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectWorkspace } from './pages/ProjectWorkspace';

function AppContent() {
  const [user, setUser] = useState<User | null>(() => api.getCurrentUser());
  const [projects, setProjects] = useState<Project[]>([]);
  const location = useLocation();

  // Check auth status on mount
  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api.getMe()
        .then((res) => {
          setUser(res.user);
          // Pre-load projects for switcher
          api.getProjects().then(setProjects).catch(() => {});
        })
        .catch(() => {
          api.logout();
          setUser(null);
        });
    }
  }, []);

  const handleLogout = () => {
    api.logout();
    setUser(null);
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    api.getProjects().then(setProjects).catch(() => {});
  };

  // Extract current project ID from path if present
  const projectMatch = location.pathname.match(/\/projects\/([a-zA-Z0-9-]+)/);
  const currentProjectId = projectMatch ? projectMatch[1] : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar
        user={user}
        onLogout={handleLogout}
        projects={projects}
        currentProjectId={currentProjectId}
      />

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={
              user ? <Navigate to="/dashboard" replace /> : <LoginPage onLoginSuccess={handleLoginSuccess} />
            }
          />
          <Route
            path="/register"
            element={
              user ? <Navigate to="/dashboard" replace /> : <RegisterPage onRegisterSuccess={handleLoginSuccess} />
            }
          />
          <Route
            path="/dashboard"
            element={
              user ? <DashboardPage user={user} /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/projects/:id"
            element={
              user ? <ProjectWorkspace /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/projects/:id/sources"
            element={
              user ? <ProjectWorkspace /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/projects/:id/chat"
            element={
              user ? <ProjectWorkspace /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/projects/:id/synthesize"
            element={
              user ? <ProjectWorkspace /> : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/projects/:id/export"
            element={
              user ? <ProjectWorkspace /> : <Navigate to="/login" replace />
            }
          />
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-300">ResearchHub AI</span>
            <span>—</span>
            <span>Literature Discovery & Synthesis Platform</span>
          </div>
          <div>
            Powered by Google Gemini RAG • APA, MLA, BibTeX Citations • Strict Evidence Grounding
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
