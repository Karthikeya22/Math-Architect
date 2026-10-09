import React, { createContext, useContext, useLayoutEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Calculator,
  Eye,
  Lightbulb,
  PencilLine,
  Target,
  type LucideIcon,
} from 'lucide-react';
import type { RemedialSlide, RemedialSlideLayout } from '../types';
import { SLIDE_LAYOUT_LABELS, isLegacySlide, resolveSlideLayout, toVocabEntries } from '../utils/remedialDeck';
import { toPlainMathText } from '../utils/renderRichMathHtml';
import { MathHtml } from './MathHtml';

export const SLIDE_WIDTH = 1280;
export const SLIDE_HEIGHT = 720;

const LAYOUT_ICONS: Record<RemedialSlideLayout, LucideIcon> = {
  gap_overview: Target,
  concept: Lightbulb,
  model: Eye,
  worked_example: Calculator,
  mistake_fix: AlertTriangle,
  try_it: PencilLine,
};

/** html2canvas misplaces KaTeX's stacked fractions, so PDF capture renders math as plain text. */
const PlainMathContext = createContext(false);

const M: React.FC<{ text: string }> = ({ text }) =>
  useContext(PlainMathContext) ? <span>{toPlainMathText(text)}</span> : <MathHtml text={text} />;

const PointList: React.FC<{ points: string[]; numbered?: boolean }> = ({ points, numbered }) => (
  <ul className="slide-points">
    {points.map((point, i) => (
      <li key={i} className="slide-point">
        {numbered ? (
          <span className="slide-point-num">{i + 1}</span>
        ) : (
          <span className="slide-point-mark" aria-hidden />
        )}
        <M text={point} />
      </li>
    ))}
  </ul>
);

const Remember: React.FC<{ points: string[] }> = ({ points }) =>
  points.length ? (
    <p className="slide-remember">
      <span className="slide-label">Remember</span>
      <M text={points.join(' ')} />
    </p>
  ) : null;

