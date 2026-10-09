import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Compass, Layers, Lightbulb, Link2 } from 'lucide-react';
import type { GradeLevel, StandardsGraphDataset } from '../types';
import {
  buildCoherenceAtlasLayout,
  columnScrollLeft,
  type CoherenceAtlasScope,
  layoutForVisibleStrands,
  visibleConnections,
  walkProgressionChain,
} from '../utils/buildCoherenceAtlasModel';
import { CoherenceMapDetailPanel } from './CoherenceMapDetailPanel';

type HorizontalEdgeRow = {
  source: string;
  target: string;
  type: string;
};

export type CoherenceMapProps = {
  k8Dataset: StandardsGraphDataset;
  hsDataset: StandardsGraphDataset;
  scope: CoherenceAtlasScope;
  onScopeChange: (scope: CoherenceAtlasScope) => void;
  focusGrade: GradeLevel | '';
  pinnedStandardCode: string;
  onPinStandard: (code: string) => void;
  onClearPin: () => void;
  onFocusGradeChange: (grade: GradeLevel | '') => void;
  strandFilter: Set<string>;
};

export const CoherenceMap: React.FC<CoherenceMapProps> = ({
  k8Dataset,
  hsDataset,
  scope,
  onScopeChange,
  focusGrade,
  pinnedStandardCode,
  onPinStandard,
  onClearPin,
  onFocusGradeChange,
  strandFilter,
}) => {
  const dataset = scope === 'k8' ? k8Dataset : hsDataset;
  const baseLayout = useMemo(() => buildCoherenceAtlasLayout(dataset, scope), [dataset, scope]);
  const layout = useMemo(
    () => layoutForVisibleStrands(baseLayout, strandFilter),
    [baseLayout, strandFilter],
  );
  const nodesByCode = useMemo(() => {
    const map = new Map(layout.nodes.map((node) => [node.code, node]));
    return map;
  }, [layout.nodes]);

  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [horizontalAdjacency, setHorizontalAdjacency] = useState<Record<string, string[]>>({});
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scope !== 'k8') {
      setHorizontalAdjacency({});
      return;
    }
    let cancelled = false;
    fetch('/data/processed/edges.json')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`edges ${res.status}`))))
      .then((rows: HorizontalEdgeRow[]) => {
        if (cancelled) return;
        const map = new Map<string, Set<string>>();
        for (const row of rows || []) {
          if (!row || row.type !== 'horizontal_alignment') continue;
          const source = String(row.source || '').trim();
          const target = String(row.target || '').trim();
          if (!source || !target || source === target) continue;
          const out = map.get(source) ?? new Set<string>();
          out.add(target);
          map.set(source, out);
          const back = map.get(target) ?? new Set<string>();
          back.add(source);
          map.set(target, back);
        }
        const next: Record<string, string[]> = {};
        for (const [code, neighbors] of map.entries()) next[code] = [...neighbors];
        setHorizontalAdjacency(next);
      })
      .catch(() => {
        if (!cancelled) setHorizontalAdjacency({});
      });
    return () => {
      cancelled = true;
    };
  }, [scope]);

  const activeCode = pinnedStandardCode || hoveredCode;
  const activeNode = activeCode ? nodesByCode.get(activeCode) ?? null : null;
  const chain = useMemo(
    () => walkProgressionChain(layout.connections, activeCode),
    [layout.connections, activeCode],
  );
  const renderedConnections = useMemo(
    () => visibleConnections(layout.connections, activeCode),
    [layout.connections, activeCode],
  );

  useEffect(() => {
    if (scope !== 'k8' || !focusGrade || !scrollRef.current) return;
    const target = columnScrollLeft(layout, String(focusGrade), scrollRef.current.clientWidth);
    scrollRef.current.scrollTo({ left: target, behavior: 'smooth' });
  }, [focusGrade, layout, scope]);

  const buildPath = (from: string, to: string) => {
    const a = layout.positions[from];
    const b = layout.positions[to];
    if (!a || !b) return '';
    const x1 = a.x + a.w;
    const y1 = a.y + a.h / 2;
    const x2 = b.x;
    const y2 = b.y + b.h / 2;
    const dx = (x2 - x1) * 0.5;
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  };

  const connectionStyle = (from: string, to: string) => {
    if (!activeCode) return { stroke: '#d8cee8', strokeWidth: 1.25, opacity: 0.75 };
    const involves = from === activeCode || to === activeCode;
    const inChain =
      (chain.upstream.has(from) && (to === activeCode || chain.upstream.has(to))) ||
      (chain.downstream.has(to) && (from === activeCode || chain.downstream.has(from)));
    if (involves || inChain) {
      const fromNode = nodesByCode.get(from);
      const color = fromNode ? layout.strandMeta[fromNode.strandCode]?.color ?? '#4f46e5' : '#4f46e5';
      return { stroke: color, strokeWidth: 2, opacity: 0.85 };
    }
    return { stroke: '#e8e2f2', strokeWidth: 1, opacity: 0.4 };
  };

  const handleNodeClick = (code: string) => {
    onPinStandard(code);
    const node = nodesByCode.get(code);
    if (scope === 'k8' && node) onFocusGradeChange(node.grade);
    setMobilePanelOpen(true);
  };

  const handleJump = (code: string) => {
    onPinStandard(code);
    const node = nodesByCode.get(code);
    if (scope === 'k8' && node) onFocusGradeChange(node.grade);
    setHoveredCode(code);
    setMobilePanelOpen(true);
  };

  const panelNode = activeNode;
  const panelMeta = panelNode ? layout.strandMeta[panelNode.strandCode] : null;

  return (
    <div className="coherence-atlas-panel coherence-atlas-panel--map w-full">
      <div className="coherence-atlas-header">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                color: 'var(--accent-strong)',
                background: 'var(--accent-soft)',
                border: '1px solid var(--border-soft)',
              }}
            >
              <Compass className="w-5 h-5" strokeWidth={1.75} aria-hidden />
            </div>
            <div>
              <h2 className="studio-panel-title studio-panel-title--lg">Coherence atlas</h2>
              <p className="text-sm coherence-atlas-body">How benchmarks build across grades</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm coherence-atlas-body">
            <span className="inline-flex items-center gap-1.5">
              <Layers className="w-4 h-4" strokeWidth={1.75} aria-hidden />
              <span className="font-mono">{layout.nodes.length}</span> benchmarks
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Link2 className="w-4 h-4" strokeWidth={1.75} aria-hidden />
              <span className="font-mono">{layout.connections.length}</span> links
            </span>
          </div>
        </div>

        <div className="relative flex gap-0 min-h-[480px]">
          <div ref={scrollRef} className="coherence-atlas-scroll flex-1">
            <svg
              width={layout.totalWidth}
              height={layout.totalHeight}
              style={{ display: 'block' }}
              role="group"
              aria-label="Coherence atlas of benchmarks by grade and strand"
            >
              {layout.strands.map((strand) => (
                <g key={`lane-${strand}`}>
                  <rect
                    x={0}
                    y={layout.laneTops[strand]}
                    width={layout.totalWidth}
                    height={layout.laneHeights[strand]}
                    fill={layout.strandMeta[strand].tint}
                  />
                  <text
                    x={12}
                    y={layout.laneTops[strand] + 18}
                    fontSize={10}
                    fontWeight={700}
                    letterSpacing={1.5}
                    fill={layout.strandMeta[strand].color}
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {strand.toUpperCase()}
                  </text>
                </g>
              ))}

              {layout.columns.map((column, index) => {
                const x = 28 + index * 260;
                const label = layout.columnLabels[column] ?? column;
                return (
                  <g key={`column-${column}`}>
                    <line
                      x1={x - 14}
                      y1={56}
                      x2={x - 14}
                      y2={layout.totalHeight}
                      stroke="#d8cee8"
                      strokeWidth={1}
                      strokeDasharray="2 4"
                    />
                    <text
                      x={x + 102}
                      y={32}
                      fontSize={11}
                      fontWeight={700}
                      letterSpacing={1}
                      fill="#6b6783"
                      textAnchor="middle"
                      style={{ fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      {scope === 'k8' ? 'GRADE' : 'STRAND'}
                    </text>
                    <text
                      x={x + 102}
                      y={50}
                      fontSize={22}
                      fontWeight={600}
                      fill="#171525"
                      textAnchor="middle"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {label}
                    </text>
                  </g>
                );
              })}

              <g>
                {renderedConnections.map(([from, to]) => {
                  const style = connectionStyle(from, to);
                  return (
                    <path
                      key={`${from}-${to}`}
                      d={buildPath(from, to)}
                      fill="none"
                      stroke={style.stroke}
                      strokeWidth={style.strokeWidth}
                      opacity={style.opacity}
                    />
                  );
                })}
              </g>

              <g>
                {layout.nodes.map((node) => {
                  const pos = layout.positions[node.code];
                  if (!pos) return null;
                  const isPinned = pinnedStandardCode === node.code;
                  const isHovered = hoveredCode === node.code;
                  const isActive = isPinned || isHovered;
                  const isUpstream = chain.upstream.has(node.code);
                  const isDownstream = chain.downstream.has(node.code);
                  const isInChain = isActive || isUpstream || isDownstream;
                  const dimmed = Boolean(activeCode) && !isInChain;
                  const color = layout.strandMeta[node.strandCode].color;

                  return (
                    <g
                      key={node.code}
                      className="coherence-node"
                      role="button"
                      tabIndex={0}
                      aria-pressed={isPinned}
                      aria-label={`${node.code}: ${node.title}`}
                      style={{ cursor: 'pointer', opacity: dimmed ? 0.3 : 1 }}
                      onClick={() => handleNodeClick(node.code)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          handleNodeClick(node.code);
                        }
                      }}
                      onFocus={() => setHoveredCode(node.code)}
                      onBlur={() => setHoveredCode((prev) => (prev === node.code ? null : prev))}
                      onMouseEnter={() => setHoveredCode(node.code)}
                      onMouseLeave={() => setHoveredCode((prev) => (prev === node.code ? null : prev))}
                    >
                      {isPinned && (
                        <rect
                          x={pos.x - 4}
                          y={pos.y - 4}
                          width={pos.w + 8}
                          height={pos.h + 8}
                          rx={12}
                          fill="none"
                          stroke={color}
                          strokeWidth={2}
                          opacity={0.4}
                        />
                      )}
                      <rect
                        x={pos.x}
                        y={pos.y}
                        width={pos.w}
                        height={pos.h}
                        rx={10}
                        fill="white"
                        stroke={isActive ? color : '#d8cee8'}
                        strokeWidth={isActive ? 2 : 1}
                      />
                      <rect x={pos.x} y={pos.y} width={4} height={pos.h} rx={2} fill={color} />
                      <text
                        x={pos.x + 14}
                        y={pos.y + 22}
                        fontSize={10}
                        fontWeight={600}
                        fill={color}
                        style={{ fontFamily: 'JetBrains Mono, monospace' }}
                      >
                        {node.code}
                      </text>
                      <text x={pos.x + 14} y={pos.y + 42} fontSize={13} fontWeight={600} fill="#171525">
                        {node.title.length > 26 ? `${node.title.slice(0, 25).trimEnd()}…` : node.title}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {panelNode && panelMeta && (
            <div className="hidden xl:block w-[380px] shrink-0 p-4">
              <CoherenceMapDetailPanel
                node={panelNode}
                strandColor={panelMeta.color}
                strandTint={panelMeta.tint}
                strandTitle={panelMeta.title}
                upstream={[...chain.upstream]}
                downstream={[...chain.downstream]}
                horizontalNeighbors={horizontalAdjacency[panelNode.code] ?? []}
                pinned={pinnedStandardCode === panelNode.code}
                onClearPin={onClearPin}
                onJump={handleJump}
                onPin={onPinStandard}
              />
            </div>
          )}
        </div>

        {!activeCode && (
          <div
            className="px-4 py-3 text-sm flex items-start gap-3 border-t coherence-atlas-body"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <Lightbulb className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--accent-strong)' }} strokeWidth={1.75} aria-hidden />
            <span>
              Hover or tab to a benchmark for details. Click or press Enter to pin it. Related grades show in the detail panel.
            </span>
          </div>
        )}

      {panelNode && panelMeta && mobilePanelOpen && (
        <div className="xl:hidden fixed inset-0 z-40">
          <button
            type="button"
            className="absolute inset-0"
            style={{ background: 'var(--scrim)' }}
            aria-label="Close detail panel"
            onClick={() => setMobilePanelOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[82vh] overflow-y-auto p-3">
            <CoherenceMapDetailPanel
              node={panelNode}
              strandColor={panelMeta.color}
              strandTint={panelMeta.tint}
              strandTitle={panelMeta.title}
              upstream={[...chain.upstream]}
              downstream={[...chain.downstream]}
              horizontalNeighbors={horizontalAdjacency[panelNode.code] ?? []}
              pinned={pinnedStandardCode === panelNode.code}
              onClearPin={onClearPin}
              onJump={handleJump}
              onPin={onPinStandard}
            />
          </div>
        </div>
      )}
    </div>
  );
};