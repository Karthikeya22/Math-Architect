import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { ECharts, EChartsOption } from 'echarts';
import { ArrowLeft, Crosshair, Link2, MapPin, Minimize2, Network, PanelBottomOpen, TreeDeciduous, X } from 'lucide-react';
import type { GraphViewState, StandardsGraphDataset, StandardsTreeNode, TopicNode } from '../types';
import { GradeLevel } from '../types';
import {
  buildStandardsTreeDataset,
  expandPathToNode,
  getBenchmarkNodeId,
  getNodeDetails,
  getTreeForGrade,
} from '../utils/standardsGraphTransform';
import { StandardNodeDetails } from './StandardNodeDetails';
import { ForceGraphTab } from './ForceGraphTab';

type HorizontalEdgeRow = {
  source: string;
  target: string;
  type: string;
};

interface StandardsGraphProps {
  dataset: StandardsGraphDataset;
  selectedStandardCode: string;
  selectedGrade: GradeLevel | '';
  /**
   * High school strand sync only: `912-{strand}` drills the tree to that strand topic;
   * empty string resets to overview. Omit on K–8 so in-graph navigation is not cleared on re-render.
   */
  focusTopicId?: string;
  onSelectStandard: (standardCode: string) => void;
  onSelectTopic: (topic: TopicNode | null) => void;
  onMapStandard: (standardCode: string) => void;
  onViewStandard: (standardCode: string) => void;
  onSelectGrade: (grade: GradeLevel | '') => void;
}

const STRAND_COLORS: Record<string, string> = {
  NSO: '#22c55e',
  AR: '#3b82f6',
  A: '#3b82f6',
  FR: '#f59e0b',
  F: '#f59e0b',
  M: '#14b8a6',
  C: '#14b8a6',
  GR: '#8b5cf6',
  DA: '#ec4899',
  DP: '#ec4899',
  FL: '#475569',
  LT: '#a855f7',
  T: '#0d9488',
};

const strandColor = (strandCode: string) =>
  STRAND_COLORS[strandCode] ?? '#0f766e';

const tintColor = (hex: string, ratio = 0.45) => {
  const value = hex.replace('#', '');
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  const tr = Math.round(r + (255 - r) * ratio);
  const tg = Math.round(g + (255 - g) * ratio);
  const tb = Math.round(b + (255 - b) * ratio);
  return `rgb(${tr}, ${tg}, ${tb})`;
};

const truncateLabel = (value: string, max = 34) =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value;

const mapTopicToTopicNode = (topicId: string, title: string): TopicNode => ({
  id: topicId,
  title,
  type: 'topic',
});

