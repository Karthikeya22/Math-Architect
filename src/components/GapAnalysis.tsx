import React from 'react';
import { GapAnalysis as GapAnalysisType, GapType } from '../types';
import { AlertTriangle, Brain, Calculator, Wrench, BarChart2, BookOpen, Target, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

interface Props {
  analysis: GapAnalysisType;
  onStartRemediation: () => void;
  isLoadingSlides: boolean;
}

const GapAnalysis: React.FC<Props> = ({ analysis, onStartRemediation, isLoadingSlides }) => {
  const getIcon = (type: GapType) => {
    switch (type) {
      case GapType.Conceptual: return <Brain className="w-6 h-6 text-purple-600" />;
      case GapType.Procedural: return <Wrench className="w-6 h-6 text-orange-600" />;
      case GapType.Computational: return <Calculator className="w-6 h-6 text-red-600" />;
      default: return <AlertTriangle className="w-6 h-6 text-slate-600" />;
    }
  };

  const getColor = (type: GapType) => {
    switch (type) {
      case GapType.Conceptual: return "bg-purple-50 border-purple-100 text-purple-900";
      case GapType.Procedural: return "bg-orange-50 border-orange-100 text-orange-900";
      case GapType.Computational: return "bg-red-50 border-red-100 text-red-900";
      default: return "bg-slate-50 border-slate-100 text-slate-900";
    }
  };

  const getScoreColor = (correct: number, total: number) => {
    const percentage = correct / total;
    if (percentage >= 0.8) return 'text-green-600';
    if (percentage >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (correct: number, total: number) => {
    const percentage = correct / total;
    if (percentage >= 0.8) return 'bg-green-500';
    if (percentage >= 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Determine confidence level properties
  const getConfidenceLevel = (score: number) => {
    if (score >= 85) return { 
      label: "High Reliability", 
      color: "text-emerald-600", 
      bg: "bg-emerald-50",
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      description: "Consistent error patterns detected. The AI is highly certain about the diagnosed gaps." 
    };
    if (score >= 60) return { 
      label: "Medium Reliability", 
      color: "text-amber-600", 
      bg: "bg-amber-50",
      icon: <Info className="w-4 h-4 text-amber-600" />,
      description: "Some patterns identified, but errors varied. Remediation is recommended to clarify understanding." 
    };
    return { 
      label: "Low Reliability", 
      color: "text-slate-500", 
      bg: "bg-slate-50",
      icon: <AlertTriangle className="w-4 h-4 text-slate-500" />,
      description: "Errors appear random or due to guessing. The specific gap diagnosis requires more data." 
    };
  };

  const confidence = getConfidenceLevel(analysis.confidenceScore);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (analysis.confidenceScore / 100) * circumference;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Learning Gap Analysis</h2>
        <p className="text-slate-500">AI-Diagnosis based on your quiz performance for standard {analysis.standardCode}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Expanded Confidence Score Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center relative overflow-hidden group">
          <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-slate-200 via-blue-500 to-slate-200 opacity-50"></div>
          
          <div className="relative w-28 h-28 mb-4 group-hover:scale-105 transition-transform duration-300">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="56" cy="56" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
              <circle cx="56" cy="56" r={radius} stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="text-blue-600 transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900">{analysis.confidenceScore}%</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Reliability</span>
            </div>
          </div>
          
          <div className={`flex items-center gap-2 mb-3 px-3 py-1 rounded-full ${confidence.bg}`}>
            {confidence.icon}
            <h3 className={`text-sm font-bold uppercase tracking-wider ${confidence.color}`}>
              {confidence.label}
            </h3>
          </div>
        </div>
        
        <div className="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-500" />
            Performance Summary
          </h3>
          <p className="text-slate-600 leading-relaxed text-lg">{analysis.summary}</p>
        </div>
      </div>

      {/* Sub-skills Section */}
      {analysis.subSkills && analysis.subSkills.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-500" />
            Skill Breakdown
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analysis.subSkills.map((skill, idx) => (
              <div key={idx} className="bg-slate-50 p-5 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-slate-700">{skill.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{skill.description}</p>
                  </div>
                  <span className={`text-lg font-bold ${getScoreColor(skill.correctCount, skill.totalCount)}`}>
                    {skill.correctCount}/{skill.totalCount}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${getProgressBarColor(skill.correctCount, skill.totalCount)} transition-all duration-1000`}
                    style={{ width: `${(skill.correctCount / skill.totalCount) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          Diagnosed Learning Gaps
        </h3>
        
        {analysis.identifiedGaps.length === 0 ? (
          <div className="p-8 bg-green-50 rounded-2xl border border-green-100 text-center">
            <p className="text-green-800 font-medium text-lg">No significant gaps identified! Great job mastering this standard.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {analysis.identifiedGaps.map((gap, idx) => (
              <div key={idx} className={`p-6 rounded-2xl border flex flex-col md:flex-row gap-4 ${getColor(gap.gapType)}`}>
                <div className="flex-shrink-0 mt-1">
                   <div className="bg-white/80 p-3 rounded-full h-fit shadow-sm backdrop-blur-sm">
                    {getIcon(gap.gapType)}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h4 className="font-bold text-lg">{gap.gapType}</h4>
                    {gap.relatedQuestions.map(qIdx => (
                      <span key={qIdx} className="px-2 py-0.5 bg-white/60 rounded text-xs font-bold uppercase tracking-wide border border-black/5">
                        Q{qIdx + 1}
                      </span>
                    ))}
                  </div>
                  <p className="opacity-90 mb-4 leading-relaxed">{gap.description}</p>
                  
                  {gap.misconception && (
                    <div className="bg-white/60 p-4 rounded-xl border border-black/5">
                      <span className="text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-1 mb-1">
                        <AlertTriangle className="w-3 h-3" />
                        Detected Misconception
                      </span>
                      <p className="font-medium italic">"{gap.misconception}"</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-center pt-8 pb-12">
        <button
          onClick={onStartRemediation}
          disabled={isLoadingSlides || analysis.identifiedGaps.length === 0}
          className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-10 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transform transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed flex items-center gap-3 border border-emerald-400/20"
        >
          {isLoadingSlides ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Building Personalized Lesson Plan...
            </>
          ) : (
            <>
              <BookOpen className="w-6 h-6" />
              Generate Remedial Slides
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default GapAnalysis;