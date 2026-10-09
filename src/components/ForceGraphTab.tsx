import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5hierarchy from '@amcharts/amcharts5/hierarchy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import { ArrowLeft, Home } from 'lucide-react';
import type { StandardsTreeDataset, TopicNode } from '../types';
import { GradeLevel } from '../types';

// ─── Colour palettes ──────────────────────────────────────────────────────────

const STRAND_COLORS: Record<string, string> = {
  NSO: '#16a34a',
  AR: '#2563eb',
  A: '#2563eb',
  FR: '#d97706',
  F: '#d97706',
  M: '#0d9488',
  C: '#0d9488',
  GR: '#7c3aed',
  DA: '#db2777',
  DP: '#db2777',
  FL: '#475569',
  LT: '#a855f7',
  T: '#0d9488',
};

const GRADE_COLORS: Record<string, string> = {
  Kindergarten: '#f43f5e',
  'Grade 1': '#f97316',
  'Grade 2': '#eab308',
  'Grade 3': '#22c55e',
  'Grade 4': '#14b8a6',
  'Grade 5': '#3b82f6',
  'Grade 6': '#6366f1',
  'Grade 7': '#8b5cf6',
  'Grade 8': '#ec4899',
  '912': '#0f172a',
};

const ROOT_COLOR = '#64748b';

