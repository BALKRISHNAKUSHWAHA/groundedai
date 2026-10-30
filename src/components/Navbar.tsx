import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  Sparkles, 
  LogOut, 
  User as UserIcon, 
  PlusCircle, 
  FolderGit2, 
  ChevronDown, 
  Layers, 
  BrainCircuit, 
  ExternalLink 
} from 'lucide-react';
import { api, User, Project } from '../services/api';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  projects?: Project[];
  currentProjectId?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  projects = [],
  currentProjectId,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [projectSwitcherOpen, setProjectSwitcherOpen] = useState(false);

  const currentProject = projects.find((p) => p.id === currentProjectId);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand & Project Switcher */}
        <div className="flex items-center space-x-6">
          <Link to={user ? '/dashboard' : '/'} className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <BrainCircuit className="w-5 h-5 text-indigo-400 group-hover:scale-105 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-slate-100 tracking-tight text-lg">ResearchHub</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
                  AI RAG
                </span>
              </div>
            </div>
          </Link>

          {/* Project Switcher if inside project workspace */}
          {user && currentProject && (
            <div className="relative">
              <button
                onClick={() => setProjectSwitcherOpen(!projectSwitcherOpen)}
                className="flex items-center space-x-2 text-sm text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition"
              >
                <FolderGit2 className="w-4 h-4 text-indigo-400" />
                <span className="max-w-[180px] sm:max-w-[260px] truncate font-medium">
                  {currentProject.title}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {projectSwitcherOpen && (
                <div
                  className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50"
                  onMouseLeave={() => setProjectSwitcherOpen(false)}
                >
                  <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/80 mb-1">
                    Your Research Projects
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setProjectSwitcherOpen(false);
                          navigate(`/projects/${p.id}`);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-slate-800/70 transition ${
                          p.id === currentProjectId ? 'bg-indigo-950/40 text-indigo-300' : 'text-slate-300'
                        }`}
                      >
                        <span className="font-medium truncate">{p.title}</span>
                        <span className="text-[10px] text-slate-500">{p.domain}</span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-slate-800 mt-1 pt-1 px-2">
                    <Link
                      to="/dashboard"
                      onClick={() => setProjectSwitcherOpen(false)}
                      className="flex items-center justify-center space-x-1.5 text-xs text-indigo-400 hover:text-indigo-300 py-1.5 rounded hover:bg-indigo-950/20 transition"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>All Projects & Overview</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Actions & User Info */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition ${
                  location.pathname === '/dashboard'
                    ? 'text-indigo-400 bg-indigo-500/10'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                Dashboard
              </Link>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2.5 text-sm text-slate-200 hover:text-white pl-2 pr-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:border-slate-700 transition"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                    {user.full_name?.charAt(0) || 'U'}
                  </div>
                  <span className="hidden sm:inline font-medium text-xs text-slate-300">
                    {user.full_name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-60 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 text-sm"
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-800/80">
                      <div className="font-semibold text-slate-100 text-xs">{user.full_name}</div>
                      <div className="text-slate-400 text-[11px] truncate">{user.email}</div>
                    </div>

                    <Link
                      to="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                      <Layers className="w-4 h-4 text-indigo-400" />
                      <span>Research Workspace</span>
                    </Link>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left flex items-center space-x-2 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition mt-1 border-t border-slate-800/60"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="text-sm text-slate-300 hover:text-white px-3.5 py-1.5 rounded-lg hover:bg-slate-900 transition font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 rounded-lg shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 transition flex items-center space-x-1.5"
              >
                <span>Get Started</span>
                <Sparkles className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
