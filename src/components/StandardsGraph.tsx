import React, { useMemo, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { ECharts, EChartsOption } from 'echarts';
import { Search, ZoomIn, ZoomOut, RotateCcw, Focus } from 'lucide-react';
import type {
  GraphRelationMode,
  StandardsGraphDataset,
  StandardsGraphFilters,
  TopicNode,
} from '../types';
import { buildGraphViewModel, deriveFilterOptions } from '../utils/standardsGraphTransform';

interface StandardsGraphProps {
  dataset: StandardsGraphDataset;
  selectedStandardCode: string;
  selectedTopicId: string;
  onSelectStandard: (standardCode: string) => void;
  onSelectTopic: (topic: TopicNode | null) => void;
}

const RELATION_MODE_OPTIONS: Array<{ value: GraphRelationMode; label: string }> = [
  { value: 'sequential', label: 'Sequential' },
  { value: 'cross-grade', label: 'Cross-Grade' },
  { value: 'hybrid', label: 'Hybrid' },
];

const gradeColor = (grade: string) => {
  switch (grade) {
    case 'Kindergarten':
      return '#22c55e';
    case 'Grade 1':
    case 'Grade 2':
      return '#14b8a6';
    case 'Grade 3':
    case 'Grade 4':
      return '#3b82f6';
    case 'Grade 5':
    case 'Grade 6':
      return '#8b5cf6';
    default:
      return '#ec4899';
  }
};

const linkColor = (kind: string) => {
  switch (kind) {
    case 'sequential':
      return '#64748b';
    case 'cross-grade':
      return '#8b5cf6';
    default:
      return '#94a3b8';
  }
};

const mapTopicToTopicNode = (topicId: string, title: string): TopicNode => ({
  id: topicId,
  title,
  type: 'topic',
});

export function StandardsGraph({
  dataset,
  selectedStandardCode,
  selectedTopicId,
  onSelectStandard,
  onSelectTopic,
}: StandardsGraphProps) {
  const chartRef = useRef<ReactECharts>(null);
  const [filters, setFilters] = useState<StandardsGraphFilters>({
    grade: 'all',
    relationMode: 'hybrid',
    strandCode: 'all',
    topicId: 'all',
    includeTopicNodes: true,
    includeStandardNodes: true,
    searchText: '',
  });
  const [activeNodeId, setActiveNodeId] = useState<string>('');

  const filterOptions = useMemo(() => deriveFilterOptions(dataset), [dataset]);
  const viewModel = useMemo(
    () => buildGraphViewModel(dataset, filters),
    [dataset, filters],
  );

  const option = useMemo<EChartsOption>(() => {
    const nodes = viewModel.nodes.map((node) => {
      const selected = node.id === selectedStandardCode || node.id === selectedTopicId;
      const active = node.id === activeNodeId;
      const nodeColor = node.kind === 'topic' ? '#0f766e' : gradeColor(node.grade);
      const size = node.kind === 'topic' ? 28 : selected || active ? 20 : 14;

      return {
        id: node.id,
        name: node.label,
        value: node.value,
        category: node.category,
        symbolSize: size,
        itemStyle: {
          color: nodeColor,
          borderColor: selected || active ? '#0f172a' : '#e2e8f0',
          borderWidth: selected || active ? 2 : 1,
          shadowBlur: selected || active ? 12 : 0,
          shadowColor: selected || active ? 'rgba(15, 23, 42, 0.35)' : undefined,
        },
        label: {
          show: true,
          fontSize: node.kind === 'topic' ? 12 : 10,
        },
        nodeType: node.kind,
        description: node.description,
        topicId: node.topicId,
      };
    });

    const links = viewModel.links.map((link) => ({
      source: link.source,
      target: link.target,
      lineStyle: {
        color: linkColor(link.kind),
        width: link.kind === 'topic-membership' ? 1 : 1.6,
        opacity: link.kind === 'topic-membership' ? 0.38 : 0.7,
        curveness: link.kind === 'cross-grade' ? 0.15 : 0.04,
      },
      emphasis: {
        lineStyle: {
          width: 3,
        },
      },
    }));

    return {
      tooltip: {
        trigger: 'item',
        confine: true,
        formatter: (params: any) => {
          if (params.dataType === 'edge') {
            return `${params.data.source} -> ${params.data.target}`;
          }
          const description = params.data.description
            ? `<br/><span style="opacity:.8">${params.data.description}</span>`
            : '';
          return `<strong>${params.data.name}</strong>${description}`;
        },
      },
      animationDuration: 500,
      series: [
        {
          type: 'graph',
          layout: 'force',
          roam: true,
          draggable: true,
          focusNodeAdjacency: true,
          edgeSymbol: ['none', 'arrow'],
          edgeSymbolSize: 6,
          force: {
            repulsion: 170,
            edgeLength: [55, 120],
            gravity: 0.08,
          },
          data: nodes,
          links,
          lineStyle: {
            width: 1,
            opacity: 0.65,
          },
          emphasis: {
            focus: 'adjacency',
            lineStyle: {
              width: 2.5,
            },
          },
          label: {
            position: 'right',
          },
        },
      ],
    };
  }, [activeNodeId, selectedStandardCode, selectedTopicId, viewModel.links, viewModel.nodes]);

  const handleChartReady = (chart: ECharts) => {
    chart.on('click', (params: any) => {
      if (params?.dataType !== 'node') return;
      const nodeType = params.data?.nodeType;
      const nodeId = params.data?.id;
      setActiveNodeId(nodeId ?? '');
      if (nodeType === 'standard' && nodeId) {
        onSelectStandard(nodeId);
      }
      if (nodeType === 'topic' && params.data?.topicId) {
        onSelectTopic(mapTopicToTopicNode(params.data.topicId, params.data.name));
      }
    });
  };

  const withChart = (callback: (chart: ECharts) => void) => {
    const chart = chartRef.current?.getEchartsInstance();
    if (chart) callback(chart);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-bold text-lg text-slate-800">Standards Relationship Graph</h3>
        <div className="flex items-center gap-2">
          {RELATION_MODE_OPTIONS.map((mode) => (
            <button
              key={mode.value}
              onClick={() => setFilters((prev) => ({ ...prev, relationMode: mode.value }))}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                filters.relationMode === mode.value
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={filters.searchText}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, searchText: event.target.value }))
            }
            placeholder="Search standard code or topic..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={filters.grade}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, grade: event.target.value as StandardsGraphFilters['grade'] }))
          }
          className="rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm"
        >
          <option value="all">All Grades</option>
          {filterOptions.grades.map((grade) => (
            <option key={grade} value={grade}>
              {grade}
            </option>
          ))}
        </select>
        <select
          value={filters.strandCode}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, strandCode: event.target.value }))
          }
          className="rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm"
        >
          <option value="all">All Strands</option>
          {filterOptions.strands.map((strand) => (
            <option key={strand.code} value={strand.code}>
              {strand.code} - {strand.title}
            </option>
          ))}
        </select>
        <select
          value={filters.topicId}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, topicId: event.target.value }))
          }
          className="rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm"
        >
          <option value="all">All Topics</option>
          {filterOptions.topics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.grade} - {topic.title}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.includeTopicNodes}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, includeTopicNodes: event.target.checked }))
              }
            />
            Topics
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.includeStandardNodes}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, includeStandardNodes: event.target.checked }))
              }
            />
            Standards
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => withChart((chart) => chart.dispatchAction({ type: 'restore' }))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
            title="Reset graph view"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            onClick={() =>
              withChart((chart) =>
                chart.dispatchAction({
                  type: 'graphRoam',
                  zoom: 1.15,
                  originX: chart.getWidth() / 2,
                  originY: chart.getHeight() / 2,
                }),
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() =>
              withChart((chart) =>
                chart.dispatchAction({
                  type: 'graphRoam',
                  zoom: 0.87,
                  originX: chart.getWidth() / 2,
                  originY: chart.getHeight() / 2,
                }),
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() =>
              withChart((chart) => {
                if (!activeNodeId) return;
                chart.dispatchAction({
                  type: 'focusNodeAdjacency',
                  seriesIndex: 0,
                  dataIndex: viewModel.nodes.findIndex((node) => node.id === activeNodeId),
                });
              })
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
            title="Highlight neighbors"
          >
            <Focus className="w-3.5 h-3.5" />
            Highlight
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <ReactECharts
          ref={chartRef}
          option={option}
          onChartReady={handleChartReady}
          style={{ height: 540 }}
          notMerge
          lazyUpdate
        />
      </div>

      <p className="text-xs text-slate-500">
        {viewModel.nodes.length} nodes • {viewModel.links.length} links
      </p>
    </div>
  );
}