const nodeColor = (ctx: ForceNode): string => {
  // High-contrast violet so cross-strand / cross-grade peers read at a glance
  if (ctx.isHorizontal) return '#7e22ce';
  if (ctx.kind === 'grade') return GRADE_COLORS[ctx.gradeValue ?? ''] ?? '#64748b';
  if (ctx.kind === 'root') return ROOT_COLOR;
  return STRAND_COLORS[ctx.strandCode ?? ''] ?? '#64748b';
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ForceNode {
  name: string;
  displayName?: string;
  /** ~72 for center node, ~34 for all leaf children (uniform size per level) */
  value?: number;
  children?: ForceNode[];
  nodeId?: string;
  kind?: 'root' | 'grade' | 'strand' | 'topic' | 'family' | 'benchmark' | 'horizontal';
  gradeValue?: string;
  strandCode?: string;
  topicId?: string;
  isHorizontal?: boolean;
  benchmarkCode?: string;
}

export interface ForceGraphTabProps {
  treeDataset: StandardsTreeDataset;
  selectedGrade: GradeLevel | '';
  selectedStandardCode: string;
  showHorizontalLinks: boolean;
  /** Chart area height in px (taller for high school drill views). */
  heightPx?: number;
  onSelectGrade: (grade: GradeLevel | '') => void;
  onClearGrade: () => void;
  onSelectStandard: (code: string) => void;
  onSelectTopic: (topic: TopicNode | null) => void;
  onActivateNode: (nodeId: string | null) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ForceGraphTab({
  treeDataset,
  selectedGrade,
  selectedStandardCode,
  showHorizontalLinks,
  heightPx = 560,
  onSelectGrade,
  onClearGrade,
  onSelectStandard,
  onSelectTopic,
  onActivateNode,
}: ForceGraphTabProps) {
  const chartDivRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<am5.Root | null>(null);

  /**
   * drillStack drives which level we are at:
   *   []                    → grade selection (or topic overview when grade chosen)
   *   ['topic:X']           → topic's families
   *   ['topic:X','family:Y']→ family's benchmarks
   */
  const [drillStack, setDrillStack] = useState<string[]>([]);

  // Stable callback refs
  const onSelectGradeRef = useRef(onSelectGrade);
  onSelectGradeRef.current = onSelectGrade;
  const onSelectStandardRef = useRef(onSelectStandard);
  onSelectStandardRef.current = onSelectStandard;
  const onClearGradeRef = useRef(onClearGrade);
  onClearGradeRef.current = onClearGrade;
  const onSelectTopicRef = useRef(onSelectTopic);
  onSelectTopicRef.current = onSelectTopic;
  const onActivateNodeRef = useRef(onActivateNode);
  onActivateNodeRef.current = onActivateNode;
  const setDrillStackRef = useRef(setDrillStack);
  setDrillStackRef.current = setDrillStack;

  // Reset drill state whenever grade changes
  useEffect(() => {
    setDrillStack([]);
    onActivateNode(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGrade]);

  const gradeView = selectedGrade ? treeDataset.gradesView[selectedGrade] : null;

  // ── Build single-level (parent + children, all children same size) ──────────
  const chartData = useMemo((): ForceNode => {
    // ── LEVEL 0a – No grade: show grade picker ────────────────────────────────
    if (!selectedGrade || !gradeView) {
      const grades = treeDataset.grades;
      return {
        name: 'Math Standards',
        displayName: 'Select a Grade',
        value: 72,
        kind: 'root',
        children: grades.map((g) => ({
          name: g,
          displayName: g,
          value: 34,
          kind: 'grade' as const,
          gradeValue: g,
        })),
      };
    }

    const currentNodeId = drillStack[drillStack.length - 1] ?? null;

    // ── LEVEL 0b – Grade chosen, no drill: show ONE node per strand/topic family
    if (!currentNodeId) {
      const topics = gradeView.rootNodeIds
        .map((id) => gradeView.nodesById[id])
        .filter((n) => n?.kind === 'topic');

      const strandByCode = new Map<
        string,
        { strandCode: string; strandTitle: string; nodeId: string }
      >();
      for (const t of topics) {
        if (!strandByCode.has(t.strandCode)) {
          strandByCode.set(t.strandCode, {
            strandCode: t.strandCode,
            strandTitle: t.strandTitle,
            nodeId: `strand:${t.strandCode}`,
          });
        }
      }

      const strandList = [...strandByCode.values()];
      const strandVal = Math.max(28, 40 - Math.min(10, strandList.length));
      return {
        name: selectedGrade,
        displayName: selectedGrade,
        value: 72,
        kind: 'grade',
        gradeValue: selectedGrade,
        children: strandList.map((strand) => ({
          name: strand.nodeId,
          displayName: strand.strandTitle,
          value: strandVal,
          nodeId: strand.nodeId,
          kind: 'strand' as const,
          strandCode: strand.strandCode,
        })),
      };
    }

    // ── LEVEL 1a – Strand selected: show topic variants (1, 2, 3...) ──────────
    if (currentNodeId.startsWith('strand:')) {
      const strandCode = currentNodeId.replace('strand:', '');
      const strandTopics = gradeView.rootNodeIds
        .map((id) => gradeView.nodesById[id])
        .filter((n) => n?.kind === 'topic' && n.strandCode === strandCode);
      const strandTitle =
        strandTopics[0]?.strandTitle ?? strandCode;

      const topicVal = Math.max(26, 40 - Math.min(12, strandTopics.length));
      return {
        name: strandTitle,
        displayName: strandTitle,
        value: 72,
        kind: 'strand',
        strandCode,
        children: strandTopics.map((t) => ({
          name: t.label,
          displayName: t.topicTitle,
          value: topicVal,
          nodeId: `topic:${t.topicId}`,
          kind: 'topic' as const,
          strandCode: t.strandCode,
          topicId: t.topicId,
        })),
      };
    }

    const currentNode = gradeView.nodesById[currentNodeId];
    if (!currentNode) return { name: 'Root', value: 72, kind: 'root' };

    // ── LEVEL 1 – Topic: show families ───────────────────────────────────────
    if (currentNode.kind === 'topic') {
      const famCount = currentNode.childrenIds.length;
      const famVal = Math.max(26, 40 - Math.min(14, famCount));
      return {
        name: currentNode.topicTitle,
        displayName: currentNode.topicTitle,
        value: 72,
        kind: 'topic',
        strandCode: currentNode.strandCode,
        children: currentNode.childrenIds
          .map((fId) => {
            const f = gradeView.nodesById[fId];
            if (!f || f.kind !== 'family') return null;
            return {
              name: f.code,
              displayName: f.description ? f.description.slice(0, 50) : f.code,
              value: famVal,
              nodeId: fId,
              kind: 'family' as const,
              strandCode: f.strandCode,
            };
          })
          .filter(Boolean) as ForceNode[],
      };
    }

    // ── LEVEL 2 – Family: show benchmarks + horizontal nodes ─────────────────
    if (currentNode.kind === 'family') {
      // Show horizontal peers for every benchmark in this family (capped), not only the
      // globally selected standard — otherwise inner views often had zero purple nodes.
      let horizontalCodes: string[] = [];
      if (showHorizontalLinks) {
        const seen = new Set<string>();
        for (const bId of currentNode.childrenIds) {
          const b = gradeView.nodesById[bId];
          if (b?.kind !== 'benchmark') continue;
          for (const c of treeDataset.horizontalAdjacency[b.code] ?? []) {
            if (c && c !== b.code && !seen.has(c)) seen.add(c);
          }
        }
        horizontalCodes = [...seen].slice(0, 20);
      }

      const benchCount = currentNode.childrenIds.filter(
        (id) => gradeView.nodesById[id]?.kind === 'benchmark',
      ).length;
      const totalLeaves = benchCount + horizontalCodes.length;
      const benchVal = Math.max(24, 38 - Math.min(12, totalLeaves));

      const benchmarks: ForceNode[] = currentNode.childrenIds
        .map((bId) => {
          const b = gradeView.nodesById[bId];
          if (!b || b.kind !== 'benchmark') return null;
          return {
            name: b.code,
            displayName: b.code,
            value: benchVal,
            nodeId: bId,
            kind: 'benchmark' as const,
            strandCode: b.strandCode,
            benchmarkCode: b.code,
          };
        })
        .filter(Boolean) as ForceNode[];

      // `name` must be unique among siblings (categoryField); prefix avoids clashing with a code string.
      const horizontalNodes: ForceNode[] = horizontalCodes.map((code) => ({
        name: `hz:${code}`,
        displayName: `⟷ ${code}`,
        value: Math.max(48, benchVal + 18),
        kind: 'horizontal' as const,
        isHorizontal: true,
        benchmarkCode: code,
        strandCode: gradeView.nodesById[`benchmark:${code}`]?.strandCode,
      }));

      return {
        name: currentNode.code,
        displayName: currentNode.description
          ? currentNode.description.slice(0, 50)
          : currentNode.code,
        value: 72,
        kind: 'family',
        strandCode: currentNode.strandCode,
        children: [...benchmarks, ...horizontalNodes],
      };
    }

    return { name: 'Root', value: 72, kind: 'root' };
  }, [
    gradeView,
    drillStack,
    selectedGrade,
    selectedStandardCode,
    showHorizontalLinks,
    treeDataset.grades,
    treeDataset.horizontalAdjacency,
  ]);

  // ── Chart: rebuild on every data change ───────────────────────────────────
  useEffect(() => {
    if (!chartDivRef.current) return;

    if (rootRef.current) {
      rootRef.current.dispose();
      rootRef.current = null;
    }

    const root = am5.Root.new(chartDivRef.current);
    rootRef.current = root;
    root.setThemes([am5themes_Animated.new(root)]);

    const zoomableContainer = root.container.children.push(
      am5.ZoomableContainer.new(root, {
        width: am5.p100,
        height: am5.p100,
        wheelable: true,
        pinchZoom: true,
      }),
    );

    // ZoomableContainer defaults contents to draggable with a huge hit-area background for panning.
    // That steals pointer events from ForceDirected circles, so node clicks never fire.
    zoomableContainer.contents.set('draggable', false);
    const zoomBg = zoomableContainer.contents.get('background');
    if (zoomBg) {
      zoomBg.setAll({ interactive: false });
    }

    zoomableContainer.children.push(
      am5.ZoomTools.new(root, { target: zoomableContainer }),
    );

    // ── Series ──────────────────────────────────────────────────────────────
    const isHs = selectedGrade === GradeLevel.G912;
    const leafCount = chartData.children?.length ?? 0;
    // Dense levels (many families / benchmarks) need more repulsion or nodes overlap and clicks misfire.
    const densityBoost = Math.min(44, Math.max(0, leafCount - 5) * 2.4);
    const series = zoomableContainer.contents.children.push(
      am5hierarchy.ForceDirected.new(root, {
        singleBranchOnly: false,
        // Show only the immediate children (1 depth below root)
        downDepth: 1,
        initialDepth: 1,
        nodePadding: (isHs ? 50 : 38) + densityBoost * 0.35,
        valueField: 'value',
        categoryField: 'name',
        childDataField: 'children',
        minRadius: isHs ? 36 : 30,
        maxRadius: isHs ? 112 : 104,
        manyBodyStrength: (isHs ? -34 : -46) - densityBoost * 0.95,
        centerStrength: Math.max(0.16, (isHs ? 0.34 : 0.4) - leafCount * 0.0025),
        velocityDecay: 0.42,
      }),
    );

    // Links / link bullets must not sit above nodes in the hit-test stack.
    series.links.template.setAll({ interactive: false });

    // ── Animated arrows (non-interactive so they never block node clicks) ───
    series.linkBullets.push((_r, source) => {
      const bullet = am5.Bullet.new(root, {
        locationX: 0.5,
        autoRotate: true,
        autoRotateAngle: 180,
        sprite: am5.Graphics.new(root, {
          fill: source.get('fill'),
          opacity: 0.6,
          interactive: false,
          centerY: am5.percent(50),
          centerX: am5.percent(50),
          draw: (d) => {
            d.moveTo(0, -4);
            d.lineTo(10, 0);
            d.lineTo(0, 4);
            d.lineTo(2, 0);
            d.lineTo(0, -4);
          },
        }),
      });
      bullet.animate({
        key: 'locationX',
        to: -0.1,
        from: 1.1,
        duration: Math.random() * 600 + 800,
        loops: Infinity,
        easing: am5.ease.quad,
      });
      return bullet;
    });

    // ── Link styling ───────────────────────────────────────────────────────
    series.links.template.setAll({ strokeWidth: 1.5, strokeOpacity: 0.2 });

    // ── Node fill ─────────────────────────────────────────────────────────
    series.circles.template.adapters.add('fill', (fill, target) => {
      const ctx = target.dataItem?.dataContext as ForceNode | undefined;
      if (!ctx) return fill;
      return am5.color(nodeColor(ctx));
    });

    series.circles.template.adapters.add('stroke', (_s, target) => {
      const ctx = target.dataItem?.dataContext as ForceNode | undefined;
      if (!ctx) return _s;
      if (ctx.isHorizontal) return am5.color('#ffffff');
      return am5.color(nodeColor(ctx));
    });

    series.circles.template.adapters.add('strokeWidth', (w, target) => {
      const ctx = target.dataItem?.dataContext as ForceNode | undefined;
      return ctx?.isHorizontal ? 3.2 : 0;
    });

    series.circles.template.setAll({ strokeWidth: 0, interactive: true });

    // Static halo for horizontal-link nodes (pulsing on boundschanged broke hit areas / visibility).
    series.outerCircles.template.setAll({ strokeWidth: 0, interactive: true });

    series.outerCircles.template.adapters.add('fillOpacity', (_o, target) => {
      const ctx = target.dataItem?.dataContext as ForceNode | undefined;
      return ctx?.isHorizontal ? 0.5 : 0;
    });
    series.outerCircles.template.adapters.add('fill', (fill, target) => {
      const ctx = target.dataItem?.dataContext as ForceNode | undefined;
      return ctx?.isHorizontal ? am5.color('#ede9fe') : fill;
    });
    series.outerCircles.template.adapters.add('strokeWidth', (w, target) => {
      const ctx = target.dataItem?.dataContext as ForceNode | undefined;
      return ctx?.isHorizontal ? 4 : 0;
    });
    series.outerCircles.template.adapters.add('stroke', (_s, target) => {
      const ctx = target.dataItem?.dataContext as ForceNode | undefined;
      return ctx?.isHorizontal ? am5.color('#5b21b6') : _s;
    });

    // ── Labels (non-interactive so clicks hit circles / node data) ───────────
    series.labels.template.setAll({
      fontSize: 16,
      fontWeight: '700',
      fill: am5.color('#ffffff'),
      oversizedBehavior: 'fit',
      maxWidth: 320,
      minScale: 0,
      populateText: true,
      shadowColor: am5.color('#000000'),
      shadowBlur: 6,
      shadowOffsetX: 0,
      shadowOffsetY: 1,
      shadowOpacity: 0.9,
      centerX: am5.percent(50),
      centerY: am5.percent(50),
      interactive: false,
    });

    series.labels.template.adapters.add('text', (_t, target) => {
      const ctx = target.dataItem?.dataContext as ForceNode | undefined;
      return ctx?.displayName ?? ctx?.name ?? _t;
    });

    series.labels.template.adapters.add('fontSize', (size, target) => {
      const ctx = target.dataItem?.dataContext as ForceNode | undefined;
      if (ctx?.isHorizontal) return 11;
      if (ctx?.kind === 'benchmark' || ctx?.kind === 'family') return 12;
      return typeof size === 'number' ? size : 16;
    });

    // ── Tooltip ────────────────────────────────────────────────────────────
    series.nodes.template.setAll({
      cursorOverStyle: 'pointer',
      tooltipText: '{displayName}',
      interactive: true,
    });

    const resolveForceNodeContext = (target: am5.Sprite | null): ForceNode | undefined => {
      let t: am5.Sprite | null = target;
      for (let depth = 0; depth < 20 && t; depth++) {
        const di = t.dataItem as { dataContext?: unknown } | undefined;
        const dc = di?.dataContext as ForceNode | undefined;
        if (dc && typeof dc === 'object' && typeof dc.name === 'string') return dc;
        t = t.parent;
      }
      return undefined;
    };

    const handleForceNodeClick = (ev: { target: am5.Sprite }) => {
      const ctx = resolveForceNodeContext(ev.target);
      if (!ctx) return;

      // Root node – no action
      if (ctx.kind === 'root') return;

      // Grade node → select grade
      if (ctx.kind === 'grade' && ctx.gradeValue) {
        onSelectGradeRef.current(ctx.gradeValue as GradeLevel);
        return;
      }

      // Strand node → drill to topic variants under this strand
      if (ctx.kind === 'strand' && ctx.nodeId) {
        setDrillStackRef.current([ctx.nodeId]);
        onActivateNodeRef.current(null);
        onSelectTopicRef.current(null);
        return;
      }

      // Horizontal node → navigate to that benchmark in the force graph
      if (ctx.isHorizontal && ctx.benchmarkCode) {
        const gradeViewLocal = gradeView;
        if (!gradeViewLocal) return;

        const targetBenchmarkId = `benchmark:${ctx.benchmarkCode}`;
        const targetBenchmark = gradeViewLocal.nodesById[targetBenchmarkId];

        if (targetBenchmark?.parentId) {
          const targetFamilyId = targetBenchmark.parentId;
          const targetFamily = gradeViewLocal.nodesById[targetFamilyId];
          if (targetFamily?.parentId) {
            setDrillStackRef.current([targetFamily.parentId, targetFamilyId]);
          } else {
            setDrillStackRef.current([targetFamilyId]);
          }
          onSelectStandardRef.current(ctx.benchmarkCode);
          onActivateNodeRef.current(targetBenchmarkId);
        } else {
          onSelectStandardRef.current(ctx.benchmarkCode);
        }
        return;
      }

      // Topic → drill into families
      if (ctx.kind === 'topic' && ctx.topicId && ctx.nodeId) {
        setDrillStackRef.current([ctx.nodeId]);
        onSelectTopicRef.current({ id: ctx.topicId, title: ctx.displayName ?? ctx.name, type: 'topic' });
        onActivateNodeRef.current(ctx.nodeId);
        return;
      }

      // Family → drill into benchmarks
      if (ctx.kind === 'family' && ctx.nodeId) {
        setDrillStackRef.current((prev) => {
          const topicEntry = prev.find((id) => id.startsWith('topic:'));
          return topicEntry ? [topicEntry, ctx.nodeId!] : [ctx.nodeId!];
        });
        onActivateNodeRef.current(ctx.nodeId);
        return;
      }

      // Benchmark → select + update right panel (stay on this tab)
      if (ctx.kind === 'benchmark' && ctx.benchmarkCode && ctx.nodeId) {
        onSelectStandardRef.current(ctx.benchmarkCode);
        onActivateNodeRef.current(ctx.nodeId);
        return;
      }
    };

    // Bind on circles, outer rings, and node container (label hits may delegate here).
    series.circles.template.events.on('click', handleForceNodeClick);
    series.outerCircles.template.events.on('click', handleForceNodeClick);
    series.nodes.template.events.on('click', handleForceNodeClick);

    series.data.setAll([chartData]);
    series.set('selectedDataItem', series.dataItems[0]);
    series.appear(1000, 100);

    return () => {
      root.dispose();
      rootRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartData, selectedGrade]);

  // ── Navigation ──────────────────────────────────────────────────────────────
  const drillLevel = drillStack.length; // 0=grade/strand list, 1=topic list or families, 2=benchmarks

  const handleBack = () => {
    if (drillLevel === 0 && selectedGrade) {
      // "Back" from topics → deselect grade (show grade picker again)
      onClearGradeRef.current();
      return;
    }
    setDrillStack((prev) => {
      const next = prev.slice(0, -1);
      const parentId = next[next.length - 1] ?? null;
      onActivateNodeRef.current(parentId);
      if (next.length === 0) onSelectTopicRef.current(null);
      return next;
    });
  };

  const handleHome = () => {
    setDrillStack([]);
    onActivateNodeRef.current(null);
    onSelectTopicRef.current(null);
  };

  // Breadcrumbs
  const breadcrumbs: string[] = [];
  if (selectedGrade) breadcrumbs.push(selectedGrade as string);
  for (const nodeId of drillStack) {
    if (nodeId.startsWith('strand:')) {
      const code = nodeId.replace('strand:', '');
      const firstTopic = gradeView?.rootNodeIds
        .map((id) => gradeView.nodesById[id])
        .find((n) => n?.kind === 'topic' && n.strandCode === code);
      if (firstTopic) breadcrumbs.push(firstTopic.strandTitle);
      continue;
    }
    const n = gradeView?.nodesById[nodeId];
    if (n) breadcrumbs.push(n.kind === 'topic' ? n.topicTitle : n.code);
  }

  const showBack = !!selectedGrade; // any time a grade is selected we can go back

  return (
    <div className="relative w-full" style={{ height: heightPx }}>

      {/* Navigation bar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 flex-wrap">
        {showBack && (
          <>
            {drillLevel > 0 && (
              <button
                onClick={handleHome}
                className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white/95 text-slate-600 hover:bg-slate-50 shadow-sm"
                title="Back to grade overview"
              >
                <Home className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg border border-slate-200 bg-white/95 text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </>
        )}

        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-xs font-medium bg-white/90 border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-sm max-w-[380px]">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-slate-300 mx-0.5">›</span>}
                <span className={i === breadcrumbs.length - 1 ? 'text-slate-800 font-bold truncate' : 'text-slate-400 truncate'}>
                  {crumb}
                </span>
              </React.Fragment>
            ))}
          </nav>
        )}

        {drillLevel === 2 && showHorizontalLinks && selectedStandardCode && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-violet-50 border border-violet-200 text-violet-700">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            Horizontal links on
          </span>
        )}
      </div>

      {/* Chart */}
      <div ref={chartDivRef} className="w-full h-full rounded-xl border border-slate-200 bg-white" />

      {/* Hint at bottom */}
      <div className="absolute bottom-3 right-3 rounded-lg bg-white/90 border border-slate-200 px-3 py-1 text-xs text-slate-500 pointer-events-none">
        {!selectedGrade && 'Click a grade to begin'}
        {selectedGrade &&
          drillLevel === 0 &&
          (selectedGrade === GradeLevel.G912
            ? 'Click a strand, then the topic, then a family'
            : 'Click a strand to explore topics')}
        {selectedGrade && drillLevel === 1 && (
          drillStack[0]?.startsWith('strand:')
            ? 'Click a topic variant to continue'
            : 'Click a family to see benchmarks'
        )}
        {selectedGrade && drillLevel === 2 && !showHorizontalLinks && 'Click a benchmark to select • Enable Horizontal Links for cross-grade connections'}
        {selectedGrade && drillLevel === 2 && showHorizontalLinks && (
          <span>
            Click a benchmark to select.{' '}
            <span className="text-violet-700 font-semibold">Violet ring = horizontally linked standard (click to jump).</span>
          </span>
        )}
      </div>
    </div>
  );
}
