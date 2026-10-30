import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  FolderGit2, 
  FileText, 
  BrainCircuit, 
  TableProperties, 
  Download, 
  Network, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Layers, 
  Loader2, 
  Quote, 
  CheckCircle2, 
  ArrowLeft 
} from 'lucide-react';
import { api, Project, Source, SynthesisReport } from '../services/api';
import { SourceUploader } from '../components/SourceUploader';
import { ChatInterface } from '../components/ChatInterface';
import { SynthesisMatrix } from '../components/SynthesisMatrix';
import { ConceptGraph } from '../components/ConceptGraph';
import { CitationBox } from '../components/CitationBox';
import { ExportModal } from '../components/ExportModal';

export const ProjectWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [project, setProject] = useState<Project | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [synthesisReports, setSynthesisReports] = useState<SynthesisReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active view: derived from URL path or tab
  // Options: 'overview' | 'sources' | 'chat' | 'synthesize' | 'export'
  const getActiveTabFromPath = (): 'overview' | 'sources' | 'chat' | 'synthesize' | 'export' => {
    const path = location.pathname;
    if (path.endsWith('/sources')) return 'sources';
    if (path.endsWith('/chat')) return 'chat';
    if (path.endsWith('/synthesize')) return 'synthesize';
    if (path.endsWith('/export')) return 'export';
    return 'overview';
  };

  const activeTab = getActiveTabFromPath();

  // Export Modal
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Active source for inspection
  const [selectedSourceForCitation, setSelectedSourceForCitation] = useState<Source | null>(null);

  useEffect(() => {
    if (id) {
      loadWorkspaceData(id);
    }
  }, [id]);

  const loadWorkspaceData = async (projectId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [projData, sourcesData, synthesisData] = await Promise.all([
        api.getProject(projectId),
        api.getSources(projectId),
        api.getSynthesisReports(projectId),
      ]);
      setProject(projData);
      setSources(sourcesData);
      setSynthesisReports(synthesisData);
    } catch (err: any) {
      console.error('Workspace load error:', err);
      setError(err.message || 'Failed to load project workspace.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSource = async (sourceId: string, title: string) => {
    if (!id) return;
    if (!window.confirm(`Delete "${title}" and all its indexed chunks?`)) return;

    try {
      await api.deleteSource(id, sourceId);
      setSources((prev) => prev.filter((s) => s.id !== sourceId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete source.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-xs text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
        <span className="font-medium text-slate-300">Loading research workspace & RAG indices...</span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl">
          <h2 className="text-base font-bold text-slate-200 mb-2">Unable to Load Project</h2>
          <p className="text-xs text-slate-400 mb-6">{error || 'Project not found or unauthorized access.'}</p>
          <Link
            to="/dashboard"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow transition"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Workspace Sub-header */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-2">
            <Link to="/dashboard" className="hover:text-indigo-400 transition flex items-center space-x-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Projects</span>
            </Link>
            <span>/</span>
            <span className="text-slate-300 font-medium">{project.domain}</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
            {project.title}
          </h1>

          {project.description && (
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              {project.description}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl flex items-center space-x-2 transition cursor-pointer shadow"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export & Citations</span>
          </button>
        </div>
      </div>

      {/* Workspace Tabs Navigation */}
      <div className="flex space-x-2 border-b border-slate-800/80 pb-px overflow-x-auto">
        <Link
          to={`/projects/${id}`}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl flex items-center space-x-2 transition border-b-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Knowledge Graph</span>
        </Link>

        <Link
          to={`/projects/${id}/sources`}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl flex items-center space-x-2 transition border-b-2 whitespace-nowrap ${
            activeTab === 'sources'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Sources & Chunks ({sources.length})</span>
        </Link>

        <Link
          to={`/projects/${id}/chat`}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl flex items-center space-x-2 transition border-b-2 whitespace-nowrap ${
            activeTab === 'chat'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <BrainCircuit className="w-4 h-4" />
          <span>RAG Assistant</span>
        </Link>

        <Link
          to={`/projects/${id}/synthesize`}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl flex items-center space-x-2 transition border-b-2 whitespace-nowrap ${
            activeTab === 'synthesize'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <TableProperties className="w-4 h-4" />
          <span>Synthesis Matrix</span>
        </Link>
      </div>

      {/* Tab Content Panels */}
      <div>
        {/* Tab 1: Overview & Concept Graph */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <ConceptGraph projectId={id!} />

            {/* Quick summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Ingested Literature
                  </h3>
                  <FileText className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-bold text-slate-100 mb-1">{sources.length} Papers</div>
                <p className="text-[11px] text-slate-400 mb-4">
                  Full text parsed, indexed, and available for multi-document RAG querying.
                </p>
                <Link
                  to={`/projects/${id}/sources`}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center space-x-1"
                >
                  <span>Manage Sources</span>
                  <span>→</span>
                </Link>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Gemini RAG Assistant
                  </h3>
                  <BrainCircuit className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-2xl font-bold text-slate-100 mb-1">Grounded Mode</div>
                <p className="text-[11px] text-slate-400 mb-4">
                  Ask analytical questions with verifiable chunk quotes and source attribution.
                </p>
                <Link
                  to={`/projects/${id}/chat`}
                  className="text-xs font-semibold text-sky-400 hover:text-sky-300 inline-flex items-center space-x-1"
                >
                  <span>Open Chat</span>
                  <span>→</span>
                </Link>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Comparative Matrix
                  </h3>
                  <TableProperties className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-slate-100 mb-1">
                  {synthesisReports.length > 0 ? 'Synthesized' : 'Pending'}
                </div>
                <p className="text-[11px] text-slate-400 mb-4">
                  Cross-paper comparison across objectives, methods, findings, and limits.
                </p>
                <Link
                  to={`/projects/${id}/synthesize`}
                  className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center space-x-1"
                >
                  <span>View Synthesis Matrix</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Sources Manager */}
        {activeTab === 'sources' && (
          <div className="space-y-8">
            <SourceUploader
              projectId={id!}
              onSourceIngested={() => loadWorkspaceData(id!)}
            />

            {/* List of Sources */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>Ingested Documents & Indexed Chunks ({sources.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    All sources are indexed for RAG vector retrieval and literature matrix generation.
                  </p>
                </div>
              </div>

              {sources.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No sources ingested yet. Use the uploader above to add PDFs, text, or web URLs.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {sources.map((source) => (
                    <div key={source.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-100 text-sm">{source.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded uppercase font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            {source.source_type}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          <span>Authors: {source.authors}</span> • <span>Year: {source.publication_year}</span> •{' '}
                          <span className="text-indigo-300 font-mono">{source.chunkCount || 1} chunks</span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 max-w-3xl pt-1">
                          {source.raw_content.slice(0, 240)}...
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 self-start md:self-auto shrink-0">
                        <button
                          onClick={() => setSelectedSourceForCitation(source)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition flex items-center space-x-1"
                        >
                          <Quote className="w-3 h-3 text-indigo-400" />
                          <span>Cite</span>
                        </button>

                        <button
                          onClick={() => handleDeleteSource(source.id, source.title)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                          title="Delete source"
                          aria-label={`Delete ${source.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Citation Modal / Box if selected */}
            {selectedSourceForCitation && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-slate-100 truncate pr-4">
                      Citation: {selectedSourceForCitation.title}
                    </h3>
                    <button
                      onClick={() => setSelectedSourceForCitation(null)}
                      className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
                    >
                      Close
                    </button>
                  </div>
                  <CitationBox source={selectedSourceForCitation} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: RAG Assistant Chat */}
        {activeTab === 'chat' && (
          <div>
            <ChatInterface
              projectId={id!}
              projectTitle={project.title}
              sources={sources}
            />
          </div>
        )}

        {/* Tab 4: Literature Synthesis Matrix */}
        {activeTab === 'synthesize' && (
          <div>
            <SynthesisMatrix
              projectId={id!}
              projectTitle={project.title}
              reports={synthesisReports}
              sources={sources}
              onSynthesisGenerated={() => loadWorkspaceData(id!)}
            />
          </div>
        )}

        {/* Tab 5: Export Hub */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <Download className="w-5 h-5 text-indigo-400" />
                  <span>Research Export Hub</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Export structured academic reports, complete BibTeX bibliographies, and full project datasets.
                </p>
              </div>

              <button
                onClick={() => setIsExportModalOpen(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow transition"
              >
                Open Export Dialog
              </button>
            </div>

            {/* Quick Citations Overview for all sources */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h4 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Quote className="w-4 h-4 text-indigo-400" />
                <span>Instant Bibliography for Ingested Papers</span>
              </h4>
              <div className="grid grid-cols-1 gap-4">
                {sources.map((s) => (
                  <CitationBox key={s.id} source={s} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      <ExportModal
        projectId={id!}
        projectTitle={project.title}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
};
