import React from 'react';
import type { GradeLevel, StandardsTreeNode, StandardsTreeNodeDetails } from '../types';
import { StandardPracticeLinks } from './StandardPracticeLinks';

type Props = {
  selectedGrade: GradeLevel | '';
  details: StandardsTreeNodeDetails | null;
  showHorizontalLinks: boolean;
  onJumpToNode: (node: StandardsTreeNode) => void;
  onMapStandard: (standardCode: string) => void;
  onViewStandard: (standardCode: string) => void;
  activeStandardCode: string;
  className?: string;
};

const sectionTitle = 'text-xs uppercase font-bold tracking-wide text-slate-500';

export const StandardNodeDetails: React.FC<Props> = ({
  selectedGrade,
  details,
  showHorizontalLinks,
  onJumpToNode,
  onMapStandard,
  onViewStandard,
  activeStandardCode,
  className = '',
}) => {
  if (!selectedGrade) {
    return (
      <aside className={`rounded-xl border border-slate-200 bg-slate-50 p-4 ${className}`}>
        <p className="text-sm text-slate-600">Select a grade and node to view details.</p>
      </aside>
    );
  }

  if (!details) {
    return (
      <aside className={`rounded-xl border border-slate-200 bg-slate-50 p-4 ${className}`}>
        <p className="text-sm text-slate-600">Click any topic, family, or benchmark node.</p>
      </aside>
    );
  }

  const { node, horizontalNeighbors } = details;
  const showBenchmarkControls = node.kind === 'benchmark';

  return (
    <aside className={`rounded-xl border border-teal-500/60 bg-white p-4 space-y-4 h-full overflow-y-auto ${className}`}>
      <div>
        <p className={sectionTitle}>General Information</p>
        <h4 className="text-lg font-bold text-slate-800 mt-1">{node.code}</h4>
        <p className="text-sm text-slate-600 mt-1">{node.label}</p>
      </div>

      <div className="grid grid-cols-1 gap-2 text-sm">
        <p><span className="font-semibold text-slate-700">Grade:</span> {node.grade}</p>
        <p><span className="font-semibold text-slate-700">Strand:</span> {node.strandCode} ({node.strandTitle})</p>
        <p><span className="font-semibold text-slate-700">Topic:</span> {node.topicTitle}</p>
      </div>

      {node.description && (
        <div>
          <p className={sectionTitle}>Description</p>
          <p className="text-sm text-slate-700 mt-1 leading-relaxed">{node.description}</p>
        </div>
      )}

      <div className="text-sm">
        <p className={sectionTitle}>Node Stats</p>
        <div className="mt-2 space-y-1 text-slate-700">
          <p>Children: {node.counts.childCount ?? node.childrenIds.length}</p>
          <p>Benchmarks: {node.counts.benchmarkCount ?? 0}</p>
          <p>Horizontal Links: {node.counts.horizontalLinkCount ?? 0}</p>
        </div>
      </div>

      {showHorizontalLinks && horizontalNeighbors.length > 0 && (
        <div>
          <p className={sectionTitle}>Connected Benchmarks</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {horizontalNeighbors.map((neighbor) => (
              <button
                key={neighbor.id}
                onClick={() => onJumpToNode(neighbor)}
                className="text-xs font-semibold px-2 py-1 rounded-md border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
              >
                {neighbor.code}
              </button>
            ))}
          </div>
        </div>
      )}

      {showBenchmarkControls && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onMapStandard(node.code)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700"
          >
            Map Standard
          </button>
          <button
            onClick={() => onViewStandard(node.code)}
            className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-bold text-white"
          >
            View Standard
          </button>
        </div>
      )}

      {activeStandardCode && (
        <StandardPracticeLinks
          standardCode={activeStandardCode}
          title="Aligned practice"
          subtitle={activeStandardCode}
          maxVisible={6}
          defaultOpen
        />
      )}
    </aside>
  );
};
