import React, { createContext, useContext, useEffect, useRef } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
  useAnimationFrame,
  type MotionValue,
} from 'motion/react';
import type { SceneMotion, ScenePalette } from './types';

const DiagramMotionContext = createContext<SceneMotion | null>(null);

export function useDiagramMotion(): SceneMotion {
  const ctx = useContext(DiagramMotionContext);
  if (!ctx) throw new Error('useDiagramMotion must be used inside DiagramStage');
  return ctx;
}

type StageProps = {
  play?: boolean;
  palette: ScenePalette;
  plate?: string;
  className?: string;
  children: React.ReactNode;
};

const springCfg = { stiffness: 120, damping: 18, mass: 0.6 };

export const DiagramStage: React.FC<StageProps> = ({
  play = false,
  palette,
  plate = '#ffffff',
  className = '',
  children,
}) => {
  const reduceMotion = Boolean(useReducedMotion());
  const rootRef = useRef<HTMLDivElement>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, springCfg);
  const y = useSpring(rawY, springCfg);
  const enter = useMotionValue(reduceMotion ? 1 : 0);
  const enterSpring = useSpring(enter, { stiffness: 80, damping: 20 });

  useEffect(() => {
    enter.set(1);
  }, [enter]);

  useEffect(() => {
    if (reduceMotion) {
      rawX.set(0);
      rawY.set(0);
    }
  }, [reduceMotion, rawX, rawY]);

  useAnimationFrame((t) => {
    if (reduceMotion || !play) return;
    const ang = t / 1800;
    rawX.set(Math.sin(ang) * 0.55);
    rawY.set(Math.cos(ang * 0.85) * 0.35);
  });

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || play) return;
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    rawX.set(Math.max(-1, Math.min(1, nx)));
    rawY.set(Math.max(-1, Math.min(1, ny)));
  };

  const onPointerLeave = () => {
    if (reduceMotion || play) return;
    rawX.set(0);
    rawY.set(0);
  };

  const value: SceneMotion = {
    x,
    y,
    enter: enterSpring,
    reduceMotion,
    play,
    palette,
  };

  return (
    <DiagramMotionContext.Provider value={value}>
      <motion.div
        ref={rootRef}
        className={`motion-diagram-stage ${className}`}
        style={{
          aspectRatio: '5 / 4',
          width: '100%',
          position: 'relative',
          touchAction: 'pan-y',
          borderRadius: 16,
          background: `radial-gradient(ellipse 70% 60% at 50% 40%, ${palette.glow}, transparent 70%), ${plate}`,
        }}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
      >
        {children}
      </motion.div>
    </DiagramMotionContext.Provider>
  );
};

/** Parallax helper: map pointer × depth into pixel offset. */
export function useParallax(depth: number, scale = 10): { x: MotionValue<number>; y: MotionValue<number> } {
  const { x: px, y: py } = useDiagramMotion();
  const x = useSpring(0, springCfg);
  const y = useSpring(0, springCfg);

  useEffect(() => {
    const unsubX = px.on('change', (v) => x.set(v * depth * scale));
    const unsubY = py.on('change', (v) => y.set(v * depth * scale));
    x.set(px.get() * depth * scale);
    y.set(py.get() * depth * scale);
    return () => {
      unsubX();
      unsubY();
    };
  }, [px, py, x, y, depth, scale]);

  return { x, y };
}
