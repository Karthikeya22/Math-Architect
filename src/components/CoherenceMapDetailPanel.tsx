import React from 'react';
import { ArrowUpRight, Link2, X } from 'lucide-react';
import type { CoherenceAtlasNode } from '../utils/buildCoherenceAtlasModel';
import { StandardExpectedQuestions } from './StandardExpectedQuestions';

type Props = {
  node: CoherenceAtlasNode;
  strandColor: string;
  strandTint: string;
  strandTitle: string;
  upstream: string[];
  downstream: string[];
  horizontalNeighbors: string[];
  pinned: boolean;
  onClearPin: () => void;
  onJump: (code: string) => void;
  onPin: (code: string) => void;
  className?: string;
};

const sectionTitleClass = 'coherence-atlas-section-label mb-2';

export const CoherenceMapDetailPanel: React.FC<Props> = ({
  node,
  strandColor,
  strandTint,
  strandTitle,
  upstream,
  downstream,
  horizontalNeighbors,
  pinned,
  onClearPin,
  onJump,
  onPin,
  className = '',
}) => (
  <aside
    className={`rounded-2xl border overflow-hidden ${className}`}
    style={{
      borderColor: 'var(--border-soft)',
      background: 'var(--surface-bg)',
      boxShadow: 'var(--shadow-soft)',
    }}
  >
    <div
      style={{
        padding: '20px 24px 16px',
        background: strandTint,
        borderBottom: `1px solid ${strandColor}33`,
      }}
    >
      <DetailHeader
        strandTitle={strandTitle}
        strandColor={strandColor}
        node={node}
        pinned={pinned}
        onClearPin={onClearPin}
        onPin={onPin}
      />
    </div>

    <div className="px-6 py-5">
      <div className={sectionTitleClass}>Benchmark</div>
      <p className="text-sm leading-relaxed" style={{ color: '#3A3528' }}>
        {node.description}
      </p>
    </div>

    {(upstream.length > 0 || downstream.length > 0) && (
      <div className="px-6 pb-4 space-y-3">
        {upstream.length > 0 && (
          <div>
            <div className={sectionTitleClass}>
              <ArrowUpRight className="w-3 h-3 rotate-[225deg]" /> Builds on
            </div>
            <div className="flex flex-wrap gap-1.5">
              {upstream.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => onJump(code)}
                  className="px-2 py-1 rounded text-xs font-mono font-semibold"
                  style={{
                    background: strandTint,
                    color: strandColor,
                    border: `1px solid ${strandColor}33`,
                  }}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        )}
        {downstream.length > 0 && (
          <div>
            <div className={sectionTitleClass}>
              <ArrowUpRight className="w-3 h-3" /> Builds toward
            </div>
            <div className="flex flex-wrap gap-1.5">
              {downstream.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => onJump(code)}
                  className="px-2 py-1 rounded text-xs font-mono font-semibold"
                  style={{
                    background: strandTint,
                    color: strandColor,
                    border: `1px solid ${strandColor}33`,
                  }}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )}

    {horizontalNeighbors.length > 0 && (
      <div className="px-6 pb-4">
        <div className={sectionTitleClass}>
          <Link2 className="w-3 h-3" /> Horizontal alignment
        </div>
        <div className="flex flex-wrap gap-1.5">
          {horizontalNeighbors.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => onJump(code)}
              className="px-2 py-1 rounded text-xs font-mono font-semibold"
              style={{
                background: strandTint,
                color: strandColor,
                border: `1px solid ${strandColor}33`,
              }}
            >
              {code}
            </button>
          ))}
        </div>
      </div>
    )}

    <div
      className="border-t px-6 py-5"
      style={{ borderColor: 'var(--border-soft)', background: 'var(--surface-soft)' }}
    >
      <StandardExpectedQuestions standardCode={node.code} description={node.description} />
    </div>
  </aside>
);

function DetailHeader({
  strandTitle,
  strandColor,
  node,
  pinned,
  onClearPin,
  onPin,
}: {
  strandTitle: string;
  strandColor: string;
  node: CoherenceAtlasNode;
  pinned: boolean;
  onClearPin: () => void;
  onPin: (code: string) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between mb-3 gap-2">
        <span
          className="text-xs font-bold px-2 py-1 rounded-md"
          style={{ color: 'white', background: strandColor }}
        >
          {strandTitle}
        </span>
        {pinned ? (
          <button
            type="button"
            onClick={onClearPin}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--surface-soft)', border: '1px solid var(--border-soft)' }}
            aria-label="Clear pinned standard"
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onPin(node.code)}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg"
            style={{ background: 'var(--text-primary)', color: '#fff' }}
          >
            Pin for generate
          </button>
        )}
      </div>
      <div className="font-mono text-xs font-semibold mb-2" style={{ color: strandColor }}>
        {node.code}
      </div>
      <h2
        className="font-display text-2xl font-semibold leading-tight tracking-tight"
        style={{ color: 'var(--text-primary)' }}
      >
        {node.title}
      </h2>
    </>
  );
}
