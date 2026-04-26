import React, { useState, useEffect } from 'react';
import { AppState, Standard, Quiz, QuizResult, GapAnalysis, RemedialSlide, QuizConfig, User } from './types';
import { generateQuiz, analyzeGaps, generateRemedialSlides } from './services/aiService';
import { dbService } from './services/dbService';
import QuizGenerator from './components/QuizGenerator';
import QuizTaker from './components/QuizTaker';
import GapAnalysisComponent from './components/GapAnalysis';
import RemedialSlides from './components/RemedialSlides';
import AuthScreen from './components/AuthScreen';
import { GraduationCap, LogOut, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<AppState>({
    view: 'setup',
    selectedStandard: null,
    quiz: null,
    quizResults: [],
    analysis: null,
    slides: [],
    loading: false,
    loadingMessage: '',
  });

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
    let message = "An error occurred while communicating with the AI service.";
    
    const isQuotaError = 
      error?.status === 429 || 
      error?.code === 429 || 
      error?.message?.includes('429') || 
      error?.message?.toLowerCase().includes('quota') ||
      error?.status === 'RESOURCE_EXHAUSTED';

    if (isQuotaError) {
      message = "⚠️ API Rate Limit Exceeded. The system is busy or you have hit your quota. Please wait a moment and try again.";
    }

    alert(message);
    setState(prev => ({ ...prev, loading: false }));
  };

  const handleGenerateQuiz = async (standard: Standard, config: QuizConfig) => {
    const modeLabel = config.mode === 'item-bank' ? 'Fetching Bank Items...' : 'Generating AI Questions...';
    
    // Log Activity
    if (user) {
      dbService.logAction(user.id, 'QUIZ_GENERATE_START', { standard: standard.code, mode: config.mode });
    }

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      loadingMessage: modeLabel, 
      selectedStandard: standard 
    }));

    try {
      const quiz = await generateQuiz(standard, config);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        quiz, 
        view: 'quiz',
        quizResults: [] // reset results
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

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      loadingMessage: 'Analyzing Performance & Identifying Gaps...', 
      quizResults: results 
    }));

    try {
      const analysis = await analyzeGaps(state.selectedStandard, state.quiz.questions, results);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        analysis, 
        view: 'analysis' 
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
      const slides = await generateRemedialSlides(state.selectedStandard, state.analysis);
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        slides, 
        view: 'remedial' 
      }));
    } catch (error) {
      handleApiError(error);
    }
  };

  const restart = () => {
    if (user) {
      dbService.logAction(user.id, 'VIEW_HOME', {});
    }
    setState({
      view: 'setup',
      selectedStandard: null,
      quiz: null,
      quizResults: [],
      analysis: null,
      slides: [],
      loading: false,
      loadingMessage: '',
    });
  };

  // --- Auth Gate ---
  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 cursor-pointer" 
            onClick={restart}
          >
            <div className="bg-blue-600 p-2 rounded-lg">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 hidden md:block">
              Florida B.E.S.T. Math Architect
            </h1>
            <h1 className="text-xl font-bold text-blue-700 md:hidden">Math Architect</h1>
          </motion.div>
          
          <div className="flex items-center gap-4">
             {state.selectedStandard && (
              <div className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full hidden sm:block">
                {state.selectedStandard.code}
              </div>
             )}
             
             <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>
             
             <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <UserIcon className="w-4 h-4" />
                   </div>
                   <span className="text-sm font-bold text-slate-700 hidden sm:block">{user.fullName || user.username}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <AnimatePresence mode="wait">
          {state.loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-[60vh]"
            >
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{state.loadingMessage}</h2>
              <p className="text-slate-500">Powered by Gemini AI</p>
            </motion.div>
          ) : (
            <motion.div
              key={state.view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {state.view === 'setup' && (
                <QuizGenerator onGenerate={handleGenerateQuiz} isLoading={state.loading} />
              )}

              {state.view === 'quiz' && state.quiz && (
                <QuizTaker quiz={state.quiz} onComplete={handleQuizComplete} />
              )}

              {state.view === 'analysis' && state.analysis && (
                <GapAnalysisComponent 
                  analysis={state.analysis} 
                  onStartRemediation={handleStartRemediation} 
                  isLoadingSlides={state.loading} 
                />
              )}

              {state.view === 'remedial' && (
                <RemedialSlides slides={state.slides} onRestart={restart} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;