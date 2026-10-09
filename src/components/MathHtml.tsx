import React, { useMemo } from 'react';
import { renderRichMathHtml } from '../utils/renderRichMathHtml';
import 'katex/dist/katex.min.css';

type Props = {
  text: string;
  className?: string;
  /** Use KaTeX display mode for $$...$$ only; stem uses inline-friendly chunks by default. */
  displayBlock?: boolean;
};

/**
 * Renders quiz/explanation strings with KaTeX for common math (scientific notation, sqrt, frac, $...$).
 */
export function MathHtml({ text, className, displayBlock }: Props) {
  const html = useMemo(() => renderRichMathHtml(text, { displayBlock }), [text, displayBlock]);
  return (
    <span
      className={['math-html leading-relaxed [&_.katex]:text-[1.05em]', className].filter(Boolean).join(' ')}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
