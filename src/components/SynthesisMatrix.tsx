import React, { useState } from 'react';
import { 
  TableProperties, 
  Sparkles, 
  FileText, 
  HelpCircle, 
  Compass, 
  AlertTriangle, 
  CheckCircle, 
  Loader2, 
  RefreshCw, 
  ChevronDown, 
  Maximize2 
} from 'lucide-react';
import { api, SynthesisReport, Source } from '../services/api';

interface SynthesisMatrixProps {
  projectId: string;
  projectTitle: string;
  reports: SynthesisReport[];
  sources: Source[];
  onSynthesisGenerated: () => void;
}

export const SynthesisMatrix: React.FC<SynthesisMatrixProps> = ({
  projectId,
  projectTitle,
  reports,
  sources,
  onSynthesisGenerated,
}) => {
  const [selectedReportIndex, setSelectedReportIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentReport = reports.length > 0 ? reports[selectedReportIndex] || reports[0] : null;

  const handleRunSynthesis = async () => {
    if (sources.length === 0) {
      setErrorMessage('You need at least 1 ingested research paper before running literature synthesis.');
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);
    try {
      await api.runSynthesis(projectId);
      onSynthesisGenerated();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to synthesize literature.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <TableProperties className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <span>Automated Literature Synthesis Matrix</span>
                {reports.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
                    {reports.length} Version{reports.length > 1 ? 's' : ''}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Multi-paper comparative matrix analyzing research objectives, methodologies, findings, and limits.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {reports.length > 1 && (
            <select
              value={selectedReportIndex}
              onChange={(e) => setSelectedReportIndex(parseInt(e.target.value, 10))}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              {reports.map((r, idx) => (
                <option key={r.id} value={idx}>
                  {new Date(r.created_at).toLocaleDateString()} - Version {idx + 1}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleRunSynthesis}
            disabled={isGenerating || sources.length === 0}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 flex items-center space-x-2 transition cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synthesizing Corpus...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{reports.length > 0 ? 'Re-Synthesize Matrix' : 'Generate Synthesis Matrix'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center space-x-2.5 text-xs text-rose-300">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {!currentReport ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <TableProperties className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-100 mb-2">No Literature Matrix Generated Yet</h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Generate an automated cross-paper comparison matrix across your {sources.length} ingested research sources. Gemini AI will extract objectives, methods, findings, gaps, and future horizons.
          </p>
          <button
            onClick={handleRunSynthesis}
            disabled={isGenerating || sources.length === 0}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 inline-flex items-center space-x-2 transition cursor-pointer"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Generate First Synthesis Matrix</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Executive Theme & Summary */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 mb-1 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Core Research Theme</span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-3">
              {currentReport.synthesized_content.theme}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              {currentReport.synthesized_content.summary}
            </p>
          </div>

          {/* Comparative Matrix Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <TableProperties className="w-4 h-4 text-indigo-400" />
                <span>Multi-Paper Comparative Dimension Matrix</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                {currentReport.synthesized_content.comparison_matrix.length} Papers Compared
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-300 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4 min-w-[220px]">Research Source</th>
                    <th className="py-3 px-4 min-w-[240px]">Objective</th>
                    <th className="py-3 px-4 min-w-[240px]">Methodology</th>
                    <th className="py-3 px-4 min-w-[260px]">Key Findings</th>
                    <th className="py-3 px-4 min-w-[220px]">Limitations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {currentReport.synthesized_content.comparison_matrix.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4 font-semibold text-indigo-300 align-top">
                        <div className="flex items-start space-x-2">
                          <FileText className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                          <span className="leading-snug">{row.source_title}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-300 leading-relaxed align-top">
                        {row.research_objective}
                      </td>
                      <td className="py-4 px-4 text-slate-300 leading-relaxed align-top">
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-200 border border-slate-800 inline-block">
                          {row.methodology}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-emerald-300 leading-relaxed align-top font-medium">
                        {row.key_findings}
                      </td>
                      <td className="py-4 px-4 text-rose-300/90 leading-relaxed align-top">
                        {row.limitations}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Research Gaps & Future Directions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Research Gaps */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm mb-4">
                <AlertTriangle className="w-4 h-4" />
                <span>Identified Literature Gaps</span>
              </div>
              <ul className="space-y-3">
                {currentReport.synthesized_content.research_gaps.map((gap, i) => (
                  <li key={i} className="flex items-start space-x-2.5 text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                    <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Future Directions */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center space-x-2 text-sky-400 font-bold text-sm mb-4">
                <Compass className="w-4 h-4" />
                <span>High-Priority Future Research Horizons</span>
              </div>
              <ul className="space-y-3">
                {currentReport.synthesized_content.future_directions.map((dir, i) => (
                  <li key={i} className="flex items-start space-x-2.5 text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                    <span className="w-5 h-5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span>{dir}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
