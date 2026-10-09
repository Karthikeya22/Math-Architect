export enum GradeLevel {
  K = 'Kindergarten',
  G1 = 'Grade 1',
  G2 = 'Grade 2',
  G3 = 'Grade 3',
  G4 = 'Grade 4',
  G5 = 'Grade 5',
  G6 = 'Grade 6',
  G7 = 'Grade 7',
  G8 = 'Grade 8',
  /** Florida B.E.S.T. high school course band (9–12) in standard codes (MA.912.*) */
  G912 = '912',
}

export interface Standard {
  code: string;
  description: string;
  grade: GradeLevel | string;
  clarifications?: string[];
  examples?: string[];
  purposeAndStrategies?: string[];
  misconceptions?: string[];
  tieredInstruction?: string[];
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Mixed';

export type VisualType =
  | 'none'
  | 'ten_frame'
  | 'line_plot'
  | 'table'
  | 'bar_chart'
  | 'fraction_bar'
  | 'number_line'
  | 'array_model'
  | 'area_model'
  | 'fraction_circle'
  | 'coordinate_plane'
  | 'geometric_shape'
  | 'bar_model'
  | 'clock_face'
  | 'shape_diagram'
  | 'scene_only';

export type GeometricShapeName =
  | 'triangle'
  | 'right_triangle'
  | 'square'
  | 'rectangle'
  | 'parallelogram'
  | 'trapezoid'
  | 'pentagon'
  | 'hexagon';

export interface CoordinatePoint {
  x: number;
  y: number;
  label?: string;
}

export interface VisualSpec {
  visualType: VisualType;
  title?: string;
  xLabel?: string;
  yLabel?: string;
  values?: number[];
  min?: number;
  max?: number;
  tickStep?: number;
  columns?: string[];
  rows?: string[][];
  categories?: string[];
  yMin?: number;
  yMax?: number;
  prompt?: string;
  visualIntent?: string;
  mustDisplay?: string[];
  mustNotDisplay?: string[];
  /** fraction_bar / fraction_circle: partition into totalParts; shade first shadedParts. */
  shadedParts?: number;
  totalParts?: number;
  /** array_model / area_model: rows × cols grid. array_model values row-major 0/1. */
  gridRows?: number;
  gridCols?: number;
  /** area_model: outer labels (one per row / column) and optional inner cell labels (row-major). */
  rowLabels?: string[];
  /** array_model: one solid color per row (e.g. red train vs blue train). */
  rowColors?: string[];
  colLabels?: string[];
  cellLabels?: string[];
  /** coordinate_plane bounds (x-axis); yMin/yMax above are reused for the y-axis. */
  xMin?: number;
  xMax?: number;
  /** coordinate_plane: tick spacing (defaults to 1) and points to plot. */
  xTickStep?: number;
  yTickStep?: number;
  points?: CoordinatePoint[];
  /** geometric_shape: which polygon to draw, plus optional labels (cw order from top/left). */
  shapeName?: GeometricShapeName;
  /** geometric_shape: two or more named figures shown side by side for compare/classify items. */
  shapes?: GeometricShapeName[];
  sideLabels?: string[];
  angleLabels?: string[];
  /** geometric_shape rectangle/parallelogram aspect; ignored for regular polygons. */
  shapeWidth?: number;
  shapeHeight?: number;
  /** bar_model: ordered segments with labels, relative widths, and shading. */
  segmentLabels?: string[];
  segmentWeights?: number[];
  segmentShaded?: number[];
  /** clock_face: hour 0-23 (mod 12 used for hour hand) and minute 0-59. */
  hour?: number;
  minute?: number;
  /** ten_frame: extra ones dots shown beside a full ten (K place-value teens). */
  onesCount?: number;
  /** ten_frame: how many full ten-frames to show side by side (e.g. 4 for forty). */
  tensCount?: number;
}

/** One step in a student-facing solution walkthrough (shown after answering). */
export interface SolutionStep {
  title: string;
  body: string;
  /** Optional per-step deterministic visual; omit to reuse the question figure on the last step. */
  visualSpec?: VisualSpec;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  /** Grade-appropriate step-by-step solution shown to students after they answer. */
  solutionSteps?: SolutionStep[];
  animationDescription: string;
  visualIntent?: string;
  /** Short student-facing lines on how to read the figure (1–3 items). */
  figureHints?: string[];
  visualSpec?: VisualSpec;
  imagePrompt?: string; // Optional prompt for AI image generation
  generatedImageBase64?: string; // Actual base64 jpeg if generated
  /** Optional GeoGebra PNG (toggle in QuizTaker vs primary figure). */
  geogebraImageBase64?: string;
  visual?: string; // Legacy SVG fallback
  difficulty: Difficulty;
  sourceType?: 'bank' | 'rewrite' | 'novel';
  sourceProvider?: 'IXL' | 'CPALMS_MFAS' | 'KHAN' | 'UNKNOWN';
  providerItemId?: string;
  generatedByAi?: boolean;
  promptVersion?: string;
  feedbackGuidance?: {
    misconceptionSignal?: string;
    strategyTip?: string;
    tieredNextStep?: string;
  };
  /**
   * Telemetry: which image path served this question. One of:
   * - 'deterministic_svg' — rendered locally from a deterministic visualSpec.
   * - 'gemini_image'      — Gemini-generated raster, validation passed.
   * - 'gemini_image_retry'— Gemini-generated raster, used after stricter retry.
   * - 'openai_image'      — OpenAI-generated raster, validation passed.
   * - 'openai_image_retry'— OpenAI-generated raster, used after stricter retry.
   * - 'fallback_svg'      — buildVisualFallbackSvg placeholder used.
   * - 'no_visual'         — no image produced (text-only question).
   */
  visualPath?:
    | 'deterministic_svg'
    | 'gemini_image'
    | 'gemini_image_retry'
    | 'openai_image'
    | 'openai_image_retry'
    | 'fallback_svg'
    | 'figure_rejected'
    | 'figure_skipped'
    | 'no_visual'
    | 'sanitized_no_visual';
  figureStatus?: 'verified' | 'unverified' | 'rejected' | 'skipped' | 'error';
  /** Reviewer notes from the figure pipeline (teacher/debug only). */
  figureIssues?: string[];
}

export interface Quiz {
  standardCode: string;
  questions: Question[];
  config: QuizConfig;
  providerMetadata?: {
    provider?: string;
    model?: string;
    usage?: Record<string, unknown>;
    promptVersion?: string;
    sourcePolicy?: 'strict_rewrite_only' | 'mixed_with_limits' | 'ai_freedom';
  };
}

export interface QuizResult {
  questionIndex: number;
  selectedOptionIndex: number;
  isCorrect: boolean;
  timeTaken: number;
  difficulty: Difficulty;
  questionId?: string;
  nextDifficulty?: Difficulty;
  adaptiveDecisionReason?: string;
  difficultyChanged?: boolean;
  sourceType?: 'bank' | 'rewrite' | 'novel';
  generatedByAi?: boolean;
  feedbackUsed?: {
    misconceptionSignal?: string;
    strategyTip?: string;
    tieredNextStep?: string;
  };
}

export enum GapType {
  Conceptual = 'Conceptual Understanding',
  Procedural = 'Procedural Fluency',
  Computational = 'Computational Error',
  Unknown = 'Needs More Data'
}

export interface SubSkill {
  name: string;
  description: string;
  correctCount: number;
  totalCount: number;
}

export type DiagnosticErrorType =
  | 'conceptual'
  | 'procedural'
  | 'computational'
  | 'representation'
  | 'language'
  | 'low_evidence';

export type DiagnosticEvidenceSource = 'standard' | 'strand' | 'adjacent_grade' | 'inferred';

export type DiagnosticConfidenceLabel = 'high' | 'medium' | 'low';

export interface AnalysisAttemptRow {
  attemptOrder: number;
  questionIndex: number;
  questionId: string;
  standardCode: string;
  strandCode: string | null;
  selectedOptionIndex: number | null;
  selectedOptionText: string;
  correctOptionText: string;
  isCorrect: boolean;
  timeTakenSec: number;
  difficultyPresented: Difficulty;
  adaptiveDecisionReason: string;
  sourceType: 'bank' | 'rewrite' | 'novel' | 'unknown';
  generatedByAi: boolean;
  misconceptionSignal: string;
  strategyTip: string;
  tieredNextStep: string;
}

export interface QuestionDiagnostic {
  attemptOrder: number;
  questionIndex: number;
  questionId: string;
  errorType: DiagnosticErrorType;
  misconception: string;
  misconceptionCandidates: string[];
  evidenceSource: DiagnosticEvidenceSource;
  confidenceScore: number;
  confidenceLabel: DiagnosticConfidenceLabel;
  notes: string;
}

export interface GapAnalysis {
  standardCode: string;
  identifiedGaps: {
    gapType: GapType;
    description: string;
    relatedQuestions: number[];
    misconception?: string;
  }[];
  subSkills: SubSkill[];
  confidenceScore: number;
  summary: string;
  attemptRows?: AnalysisAttemptRow[];
  questionDiagnostics?: QuestionDiagnostic[];
  studentActions?: string[];
  teacherActions?: string[];
  reliabilityFlags?: string[];
}

export type RemedialSlideLayout =
  | 'gap_overview'
  | 'concept'
  | 'model'
  | 'worked_example'
  | 'mistake_fix'
  | 'try_it';

export interface RemedialVocabEntry {
  term: string;
  meaning: string;
}

export interface RemedialSlide {
  slideNumber: number;
  title: string;
  /** Markdown body. Older saved decks only have this; new decks derive it from keyPoints. */
  content: string;
  visualDescription: string;
  imagePrompt?: string;
  generatedImageBase64?: string;
  svgVisual?: string; // Legacy feature
  /** Older saved decks store plain strings. */
  vocabulary: Array<string | RemedialVocabEntry>;
  layout?: RemedialSlideLayout;
  subtitle?: string;
  keyPoints?: string[];
  workedExample?: { problem: string; steps: string[]; answer: string };
  misconception?: { wrong: string; why: string; fix: string };
  checkQuestion?: { prompt: string; answer: string };
  /** Teacher script shown in presenter notes and PowerPoint speaker notes. */
  talkingPoints?: string[];
  gapAddressed?: string;
  imageStatus?: 'verified' | 'unverified' | 'rejected' | 'skipped' | 'error' | 'none';
}

export type QuizMode = 'item-bank' | 'topic-based';

export interface QuizConfig {
  questionCount: number;
  difficulty: Difficulty;
  mode: QuizMode;
  questionTypes: {
    multipleChoice: boolean;
    trueFalse: boolean;
    fillInBlank: boolean;
  };
  focusAreas: {
    wordProblems: boolean;
    visualQuestions: boolean;
    realWorld: boolean;
  };
  adaptiveEnabled?: boolean;
  adaptivePolicy?: 'staircase_1up1down' | 'mastery_blocks' | 'hybrid_guardrails';
  startDifficulty?: Exclude<Difficulty, 'Mixed'>;
  sourcePolicy?: 'strict_rewrite_only' | 'mixed_with_limits' | 'ai_freedom';
  featureFlags?: {
    adaptiveV1Enabled?: boolean;
  };
  providerOverrides?: Partial<Record<AiTask, AiProvider>>;
}

export type AiTask = 'quiz' | 'analysis' | 'slides' | 'image';
export type AiProvider = 'gemini' | 'openai' | 'auto';

export interface ProviderSelection {
  task: AiTask;
  provider: AiProvider;
  model?: string;
}

export interface AppState {
  view: 'setup' | 'quiz' | 'analysis' | 'remedial';
  selectedStandard: Standard | null;
  quiz: Quiz | null;
  quizResults: QuizResult[];
  analysis: GapAnalysis | null;
  slides: RemedialSlide[];
  loading: boolean;
  loadingMessage: string;
  /** Supabase session id after successful server log; used for attempt rows. */
  currentGenerationId: string | null;
  /** Supabase gap_analyses.id after POST /api/gap-analyses. */
  gapAnalysisId: string | null;
  /** Dev-only dismissible notice when Supabase telemetry logging fails. */
  telemetryNotice: string | null;
}

export interface TopicNode {
  id: string;
  title: string;
  type: 'grade' | 'strand' | 'topic';
  children?: TopicNode[];
  associatedStandards?: string[];
}

// --- STANDARDS GRAPH TYPES ---
export type GraphRelationMode = 'sequential' | 'cross-grade' | 'hybrid';
export type GraphGradeFilter = GradeLevel | 'all';

export interface StandardsGraphTopic {
  id: string;
  title: string;
  grade: GradeLevel;
  strandCode: string;
  strandTitle: string;
  keywords: string[];
}

export interface StandardsGraphStandard {
  code: string;
  grade: GradeLevel;
  topicId: string;
  topicTitle: string;
  strandCode: string;
  strandTitle: string;
  description: string;
  keywords: string[];
  sequenceOrder: number;
  relationships: {
    sequentialPrev: string[];
    sequentialNext: string[];
    crossGradeConceptLinks: string[];
  };
}

export interface StandardsGraphDataset {
  metadata: {
    source: string;
    generatedAt: string;
    totalStandards: number;
    totalTopics: number;
    grades: GradeLevel[];
  };
  topics: StandardsGraphTopic[];
  standards: StandardsGraphStandard[];
}

export interface StandardsGraphFilters {
  grade: GraphGradeFilter;
  relationMode: GraphRelationMode;
  strandCode: string | 'all';
  topicId: string | 'all';
  rootStandardCode?: string | null;
  activeStandardCode?: string | null;
  traversalDepth?: number;
  includeTopicNodes: boolean;
  includeStandardNodes: boolean;
  searchText: string;
}

export type StandardsGraphNodeKind = 'topic' | 'standard';

export interface StandardsGraphNodeView {
  id: string;
  kind: StandardsGraphNodeKind;
  label: string;
  grade: GradeLevel;
  strandCode: string;
  topicId?: string;
  standardCode?: string;
  description?: string;
  value: number;
  category: string;
  lane?: number;
  stage?: number;
  column?: number;
  row?: number;
  parentTopicId?: string;
}

export type StandardsGraphLinkKind =
  | 'topic-membership'
  | 'sequential'
  | 'cross-grade'
  | 'topic-relationship';

export type StandardsGraphEdgeStyle = 'solid' | 'dotted';

export interface StandardsGraphLinkView {
  source: string;
  target: string;
  kind: StandardsGraphLinkKind;
  edgeStyle: StandardsGraphEdgeStyle;
  sourceTopicId?: string;
  targetTopicId?: string;
  explanation?: string;
}

export interface StandardsGraphViewModel {
  nodes: StandardsGraphNodeView[];
  links: StandardsGraphLinkView[];
}

export interface StandardsGraphFilterOptions {
  grades: GradeLevel[];
  strands: Array<{ code: string; title: string }>;
  topics: StandardsGraphTopic[];
}

// --- TREE GRAPH REDESIGN TYPES ---
export type StandardsTreeNodeKind = 'topic' | 'family' | 'benchmark';

export interface StandardsTreeCounts {
  familyCount?: number;
  benchmarkCount?: number;
  childCount?: number;
  horizontalLinkCount?: number;
}

export interface StandardsTreeNode {
  id: string;
  code: string;
  label: string;
  kind: StandardsTreeNodeKind;
  grade: GradeLevel;
  strandCode: string;
  strandTitle: string;
  topicId: string;
  topicTitle: string;
  parentId: string | null;
  childrenIds: string[];
  description?: string;
  cluster?: string;
  clarifications?: string[];
  misconceptions?: string[];
  instructionalItems?: string[];
  instructionalTasks?: string[];
  keywords?: string[];
  counts: StandardsTreeCounts;
}

export interface StandardsTreeGradeView {
  grade: GradeLevel;
  rootNodeIds: string[];
  nodesById: Record<string, StandardsTreeNode>;
}

export interface StandardsTreeDataset {
  metadata: StandardsGraphDataset['metadata'];
  grades: GradeLevel[];
  gradesView: Record<GradeLevel, StandardsTreeGradeView>;
  horizontalAdjacency: Record<string, string[]>;
}

export interface GraphCameraState {
  zoom: number;
  centerX: number;
  centerY: number;
}

export interface GraphViewState {
  grade: GradeLevel | '';
  selectedNodeId: string | null;
  expandedNodeIds: string[];
  showHorizontalLinks: boolean;
  camera: GraphCameraState | null;
}

export interface StandardsTreeNodeDetails {
  node: StandardsTreeNode;
  horizontalNeighbors: StandardsTreeNode[];
}

// --- DATABASE & AUTH TYPES ---

export interface User {
  id: string;
  username: string;
  fullName: string;
  createdAt: number;
  /** True when created via POST /api/users/guest */
  isGuest?: boolean;
  /** Numeric guest sequence when `isGuest` (from Supabase). */
  guestNumber?: number;
}

export interface LogEntry {
  id: string;
  userId: string;
  action: string;
  timestamp: number;
  metadata?: any;
}

export interface UserSession {
  user: User | null;
  isAuthenticated: boolean;
}

export interface CoherenceMapRouteState {
  band: 'k8' | '912' | null;
  grade: GradeLevel | null;
  category: string | null;
  domain: string | null;
  root: string | null;
  standard: string | null;
  standardIndex: number | null;
}