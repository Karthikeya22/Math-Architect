import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CheckCircle, Lightbulb, XCircle } from 'lucide-react';
import type { Question, SolutionStep } from '../types';
import { MathHtml } from './MathHtml';
import { processQuizSvg } from '../utils/processQuizSvg';
import { renderDeterministicVisualSvg } from '../utils/visualSpec';

interface Props {
  question: Question;
  steps: SolutionStep[];
  isCorrect: boolean;
  selectedOptionIndex: number;
  adaptiveNote?: React.ReactNode;
}

const StepVisual: React.FC<{
  step: SolutionStep;
  question: Question;
  isLast: boolean;
}> = ({ step, question, isLast }) => {
  const reduceMotion = useReducedMotion();

  const svgHtml = useMemo(() => {
    if (step.visualSpec) {
      return processQuizSvg(renderDeterministicVisualSvg(step.visualSpec) || undefined);
    }
    if (isLast && question.visual) {
      return processQuizSvg(question.visual);
    }
    return null;
  }, [step.visualSpec, isLast, question.visual]);

  const imageSrc = isLast && !step.visualSpec ? question.generatedImageBase64 : undefined;

  if (svgHtml) {
    return (
      <motion.div
        className="quiz-walkthrough-visual"
        initial={reduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
      >
        <motion.div
          className="svg-visual-container"
          dangerouslySetInnerHTML={{ __html: svgHtml }}
          aria-hidden
        />
      </motion.div>
    );
  }

  if (imageSrc) {
    return (
      <motion.div
        className="quiz-walkthrough-visual"
        initial={reduceMotion ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <img src={imageSrc} alt="Picture for this step" className="w-full max-h-[14rem] object-contain mx-auto" />
      </motion.div>
    );
  }

  return null;
};

const StudentSolutionWalkthrough: React.FC<Props> = ({
  question,
  steps,
  isCorrect,
  selectedOptionIndex,
  adaptiveNote,
}) => {
  const reduceMotion = useReducedMotion();
  const correctLabel = String.fromCharCode(65 + question.correctAnswerIndex);
  const correctText = question.options[question.correctAnswerIndex] ?? '';

  const containerVariants = {
    hidden: {},
    visible: {
      transition: reduceMotion ? {} : { staggerChildren: 0.07 },
    },
  };

  const itemVariants = reduceMotion
    ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } };

  return (
    <section className="quiz-walkthrough" aria-label="How to solve this problem">
      <motion.header
        className="quiz-walkthrough-header"
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <h4 className="quiz-walkthrough-title">
          <Lightbulb className="w-5 h-5 shrink-0" style={{ color: 'var(--accent)' }} aria-hidden />
          How we solved it
        </h4>
        <span
          className={`quiz-walkthrough-status ${
            isCorrect ? 'quiz-walkthrough-status--ok' : 'quiz-walkthrough-status--retry'
          }`}
        >
          {isCorrect ? <CheckCircle className="w-3.5 h-3.5" aria-hidden /> : <XCircle className="w-3.5 h-3.5" aria-hidden />}
          {isCorrect ? 'Correct' : 'Not quite'}
        </span>
        <p className="quiz-walkthrough-result">
          {isCorrect ? (
            <>
              Nice work! The answer is{' '}
              <strong>
                {correctLabel}. {correctText}
              </strong>
              .
            </>
          ) : (
            <>
              The correct answer is{' '}
              <strong>
                {correctLabel}. {correctText}
              </strong>
              {selectedOptionIndex >= 0 && <> (you chose {String.fromCharCode(65 + selectedOptionIndex)}).</>}
            </>
          )}
        </p>
      </motion.header>

      <motion.ol
        className="quiz-walkthrough-steps"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {steps.map((step, idx) => (
          <motion.li
            key={`${question.id}-step-${idx}`}
            variants={itemVariants}
            className="quiz-walkthrough-step"
          >
            <span className="quiz-walkthrough-step-num" aria-hidden>
              {idx + 1}
            </span>
            <article className="quiz-walkthrough-step-card">
              <h5 className="quiz-walkthrough-step-title">{step.title}</h5>
              <motion.div className="quiz-walkthrough-step-body">
                <MathHtml text={step.body} />
              </motion.div>
              <StepVisual step={step} question={question} isLast={idx === steps.length - 1} />
            </article>
          </motion.li>
        ))}
      </motion.ol>

      {adaptiveNote}
    </section>
  );
};

export default StudentSolutionWalkthrough;
