import React from 'react';
import { GapAnalysis as GapAnalysisType, GapType } from '../types';
import {
  AlertTriangle,
  Brain,
  Calculator,
  Wrench,
  BarChart2,
  BookOpen,
  Target,
  ListChecks,
  Route,
  FileSearch,
  CheckCircle2,
  XCircle,
  Users,
  User,
  Gauge,
} from 'lucide-react';
import { StandardPracticeLinks } from './StandardPracticeLinks';
import { MotionDiagram } from './motion-diagrams';
import { MathHtml } from './MathHtml';

interface Props {
  analysis: GapAnalysisType;
  onStartRemediation: () => void;
  isLoadingSlides: boolean;
}

const DIFFICULTY_ROWS = ['Hard', 'Medium', 'Easy'] as const;

const EVIDENCE_SOURCE_LABELS: Record<string, string> = {
  standard: 'This standard',
  strand: 'Same strand',
  adjacent_grade: 'Adjacent grade',
  inferred: 'Inferred',
};

const humanize = (value: string) => {
  const text = value.replaceAll('_', ' ').trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
};

const GapAnalysis: React.FC<Props> = ({ analysis, onStartRemediation, isLoadingSlides }) => {
  const attemptRows = analysis.attemptRows || [];
  const questionDiagnostics = analysis.questionDiagnostics || [];
  const teacherActions = analysis.teacherActions || [];
  const studentActions = analysis.studentActions || [];
  const reliabilityFlags = analysis.reliabilityFlags || [];
  const hasGaps = analysis.identifiedGaps.length > 0;

  const gapIcon = (type: GapType) => {
    switch (type) {
      case GapType.Conceptual:
        return <Brain className="w-5 h-5" strokeWidth={1.75} aria-hidden />;
      case GapType.Procedural:
        return <Wrench className="w-5 h-5" strokeWidth={1.75} aria-hidden />;
      case GapType.Computational:
        return <Calculator className="w-5 h-5" strokeWidth={1.75} aria-hidden />;
      default:
        return <AlertTriangle className="w-5 h-5" strokeWidth={1.75} aria-hidden />;
    }
  };

  const gapTone = (type: GapType) => {
    switch (type) {
      case GapType.Conceptual:
        return 'gap-card--conceptual';
      case GapType.Procedural:
        return 'gap-card--procedural';
      case GapType.Computational:
        return 'gap-card--computational';
      default:
        return '';
    }
  };

  const skillTone = (correct: number, total: number) => {
    const ratio = total > 0 ? correct / total : 0;
    if (ratio >= 0.8) return 'success';
    if (ratio >= 0.5) return 'warning';
    return 'danger';
  };

  const reliability = (() => {
    const score = analysis.confidenceScore;
    if (score >= 85) {
      return {
        label: 'High reliability',
        tone: 'success',
        description: 'Errors follow a consistent pattern, so the diagnosis below is well supported.',
      };
    }
    if (score >= 60) {
      return {
        label: 'Medium reliability',
        tone: 'warning',
        description: 'Some patterns showed up, but errors varied. Remediation will help confirm the gaps.',
      };
    }
    return {
      label: 'Low reliability',
      tone: 'neutral',
      description: 'Errors look random or like guessing. Collect another quiz before acting on this diagnosis.',
    };
  })();

  const correctCount = attemptRows.filter((row) => row.isCorrect).length;
  const ctaStatus = isLoadingSlides
    ? 'Building slides for the gaps above…'
    : hasGaps
      ? `${analysis.identifiedGaps.length} gap${analysis.identifiedGaps.length === 1 ? '' : 's'} ready for a remedial lesson.`
      : 'No gaps were diagnosed, so there is nothing to build slides for.';

  return (
    <div className="analysis-page">
      <header className="analysis-hero app-hero-band">
        <div className="app-hero-band-copy">
          <h1 className="app-page-title">Gap analysis</h1>
          <p className="app-page-lede">
            What this quiz shows about{' '}
            <span className="app-badge app-badge--accent app-badge--mono" translate="no">
              {analysis.standardCode}
            </span>
            {attemptRows.length > 0 && (
              <>
                {' '}
                ·{' '}
                <span className="tabular-nums">
                  {correctCount} of {attemptRows.length} correct
                </span>
              </>
            )}
          </p>
        </div>
        <MotionDiagram name="Gaps" width={112} plate="#f2edfd" desktopOnly className="motion-diagram--compact" />
      </header>

      <div className="analysis-overview">
        <section className="app-section" aria-labelledby="analysis-summary-heading">
          <h2 id="analysis-summary-heading" className="app-section-head">
            <span className="app-icon-tile" aria-hidden="true">
              <BarChart2 className="w-4 h-4" strokeWidth={1.75} />
            </span>
            Summary
          </h2>
          <p className="analysis-prose">
            {hasGaps
              ? analysis.summary
              : 'This quiz did not surface a clear skill gap. Collect another sample before reteaching, or return to the studio to pin a different standard.'}
          </p>
        </section>

        <section className="app-section analysis-reliability" aria-labelledby="analysis-reliability-heading">
          <h2 id="analysis-reliability-heading" className="app-section-head">
            <span className="app-icon-tile app-icon-tile--amber" aria-hidden="true">
              <Gauge className="w-4 h-4" strokeWidth={1.75} />
            </span>
            Reliability
          </h2>
          <div className="analysis-reliability-score">
            <span className="analysis-reliability-value tabular-nums">{analysis.confidenceScore}%</span>
            <span className={`app-badge ${reliability.tone === 'neutral' ? '' : `app-badge--${reliability.tone}`}`}>
              {reliability.label}
            </span>
          </div>
          <div
            className="analysis-meter"
            role="meter"
            aria-label="Diagnosis reliability"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={analysis.confidenceScore}
          >
            <div className="analysis-meter-fill" style={{ width: `${Math.max(0, Math.min(100, analysis.confidenceScore))}%` }} />
          </div>
          <p className="analysis-note">{reliability.description}</p>
          {reliabilityFlags.length > 0 && (
            <ul className="studio-alert analysis-flags">
              {reliabilityFlags.map((flag, idx) => (
                <li key={`rf-${idx}`}>{flag}</li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="analysis-block" aria-labelledby="analysis-gaps-heading">
        <h2 id="analysis-gaps-heading" className="app-section-head app-section-head--lg">
          <span className="app-icon-tile app-icon-tile--violet" aria-hidden="true">
            <Target className="w-4 h-4" strokeWidth={1.75} />
          </span>
          Diagnosed gaps
        </h2>

        {!hasGaps ? (
          <div className="app-section analysis-empty">
            <CheckCircle2 className="w-6 h-6 quiz-result-icon--ok" strokeWidth={1.75} aria-hidden />
            <div>
              <p className="analysis-empty-title">No significant gaps</p>
              <p className="analysis-note">This quiz shows solid command of the standard. Try the extra practice below to stretch further.</p>
            </div>
          </div>
        ) : (
          <div className="analysis-gap-list">
            {analysis.identifiedGaps.map((gap, idx) => (
              <article key={idx} className={`gap-card ${gapTone(gap.gapType)}`}>
                <div className="gap-card-icon">{gapIcon(gap.gapType)}</div>
                <div className="min-w-0 flex-1">
                  <div className="gap-card-head">
                    <h3 className="gap-card-title">{gap.gapType}</h3>
                    {gap.relatedQuestions.length > 0 && (
                      <span className="gap-card-questions">
                        From{' '}
                        {gap.relatedQuestions.map((qIdx) => (
                          <span key={qIdx} className="app-badge app-badge--mono">
                            Q{qIdx + 1}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                  <p className="analysis-prose">{gap.description}</p>
                  {gap.misconception && (
                    <div className="gap-card-misconception">
                      <p className="gap-card-misconception-label">Likely misconception</p>
                      <p>{gap.misconception}</p>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {analysis.subSkills && analysis.subSkills.length > 0 && (
        <section className="app-section" aria-labelledby="analysis-skills-heading">
          <h2 id="analysis-skills-heading" className="app-section-head">
            <span className="app-icon-tile app-icon-tile--teal" aria-hidden="true">
              <ListChecks className="w-4 h-4" strokeWidth={1.75} />
            </span>
            Skill breakdown
          </h2>
          <div className="analysis-skill-grid">
            {analysis.subSkills.map((skill, idx) => {
              const tone = skillTone(skill.correctCount, skill.totalCount);
              const pct = skill.totalCount > 0 ? (skill.correctCount / skill.totalCount) * 100 : 0;
              return (
                <div key={idx} className="app-inset analysis-skill">
                  <div className="analysis-skill-head">
                    <div className="min-w-0">
                      <h3 className="analysis-skill-name">{skill.name}</h3>
                      <p className="analysis-note">{skill.description}</p>
                    </div>
                    <span className={`analysis-skill-score analysis-skill-score--${tone} tabular-nums`}>
                      {skill.correctCount}/{skill.totalCount}
                    </span>
                  </div>
                  <div
                    className="analysis-meter"
                    role="meter"
                    aria-label={`${skill.name}: ${skill.correctCount} of ${skill.totalCount} correct`}
                    aria-valuemin={0}
                    aria-valuemax={skill.totalCount}
                    aria-valuenow={skill.correctCount}
                  >
                    <div className={`analysis-meter-fill analysis-meter-fill--${tone}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {hasGaps && (teacherActions.length > 0 || studentActions.length > 0) && (
        <div className="analysis-actions-grid">
          <section className="app-section" aria-labelledby="analysis-teacher-heading">
            <h2 id="analysis-teacher-heading" className="app-section-head">
              <span className="app-icon-tile app-icon-tile--rose" aria-hidden="true">
                <Users className="w-4 h-4" strokeWidth={1.75} />
              </span>
              What to reteach
            </h2>
            <ul className="analysis-list">
              {teacherActions.length > 0
                ? teacherActions.map((action, idx) => <li key={`ta-${idx}`}>{action}</li>)
                : <li>No urgent reteach priorities.</li>}
            </ul>
          </section>
          <section className="app-section" aria-labelledby="analysis-student-heading">
            <h2 id="analysis-student-heading" className="app-section-head">
              <span className="app-icon-tile app-icon-tile--rose" aria-hidden="true">
                <User className="w-4 h-4" strokeWidth={1.75} />
              </span>
              Student next steps
            </h2>
            <ul className="analysis-list">
              {studentActions.length > 0
                ? studentActions.map((action, idx) => <li key={`sa-${idx}`}>{action}</li>)
                : <li>No immediate intervention needed.</li>}
            </ul>
          </section>
        </div>
      )}

      {attemptRows.length > 0 && (
        <section className="app-section" aria-labelledby="analysis-path-heading">
          <h2 id="analysis-path-heading" className="app-section-head">
            <span className="app-icon-tile app-icon-tile--sky" aria-hidden="true">
              <Route className="w-4 h-4" strokeWidth={1.75} />
            </span>
            Difficulty path
          </h2>
          <p className="app-section-sub">The difficulty of each question in the order it was answered.</p>
          <div className="analysis-path" aria-hidden>
            {DIFFICULTY_ROWS.map((level) => (
              <React.Fragment key={level}>
                <span className="analysis-path-level">{level}</span>
                <div className="analysis-path-row" style={{ gridTemplateColumns: `repeat(${attemptRows.length}, minmax(1.75rem, 1fr))` }}>
                  {attemptRows.map((row, idx) => (
                    <span key={`${row.questionId}-${idx}-${level}`} className="analysis-path-cell">
                      {row.difficultyPresented === level && (
                        <span className={`analysis-path-dot ${row.isCorrect ? 'is-correct' : 'is-incorrect'}`} />
                      )}
                    </span>
                  ))}
                </div>
              </React.Fragment>
            ))}
          </div>
          <ol className="analysis-path-list">
            {attemptRows.map((row) => (
              <li key={`${row.questionId}-chip`} className="app-badge">
                <span className="font-mono">Q{row.attemptOrder}</span>
                <span>{row.difficultyPresented}</span>
                {row.isCorrect ? (
                  <CheckCircle2 className="w-3.5 h-3.5 quiz-result-icon--ok" aria-hidden />
                ) : (
                  <XCircle className="w-3.5 h-3.5 quiz-result-icon--bad" aria-hidden />
                )}
                <span className="sr-only">{row.isCorrect ? 'correct' : 'incorrect'}</span>
              </li>
            ))}
          </ol>
          <p className="analysis-legend">
            <span className="analysis-path-dot is-correct" aria-hidden /> Correct
            <span className="analysis-path-dot is-incorrect" aria-hidden /> Incorrect
          </p>
        </section>
      )}

      {questionDiagnostics.length > 0 && (
        <details className="app-section analysis-evidence">
          <summary className="analysis-evidence-summary">
            <span className="app-section-head m-0">
              <span className="app-icon-tile" aria-hidden="true">
                <FileSearch className="w-4 h-4" strokeWidth={1.75} />
              </span>
              Per-question evidence
            </span>
            <span className="app-badge app-badge--mono">{questionDiagnostics.length}</span>
          </summary>
          <div className="analysis-evidence-list">
            {questionDiagnostics.map((diagnostic) => {
              const attempt = attemptRows.find((item) => item.attemptOrder === diagnostic.attemptOrder);
              return (
                <article key={`diag-${diagnostic.attemptOrder}`} className="app-inset">
                  <div className="analysis-evidence-badges">
                    <span className="app-badge app-badge--mono">Q{diagnostic.attemptOrder}</span>
                    <span className="app-badge">{attempt?.difficultyPresented || 'Unknown difficulty'}</span>
                    <span className="app-badge">{humanize(diagnostic.errorType)}</span>
                    <span className="app-badge">
                      {humanize(diagnostic.confidenceLabel)} confidence,{' '}
                      <span className="tabular-nums">{diagnostic.confidenceScore}%</span>
                    </span>
                  </div>
                  <dl className="analysis-evidence-fields">
                    <dt>Likely misconception</dt>
                    <dd>{diagnostic.misconception}</dd>
                    <dt>Evidence from</dt>
                    <dd>{EVIDENCE_SOURCE_LABELS[diagnostic.evidenceSource] ?? humanize(diagnostic.evidenceSource)}</dd>
                    {attempt && (
                      <>
                        <dt>Answer</dt>
                        <dd className="math-html">
                          Chose <MathHtml text={attempt.selectedOptionText} className="inline" />, correct was{' '}
                          <MathHtml text={attempt.correctOptionText} className="inline" />
                        </dd>
                      </>
                    )}
                    {attempt?.adaptiveDecisionReason && (
                      <>
                        <dt>Adaptive step</dt>
                        <dd>{humanize(attempt.adaptiveDecisionReason)}</dd>
                      </>
                    )}
                  </dl>
                </article>
              );
            })}
          </div>
        </details>
      )}

      <StandardPracticeLinks
        standardCode={analysis.standardCode}
        title="Extra practice for this standard"
        subtitle={analysis.standardCode}
        maxVisible={8}
        collapsible={false}
      />

      <div className="studio-actionbar" role="region" aria-label="Remedial lesson">
        <div className="studio-actionbar-status" aria-live="polite">
          <span className="studio-actionbar-hint">{ctaStatus}</span>
        </div>
        <div className="studio-actionbar-actions">
          <button
            type="button"
            onClick={onStartRemediation}
            disabled={isLoadingSlides || !hasGaps}
            aria-busy={isLoadingSlides}
            className="coherence-atlas-btn-primary studio-generate-btn"
          >
            {isLoadingSlides ? (
              <>
                <span className="app-spinner" aria-hidden />
                Building slides…
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4" strokeWidth={2} aria-hidden />
                Build remedial slides
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GapAnalysis;