const LegacyContent: React.FC<{ content: string }> = ({ content }) => (
  <div className="slide-legacy">
    {content.split('\n').map((line, i) => {
      const trimmed = line.trim().replace(/\*\*/g, '');
      if (!trimmed) return null;
      if (trimmed.startsWith('#')) return <h3 key={i}>{trimmed.replace(/^#+\s*/, '')}</h3>;
      if (/^([-•>]|\d+\.)\s*/.test(trimmed)) {
        return (
          <div key={i} className="slide-point">
            <span className="slide-point-mark" aria-hidden />
            <M text={trimmed.replace(/^([-•>]|\d+\.)\s*/, '')} />
          </div>
        );
      }
      return (
        <p key={i}>
          <M text={trimmed} />
        </p>
      );
    })}
  </div>
);

const SlideBody: React.FC<{ slide: RemedialSlide; layout: RemedialSlideLayout; hasFigure: boolean }> = ({
  slide,
  layout,
  hasFigure,
}) => {
  const points = slide.keyPoints ?? [];
  const vocab = toVocabEntries(slide.vocabulary);

  if (isLegacySlide(slide)) return <LegacyContent content={slide.content} />;

  switch (layout) {
    case 'gap_overview':
      return (
        <div className="slide-row">
          <div className="slide-copy">
            <p className="slide-label">Today we will fix</p>
            <PointList points={points} />
          </div>
          {!hasFigure && vocab.length > 0 && (
            <div className="slide-words">
              <p className="slide-label">Words to know</p>
              {vocab.slice(0, 3).map((entry) => (
                <div key={entry.term} className="slide-word">
                  <p className="slide-word-term">{entry.term}</p>
                  {entry.meaning && <p className="slide-word-meaning">{entry.meaning}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      );

    case 'concept': {
      const [bigIdea, ...rest] = points;
      return (
        <div className="slide-copy">
          {bigIdea && (
            <p className="slide-bigidea">
              <M text={bigIdea} />
            </p>
          )}
          {rest.length > 0 && <PointList points={rest} />}
        </div>
      );
    }

    case 'model':
      return hasFigure ? (
        <div className="slide-copy">
          <PointList points={points} numbered />
        </div>
      ) : (
        <div className="slide-cards">
          {points.map((point, i) => (
            <div key={i} className="slide-card">
              <span className="slide-point-num">{i + 1}</span>
              <M text={point} />
            </div>
          ))}
        </div>
      );

    case 'worked_example': {
      const example = slide.workedExample;
      if (!example) {
        return (
          <div className="slide-copy">
            <PointList points={points} numbered />
          </div>
        );
      }
      return (
        <div className="slide-copy">
          <div>
            <p className="slide-label">Problem</p>
            <p className="slide-problem">
              <M text={example.problem} />
            </p>
          </div>
          <ol className="slide-steps">
            {example.steps.map((step, i) => (
              <li key={i} className="slide-point">
                <span className="slide-point-num">{i + 1}</span>
                <M text={step} />
              </li>
            ))}
          </ol>
          {example.answer && (
            <div className="slide-answer">
              <span className="slide-label">Answer</span>
              <M text={example.answer} />
            </div>
          )}
          <Remember points={points} />
        </div>
      );
    }

    case 'mistake_fix': {
      const mistake = slide.misconception;
      if (!mistake) {
        return (
          <div className="slide-copy">
            <PointList points={points} />
          </div>
        );
      }
      return (
        <div className="slide-copy">
          <div className="slide-compare">
            <div className="slide-side slide-side--wrong">
              <p className="slide-label">Not this</p>
              <p className="slide-side-math">
                <M text={mistake.wrong} />
              </p>
              {mistake.why && (
                <p className="slide-side-note">
                  <M text={mistake.why} />
                </p>
              )}
            </div>
            <div className="slide-side slide-side--right">
              <p className="slide-label">Do this</p>
              <p className="slide-side-math">
                <M text={mistake.fix} />
              </p>
              {points[0] && (
                <p className="slide-side-note">
                  <M text={points[0]} />
                </p>
              )}
            </div>
          </div>
          <Remember points={points.slice(1)} />
        </div>
      );
    }

    case 'try_it': {
      const check = slide.checkQuestion;
      return (
        <div className="slide-copy">
          {check && (
            <div className="slide-task">
              <p className="slide-label">Try this</p>
              <p className="slide-task-prompt">
                <M text={check.prompt} />
              </p>
            </div>
          )}
          {points.length > 0 && (
            <div className="slide-panel">
              <p className="slide-label">Takeaway</p>
              <PointList points={points} />
            </div>
          )}
        </div>
      );
    }
  }
};

interface SlideCanvasProps {
  slide: RemedialSlide;
  index: number;
  total: number;
  /** Set for the hidden copies that html2canvas captures for the PDF. */
  forCapture?: boolean;
}

/** A 1280x720 slide in px. Wrap with ScaledSlide on screen; render bare for PDF capture. */
export const SlideCanvas: React.FC<SlideCanvasProps> = ({ forCapture = false, ...props }) => (
  <PlainMathContext.Provider value={forCapture}>
    <SlideCanvasInner {...props} />
  </PlainMathContext.Provider>
);

const MIN_FIT = 0.7;

/** Shrinks body type (via --slide-fit) until the slide body no longer overflows its box. */
function fitSlideBody(main: HTMLElement) {
  let fit = 1;
  main.style.setProperty('--slide-fit', '1');
  while (fit > MIN_FIT && main.scrollHeight > main.clientHeight + 1) {
    fit = Math.round((fit - 0.05) * 100) / 100;
    main.style.setProperty('--slide-fit', String(fit));
  }
}

const SlideCanvasInner: React.FC<Omit<SlideCanvasProps, 'forCapture'>> = ({ slide, index, total }) => {
  const layout = resolveSlideLayout(slide, index);
  const Icon = LAYOUT_ICONS[layout];
  const image = slide.generatedImageBase64;
  const terms = toVocabEntries(slide.vocabulary).map((entry) => entry.term);
  const showTermsInFooter = layout !== 'gap_overview' || Boolean(image);
  const mainRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    fitSlideBody(main);
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) fitSlideBody(main);
    });
    return () => {
      cancelled = true;
    };
  }, [slide, layout]);

  return (
    <div className={`slide slide-tone--${layout}`}>
      <header className="slide-head">
        <span className="slide-kicker">
          <span className="slide-kicker-icon">
            <Icon size={18} strokeWidth={2} aria-hidden />
          </span>
          {SLIDE_LAYOUT_LABELS[layout]}
        </span>
        <span className="slide-count">
          {index + 1} / {total}
        </span>
      </header>

      <div className="slide-titles">
        <h2 className="slide-title">
          <M text={slide.title} />
        </h2>
        {slide.subtitle && <p className="slide-subtitle">{slide.subtitle}</p>}
      </div>

      <div ref={mainRef} className={`slide-main${image ? ' has-figure' : ''}`}>
        <SlideBody slide={slide} layout={layout} hasFigure={Boolean(image)} />
        {image && (
          <figure className="slide-figure">
            <img src={image} alt={slide.visualDescription || `Picture for ${slide.title}`} />
          </figure>
        )}
      </div>

      <footer className="slide-foot">
        <span className="slide-gap">
          {slide.gapAddressed && (
            <>
              <Target size={18} strokeWidth={2} aria-hidden />
              Fixing: {slide.gapAddressed}
            </>
          )}
        </span>
        {showTermsInFooter && terms.length > 0 && (
          <span className="slide-terms">
            {terms.slice(0, 3).map((term) => (
              <span key={term} className="slide-term">
                {term}
              </span>
            ))}
          </span>
        )}
      </footer>
    </div>
  );
};

/** Fits the fixed canvas into its parent box, letterboxed and centered. */
export const ScaledSlide: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ scale: 1, left: 0, top: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width) return;
      const scale = Math.min(width / SLIDE_WIDTH, height > 0 ? height / SLIDE_HEIGHT : Infinity);
      setBox({
        scale,
        left: (width - SLIDE_WIDTH * scale) / 2,
        top: height > 0 ? (height - SLIDE_HEIGHT * scale) / 2 : 0,
      });
    };
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="slide-viewport">
      <div
        className="slide-scaler"
        style={{ transform: `translate(${box.left}px, ${box.top}px) scale(${box.scale})` }}
      >
        {children}
      </div>
    </div>
  );
};
