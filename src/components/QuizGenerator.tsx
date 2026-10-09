import React, { useState, useEffect, useMemo } from 'react';
import {
  GradeLevel,
  Standard,
  Difficulty,
  QuizConfig,
  StandardsGraphDataset,
  CoherenceMapRouteState,
} from '../types';
import { FLORIDA_STANDARDS } from '../constants';
import { fetchStandardsFromApi } from '../services/standardsService';
import { CoherenceMap } from './CoherenceMap';
import { CoherenceMapControls } from './CoherenceMapControls';
import { buildCoherenceAtlasLayout, type CoherenceAtlasScope } from '../utils/buildCoherenceAtlasModel';
import standardsGraphDataset from '../data/best-standards-graph.json';
import {
  buildCoherenceMapPath,
  emptyCoherenceMapRouteState,
  parseCoherenceMapPath,
} from '../utils/coherenceMapRoute';
import { parseStandardCodeMeta } from '../utils/parseStandardCode';
import { buildHsStandardsGraphDataset } from '../utils/buildHsStandardsGraphDataset';
import { HS_STRAND_FALLBACK_TITLES } from '../constants/hsStrandTitles';
import { ArrowRight, Settings2 } from 'lucide-react';
import { MotionDiagram } from './motion-diagrams';

interface Props {
  onGenerate: (standard: Standard, config: QuizConfig) => void;
  isLoading: boolean;
}

const K8_GRADES: GradeLevel[] = [
  GradeLevel.K,
  GradeLevel.G1,
  GradeLevel.G2,
  GradeLevel.G3,
  GradeLevel.G4,
  GradeLevel.G5,
  GradeLevel.G6,
  GradeLevel.G7,
  GradeLevel.G8,
];

const K8_GRADE_VALUES = new Set<string>(K8_GRADES);

const isK8Grade = (grade: string): grade is GradeLevel => K8_GRADE_VALUES.has(grade);