export function StandardsGraph({
  dataset,
  selectedStandardCode,
  selectedGrade,
  focusTopicId,
  onSelectStandard,
  onSelectTopic,
  onMapStandard,
  onViewStandard,
  onSelectGrade,
}: StandardsGraphProps) {
  const chartRef = useRef<ReactECharts>(null);
  const [graphTab, setGraphTab] = useState<'tree' | 'force'>('tree');
  const [expandedNodeIds, setExpandedNodeIds] = useState<string[]>([]);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [focusedTopicId, setFocusedTopicId] = useState<string | null>(null);
  const [showHorizontalLinks, setShowHorizontalLinks] = useState(false);
  const [historyStack, setHistoryStack] = useState<GraphViewState[]>([]);
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const [externalHorizontalAdj, setExternalHorizontalAdj] = useState<Record<string, string[]>>({});
  const [flashPhase, setFlashPhase] = useState(false);
  const gradeSelected = selectedGrade !== '';
  const treeDataset = useMemo(
    () => buildStandardsTreeDataset(dataset, externalHorizontalAdj),
    [dataset, externalHorizontalAdj],
  );
  const gradeView = useMemo(
    () => getTreeForGrade(treeDataset, selectedGrade),
    [selectedGrade, treeDataset],
  );
  const isHighSchoolView = selectedGrade === GradeLevel.G912;
  const treeChartHeight = isHighSchoolView ? 700 : 560;

  useEffect(() => {
    setExpandedNodeIds([]);
    setActiveNodeId(null);
    setFocusedTopicId(null);
    setHistoryStack([]);
    setShowMobileDetails(false);
  }, [selectedGrade]);

  useEffect(() => {
    if (selectedGrade === GradeLevel.G912) {
      setShowHorizontalLinks(false);
    }
  }, [selectedGrade]);

  /** Keep tree in sync with parent selectors (dropdowns): drill to topic + benchmark, or strand topic only (HS). */
  useEffect(() => {
    if (!selectedGrade || !gradeView) return;

    if (selectedStandardCode) {
      const benchmarkNodeId = getBenchmarkNodeId(selectedStandardCode);
      const bench = gradeView.nodesById[benchmarkNodeId];
      if (!bench || bench.kind !== 'benchmark') return;
      setGraphTab('tree');
      setFocusedTopicId(bench.topicId);
      setActiveNodeId(benchmarkNodeId);
      const path = expandPathToNode(treeDataset, selectedGrade, benchmarkNodeId);
      setExpandedNodeIds([...new Set(path)]);
      return;
    }

    if (focusTopicId !== undefined && selectedGrade === GradeLevel.G912) {
      if (!focusTopicId) {
        setGraphTab('tree');
        setFocusedTopicId(null);
        setActiveNodeId(null);
        setExpandedNodeIds([]);
        return;
      }
      const topicNodeId = `topic:${focusTopicId}`;
      const topicNode = gradeView.nodesById[topicNodeId];
      if (!topicNode || topicNode.kind !== 'topic') return;
      setGraphTab('tree');
      setFocusedTopicId(focusTopicId);
      setActiveNodeId(topicNodeId);
      setExpandedNodeIds([topicNodeId]);
    }
  }, [selectedGrade, gradeView, selectedStandardCode, treeDataset, focusTopicId]);

  useEffect(() => {
    if (selectedGrade === GradeLevel.G912) {
      setExternalHorizontalAdj({});
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
        for (const [code, neighbors] of map.entries()) {
          next[code] = [...neighbors];
        }
        setExternalHorizontalAdj(next);
      })
      .catch(() => {
        if (!cancelled) setExternalHorizontalAdj({});
      });
    return () => {
      cancelled = true;
    };
  }, [selectedGrade]);

  const visibleNodeIds = useMemo(() => {
    if (!gradeView) return [];
    if (!focusedTopicId) return gradeView.rootNodeIds;

    const focusedTopicNodeId = `topic:${focusedTopicId}`;
    const focusedTopic = gradeView.nodesById[focusedTopicNodeId];
    if (!focusedTopic) return gradeView.rootNodeIds;

    const keep = new Set<string>([focusedTopicNodeId, ...focusedTopic.childrenIds]);
    for (const familyId of focusedTopic.childrenIds) {
      if (!expandedNodeIds.includes(familyId)) continue;
      const family = gradeView.nodesById[familyId];
      if (!family) continue;
      for (const benchmarkId of family.childrenIds) keep.add(benchmarkId);
    }

    if (activeNodeId) {
      keep.add(activeNodeId);
      const activeNode = gradeView.nodesById[activeNodeId];
      if (activeNode?.parentId) keep.add(activeNode.parentId);
      if (showHorizontalLinks && activeNode.kind === 'benchmark' && selectedGrade) {
        const detail = getNodeDetails(treeDataset, selectedGrade, activeNodeId);
        for (const neighbor of detail?.horizontalNeighbors ?? []) {
          keep.add(neighbor.id);
        }
      }
    }

    return [...keep];
  }, [activeNodeId, expandedNodeIds, focusedTopicId, gradeView, selectedGrade, showHorizontalLinks, treeDataset]);

  const details = useMemo(() => {
    if (!selectedGrade || !activeNodeId) return null;
    return getNodeDetails(treeDataset, selectedGrade, activeNodeId);
  }, [activeNodeId, selectedGrade, treeDataset]);

  useEffect(() => {
    if (!showHorizontalLinks || details?.node.kind !== 'benchmark') return;
    const timer = window.setInterval(() => {
      setFlashPhase((prev) => !prev);
    }, 620);
    return () => window.clearInterval(timer);
  }, [details?.node.kind, showHorizontalLinks]);

  const option = useMemo<EChartsOption>(() => {
    if (!gradeView) {
      return { series: [{ type: 'graph', data: [], links: [] }] };
    }

    const isHsLayout = selectedGrade === GradeLevel.G912;

    const nodes = visibleNodeIds
      .map((id) => gradeView.nodesById[id])
      .filter((node): node is StandardsTreeNode => Boolean(node));

    const links: Array<{ source: string; target: string; lineStyle?: any }> = [];
    const positionByNodeId = new Map<string, { x: number; y: number }>();
    const overviewMode = !focusedTopicId;

    if (overviewMode) {
      const topicNodes = nodes.filter((node) => node.kind === 'topic');
      const strandCodes = [...new Set(topicNodes.map((node) => node.strandCode))].sort();
      const topicsByStrand = new Map<string, StandardsTreeNode[]>();
      for (const topic of topicNodes) {
        const list = topicsByStrand.get(topic.strandCode) ?? [];
        list.push(topic);
        topicsByStrand.set(topic.strandCode, list);
      }
      for (const list of topicsByStrand.values()) {
        list.sort((a, b) => a.topicTitle.localeCompare(b.topicTitle));
      }
      const clusterCols = isHsLayout
        ? Math.min(5, Math.max(2, Math.ceil(Math.sqrt(strandCodes.length))))
        : Math.max(2, Math.min(3, Math.ceil(Math.sqrt(strandCodes.length))));
      const clusterXGap = isHsLayout ? 520 : 330;
      const clusterYGap = isHsLayout ? 360 : 250;
      const clusterStartX = isHsLayout ? 260 : 180;
      const clusterStartY = isHsLayout ? 200 : 150;
      const clusterNodeCols = isHsLayout ? 1 : 2;
      const clusterNodeXGap = isHsLayout ? 160 : 120;
      const clusterNodeYGap = isHsLayout ? 140 : 110;

      const graphNodes = topicNodes.map((node) => {
          const clusterIndex = strandCodes.indexOf(node.strandCode);
          const cluster = topicsByStrand.get(node.strandCode) ?? [];
          const withinClusterIndex = Math.max(
            0,
            cluster.findIndex((item) => item.id === node.id),
          );
          const clusterCol = clusterIndex % clusterCols;
          const clusterRow = Math.floor(clusterIndex / clusterCols);
          const cx = clusterStartX + clusterCol * clusterXGap;
          const cy = clusterStartY + clusterRow * clusterYGap;

          const localCol = withinClusterIndex % clusterNodeCols;
          const localRow = Math.floor(withinClusterIndex / clusterNodeCols);
          const localXOffset =
            (localCol - (clusterNodeCols - 1) / 2) * clusterNodeXGap;
          const localYOffset = localRow * clusterNodeYGap;
          const x = cx + localXOffset;
          const y = cy + localYOffset;
          const selected = node.id === activeNodeId;
          const color = strandColor(node.strandCode);
          return {
            id: node.id,
            name: '',
            fullName: node.label,
            symbolSize: isHsLayout ? 62 : 56,
            x,
            y,
            nodeType: node.kind,
            topicId: node.topicId,
            code: node.code,
            itemStyle: {
              color,
              borderColor: selected ? '#0f172a' : '#dbe3ed',
              borderWidth: selected ? 2.8 : 1.2,
              opacity: 0.98,
              shadowBlur: 12,
              shadowColor: 'rgba(15,23,42,0.16)',
            },
            label: {
              show: true,
              position: 'bottom',
              formatter: () => truncateLabel(node.label, isHsLayout ? 42 : 28),
              fontSize: isHsLayout ? 12 : 11,
              color: '#334155',
              distance: isHsLayout ? 18 : 14,
              backgroundColor: 'rgba(255,255,255,0.92)',
              padding: [3, 6],
              borderRadius: 6,
            },
          };
        });

      return {
        tooltip: {
          trigger: 'item',
          confine: true,
          formatter: (params: any) => {
            if (params.data?.isClusterAnchor) return '';
            if (params.dataType === 'edge') return '';
            const node = gradeView.nodesById[params.data.id];
            if (!node) return '';
            return `<strong>${node.code}</strong><br/>${node.label}`;
          },
        },
        animationDuration: 700,
        animationDurationUpdate: 520,
        series: [
          {
            type: 'graph',
            layout: 'none',
            roam: true,
            draggable: false,
            edgeSymbol: ['none', 'none'],
            data: graphNodes,
            links: [],
            lineStyle: { opacity: 0 },
            animationEasingUpdate: 'cubicOut',
            animationDelayUpdate: (idx: number) => idx * 8,
          },
        ],
      };
    }

    const focusedTopicNodeId = `topic:${focusedTopicId}`;
    const focusedTopic = gradeView.nodesById[focusedTopicNodeId];
    const externalBenchmarkIds: string[] = [];

    if (focusedTopic) {
      const visibleFamilyIds = focusedTopic.childrenIds.filter((id) => visibleNodeIds.includes(id));
      const familyCount = Math.max(1, visibleFamilyIds.length || focusedTopic.childrenIds.length);
      const familySpread = isHsLayout
        ? Math.min(210, Math.max(86, 760 / familyCount))
        : 170;
      const topicY = isHsLayout ? 72 : 80;
      const familyY = isHsLayout ? 268 : 250;
      const benchmarkY = isHsLayout ? 458 : 425;

      positionByNodeId.set(focusedTopic.id, { x: 520, y: topicY });
      for (const familyId of focusedTopic.childrenIds) {
        if (!visibleNodeIds.includes(familyId)) continue;
        const family = gradeView.nodesById[familyId];
        if (!family) continue;
        const familyIndex = focusedTopic.childrenIds.indexOf(familyId);
        const familyOffset = (familyIndex - (focusedTopic.childrenIds.length - 1) / 2) * familySpread;
        const familyX = 520 + familyOffset;
        positionByNodeId.set(familyId, { x: familyX, y: familyY });
        links.push({ source: focusedTopic.id, target: familyId });
        const benchCount = Math.max(1, family.childrenIds.filter((id) => visibleNodeIds.includes(id)).length);
        const benchSpread = isHsLayout
          ? Math.min(124, Math.max(64, 480 / benchCount))
          : 108;
        for (const benchmarkId of family.childrenIds) {
          if (!visibleNodeIds.includes(benchmarkId)) continue;
          const benchmarkIndex = family.childrenIds.indexOf(benchmarkId);
          const benchmarkOffset = (benchmarkIndex - (family.childrenIds.length - 1) / 2) * benchSpread;
          const benchmarkX = familyX + benchmarkOffset;
          positionByNodeId.set(benchmarkId, { x: benchmarkX, y: benchmarkY });
          links.push({ source: familyId, target: benchmarkId });
        }
      }
    }

    for (const node of nodes) {
      if (positionByNodeId.has(node.id)) continue;
      if (node.kind === 'benchmark') externalBenchmarkIds.push(node.id);
    }

    externalBenchmarkIds.forEach((id, idx) =>
      positionByNodeId.set(id, { x: 1000, y: 260 + idx * 64 }),
    );

    const horizontalNeighborSet = new Set(
      showHorizontalLinks && details?.node.kind === 'benchmark'
        ? details.horizontalNeighbors.map((neighbor) => neighbor.id)
        : [],
    );

    if (showHorizontalLinks && details?.node.kind === 'benchmark') {
      for (const neighbor of details.horizontalNeighbors) {
        links.push({
          source: details.node.id,
          target: neighbor.id,
          lineStyle: {
            color: '#8b5cf6',
            width: 2.8,
            type: 'dashed',
            opacity: 0.95,
          },
        });
      }
    }

    const graphNodes = nodes.map((node) => {
      const point = positionByNodeId.get(node.id) ?? { x: 120, y: 120 };
      const selected = node.id === activeNodeId;
      const isHorizontalNeighbor = horizontalNeighborSet.has(node.id);
      const pulseOn = isHorizontalNeighbor && flashPhase;
      const color = node.kind === 'benchmark' ? tintColor(strandColor(node.strandCode), 0.55) : strandColor(node.strandCode);
      const shortName =
        node.kind === 'topic'
          ? node.label
          : node.kind === 'family'
            ? `${node.code} (${node.counts.childCount ?? 0})`
            : truncateLabel(node.code, isHsLayout ? 18 : 22);
      return {
        id: node.id,
        name: shortName,
        fullName: node.label,
        x: point.x,
        y: point.y,
        symbolSize:
          node.kind === 'topic'
            ? 52
            : node.kind === 'family'
              ? 26
              : isHorizontalNeighbor
                ? pulseOn
                  ? 24
                  : 20
                : 16,
        nodeType: node.kind,
        topicId: node.topicId,
        code: node.code,
        horizontalNeighbor: isHorizontalNeighbor,
        itemStyle: {
          color,
          borderColor: selected ? '#0f172a' : isHorizontalNeighbor ? '#7c3aed' : '#dbe3ed',
          borderWidth: selected ? 2.8 : isHorizontalNeighbor ? (pulseOn ? 3 : 2.2) : 1.2,
          opacity: selected ? 1 : node.kind === 'benchmark' ? 0.9 : 0.97,
          shadowBlur: isHorizontalNeighbor ? (pulseOn ? 22 : 14) : 0,
          shadowColor: isHorizontalNeighbor ? 'rgba(124,58,237,0.36)' : undefined,
        },
        label: {
          show:
            node.kind === 'topic' ||
            node.kind === 'family' ||
            node.id === activeNodeId ||
            isHorizontalNeighbor,
          position: 'bottom',
          fontSize: node.kind === 'benchmark' ? (isHsLayout ? 8.5 : 9) : isHsLayout ? 11.5 : 12,
          distance: node.kind === 'benchmark' ? (isHsLayout ? 12 : 10) : isHsLayout ? 10 : 8,
          backgroundColor: 'rgba(255,255,255,0.88)',
          padding: [1, 4],
          borderRadius: 6,
          color: isHorizontalNeighbor ? '#6d28d9' : '#334155',
          fontWeight: isHorizontalNeighbor ? 'bold' : 'normal',
        },
        level:
          node.kind === 'topic'
            ? 0
            : node.kind === 'family'
              ? 1
              : 2,
      };
    });
    return {
      tooltip: {
        trigger: 'item',
        confine: true,
        formatter: (params: any) => {
          if (params.dataType === 'edge') return `${params.data.source} -> ${params.data.target}`;
          const node = gradeView.nodesById[params.data.id];
          if (!node) return params.data.name;
          return `<strong>${node.code}</strong><br/>${node.label}<br/><span style="opacity:.75">Links: ${node.counts.horizontalLinkCount ?? 0}</span>`;
        },
      },
      animationDuration: 620,
      animationDurationUpdate: 520,
      series: [
        {
          type: 'graph',
          layout: 'none',
          roam: true,
          draggable: true,
          focusNodeAdjacency: false,
          edgeSymbol: ['none', 'arrow'],
          edgeSymbolSize: [0, 5],
          data: graphNodes,
          links,
          lineStyle: {
            width: 1.3,
            opacity: 0.72,
            curveness: 0.15,
          },
          emphasis: {
            focus: 'none',
            lineStyle: { width: 2.8 },
          },
          labelLayout: { hideOverlap: true, moveOverlap: 'shiftY' },
          label: { position: 'bottom' },
          animationEasing: 'cubicOut',
          animationEasingUpdate: 'cubicOut',
          animationDelay: (idx: number) => idx * 12,
          animationDelayUpdate: (idx: number) => idx * 8,
        },
      ],
      graphic:
        showHorizontalLinks && details?.node.kind === 'benchmark'
          ? [
              {
                type: 'text',
                left: 860,
                top: 210,
                style: {
                  text: 'Connected Benchmarks',
                  font: '600 13px Inter, system-ui, sans-serif',
                  fill: '#6d28d9',
                },
                silent: true,
              },
            ]
          : [],
    };
  }, [
    activeNodeId,
    details,
    flashPhase,
    focusedTopicId,
    gradeView,
    selectedGrade,
    showHorizontalLinks,
    visibleNodeIds,
  ]);

  const withChart = (callback: (chart: ECharts) => void) => {
    const chart = chartRef.current?.getEchartsInstance();
    if (chart) callback(chart);
  };

  const fitToView = () => withChart((chart) => chart.dispatchAction({ type: 'restore' }));
  const centerOnSelected = () =>
    withChart((chart) => {
      if (!activeNodeId || !gradeView) return;
      const visibleNodes = visibleNodeIds
        .map((id) => gradeView.nodesById[id])
        .filter((node): node is StandardsTreeNode => Boolean(node));
      const dataIndex = visibleNodes.findIndex((node) => node.id === activeNodeId);
      if (dataIndex < 0) return;
      chart.dispatchAction({ type: 'focusNodeAdjacency', seriesIndex: 0, dataIndex });
    });

  const currentViewState = (): GraphViewState => ({
    grade: selectedGrade,
    selectedNodeId: activeNodeId,
    expandedNodeIds,
    showHorizontalLinks,
    camera: null,
  });

  const jumpToNode = (node: StandardsTreeNode) => {
    if (!selectedGrade || !gradeView) return;
    setHistoryStack((prev) => [...prev, currentViewState()]);
    const expandedPath = expandPathToNode(treeDataset, selectedGrade, node.id);
    const nextExpanded = [...new Set([...expandedPath, node.id, ...(node.parentId ? [node.parentId] : [])])];
    setFocusedTopicId(node.topicId);
    setExpandedNodeIds(nextExpanded);
    setActiveNodeId(node.id);
    if (node.kind === 'benchmark') {
      onSelectStandard(node.code);
      onViewStandard(node.code);
      return;
    }
    onSelectTopic(mapTopicToTopicNode(node.topicId, node.topicTitle));
  };

  const handleNodeClick = (params: any) => {
    const maybeNodeId = params?.data?.id ?? params?.id ?? null;
    const isNodeClick = params?.dataType === 'node' || Boolean(maybeNodeId);
    if (!isNodeClick) return;
    const nodeId = String(maybeNodeId || '');
    if (!gradeView || !nodeId || !selectedGrade) return;
    const node = gradeView.nodesById[nodeId];
    if (!node) return;

    setActiveNodeId(nodeId);
    setShowMobileDetails(true);
    if (node.kind !== 'benchmark') {
      if (node.kind === 'topic') {
        setFocusedTopicId(node.topicId);
        setExpandedNodeIds([nodeId]);
      } else {
        setExpandedNodeIds((prev) =>
          prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId],
        );
      }
    } else {
      // Re-root tree context to the clicked benchmark's topic/family path.
      setFocusedTopicId(node.topicId);
      setExpandedNodeIds(expandPathToNode(treeDataset, selectedGrade, nodeId));
      onSelectStandard(node.code);
      onViewStandard(node.code);
      return;
    }
    onSelectTopic(mapTopicToTopicNode(node.topicId, node.topicTitle));
  };
  const chartEvents = useMemo(
    () => ({ click: handleNodeClick }),
    [gradeView, onSelectStandard, onSelectTopic, onViewStandard],
  );
  const activeStandardCode = details?.node.kind === 'benchmark' ? details.node.code : '';
  const breadcrumbs = useMemo(() => {
    if (!details) return [];
    const items = [details.node.code];
    let current = details.node.parentId ? gradeView?.nodesById[details.node.parentId] : null;
    while (current) {
      items.unshift(current.code);
      current = current.parentId ? gradeView?.nodesById[current.parentId] : null;
    }
    return items;
  }, [details, gradeView]);

  const handleBack = () => {
    const last = historyStack[historyStack.length - 1];
    if (!last) return;
    setHistoryStack((prev) => prev.slice(0, -1));
    setExpandedNodeIds(last.expandedNodeIds);
    setActiveNodeId(last.selectedNodeId);
    setShowHorizontalLinks(last.showHorizontalLinks);
  };

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-3 min-h-[640px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Title + tab switcher */}
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="font-bold text-lg text-slate-800">Standards Graph</h3>
          <div className="bg-slate-100 p-0.5 rounded-xl flex shadow-inner">
            <button
              onClick={() => setGraphTab('tree')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                graphTab === 'tree'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <TreeDeciduous className="w-4 h-4" />
              Tree Graph
            </button>
            <button
              onClick={() => setGraphTab('force')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                graphTab === 'force'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Network className="w-4 h-4" />
              Interactive Visual
            </button>
          </div>
        </div>

        {/* Toolbar — tree-specific controls hidden on force tab */}
        <div className="flex items-center gap-2">
          {graphTab === 'tree' && (
            <>
              <button
                onClick={handleBack}
                disabled={historyStack.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={() => {
                  setFocusedTopicId(null);
                  setExpandedNodeIds([]);
                  setActiveNodeId(null);
                }}
                disabled={!focusedTopicId}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <ArrowLeft className="w-4 h-4" />
                Overview
              </button>
              <button
                onClick={fitToView}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                <Minimize2 className="w-4 h-4" />
                Fit
              </button>
              <button
                onClick={centerOnSelected}
                disabled={!activeNodeId}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <Crosshair className="w-4 h-4" />
                Center
              </button>
            </>
          )}

          {/* Horizontal links are K–8 coherence data; hidden for HS synthetic graph */}
          {!isHighSchoolView && (
            <button
              onClick={() => setShowHorizontalLinks((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg border ${
                showHorizontalLinks
                  ? 'border-violet-500 bg-violet-50 text-violet-700'
                  : 'border-slate-200 text-slate-700'
              }`}
            >
              <Link2 className="w-4 h-4" />
              Horizontal Links
            </button>
          )}

          <button
            onClick={() => setShowMobileDetails(true)}
            className="xl:hidden inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <PanelBottomOpen className="w-4 h-4" />
            Details
          </button>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
        <div className="flex flex-wrap items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-400" />
          <span>
            {selectedGrade === GradeLevel.G912
              ? 'High school (912)'
              : selectedGrade || 'Select a grade to begin'}
          </span>
          {focusedTopicId && <span className="rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-blue-700">Tree View</span>}
          {breadcrumbs.map((crumb) => (
            <React.Fragment key={crumb}>
              <span className="text-slate-400">/</span>
              <span className="rounded border border-slate-200 bg-white px-2 py-0.5">{crumb}</span>
            </React.Fragment>
          )          )}
        </div>
      </div>
      {isHighSchoolView && graphTab === 'tree' && (
        <p className="text-xs text-slate-500 leading-relaxed -mt-1">
          Strand overview: one bubble per strand. Click a strand to open families, then benchmarks. Pan and zoom to spread nodes; use{' '}
          <strong className="font-semibold text-slate-600">Overview</strong> to return here.
        </p>
      )}
      <div
        className={`grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4 ${isHighSchoolView ? 'min-h-[600px]' : 'min-h-[520px]'}`}
      >
        <div className="rounded-xl border border-slate-200 overflow-hidden relative">
          {graphTab === 'tree' ? (
            <>
              <ReactECharts
                ref={chartRef}
                option={option}
                onEvents={chartEvents}
                style={{ height: treeChartHeight, opacity: gradeSelected ? 1 : 0.45 }}
                notMerge
                lazyUpdate
              />
              {!gradeSelected && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white/95 border border-slate-200 rounded-xl px-5 py-4 text-center shadow-sm">
                    <p className="font-semibold text-slate-800">Select a grade to begin</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Topics, families, and benchmarks appear after grade selection.
                    </p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-3 right-3 rounded-lg bg-white/90 border border-slate-200 px-3 py-1 text-xs text-slate-600">
                {isHighSchoolView
                  ? 'Strand (large) • Family (code + count) • Benchmark (code)'
                  : 'Topic (large) • Family (count) • Benchmark (code)'}
              </div>
            </>
          ) : (
            <ForceGraphTab
              treeDataset={treeDataset}
              selectedGrade={selectedGrade}
              selectedStandardCode={selectedStandardCode}
              showHorizontalLinks={showHorizontalLinks}
              heightPx={treeChartHeight}
              onSelectGrade={onSelectGrade}
              onClearGrade={() => onSelectGrade('')}
              onSelectStandard={onSelectStandard}
              onSelectTopic={onSelectTopic}
              onActivateNode={(nodeId) => setActiveNodeId(nodeId ?? null)}
            />
          )}
        </div>
        <StandardNodeDetails
          className="hidden xl:block"
          selectedGrade={selectedGrade}
          details={details}
          showHorizontalLinks={showHorizontalLinks}
          onJumpToNode={(node) => jumpToNode(node)}
          onMapStandard={onMapStandard}
          onViewStandard={onViewStandard}
          activeStandardCode={activeStandardCode}
        />
      </div>
      {showMobileDetails && (
        <div className="xl:hidden fixed inset-0 z-40">
          <button
            className="absolute inset-0 bg-slate-900/35"
            aria-label="Close details drawer backdrop"
            onClick={() => setShowMobileDetails(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[78vh] overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-3 shadow-2xl">
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-sm font-semibold text-slate-700">Node Details</p>
              <button
                onClick={() => setShowMobileDetails(false)}
                className="rounded-md border border-slate-200 p-1.5 text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <StandardNodeDetails
              selectedGrade={selectedGrade}
              details={details}
              showHorizontalLinks={showHorizontalLinks}
              onJumpToNode={(node) => {
                jumpToNode(node);
                setShowMobileDetails(false);
              }}
              onMapStandard={onMapStandard}
              onViewStandard={onViewStandard}
              activeStandardCode={activeStandardCode}
            />
          </div>
        </div>
      )}
    </div>
  );
}
