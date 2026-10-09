import React, { useState, useEffect } from 'react';
import { AppState, Standard, Quiz, QuizResult, GapAnalysis, RemedialSlide, QuizConfig, User } from './types';
import { generateQuiz, analyzeGaps, generateRemedialSlides } from './services/aiService';
import { logAiQuizAttempt, logAiQuizGeneration } from './services/aiQuizLogService';
import { saveGapAnalysisToServer, saveRemediationSlidesToServer } from './services/persistenceTelemetryService';
import { dbService } from './services/dbService';
import QuizGenerator from './components/QuizGenerator';
import QuizTaker from './components/QuizTaker';
import GapAnalysisComponent from './components/GapAnalysis';
import RemedialSlides from './components/RemedialSlides';
import AuthScreen from './components/AuthScreen';
import BrandMark from './components/BrandMark';
import LoadingStage from './components/LoadingStage';
import { LogOut, UserRound } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';

const VisualGalleryRoute = React.lazy(() => import('./dev/VisualGalleryRoute'));
const ScreensGalleryRoute = React.lazy(() => import('./dev/ScreensGalleryRoute'));
const DiagramsGalleryRoute = React.lazy(() => import('./dev/DiagramsGalleryRoute'));

type AppError = { title: string; message: string };

function App() {
  const reduceMotion = useReducedMotion();
  const [user, setUser] = useState<User | null>(null);
  const [appError, setAppError] = useState<AppError | null>(null);
  const [hashRoute, setHashRoute] = useState<string>(typeof window !== 'undefined' ? window.location.hash : '');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onHashChange = () => setHashRoute(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  const [state, setState] = useState<AppState>({
    view: 'setup',
    selectedStandard: null,
    quiz: null,
    quizResults: [],
    analysis: null,
    slides: [],
    loading: false,
    loadingMessage: '',
    currentGenerationId: null,
    gapAnalysisId: null,
    telemetryNotice: null,
  });
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);

  const setupLoadingSteps = [
    { text: 'Reading your selected standard…' },
    { text: 'Designing aligned assessment prompts…' },
    { text: 'Calibrating question difficulty and flow…' },
  ] as const;

  // Initialize Session
  useEffect(() => {
    const currentUser = dbService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  // Global Click Tracker
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (!user) return;
      
      const target = e.target as HTMLElement;
      // We log clicks on interactive elements
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
        const text = target.innerText || target.getAttribute('aria-label') || 'Unknown Element';
        
        // CRITICAL: Don't log clicks on the "Generate Assessment" button as it might interfere with the state
        if (text.includes('Generate Assessment')) return;

        dbService.logAction(user.id, 'CLICK', { 
           text: text.substring(0, 50), 
           tag: target.tagName,
           x: e.clientX,
           y: e.clientY 
        });
      }
    };

    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [user]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'pastel');
  }, []);

  useEffect(() => {
    if (!state.loading) {
      setLoadingStepIndex(0);
      return;
    }

    const msg = state.loadingMessage.trim();
    const stepCount =
      /analyz|slide/i.test(msg) ? 3 : setupLoadingSteps.length;

    const interval = setInterval(() => {
      setLoadingStepIndex((prev) => (prev + 1) % stepCount);
    }, 2500);
    return () => clearInterval(interval);
  }, [state.loading, state.loadingMessage, setupLoadingSteps.length]);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    dbService.logout();
    setUser(null);
    restart();
  };

  const handleApiError = (error: any) => {
    console.error("AI API Error:", error);
    const details =
      typeof error?.message === 'string' && error.message.trim().length > 0
        ? error.message.trim()
        : '';

    const isQuotaError =
      error?.status === 429 ||
      error?.code === 429 ||
      error?.message?.includes('429') ||
      error?.message?.toLowerCase().includes('quota') ||
      error?.status === 'RESOURCE_EXHAUSTED';

    const isTimeout =
      /timed out after \d+ms/i.test(details) ||
      error?.name === 'AbortError';

    let next: AppError = {
      title: 'The AI service did not respond',
      message: 'Try again in a moment. If it keeps failing, generate fewer questions.',
    };

    if (isQuotaError) {
      next = {
        title: 'AI rate limit reached',
        message: 'The service is busy or the quota is used up. Wait a minute, then try again.',
      };
    } else if (isTimeout) {
      const isServerQuizTimeout = /gemini quiz|openai quiz|quiz.*timed out/i.test(details);
      next = {
        title: 'Generation took too long',
        message: import.meta.env.DEV
          ? isServerQuizTimeout
            ? 'Quiz text generation timed out on the server. Raise GENAI_QUIZ_TIMEOUT_MS in .env (for example 300000) or try fewer questions, then restart npm run dev.'
            : 'Try fewer questions, set VITE_IMAGE_SELF_VALIDATION=false, or raise VITE_QUIZ_GEN_TIMEOUT_MS / GENAI_QUIZ_TIMEOUT_MS in .env, then restart the dev server.'
          : 'Try again with fewer questions.',
      };
    }

    if (import.meta.env.DEV && details && !isQuotaError) {
      next = { ...next, message: `${next.message}\n\nDetails: ${details}` };
    }

    setAppError(next);
    setState(prev => ({ ...prev, loading: false }));
  };

  const handleGenerateQuiz = async (standard: Standard, config: QuizConfig) => {
    // Log Activity
    if (user) {
      dbService.logAction(user.id, 'QUIZ_GENERATE_START', { standard: standard.code, mode: config.mode });
    }

    setAppError(null);
    setState((prev) => ({
      ...prev,
      loading: true,
      loadingMessage: '',
      selectedStandard: standard,
      currentGenerationId: null,
      gapAnalysisId: null,
    }));

    try {
      const quiz = await generateQuiz(standard, config);

      let currentGenerationId: string | null = null;
      const genLog = await logAiQuizGeneration({
        userId: user?.id ?? null,
        standard,
        config,
        quiz,
        providerMetadata: quiz.providerMetadata,
        sessionMetadata: {
          adaptiveEnabled: Boolean(config.adaptiveEnabled),
          adaptivePolicy: config.adaptivePolicy || null,
          sourcePolicy: config.sourcePolicy || null,
          generatedAt: new Date().toISOString(),
        },
      });
      currentGenerationId = genLog.generationId;
      if (!genLog.generationId && genLog.error && import.meta.env.DEV) {
        setState((prev) => ({
          ...prev,
          telemetryNotice: `Quiz telemetry (generation): ${genLog.error}`,
        }));
      }

      setState((prev) => ({
        ...prev,
        loading: false,
        quiz,
        view: 'quiz',
        quizResults: [],
        currentGenerationId,
        gapAnalysisId: null,
      }));
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleQuizComplete = async (results: QuizResult[]) => {
    if (!state.quiz || !state.selectedStandard) return;
    
    // Save to DB
    if (user) {
      dbService.saveQuizAttempt(user.id, state.quiz, results);
    }

    if (state.currentGenerationId) {
      try {
        const adaptivePath = results
          .filter((result) => Boolean(result.nextDifficulty))
          .map((result) => ({
            from: String(result.difficulty),
            to: String(result.nextDifficulty),
            reason: result.adaptiveDecisionReason || 'none',
            changed: Boolean(result.difficultyChanged),
          }));
        const att = await logAiQuizAttempt(state.currentGenerationId, results, user?.id ?? null, {
          adaptiveEnabled: Boolean(state.quiz.config.adaptiveEnabled),
          adaptivePath,
          attemptMetadata: {
            questionCount: results.length,
            completedAt: new Date().toISOString(),
          },
        });
        if (!att.ok && att.error && import.meta.env.DEV) {
          setState((prev) => ({
            ...prev,
            telemetryNotice: `Quiz telemetry (attempt): ${att.error}`,
          }));
        }
      } catch (e) {
        console.error('Could not persist quiz attempt to Supabase:', e);
      }
    }

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      loadingMessage: 'Analyzing Performance & Identifying Gaps...', 
      quizResults: results 
    }));

    try {
      const analysis = await analyzeGaps(state.selectedStandard, state.quiz.questions, results);
      let gapAnalysisId: string | null = null;
      if (user && state.currentGenerationId) {
        const saved = await saveGapAnalysisToServer({
          userId: user.id,
          sessionId: state.currentGenerationId,
          standardCode: state.selectedStandard.code,
          analysis,
        });
        if (saved.ok === false) {
          if (import.meta.env.DEV) {
            console.warn("[telemetry] gap analysis save failed", saved.error);
          }
        } else {
          gapAnalysisId = saved.id;
        }
      }
      setState((prev) => ({
        ...prev,
        loading: false,
        analysis,
        view: 'analysis',
        gapAnalysisId,
      }));
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleStartRemediation = async () => {
    if (!state.analysis || !state.selectedStandard) return;

    if (user) {
      dbService.logAction(user.id, 'REMEDIAL_START', { standard: state.selectedStandard.code });
    }

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      loadingMessage: 'Creating Personalized Learning Slides...' 
    }));

    try {
      const slides = await generateRemedialSlides(
        state.selectedStandard,
        state.analysis,
        state.quiz?.questions ?? [],
        state.quizResults,
      );
      if (user && state.gapAnalysisId) {
        const rem = await saveRemediationSlidesToServer({
          userId: user.id,
          gapAnalysisId: state.gapAnalysisId,
          slides,
        });
        if (rem.ok === false && import.meta.env.DEV) {
          console.warn("[telemetry] remediation slides save failed", rem.error);
        }
      }
      setState((prev) => ({
        ...prev,
        loading: false,
        slides,
        view: 'remedial',
      }));
    } catch (error) {
      handleApiError(error);
    }
  };

  const restart = () => {
    if (user) {
      dbService.logAction(user.id, 'VIEW_HOME', {});
    }
    setAppError(null);
    setState({
      view: 'setup',
      selectedStandard: null,
      quiz: null,
      quizResults: [],
      analysis: null,
      slides: [],
      loading: false,
      loadingMessage: '',
      currentGenerationId: null,
      gapAnalysisId: null,
      telemetryNotice: null,
    });
  };

  // --- Dev-only fixture gallery (#/dev/visuals) ---
  if (import.meta.env.DEV && hashRoute === '#/dev/visuals') {
    return (
      <React.Suspense fallback={<div style={{ padding: 24 }}>Loading visual gallery…</div>}>
        <VisualGalleryRoute />
      </React.Suspense>
    );
  }

  if (import.meta.env.DEV && hashRoute.startsWith('#/dev/screens')) {
    return (
      <React.Suspense fallback={<div style={{ padding: 24 }}>Loading screens…</div>}>
        <ScreensGalleryRoute route={hashRoute} />
      </React.Suspense>
    );
  }

  if (import.meta.env.DEV && (hashRoute === '#/dev/diagrams' || hashRoute === '#/dev/hairlines')) {
    return (
      <React.Suspense fallback={<div style={{ padding: 24 }}>Loading diagrams…</div>}>
        <DiagramsGalleryRoute />
      </React.Suspense>
    );
  }

  // --- Auth Gate ---
  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-dvh flex flex-col font-sans app-shell-bg" style={{ color: 'var(--text-primary)' }}>
      <a href="#main-content" className="app-skip-link">
        Skip to main content
      </a>
      <header className="app-shell-header sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            type="button"
            className="flex items-center gap-2.5 rounded-xl"
            onClick={restart}
            aria-label="Math Architect, go to studio home"
          >
            <BrandMark />
          </button>

          <div className="flex items-center gap-3">
            {state.selectedStandard && state.view !== 'setup' && (
              <span className="app-shell-standard hidden sm:inline-block" translate="no">
                {state.selectedStandard.code}
              </span>
            )}

            <div className="app-shell-userchip">
              <span className="app-shell-avatar" aria-hidden="true">
                <UserRound className="w-3.5 h-3.5" strokeWidth={1.75} />
              </span>
              <span className="text-sm font-semibold hidden sm:block pr-1" style={{ color: 'var(--text-primary)' }}>
                {user.fullName || user.username}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="app-shell-icon-btn"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full outline-none"
      >
        {(appError || (import.meta.env.DEV && state.telemetryNotice)) && (
          <div className="space-y-2 mb-4" aria-live="polite">
            {appError && (
              <div className="studio-alert studio-alert--danger studio-alert--stack" role="alert">
                <div className="studio-alert-body">
                  <strong className="studio-alert-title">{appError.title}</strong>
                  {appError.message}
                </div>
                <button type="button" onClick={() => setAppError(null)}>
                  Dismiss
                </button>
              </div>
            )}
            {import.meta.env.DEV && state.telemetryNotice && (
              <div className="studio-alert" role="status">
                <span className="studio-alert-body">{state.telemetryNotice}</span>
                <button type="button" onClick={() => setState((prev) => ({ ...prev, telemetryNotice: null }))}>
                  Dismiss
                </button>
              </div>
            )}
          </div>
        )}
        <AnimatePresence mode="wait">
          {state.loading ? (
            <motion.div
              key="loading"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoadingStage
                message={
                  state.loadingMessage.trim()
                    ? state.loadingMessage
                    : setupLoadingSteps[loadingStepIndex].text
                }
                steps={setupLoadingSteps}
                stepIndex={loadingStepIndex}
              />
            </motion.div>
          ) : (
            <motion.div
              key={state.view}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {state.view === 'setup' && (
                <QuizGenerator onGenerate={handleGenerateQuiz} isLoading={state.loading} />
              )}

              {state.view === 'quiz' && state.quiz && (
                <QuizTaker quiz={state.quiz} onComplete={handleQuizComplete} onHome={restart} />
              )}

              {state.view === 'analysis' && state.analysis && (
                <GapAnalysisComponent 
                  analysis={state.analysis} 
                  onStartRemediation={handleStartRemediation} 
                  isLoadingSlides={state.loading} 
                />
              )}

              {state.view === 'remedial' && (
                <RemedialSlides slides={state.slides} onRestart={restart} onHome={restart} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;