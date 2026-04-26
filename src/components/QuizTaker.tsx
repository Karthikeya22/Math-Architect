import React, { useState, useEffect } from 'react';
import { Quiz, QuizResult, Difficulty } from '../types';
import { dbService } from '../services/dbService';
import { CheckCircle, XCircle, ArrowRight, Clock, Image as ImageIcon, Gauge } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  quiz: Quiz;
  onComplete: (results: QuizResult[]) => void;
}

const QuizTaker: React.FC<Props> = ({ quiz, onComplete }) => {
  // --- State Management ---
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Use questions directly from quiz prop - no adaptive fetching
  const questions = quiz.questions;
  const question = questions[currentQuestionIdx];

  useEffect(() => {
    setStartTime(Date.now());
  }, [currentQuestionIdx]);

  // --- Logic ---

  const handleSelect = (idx: number) => {
    if (showFeedback) return;
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;

    const timeTaken = (Date.now() - startTime) / 1000;
    const isCorrect = selectedOption === question.correctAnswerIndex;

    const result: QuizResult = {
      questionIndex: currentQuestionIdx,
      selectedOptionIndex: selectedOption,
      isCorrect,
      timeTaken,
      difficulty: question.difficulty
    };
    
    // Log Answer
    const user = dbService.getCurrentUser();
    if (user) {
      dbService.logAction(user.id, 'QUESTION_ANSWER', { 
        qId: question.id, 
        correct: isCorrect, 
        time: timeTaken 
      });
    }

    const newResults = [...results, result];
    setResults(newResults);
    setShowFeedback(true);
  };

  const handleNext = () => {
    // Check against the actual number of generated questions, in case the AI generated fewer than config
    const isLastQuestion = results.length >= quiz.questions.length;
    
    if (isLastQuestion) {
      onComplete(results);
    } else {
      setCurrentQuestionIdx(curr => Math.min(curr + 1, quiz.questions.length - 1));
      setSelectedOption(null);
      setShowFeedback(false);
    }
  };

  // --- Rendering ---
  
  if (!question) {
    return (
      <div className="max-w-3xl mx-auto p-8 bg-white rounded-2xl shadow-xl flex flex-col items-center justify-center">
         <XCircle className="w-12 h-12 text-red-500 mb-4" />
         <h2 className="text-xl font-bold text-slate-800">Error Loading Question</h2>
         <p className="text-slate-500 text-sm">We couldn't find the question data. Please end the practice and try again.</p>
         <button onClick={() => onComplete(results)} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg">End Practice</button>
      </div>
    );
  }

  const processSVG = (svgString: string | undefined) => {
    if (!svgString) return null;
    let processed = svgString;
    
    // Strip markdown wrappers (e.g., ```xml, ```svg, ```html, or just ```)
    processed = processed.replace(/```(?:xml|svg|html)?\n?/gi, '').replace(/```/g, '').trim();

    // Ensure the SVG starts cleanly and has a viewBox if possible
    if (!processed.includes('viewBox') && processed.includes('<svg')) {
      // Add a fallback viewBox if the AI missed it
      processed = processed.replace('<svg', '<svg viewBox="0 0 400 250"');
    }

    if (!processed.includes('preserveAspectRatio')) {
      processed = processed.replace('<svg', '<svg preserveAspectRatio="xMidYMid meet"');
    }
    
    // Remove hardcoded width/height to make it responsive
    processed = processed.replace(/\s(width|height)=["'][^"']*["']/g, '');
    
    // Add default properties for proper responsive scaling without distortion
    if (!processed.includes('preserveAspectRatio')) {
      processed = processed.replace('<svg', '<svg preserveAspectRatio="xMidYMid meet"');
    }
    
    // Add Tailwind classes to the SVG tag for proper scaling and centering
    processed = processed.replace('<svg', '<svg style="width: 100%; height: 100%; max-height: 300px;" class="drop-shadow-md text-blue-600"');
    
    // Give a default stroke to paths if AI generated invisible lines
    if (!processed.includes('stroke=') && !processed.includes('fill=')) {
       processed = processed.replace(/<path /g, '<path stroke="currentColor" fill="none" strokeWidth="2" ');
    }

    return processed;
  };

  const progress = ((currentQuestionIdx) / quiz.questions.length) * 100;

  // Get Difficulty Color
  const getDiffColor = (d: Difficulty) => {
    switch(d) {
      case 'Easy': return 'text-green-600 bg-green-50 border-green-200';
      case 'Medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Hard': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="w-full bg-slate-200 h-2 rounded-full mb-8 overflow-hidden">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden min-h-[500px] flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
            Question {currentQuestionIdx + 1} of {quiz.questions.length}
          </span>
          <div className="flex items-center gap-3">
             <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${getDiffColor(question.difficulty)}`}>
                <Gauge className="w-3.5 h-3.5" />
                {question.difficulty}
             </div>
             <span className="text-sm font-medium text-slate-400 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Standard: {quiz.standardCode}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 flex-1">
          <h3 className="text-2xl font-extrabold text-slate-800 mb-8 leading-snug tracking-tight">
            {question.text}
          </h3>

          {/* Question Visual */}
          {(question.generatedImageBase64 || question.visual) && (
            <div className="mb-10 p-6 bg-white rounded-2xl border-2 border-slate-100 shadow-sm flex flex-col items-center">
               <div className="flex items-center gap-2 mb-4 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <ImageIcon className="w-4 h-4" />
                  <span>Visual Reference</span>
               </div>
               
               {question.generatedImageBase64 ? (
                  <div className="w-full max-w-lg rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <img src={question.generatedImageBase64} alt="Question Visual" className="w-full h-auto object-cover" />
                  </div>
               ) : (
                  <div
                    className="w-full max-w-lg aspect-[16/9] flex items-center justify-center overflow-hidden svg-visual-container"
                    dangerouslySetInnerHTML={{ __html: processSVG(question.visual || '') || '' }}
                  />
               )}
            </div>
          )}

          <motion.div 
            className="space-y-4"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } },
              hidden: {}
            }}
          >
            {question.options.map((option, idx) => {
              let btnClass = "w-full p-4 rounded-xl border-2 text-left transition-all relative flex items-center justify-between ";
              
              if (showFeedback) {
                if (idx === question.correctAnswerIndex) {
                  btnClass += "border-green-500 bg-green-50 text-green-800";
                } else if (idx === selectedOption && idx !== question.correctAnswerIndex) {
                   btnClass += "border-red-500 bg-red-50 text-red-800";
                } else {
                  btnClass += "border-slate-100 text-slate-400 opacity-50";
                }
              } else {
                if (selectedOption === idx) {
                  btnClass += "border-blue-600 bg-blue-50 text-blue-900 shadow-md ring-2 ring-blue-100";
                } else {
                  btnClass += "border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-700";
                }
              }

              return (
                <motion.button
                  key={`${currentQuestionIdx}-${idx}`}
                  variants={{
                    hidden: { opacity: 0, x: -10 },
                    visible: { opacity: 1, x: 0 }
                  }}
                  whileHover={!showFeedback ? { scale: 1.01, x: 5 } : {}}
                  whileTap={!showFeedback ? { scale: 0.99 } : {}}
                  onClick={() => handleSelect(idx)}
                  className={btnClass}
                  disabled={showFeedback}
                >
                  <span className="font-medium text-lg">{String.fromCharCode(65 + idx)}. {option}</span>
                  <AnimatePresence>
                    {showFeedback && idx === question.correctAnswerIndex && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </motion.div>
                    )}
                    {showFeedback && idx === selectedOption && idx !== question.correctAnswerIndex && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <XCircle className="w-6 h-6 text-red-600" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </motion.div>

          {showFeedback && (
            <div className="mt-8 animate-fade-in">
              <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                <h4 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                  Explanation
                </h4>
                <p className="text-indigo-800 leading-relaxed mb-4">{question.explanation}</p>
                
                <div className="bg-white p-4 rounded-lg border border-indigo-100">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1 block">Visual Concept</span>
                  <p className="text-sm text-slate-600 italic">
                    "{question.animationDescription}"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          {!showFeedback ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedOption === null}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none transition-all"
            >
              Check Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:bg-indigo-700 flex items-center gap-2 transition-all"
            >
              {results.length >= quiz.config.questionCount ? "Finish Quiz" : "Next Question"}
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizTaker;