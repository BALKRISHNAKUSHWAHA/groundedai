import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FolderGit2, 
  FileText, 
  MessageSquareText, 
  TableProperties, 
  ArrowRight, 
  Trash2, 
  Sparkles, 
  Clock 
} from 'lucide-react';
import { Project } from '../services/api';

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

const DOMAIN_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  'Computer Science & AI': {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  'Biomedical & Life Sciences': {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/20',
  },
  'Social Sciences & Economics': {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
  },
  'Physical Sciences & Engineering': {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/20',
  },
  'General & Interdisciplinary': {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/20',
  },
};

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDelete }) => {
  const domainStyle = DOMAIN_STYLES[project.domain] || {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/20',
  };

  const formattedDate = new Date(project.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="group relative flex flex-col justify-between bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-6 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/5">
      <div>
        {/* Top Header: Domain badge & Delete */}
        <div className="flex items-center justify-between mb-3">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${domainStyle.bg} ${domainStyle.text} ${domainStyle.border}`}
          >
            {project.domain}
          </span>
          <button
            onClick={(e) => onDelete(project.id, e)}
            className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition opacity-0 group-hover:opacity-100"
            title="Delete Project"
            aria-label={`Delete project ${project.title}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Description */}
        <Link to={`/projects/${project.id}`} className="block">
          <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug mb-2">
            {project.title}
          </h3>
          <p className="text-slate-400 text-xs line-clamp-3 leading-relaxed mb-4">
            {project.description || 'No project abstract provided. Ingest documents and start synthesized discovery.'}
          </p>
        </Link>
      </div>

      <div>
        {/* Statistics Bar */}
        <div className="grid grid-cols-3 gap-2 py-3 px-3.5 bg-slate-950/60 rounded-xl border border-slate-800/60 mb-4 text-xs">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Sources</span>
            <span className="font-bold text-slate-200 flex items-center space-x-1 mt-0.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>{project.sourcesCount ?? 0}</span>
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Chunks</span>
            <span className="font-bold text-slate-200 flex items-center space-x-1 mt-0.5">
              <FolderGit2 className="w-3.5 h-3.5 text-sky-400" />
              <span>{project.chunksCount ?? 0}</span>
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Synthesis</span>
            <span className="font-bold text-slate-200 flex items-center space-x-1 mt-0.5">
              <TableProperties className="w-3.5 h-3.5 text-emerald-400" />
              <span>{(project.synthesisCount ?? 0) > 0 ? 'Ready' : 'Pending'}</span>
            </span>
          </div>
        </div>

        {/* Card Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
            <Clock className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>

          <Link
            to={`/projects/${project.id}`}
            className="inline-flex items-center space-x-1 font-semibold text-indigo-400 hover:text-indigo-300 group-hover:translate-x-0.5 transition-transform"
          >
            <span>Open Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
