import React, { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';
import { MotionDiagram, loadingDiagramName, SCENE_PALETTE } from './motion-diagrams';
import type { MotionDiagramName } from './motion-diagrams';
import TypewriterLoading from './TypewriterLoading';

export type LoadingStep = { text: string };

type Props = {
  message: string;
  steps: readonly LoadingStep[];
  stepIndex: number;
};

type PhaseKey = 'Assemble' | 'Probe' | 'Deck';

const PHASE_META: Record<
  PhaseKey,
  { label: string; phaseClass: string; fixedSteps: readonly string[] }
> = {
  Assemble: {
    label: 'Building quiz',
    phaseClass: 'loading-stage--assemble',
    fixedSteps: [
      'Reading your selected standard…',
      'Designing aligned assessment prompts…',
      'Calibrating question difficulty and flow…',
    ],
  },
  Probe: {
    label: 'Analyzing gaps',
    phaseClass: 'loading-stage--probe',
    fixedSteps: [
      'Scoring responses by skill…',
      'Identifying learning gaps…',
      'Preparing remediation focus…',
    ],
  },
  Deck: {
    label: 'Creating slides',
    phaseClass: 'loading-stage--deck',
    fixedSteps: [
      'Gathering diagnosed gaps…',
      'Drafting remedial models…',
      'Formatting lesson slides…',
    ],
  },
};

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 };

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: spring },
};

function phaseKeyFromMessage(message: string): PhaseKey {
  const name = loadingDiagramName(message);
  if (name === 'Probe' || name === 'Deck') return name;
  return 'Assemble';
}

const LoadingStage: React.FC<Props> = ({ message, steps, stepIndex }) => {
  const reduceMotion = useReducedMotion();
  const phase = phaseKeyFromMessage(message);
  const meta = PHASE_META[phase];
  const palette = SCENE_PALETTE[phase as MotionDiagramName];
  const [diagramWidth, setDiagramWidth] = useState(300);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => setDiagramWidth(media.matches ? 220 : 300);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const railSteps = useMemo(() => {
    if (/analyz/i.test(message)) return [...PHASE_META.Probe.fixedSteps];
    if (/slide/i.test(message)) return [...PHASE_META.Deck.fixedSteps];
    if (steps.length > 0) return steps.map((s) => s.text);
    return [...meta.fixedSteps];
  }, [message, steps, meta.fixedSteps]);

  const activeIndex = Math.min(Math.max(0, stepIndex), Math.max(0, railSteps.length - 1));
  const visibleSteps = reduceMotion
    ? [{ label: railSteps[activeIndex] ?? meta.label, index: activeIndex, done: false, current: true }]
    : railSteps.map((label, i) => ({
        label,
        index: i,
        done: i < activeIndex,
        current: i === activeIndex,
      }));

  return (
    <motion.div
      className={`loading-stage ${meta.phaseClass}`}
      style={
        {
          '--loading-hi': palette.hi,
          '--loading-mid': palette.mid,
          '--loading-lo': palette.lo,
          '--loading-fill': palette.fill,
          '--loading-glow': palette.glow,
        } as React.CSSProperties
      }
      aria-busy="true"
      variants={reduceMotion ? undefined : containerVariants}
      initial={reduceMotion ? false : 'hidden'}
      animate={reduceMotion ? undefined : 'show'}
    >
      <div className="loading-stage-atmosphere" aria-hidden />

      <div className="loading-stage-grid">
        <motion.div className="loading-stage-visual" variants={reduceMotion ? undefined : itemVariants}>
          <MotionDiagram
            name={phase}
            width={diagramWidth}
            plate={palette.fill}
            play={!reduceMotion}
            className="loading-stage-diagram"
          />
        </motion.div>

        <motion.div className="loading-stage-status" variants={reduceMotion ? undefined : itemVariants}>
          <motion.span
            className="loading-stage-phase"
            animate={reduceMotion ? undefined : { opacity: [0.75, 1, 0.75] }}
            transition={reduceMotion ? undefined : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            {meta.label}
          </motion.span>

          <TypewriterLoading active text={message} className="loading-stage-typewriter" />

          <ol className="loading-stage-rail" aria-label="Progress steps">
            {visibleSteps.map((step) => (
              <motion.li
                key={`${step.index}-${step.label}`}
                className={`loading-stage-step${step.done ? ' is-done' : ''}${step.current ? ' is-current' : ''}`}
                variants={reduceMotion ? undefined : itemVariants}
              >
                <span className="loading-stage-step-mark" aria-hidden>
                  {step.done ? (
                    <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                  ) : (
                    <span className="loading-stage-step-dot" />
                  )}
                </span>
                <span className="loading-stage-step-label">{step.label}</span>
              </motion.li>
            ))}
          </ol>

          <div className="loading-stage-progress" role="progressbar" aria-label="Working" aria-valuetext="In progress">
            <div className="loading-stage-progress-track">
              {reduceMotion ? (
                <div className="loading-stage-progress-fill is-static" />
              ) : (
                <motion.div
                  className="loading-stage-progress-shimmer"
                  animate={{ x: ['-40%', '120%'] }}
                  transition={{ duration: 1.35, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
            </div>
          </div>

          <p className="loading-stage-hint">This usually takes under a minute.</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LoadingStage;
