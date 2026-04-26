export enum GradeLevel {
  K = 'Kindergarten',
  G1 = 'Grade 1',
  G2 = 'Grade 2',
  G3 = 'Grade 3',
  G4 = 'Grade 4',
  G5 = 'Grade 5',
  G6 = 'Grade 6',
  G7 = 'Grade 7',
  G8 = 'Grade 8'
}

export interface Standard {
  code: string;
  description: string;
  grade: GradeLevel;
  clarifications?: string[];
  examples?: string[];
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Mixed';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  animationDescription: string;
  visualIntent?: string;
  imagePrompt?: string; // Optional prompt for AI image generation
  generatedImageBase64?: string; // Actual base64 jpeg if generated
  visual?: string; // Legacy SVG fallback
  difficulty: Difficulty; 
}

export interface Quiz {
  standardCode: string;
  questions: Question[];
  config: QuizConfig;
}

export interface QuizResult {
  questionIndex: number;
  selectedOptionIndex: number;
  isCorrect: boolean;
  timeTaken: number;
  difficulty: Difficulty;
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
}

export interface RemedialSlide {
  slideNumber: number;
  title: string;
  content: string;
  visualDescription: string;
  imagePrompt?: string;
  generatedImageBase64?: string;
  svgVisual?: string; // Legacy feature
  vocabulary: string[];
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
}

export interface TopicNode {
  id: string;
  title: string;
  type: 'grade' | 'strand' | 'topic';
  children?: TopicNode[];
  associatedStandards?: string[];
}

// --- DATABASE & AUTH TYPES ---

export interface User {
  id: string;
  username: string;
  fullName: string;
  createdAt: number;
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