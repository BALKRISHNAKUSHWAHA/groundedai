import React, { useState, useEffect } from 'react';
import { Network, Layers, Sparkles, User, FileText, Compass } from 'lucide-react';
import { api, ConceptGraphData } from '../services/api';

interface ConceptGraphProps {
  projectId: string;
}

export const ConceptGraph: React.FC<ConceptGraphProps> = ({ projectId }) => {
  const [data, setData] = useState<ConceptGraphData | null>(null);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGraph();
  }, [projectId]);

  const loadGraph = async () => {
    setLoading(true);
    try {
      const graph = await api.getConceptGraph(projectId);
      setData(graph);
    } catch (err) {
      console.error('Failed to load concept graph:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center text-xs text-slate-400">
        Rendering concept topology and author networks...
      </div>
    );
  }

  if (!data || data.nodes.length <= 1) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
        <Network className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-60" />
        <p>Ingest at least one source document to generate automated knowledge graphs.</p>
      </div>
    );
  }

  // Layout calculations for radial graph visualization
  const width = 800;
  const height = 480;
  const centerX = width / 2;
  const centerY = height / 2;

  // Place nodes on concentric rings
  const sourceNodes = data.nodes.filter((n) => n.type === 'source');
  const authorNodes = data.nodes.filter((n) => n.type === 'author');

  const positions: Record<string, { x: number; y: number }> = {
    'proj-root': { x: centerX, y: centerY },
  };

  // Ring 1: Source nodes (radius 140)
  sourceNodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / (sourceNodes.length || 1) - Math.PI / 2;
    positions[node.id] = {
      x: centerX + 140 * Math.cos(angle),
      y: centerY + 130 * Math.sin(angle),
    };
  });

  // Ring 2: Author nodes (radius 220)
  authorNodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / (authorNodes.length || 1) + 0.3;
    positions[node.id] = {
      x: centerX + 220 * Math.cos(angle),
      y: centerY + 190 * Math.sin(angle),
    };
  });

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
            <Network className="w-4 h-4 text-indigo-400" />
            <span>Interactive Knowledge Graph & Conceptual Map</span>
          </h3>
          <p className="text-xs text-slate-400">
            Topology showing structural connections between project domain, ingested papers, and primary investigators.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-[10px]">
          <span className="flex items-center space-x-1 text-indigo-400">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
            <span>Project Root</span>
          </span>
          <span className="flex items-center space-x-1 text-sky-400">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
            <span>Research Papers</span>
          </span>
          <span className="flex items-center space-x-1 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>Authors / Co-Citations</span>
          </span>
        </div>
      </div>

      <div className="relative w-full h-[480px] bg-slate-950/90 rounded-xl border border-slate-800/80 overflow-hidden flex items-center justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          <defs>
            <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Edges */}
          {data.edges.map((edge, idx) => {
            const p1 = positions[edge.source];
            const p2 = positions[edge.target];
            if (!p1 || !p2) return null;
            const isHighlight =
              activeNode && (edge.source === activeNode || edge.target === activeNode);

            return (
              <line
                key={idx}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={isHighlight ? '#818cf8' : 'url(#edgeGrad)'}
                strokeWidth={isHighlight ? 2.5 : 1.2}
                strokeDasharray={edge.relationship === 'authored_by' ? '4,4' : undefined}
                className="transition-all duration-300"
              />
            );
          })}

          {/* Nodes */}
          {data.nodes.map((node) => {
            const pos = positions[node.id];
            if (!pos) return null;

            const isSelected = activeNode === node.id;
            let fill = '#6366f1';
            let stroke = '#818cf8';
            let r = 24;

            if (node.type === 'project') {
              fill = '#4f46e5';
              stroke = '#a5b4fc';
              r = 26;
            } else if (node.type === 'source') {
              fill = '#0284c7';
              stroke = '#38bdf8';
              r = 18;
            } else if (node.type === 'author') {
              fill = '#059669';
              stroke = '#34d399';
              r = 14;
            }

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer group"
                onMouseEnter={() => setActiveNode(node.id)}
                onMouseLeave={() => setActiveNode(null)}
              >
                <circle
                  r={r + (isSelected ? 4 : 0)}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isSelected ? 3 : 1.5}
                  className="transition-all duration-200"
                />

                <text
                  dy={r + 14}
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize={node.type === 'project' ? '11px' : '9px'}
                  fontWeight={node.type === 'project' ? 'bold' : 'normal'}
                  className="pointer-events-none select-none drop-shadow"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover info tooltip */}
        {activeNode && (
          <div className="absolute bottom-4 left-4 bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2 text-xs shadow-xl text-slate-200 backdrop-blur-md">
            <span className="font-semibold text-indigo-400">
              {data.nodes.find((n) => n.id === activeNode)?.label}
            </span>
            <span className="text-[10px] text-slate-400 block capitalize">
              Node Type: {data.nodes.find((n) => n.id === activeNode)?.type}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
