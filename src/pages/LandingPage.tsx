import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  BrainCircuit, 
  BookOpen, 
  TableProperties, 
  UploadCloud, 
  Quote, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Network, 
  ShieldCheck, 
  FileText 
} from 'lucide-react';
import { api } from '../services/api';

const DOMAINS = [
  'Computer Science & AI',
  'Biomedical & Life Sciences',
  'Social Sciences & Economics',
  'Physical Sciences & Engineering',
  'General & Interdisciplinary',
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleQuickDemoLogin = async () => {
    try {
      await api.login({
        email: 'dr.sarah@researchhub.ai',
        password: 'research123',
      });
      navigate('/dashboard');
    } catch (err) {
      navigate('/login');
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background radial gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-600/10 blur-[140px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-8 animate-in fade-in">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>ResearchHub AI Platform • Literature Synthesis & RAG Assistant</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-100 tracking-tight max-w-4xl mx-auto leading-[1.1] mb-6">
          Accelerate Literature Discovery with <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-indigo-300 bg-clip-text text-transparent">Grounded AI</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Ingest PDFs, extract methodologies, synthesize cross-paper literature matrices, and chat with your research corpus with exact source attribution.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          <Link
            to="/register"
            className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/35 flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <span>Start Free Research</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            onClick={handleQuickDemoLogin}
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-sm rounded-xl border border-slate-700/80 shadow-lg flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <BrainCircuit className="w-4 h-4 text-indigo-400" />
            <span>Launch Pre-loaded Demo</span>
          </button>
        </div>

        {/* Academic Domains Pill Strip */}
        <div className="mt-14 pt-8 border-t border-slate-800/80 max-w-4xl mx-auto">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Tailored for High-Impact Scientific Disciplines
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {DOMAINS.map((domain, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 text-xs"
              >
                {domain}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Core Capabilities Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-100 mb-3">
            Built for Academic Rigor & Objective Synthesis
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Eliminate manual review bottlenecks while ensuring strict evidence grounding and zero hallucinations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">Multi-Source Ingestion & Chunker</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Upload raw PDF papers, link DOIs or web articles, and parse BibTeX entries. Chunks are automatically indexed with customizable token density.
            </p>
            <div className="text-xs text-indigo-400 font-medium flex items-center space-x-1">
              <span>PDF text extraction & overlap tuning</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-6">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">Grounded Gemini RAG Chat</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Query across multiple documents simultaneously. Every assertion provides verifiable inline source badges and exact chunk quotes.
            </p>
            <div className="text-xs text-sky-400 font-medium flex items-center space-x-1">
              <span>Zero-hallucination citation protocol</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6">
              <TableProperties className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 mb-2">Automated Literature Matrix</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Compare papers side-by-side across objectives, methodologies, empirical findings, limitations, and future horizons into a structured matrix.
            </p>
            <div className="text-xs text-emerald-400 font-medium flex items-center space-x-1">
              <span>Structured JSON synthesis matrix</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Strip: Citations, Knowledge Graph, Export */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-slate-800/80">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <Quote className="w-6 h-6 text-indigo-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-200 mb-1">Citation-Ready Bibliographies</h4>
            <p className="text-xs text-slate-400">Instant APA 7th, MLA 9th, Chicago, and BibTeX for LaTeX/Overleaf.</p>
          </div>

          <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <Network className="w-6 h-6 text-sky-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-200 mb-1">Knowledge & Concept Graphs</h4>
            <p className="text-xs text-slate-400">Interactive visual maps of themes, citations, and co-authors.</p>
          </div>

          <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800/60">
            <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-200 mb-1">Secure Data Isolation</h4>
            <p className="text-xs text-slate-400">JWT auth, bcrypt hashing, and strict Row Level Security isolation.</p>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-12 max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
          <h2 className="text-3xl font-extrabold text-slate-100 mb-4">
            Ready to upgrade your scientific research workflow?
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto mb-8">
            Create your first research workspace, upload papers, and generate comprehensive literature reviews in seconds.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer"
            >
              Create Account
            </Link>
            <button
              onClick={handleQuickDemoLogin}
              className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
            >
              Test with Dr. Sarah's Demo
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
