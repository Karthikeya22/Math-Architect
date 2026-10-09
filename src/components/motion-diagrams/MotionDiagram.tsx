import React, { useEffect, useState } from 'react';
import { DiagramStage } from './Stage';
import { SCENE_PALETTE } from './palettes';
import type { MotionDiagramName } from './types';
import Atlas from './scenes/Atlas';
import Pin from './scenes/Pin';
import Assemble from './scenes/Assemble';
import Probe from './scenes/Probe';
import Deck from './scenes/Deck';
import Gaps from './scenes/Gaps';
import Lesson from './scenes/Lesson';
import Blank from './scenes/Blank';

export type { MotionDiagramName };

const SCENES: Record<MotionDiagramName, React.ComponentType> = {
  Atlas,
  Pin,
  Assemble,
  Probe,
  Deck,
  Gaps,
  Lesson,
  Blank,
};

const DESKTOP_QUERY = '(min-width: 768px)';

const useDesktop = () => {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(DESKTOP_QUERY).matches,
  );
  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setMatches(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);
  return matches;
};

type Props = {
  name: MotionDiagramName;
  width: number;
  plate?: string;
  play?: boolean;
  followCursor?: boolean;
  decorative?: boolean;
  desktopOnly?: boolean;
  label?: string;
  className?: string;
};

const MotionDiagram: React.FC<Props> = ({
  name,
  width,
  plate = '#ffffff',
  play = false,
  followCursor = false,
  decorative = true,
  desktopOnly = false,
  label,
  className = '',
}) => {
  const isDesktop = useDesktop();
  if (desktopOnly && !isDesktop) return null;

  const Scene = SCENES[name];
  const palette = SCENE_PALETTE[name];

  return (
    <div
      className={`motion-diagram motion-diagram--${name.toLowerCase()} ${className}`}
      style={{ width, maxWidth: '100%', flexShrink: 0 }}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : label}
    >
      <DiagramStage play={play} followCursor={followCursor} palette={palette} plate={plate}>
        <Scene />
      </DiagramStage>
    </div>
  );
};

export default MotionDiagram;

export function loadingDiagramName(message: string): MotionDiagramName {
  if (/analyz/i.test(message)) return 'Probe';
  if (/slide/i.test(message)) return 'Deck';
  return 'Assemble';
}
