import React, { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';

type Props = {
  /** Full line to type; when empty, nothing is shown until active flips. */
  text: string;
  active: boolean;
  charMs?: number;
  pauseMs?: number;
  className?: string;
};

/**
 * Repeating typewriter line with caret, for loading screens.
 */
const TypewriterLoading: React.FC<Props> = ({
  text,
  active,
  charMs = 38,
  pauseMs = 1600,
  className = '',
}) => {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState('');

  useEffect(() => {
    if (!active || !text) {
      setDisplay('');
      return;
    }
    if (reduceMotion) {
      setDisplay(text);
      return;
    }

    let disposed = false;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const schedule = (fn: () => void, ms: number) => {
      const id = setTimeout(fn, ms);
      timeouts.push(id);
    };

    const run = () => {
      let idx = 0;
      const step = () => {
        if (disposed) return;
        if (idx < text.length) {
          setDisplay(text.slice(0, idx + 1));
          idx += 1;
          schedule(step, charMs);
        } else {
          schedule(() => {
            if (disposed) return;
            setDisplay('');
            run();
          }, pauseMs);
        }
      };
      step();
    };

    run();

    return () => {
      disposed = true;
      timeouts.forEach(clearTimeout);
    };
  }, [active, text, charMs, pauseMs, reduceMotion]);

  if (!active) return null;

  return (
    <>
      <p className="sr-only-live" role="status" aria-live="polite">
        {text}
      </p>
      <h2
        className={`typewriter-loading ${className}`.trim()}
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}
        aria-hidden
      >
        {display}
        {!reduceMotion && (
          <span
            className="typewriter-loading-caret"
            style={{ background: 'var(--accent)' }}
          />
        )}
      </h2>
    </>
  );
};

export default TypewriterLoading;