const QuizGenerator: React.FC<Props> = ({ onGenerate, isLoading }) => {
  const adaptiveV1Enabled = import.meta.env.VITE_ADAPTIVE_V1_ENABLED !== 'false';
  const standardsDataset = standardsGraphDataset as StandardsGraphDataset;
  const [standards, setStandards] = useState<Standard[]>(FLORIDA_STANDARDS);
  const [mapScope, setMapScope] = useState<CoherenceAtlasScope>('k8');
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | ''>('');
  const [selectedStandardCode, setSelectedStandardCode] = useState<string>('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [strandFilter, setStrandFilter] = useState<Set<string>>(() => new Set());
  const [graphRoute, setGraphRoute] = useState<CoherenceMapRouteState>(() =>
    typeof window === 'undefined'
      ? emptyCoherenceMapRouteState()
      : parseCoherenceMapPath(window.location.pathname),
  );

  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [adaptiveEnabled, setAdaptiveEnabled] = useState(false);
  const [adaptivePolicy, setAdaptivePolicy] = useState<QuizConfig['adaptivePolicy']>('hybrid_guardrails');
  const [startDifficulty, setStartDifficulty] = useState<QuizConfig['startDifficulty']>('Medium');
  const [sourcePolicy, setSourcePolicy] = useState<QuizConfig['sourcePolicy']>('mixed_with_limits');
  const [config, setConfig] = useState({
    questionTypes: {
      multipleChoice: true,
      trueFalse: false,
      fillInBlank: false,
    },
    focusAreas: {
      wordProblems: true,
      visualQuestions: true,
      realWorld: false,
    },
  });
  const [uiMessage, setUiMessage] = useState<string>('');
  const [standardsLoadError, setStandardsLoadError] = useState<string | null>(null);

  const filteredStandards = useMemo(() => {
    if (mapScope === '912') {
      return standards.filter((row) => {
        const parsed = parseStandardCodeMeta(row.code);
        return parsed.gradeToken === '912' || String(row.grade).trim() === '912';
      });
    }
    return standards.filter((row) => selectedGrade && row.grade === selectedGrade);
  }, [mapScope, selectedGrade, standards]);

  const strandTitleByCode = useMemo(() => {
    const map: Record<string, string> = { ...HS_STRAND_FALLBACK_TITLES };
    for (const row of standardsDataset.standards) {
      if (row.strandCode && row.strandTitle) {
        map[row.strandCode] = row.strandTitle;
      }
    }
    return map;
  }, [standardsDataset.standards]);

  const hsGraphDataset = useMemo(
    () => buildHsStandardsGraphDataset(standards, strandTitleByCode),
    [standards, strandTitleByCode],
  );
  const activeMapDataset = mapScope === 'k8' ? standardsDataset : hsGraphDataset;
  const mapLayout = useMemo(
    () => buildCoherenceAtlasLayout(activeMapDataset, mapScope),
    [activeMapDataset, mapScope],
  );

  useEffect(() => {
    setStrandFilter(new Set(mapLayout.strands));
  }, [mapLayout.strands]);

  const selectedStandard = standards.find((row) => row.code === selectedStandardCode);
  const selectedStandardResolved = useMemo(() => {
    if (selectedStandard) return selectedStandard;
    const codeFallback = selectedStandardCode || graphRoute.standard || '';
    if (!codeFallback) return null;
    const fromState = standards.find((item) => item.code === codeFallback);
    if (fromState) return fromState;
    const fromGraph =
      standardsDataset.standards.find((item) => item.code === codeFallback) ||
      hsGraphDataset.standards.find((item) => item.code === codeFallback);
    if (!fromGraph) return null;
    const fromApiGrade = standards.find((item) => item.code === fromGraph.code)?.grade;
    const parsedHs = parseStandardCodeMeta(fromGraph.code);
    const mappedGrade =
      fromApiGrade ||
      (parsedHs.gradeToken === '912' ? GradeLevel.G912 : selectedGrade || GradeLevel.G4);
    return {
      code: fromGraph.code,
      description: fromGraph.description,
      grade: mappedGrade,
      clarifications: [],
      examples: [],
      purposeAndStrategies: [],
      misconceptions: [],
      tieredInstruction: [],
    } as Standard;
  }, [
    selectedStandard,
    selectedStandardCode,
    graphRoute.standard,
    standards,
    standardsDataset.standards,
    hsGraphDataset.standards,
    selectedGrade,
  ]);

  const inputClass = 'app-input';
  const pushGraphRoute = (nextRoute: CoherenceMapRouteState) => {
    const nextPath = buildCoherenceMapPath(nextRoute);
    if (window.location.pathname !== nextPath) {
      window.history.pushState(null, '', nextPath);
    }
    setGraphRoute(nextRoute);
  };

  const syncRouteForPin = (standardCode: string) => {
    const graphStandard =
      standardsDataset.standards.find((item) => item.code === standardCode) ||
      hsGraphDataset.standards.find((item) => item.code === standardCode);
    const parsed = parseStandardCodeMeta(standardCode);
    const band: CoherenceMapRouteState['band'] =
      parsed.gradeToken === '912' || graphStandard?.grade === GradeLevel.G912 ? '912' : 'k8';
    pushGraphRoute({
      band,
      grade: band === '912' ? GradeLevel.G912 : graphStandard?.grade || selectedGrade || null,
      category: graphStandard?.strandCode ?? parsed.strandCode ?? null,
      domain: null,
      root: standardCode,
      standard: standardCode,
      standardIndex: null,
    });
  };

  const handleGenerate = () => {
    setUiMessage('');
    const finalConfig: QuizConfig = {
      questionCount,
      difficulty,
      mode: 'item-bank',
      questionTypes: config.questionTypes,
      focusAreas: config.focusAreas,
      adaptiveEnabled: adaptiveV1Enabled ? adaptiveEnabled : false,
      adaptivePolicy,
      startDifficulty,
      sourcePolicy,
      featureFlags: {
        adaptiveV1Enabled,
      },
    };

    if (selectedStandardResolved) {
      onGenerate(selectedStandardResolved, finalConfig);
    } else {
      setUiMessage('Pin a standard on the coherence map before generating.');
    }
  };

  const handlePinStandard = (standardCode: string) => {
    setSelectedStandardCode(standardCode);
    const matched =
      standards.find((standard) => standard.code === standardCode) ||
      FLORIDA_STANDARDS.find((standard) => standard.code === standardCode);
    if (matched && isK8Grade(String(matched.grade))) {
      setMapScope('k8');
      setSelectedGrade(matched.grade);
    } else {
      setMapScope('912');
      setSelectedGrade(GradeLevel.G912);
    }
    syncRouteForPin(standardCode);
  };

  const handleClearPin = () => {
    setSelectedStandardCode('');
    pushGraphRoute({
      ...graphRoute,
      root: null,
      standard: null,
    });
  };

  const toggleStrand = (strand: string) => {
    setStrandFilter((prev) => {
      const next = new Set(prev);
      if (next.has(strand)) next.delete(strand);
      else next.add(strand);
      if (next.size === 0) return prev;
      return next;
    });
  };

  const handleMapScopeChange = (scope: CoherenceAtlasScope) => {
    setMapScope(scope);
    if (scope === '912') {
      setSelectedGrade(GradeLevel.G912);
    } else if (selectedGrade === GradeLevel.G912) {
      setSelectedGrade('');
    }
    pushGraphRoute({
      band: scope,
      grade: scope === '912' ? GradeLevel.G912 : selectedGrade || null,
      category: null,
      domain: null,
      root: selectedStandardCode || null,
      standard: selectedStandardCode || null,
      standardIndex: null,
    });
  };

  useEffect(() => {
    const applyRouteState = (route: CoherenceMapRouteState) => {
      if (route.band === '912') {
        setMapScope('912');
        setSelectedGrade(GradeLevel.G912);
      } else if (route.band === 'k8' || route.grade) {
        setMapScope('k8');
        if (route.grade) setSelectedGrade(route.grade);
      }
      if (route.standard) setSelectedStandardCode(route.standard);
    };

    applyRouteState(graphRoute);

    const onPopState = () => {
      const parsed = parseCoherenceMapPath(window.location.pathname);
      setGraphRoute(parsed);
      applyRouteState(parsed);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [graphRoute]);

  useEffect(() => {
    let mounted = true;
    fetchStandardsFromApi()
      .then((rows) => {
        if (!mounted) return;
        setStandardsLoadError(null);
        if (rows.length > 0) {
          setStandards(rows);
        }
      })
      .catch((error: unknown) => {
        const msg =
          error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error';
        console.error('Using local standards fallback after /api/standards failed.', error);
        if (mounted) {
          setStandardsLoadError(
            `Could not load standards from the server (${msg}). Showing bundled fallback standards until /api/standards and Supabase env are fixed.`,
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const pinReady = Boolean(selectedStandardResolved);
  const actionStatus = pinReady
    ? null
    : mapScope === 'k8' && !selectedGrade
      ? 'Pick a grade to see its benchmarks.'
      : 'Choose a benchmark from the list or click one on the map.';

  return (
    <div className="studio-page coherence-atlas-root">
      <header className="studio-hero app-hero-band">
        <div className="app-hero-band-copy">
          <h1 className="studio-title">Pin a standard, then build the quiz</h1>
          <p className="studio-lede">
            Choose a Florida B.E.S.T. benchmark from the filters or the coherence map, then generate aligned practice.
          </p>
        </div>
        <MotionDiagram name="Pin" width={120} plate="#f2edfd" desktopOnly className="motion-diagram--compact" />
      </header>

      {(standardsLoadError || uiMessage) && (
        <div className="space-y-2 mb-3" aria-live="polite">
          {standardsLoadError && (
            <div className="studio-alert" role="status">
              <span className="studio-alert-body">{standardsLoadError}</span>
              <button type="button" onClick={() => setStandardsLoadError(null)}>
                Dismiss
              </button>
            </div>
          )}
          {uiMessage && (
            <div className="studio-alert studio-alert--danger" role="alert">
              <span className="studio-alert-body">{uiMessage}</span>
              <button type="button" onClick={() => setUiMessage('')}>
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}

      <div className="coherence-atlas-stack">
          <CoherenceMapControls
            layout={mapLayout}
            scope={mapScope}
            onScopeChange={handleMapScopeChange}
            focusGrade={selectedGrade}
            onFocusGradeChange={(grade) => setSelectedGrade(grade)}
            k8Grades={K8_GRADES}
            strandFilter={strandFilter}
            onToggleStrand={toggleStrand}
            filteredStandards={filteredStandards}
            pinnedStandardCode={selectedStandardCode}
            onPinStandard={handlePinStandard}
            onClearPin={handleClearPin}
          />

          {advancedOpen && (
            <section id="quiz-options-panel" className="coherence-atlas-panel p-4 sm:p-5" aria-labelledby="quiz-options-heading">
              <div className="space-y-4">
                <h2 id="quiz-options-heading" className="studio-panel-title">Quiz options</h2>
                <div>
                  <p className="coherence-atlas-section-label mb-2">Question count</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[5, 10, 15, 20].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setQuestionCount(count)}
                        className={`coherence-atlas-option-tile ${
                          questionCount === count ? 'coherence-atlas-option-tile--active' : ''
                        }`}
                        aria-pressed={questionCount === count}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="coherence-atlas-section-label mb-2">Difficulty</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setDifficulty(level)}
                        className={`coherence-atlas-option-tile ${
                          difficulty === level ? 'coherence-atlas-option-tile--active' : ''
                        }`}
                        aria-pressed={difficulty === level}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="app-inset">
                  <label htmlFor="quiz-source-policy" className="coherence-atlas-section-label block mb-1.5">
                    Question source
                  </label>
                  <select
                    id="quiz-source-policy"
                    className={inputClass}
                    value={sourcePolicy}
                    onChange={(e) => setSourcePolicy(e.target.value as NonNullable<QuizConfig['sourcePolicy']>)}
                  >
                    <option value="mixed_with_limits">Mixed (preferred)</option>
                    <option value="strict_rewrite_only">Rewrite only</option>
                    <option value="ai_freedom">AI freedom</option>
                  </select>
                </div>
                {adaptiveV1Enabled && (
                  <div className="app-inset space-y-2.5">
                    <label className="flex items-center justify-between gap-3 cursor-pointer min-h-[2.75rem]">
                      <span>
                        <span className="coherence-atlas-section-label">Adaptive mode</span>
                        <span className="block text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          Adjust difficulty after each answer.
                        </span>
                      </span>
                      <input
                        type="checkbox"
                        checked={adaptiveEnabled}
                        onChange={(e) => setAdaptiveEnabled(e.target.checked)}
                        className="h-5 w-5 rounded"
                        style={{ accentColor: 'var(--accent)' }}
                      />
                    </label>
                    {adaptiveEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <select
                          aria-label="Adaptive policy"
                          className={inputClass}
                          value={adaptivePolicy}
                          onChange={(e) => setAdaptivePolicy(e.target.value as NonNullable<QuizConfig['adaptivePolicy']>)}
                        >
                          <option value="hybrid_guardrails">Hybrid Guardrails</option>
                          <option value="staircase_1up1down">1-Up 1-Down</option>
                          <option value="mastery_blocks">Mastery Blocks</option>
                        </select>
                        <select
                          aria-label="Starting difficulty"
                          className={inputClass}
                          value={startDifficulty}
                          onChange={(e) => setStartDifficulty(e.target.value as NonNullable<QuizConfig['startDifficulty']>)}
                        >
                          <option value="Easy">Start Easy</option>
                          <option value="Medium">Start Medium</option>
                          <option value="Hard">Start Hard</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          <div className="min-h-0">
            <CoherenceMap
              k8Dataset={standardsDataset}
              hsDataset={hsGraphDataset}
              scope={mapScope}
              onScopeChange={handleMapScopeChange}
              focusGrade={selectedGrade}
              pinnedStandardCode={selectedStandardCode}
              onPinStandard={handlePinStandard}
              onClearPin={handleClearPin}
              onFocusGradeChange={(grade) => setSelectedGrade(grade)}
              strandFilter={strandFilter}
            />
          </div>
      </div>

      <div className="studio-actionbar" role="region" aria-label="Generate quiz">
        <div className="studio-actionbar-status" aria-live="polite">
          {pinReady && selectedStandardResolved ? (
            <>
              <span className="app-badge app-badge--accent app-badge--mono" translate="no">
                {selectedStandardResolved.code}
              </span>
              <span className="studio-actionbar-desc">{selectedStandardResolved.description}</span>
            </>
          ) : (
            <span className="studio-actionbar-hint">{actionStatus}</span>
          )}
        </div>
        <div className="studio-actionbar-actions">
          <button
            type="button"
            onClick={() => setAdvancedOpen((open) => !open)}
            className={`coherence-atlas-btn-secondary ${advancedOpen ? 'coherence-atlas-btn-secondary--active' : ''}`}
            aria-expanded={advancedOpen}
            aria-controls="quiz-options-panel"
          >
            <Settings2 className="w-4 h-4" strokeWidth={1.75} aria-hidden />
            <span>
              {questionCount} questions, {difficulty}
            </span>
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading || !pinReady}
            className="coherence-atlas-btn-primary studio-generate-btn"
          >
            {isLoading ? 'Generating…' : 'Generate quiz'}
            {!isLoading && <ArrowRight className="w-4 h-4" strokeWidth={2} aria-hidden />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizGenerator;
