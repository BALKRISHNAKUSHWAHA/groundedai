import React, { useState } from 'react';
import { Download, FileText, Code, Database, X, Check, Copy, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface ExportModalProps {
  projectId: string;
  projectTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  projectId,
  projectTitle,
  isOpen,
  onClose,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'markdown' | 'bibtex' | 'json'>('markdown');
  const [isExporting, setIsExporting] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleFetchPreview = async () => {
    setIsExporting(true);
    try {
      const data = await api.exportProject(projectId, selectedFormat);
      if (typeof data === 'string') {
        setPreviewContent(data);
      } else {
        setPreviewContent(JSON.stringify(data, null, 2));
      }
    } catch (err) {
      console.error('Export error:', err);
      setPreviewContent('Failed to load export data.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const data = await api.exportProject(projectId, selectedFormat);
      const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      const extension = selectedFormat === 'markdown' ? 'md' : selectedFormat === 'bibtex' ? 'bib' : 'json';
      const mimeType = selectedFormat === 'json' ? 'application/json' : 'text/plain';

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${selectedFormat}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(previewContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Export Research Hub Workspace</h3>
              <p className="text-[11px] text-slate-400">Structured academic reports, citations, and datasets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selectors */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Select Export Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedFormat('markdown');
                  setPreviewContent('');
                }}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  selectedFormat === 'markdown'
                    ? 'border-indigo-500 bg-indigo-950/20 text-indigo-200'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-400'
                }`}
              >
                <FileText className="w-5 h-5 mb-2 text-indigo-400" />
                <span className="font-semibold text-xs block text-slate-200">Markdown (.md)</span>
                <span className="text-[10px] text-slate-400">Full Literature Matrix & Citations</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedFormat('bibtex');
                  setPreviewContent('');
                }}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  selectedFormat === 'bibtex'
                    ? 'border-indigo-500 bg-indigo-950/20 text-indigo-200'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-400'
                }`}
              >
                <Code className="w-5 h-5 mb-2 text-sky-400" />
                <span className="font-semibold text-xs block text-slate-200">BibTeX (.bib)</span>
                <span className="text-[10px] text-slate-400">LaTeX & Overleaf Ready</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedFormat('json');
                  setPreviewContent('');
                }}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  selectedFormat === 'json'
                    ? 'border-indigo-500 bg-indigo-950/20 text-indigo-200'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-400'
                }`}
              >
                <Database className="w-5 h-5 mb-2 text-emerald-400" />
                <span className="font-semibold text-xs block text-slate-200">JSON Dataset</span>
                <span className="text-[10px] text-slate-400">Raw Project Chunks & Metadata</span>
              </button>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleFetchPreview}
              disabled={isExporting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Generate Preview</span>
            </button>

            {previewContent && (
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-700 transition flex items-center space-x-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Preview'}</span>
              </button>
            )}
          </div>

          {/* Preview Box */}
          {previewContent && (
            <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 max-h-56 overflow-y-auto font-mono text-[11px] text-slate-300 whitespace-pre-wrap">
              {previewContent}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-400 hover:text-white rounded-xl transition"
          >
            Cancel
          </button>

          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 flex items-center space-x-2 transition cursor-pointer"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Download File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
