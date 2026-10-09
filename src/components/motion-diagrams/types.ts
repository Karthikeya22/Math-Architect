import type { MotionValue } from 'motion/react';

export type MotionDiagramName =
  | 'Atlas'
  | 'Pin'
  | 'Assemble'
  | 'Probe'
  | 'Deck'
  | 'Gaps'
  | 'Lesson'
  | 'Blank';

export type ScenePalette = {
  hi: string;
  edge: string;
  mid: string;
  lo: string;
  fill: string;
  glow: string;
};

export type SceneMotion = {
  /** Pointer X in −1…1 (or ambient orbit when play). */
  x: MotionValue<number>;
  /** Pointer Y in −1…1. */
  y: MotionValue<number>;
  /** 0…1 entrance progress. */
  enter: MotionValue<number>;
  reduceMotion: boolean;
  play: boolean;
  palette: ScenePalette;
};

export type SceneProps = {
  motion: SceneMotion;
};
