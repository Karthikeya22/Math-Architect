import React, { useState, useEffect } from 'react';
import { GradeLevel, Standard, QuizMode, Difficulty, QuizConfig, TopicNode } from '../types';
import { FLORIDA_STANDARDS, TOPIC_TREE } from '../constants';
import { dbService } from '../services/dbService';
import { Sparkles, ChevronDown, Database, Settings2, Menu, Filter, ArrowRight } from 'lucide-react';
import TopicSidebar from './TopicSidebar';
import { StandardDropdown } from './StandardDropdown';

interface Props {
  onGenerate: (standard: Standard, config: QuizConfig) => void;
  isLoading: boolean;
}

const QuizGenerator: React.FC<Props> = ({ onGenerate, isLoading }) => {
  // Modes
  const [quizMode, setQuizMode] = useState<QuizMode>('item-bank');
  
  // Standard Mode State
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel | ''>('');
  const [selectedStandardCode, setSelectedStandardCode] = useState<string>('');
  
  // Topic Mode State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<TopicNode | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);

  // Configuration State
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  
  // Advanced Config State
  const [config, setConfig] = useState({
    questionTypes: {
      multipleChoice: true,
      trueFalse: false,
      fillInBlank: false
    },
    focusAreas: {
      wordProblems: true,
      visualQuestions: true,
      realWorld: false
    }
  });

  // Derived
  const filteredStandards = FLORIDA_STANDARDS.filter(s => s.grade === selectedGrade);
  const selectedStandard = FLORIDA_STANDARDS.find(s => s.code === selectedStandardCode);

  // Handlers
  const handleTopicSelect = (node: TopicNode, path: string[]) => {
     setSelectedTopic(node);
     setBreadcrumbs(path);
     
     // Log Topic Selection to DB
     const user = dbService.getCurrentUser();
     if (user) {
        dbService.logAction(user.id, 'TOPIC_SELECT', { topic: node.title, path: path.join('>') });
     }
  };

  const handleGenerate = () => {
    const finalConfig: QuizConfig = {
      questionCount,
      difficulty,
      mode: quizMode,
      questionTypes: config.questionTypes,
      focusAreas: config.focusAreas
    };

    if (quizMode === 'item-bank' && selectedStandard) {
      onGenerate(selectedStandard, finalConfig);
    } else if (quizMode === 'item-bank' && !selectedStandard) {
      alert('Please select a grade and a standard first.');
    } else if (quizMode === 'topic-based' && selectedTopic) {
      // 1. Determine Grade Level from Breadcrumbs (Root level is always Grade)
      const gradeStr = breadcrumbs[0];
      const detectedGrade = Object.values(GradeLevel).find(g => g === gradeStr) || GradeLevel.G4;

      // 2. Determine Standard Code or Create a Custom Topic Code
      const safeTitle = selectedTopic.title.replace(/[^a-zA-Z0-9]/g, '').substring(0, 5).toUpperCase();
      const standardCode = selectedTopic.associatedStandards?.[0] || `MA.TOPIC.${safeTitle}`;

      // 3. Construct the Standard Object with EXPLICIT Context
      const mappedStandard: Standard = FLORIDA_STANDARDS.find(s => s.code === standardCode) || {
        code: standardCode,
        grade: detectedGrade,
        description: `Assessment on ${selectedTopic.title}`,
        clarifications: [
           `Subject: K-12 Mathematics`,
           `Target Grade: ${gradeStr}`,
           `Topic Hierarchy: ${breadcrumbs.join(' > ')}`,
           `Ensure questions are strictly aligned to ${gradeStr} math curriculum.`
        ]
      };

      onGenerate(mappedStandard, finalConfig);
    } else if (quizMode === 'topic-based' && !selectedTopic) {
      alert('Please select a topic from the sidebar first.');
    }
  };

  useEffect(() => {
    if (quizMode === 'topic-based') {
       setIsSidebarOpen(true);
    }
  }, [quizMode]);

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50 relative -mx-4 sm:-mx-6 lg:-mx-8 -my-8">
      
      {/* Sidebar (Only visible in Topic Mode) */}
      {quizMode === 'topic-based' && (
        <TopicSidebar 
          data={TOPIC_TREE} 
          isOpen={isSidebarOpen} 
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          selectedNodeId={selectedTopic?.id || null}
          onSelect={handleTopicSelect}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full p-6 lg:p-10 space-y-8">
          
          {/* Header & Mode Switcher */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
             <div>
                <h1 className="text-3xl font-bold text-slate-900">New Assessment</h1>
                <p className="text-slate-500 mt-1">Configure parameters to generate your quiz</p>
             </div>
             
             <div className="bg-white p-1 rounded-xl border border-slate-200 flex shadow-sm">
                <button
                  onClick={() => setQuizMode('item-bank')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    quizMode === 'item-bank' 
                      ? 'bg-emerald-100 text-emerald-700 shadow-sm' 
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  Item Bank
                </button>
                <button
                  onClick={() => setQuizMode('topic-based')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    quizMode === 'topic-based' 
                      ? 'bg-blue-100 text-blue-700 shadow-sm' 
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Topic AI
                </button>
             </div>
          </div>

          {/* Mobile Sidebar Toggle */}
          {quizMode === 'topic-based' && (
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden flex items-center gap-2 text-blue-600 font-bold bg-blue-50 px-4 py-2 rounded-lg w-fit"
            >
               <Menu className="w-4 h-4" />
               Browse Topics
            </button>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             
             {/* Left Col: Context Selection */}
             <div className="lg:col-span-7 space-y-6">
                
                {/* Standard Mode Selection UI */}
                {quizMode === 'item-bank' && (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 animate-fade-in">
                      <div className="flex items-center gap-2 mb-2">
                         <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm">1</span>
                         <h3 className="font-bold text-lg text-slate-800">Select Standard</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Grade</label>
                          <select 
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                            value={selectedGrade}
                            onChange={(e) => {
                              setSelectedGrade(e.target.value as GradeLevel);
                              setSelectedStandardCode('');
                            }}
                          >
                            <option value="">Select...</option>
                            {Object.values(GradeLevel).map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                        </div>
                        <div>
                           <label className="block text-sm font-semibold text-slate-700 mb-2">Standard</label>
                           <StandardDropdown 
                            standards={filteredStandards}
                            value={selectedStandardCode}
                            onChange={(code) => setSelectedStandardCode(code)}
                            disabled={!selectedGrade}
                          />
                        </div>
                      </div>

                      {selectedStandard && (
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                           <h4 className="font-bold text-emerald-900 mb-1">{selectedStandard.code}</h4>
                           <p className="text-sm text-emerald-800">{selectedStandard.description}</p>
                        </div>
                      )}
                  </div>
                )}

                {/* Topic Mode Selection Feedback UI */}
                {quizMode === 'topic-based' && (
                   <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4 animate-fade-in min-h-[200px]">
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                         <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">1</span>
                         <h3 className="font-bold text-lg text-slate-800">Selected Topic</h3>
                      </div>

                      {selectedTopic ? (
                        <div>
                           <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                              {breadcrumbs.map((b, i) => (
                                <React.Fragment key={i}>
                                   <span>{b}</span>
                                   {i < breadcrumbs.length - 1 && <ChevronDown className="w-3 h-3 -rotate-90" />}
                                </React.Fragment>
                              ))}
                           </div>
                           <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedTopic.title}</h2>
                           <p className="text-slate-600">AI will generate a unique quiz based on this concept.</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                           <ArrowRight className="w-8 h-8 mb-2 opacity-50" />
                           <p>Select a topic from the sidebar to begin</p>
                        </div>
                      )}
                   </div>
                )}
             </div>

             {/* Right Col: Configuration */}
             <div className="lg:col-span-5 space-y-6">
                <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6 transition-all duration-300 ${(!selectedStandardCode && !selectedTopic) ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                   
                   <div className="flex items-center gap-2 mb-2">
                       <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${quizMode === 'item-bank' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>2</span>
                       <h3 className="font-bold text-lg text-slate-800">Configuration</h3>
                   </div>

                   {/* Question Count */}
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-3">Number of Questions</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[5, 10, 15, 20].map(count => (
                          <button
                            key={count}
                            onClick={() => setQuestionCount(count)}
                            className={`py-2 rounded-lg font-bold border transition-all ${
                              questionCount === count 
                                ? 'border-slate-800 bg-slate-800 text-white' 
                                : 'border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {count}
                          </button>
                        ))}
                      </div>
                   </div>

                   {/* Difficulty */}
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-3">Difficulty Level</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(level => (
                          <button
                            key={level}
                            onClick={() => setDifficulty(level)}
                            className={`py-2 rounded-lg font-bold border transition-all ${
                              difficulty === level 
                                ? 'border-indigo-500 bg-indigo-50 text-indigo-700' 
                                : 'border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                   </div>

                   {/* Advanced Filters (Topic Mode Only) */}
                   {quizMode === 'topic-based' && (
                     <>
                        <div className="h-px bg-slate-100" />
                        <div>
                           <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                              <Filter className="w-4 h-4" /> Focus Areas
                           </label>
                           <div className="flex flex-wrap gap-2">
                              {Object.entries(config.focusAreas).map(([key, val]) => (
                                 <button
                                    key={key}
                                    onClick={() => setConfig({...config, focusAreas: {...config.focusAreas, [key]: !val} as any})}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                       val 
                                       ? 'bg-blue-100 text-blue-700 border-blue-200' 
                                       : 'bg-slate-50 text-slate-500 border-slate-200'
                                    }`}
                                 >
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                 </button>
                              ))}
                           </div>
                        </div>
                     </>
                   )}

                   <button
                      onClick={handleGenerate}
                      disabled={isLoading}
                      className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 mt-4"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Settings2 className="w-5 h-5" />
                          <span>Generate Assessment</span>
                        </>
                      )}
                    </button>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizGenerator;