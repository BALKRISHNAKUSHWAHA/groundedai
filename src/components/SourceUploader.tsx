import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Globe, 
  FileText, 
  Code, 
  Sliders, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  FileUp, 
  Sparkles 
} from 'lucide-react';
import { api } from '../services/api';

interface SourceUploaderProps {
  projectId: string;
  onSourceIngested: () => void;
}

export const SourceUploader: React.FC<SourceUploaderProps> = ({
  projectId,
  onSourceIngested,
}) => {
  const [activeTab, setActiveTab] = useState<'pdf' | 'url' | 'text' | 'bibtex'>('pdf');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [url, setUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [bibtexText, setBibtexText] = useState('');

  // Chunking parameters (Section 9: Max Chunk Size default 1000 tokens, Overlap 200 tokens)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [maxChunkSize, setMaxChunkSize] = useState<number>(1000);
  const [overlap, setOverlap] = useState<number>(200);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', title || (selectedFile ? selectedFile.name : 'Untitled Research Source'));
      formData.append('authors', authors || 'Unknown Researcher');
      formData.append('publicationYear', String(year || new Date().getFullYear()));
      formData.append('source_type', activeTab);
      formData.append('maxChunkSizeTokens', String(maxChunkSize));
      formData.append('overlapTokens', String(overlap));

      if (activeTab === 'pdf') {
        if (!selectedFile) {
          throw new Error('Please select or drag-and-drop a PDF file to upload.');
        }
        formData.append('file', selectedFile);
      } else if (activeTab === 'url') {
        if (!url || !url.trim().startsWith('http')) {
          throw new Error('Please enter a valid URL starting with http:// or https://');
        }
        formData.append('url', url);
        formData.append('raw_content', rawText || `Ingested web article from ${url}. Document title: ${title}`);
      } else if (activeTab === 'text') {
        if (!rawText || rawText.trim().length < 20) {
          throw new Error('Please provide substantial research text (minimum 20 characters).');
        }
        formData.append('raw_content', rawText);
      } else if (activeTab === 'bibtex') {
        if (!bibtexText || !bibtexText.includes('@')) {
          throw new Error('Please paste a valid BibTeX entry (e.g., @article{...}).');
        }
        formData.append('raw_content', bibtexText);
      }

      const res = await api.uploadSource(projectId, formData);
      setSuccessMessage(res.message || 'Source successfully ingested and indexed into semantic chunks!');
      
      // Reset inputs
      setSelectedFile(null);
      setTitle('');
      setAuthors('');
      setUrl('');
      setRawText('');
      setBibtexText('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      onSourceIngested();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to ingest source document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <FileUp className="w-5 h-5 text-indigo-400" />
            <span>Ingest Research Source</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ingest PDFs, academic papers, web URLs, or BibTeX into semantic vectors for RAG.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center space-x-1.5 transition ${
            showAdvanced
              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
              : 'border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Chunk Config</span>
        </button>
      </div>

      {/* Advanced Ingestion Settings */}
      {showAdvanced && (
        <div className="mb-6 p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Max Chunk Size: <span className="text-indigo-400 font-mono">{maxChunkSize} tokens</span>
            </label>
            <input
              type="range"
              min="200"
              max="2000"
              step="50"
              value={maxChunkSize}
              onChange={(e) => setMaxChunkSize(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Optimal chunk size for context grounding in Gemini RAG.
            </p>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Overlap Window: <span className="text-indigo-400 font-mono">{overlap} tokens</span>
            </label>
            <input
              type="range"
              min="20"
              max="400"
              step="20"
              value={overlap}
              onChange={(e) => setOverlap(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Preserves contextual continuity across paragraph boundaries.
            </p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 mb-5">
        <button
          type="button"
          onClick={() => setActiveTab('pdf')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition ${
            activeTab === 'pdf'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload PDF</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('text')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition ${
            activeTab === 'text'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Raw Text</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition ${
            activeTab === 'url'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Web URL</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bibtex')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition ${
            activeTab === 'bibtex'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>BibTeX</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* PDF Dropzone */}
        {activeTab === 'pdf' && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-400 bg-indigo-950/20'
                : 'border-slate-700 hover:border-indigo-500/60 bg-slate-950/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.txt,.md"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            {selectedFile ? (
              <div className="text-slate-200 text-sm">
                <span className="font-semibold text-indigo-400">{selectedFile.name}</span>
                <span className="text-xs text-slate-400 block mt-1">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for text extraction & chunking
                </span>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-slate-200">
                  Drag and drop your research PDF here, or <span className="text-indigo-400 underline">browse files</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supports research papers, preprint PDFs, and clinical trial documents up to 25MB.
                </p>
              </div>
            )}
          </div>
        )}

        {/* URL Input */}
        {activeTab === 'url' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Article URL or DOI Link
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://arxiv.org/abs/... or https://doi.org/10.1038/..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Article Text / Abstract (Optional or automatically parsed)
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={3}
                placeholder="Paste key article excerpts or abstract if the URL is paywalled..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Raw Text Input */}
        {activeTab === 'text' && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Paste Research Notes, Methodology, or Paper Excerpt
            </label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={6}
              placeholder="Paste research contents here. It will be parsed and semantically chunked into the RAG vector index..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>
        )}

        {/* BibTeX Input */}
        {activeTab === 'bibtex' && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              BibTeX Citation Record
            </label>
            <textarea
              value={bibtexText}
              onChange={(e) => setBibtexText(e.target.value)}
              rows={6}
              placeholder={`@article{vaswani2017attention,
  author = {Vaswani, Ashish and Shazeer, Noam},
  title = {Attention Is All You Need},
  year = {2017}
}`}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>
        )}

        {/* Metadata Fields (Title, Authors, Year) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-slate-400 mb-1">Paper / Source Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deep Learning in Genomics"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Authors</label>
            <input
              type="text"
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
              placeholder="e.g. A. Smith, J. Doe"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Publication Year</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Error / Success Feedback */}
        {errorMessage && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center space-x-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center space-x-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900/50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing & Chunking...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Ingest & Index Document</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
