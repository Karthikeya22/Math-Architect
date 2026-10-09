import katex from 'katex';
import { normalizeQuizMathCopy } from './normalizeQuizMathCopy';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Turn common ASCII math into KaTeX-friendly TeX (segment is already a math island). */
function normalizeAsciiMath(tex: string): string {
  return tex.replace(/×/g, '\\times').replace(/\*/g, '\\times ');
}

const GREEK_PAREN = new Map<string, string>([
  ['theta', '\\theta'],
  ['alpha', '\\alpha'],
  ['beta', '\\beta'],
  ['gamma', '\\gamma'],
  ['phi', '\\phi'],
  ['pi', '\\pi'],
]);

/** Plain-text quiz strings often use sin^2(theta); convert to TeX without requiring $ delimiters. */
function asciiExprToTex(expr: string): string {
  let t = expr.trim();
  const fracOnly = /^(\d+)\s*\/\s*(\d+)$/;
  const fm = t.match(fracOnly);
  if (fm) return `\\frac{${fm[1]}}{${fm[2]}}`;

  const varPow = /^([A-Za-z])\^(\d+|\{[^}]+\})$/;
  const vp = t.match(varPow);
  if (vp) return `${vp[1]}^{${vp[2].replace(/^\{|\}$/g, '')}}`;

  t = t.replace(/\((theta|alpha|beta|gamma|phi|pi)\)/gi, (_, g: string) => {
    const key = g.toLowerCase();
    return GREEK_PAREN.get(key) ?? `\\${key}`;
  });
  t = t.replace(/\b(theta|alpha|beta|gamma|phi|pi)\b/gi, (word) => {
    const key = word.toLowerCase();
    return GREEK_PAREN.get(key) ?? `\\${key}`;
  });
  t = t.replace(/\b(sin|cos|tan|sec|csc|cot)\b/gi, '\\$1');
  return normalizeAsciiMath(t);
}

function shouldRenderAsciiMathSpan(span: string): boolean {
  const t = span.trim();
  if (/^\d+\s*\/\s*\d+$/.test(t)) return true;
  if (/^[A-Za-z]\^(\d+|\{[^}]+\})$/.test(t)) return true;
  return /(sin|cos|tan|sec|csc|cot)|theta|\^/i.test(t);
}

function renderKatexInline(tex: string): string {
  try {
    return katex.renderToString(tex, {
      displayMode: false,
      throwOnError: true,
      strict: 'ignore',
    });
  } catch {
    return escapeHtml(toPlainMathText(tex) || tex);
  }
}

/**
 * Detect sin^2(theta)+…=1 style fragments (no $…$) and render with KaTeX.
 * Skips bare integer arithmetic like "1 - 2" to avoid false positives in prose.
 */
function renderPlainSegmentWithAsciiMath(plain: string): string {
  const trigPiece = String.raw`(?:sin|cos|tan|sec|csc|cot)(?:\^\d+|\^\{[^}]+\})?(?:\([^)]*\))?`;
  const numWithPow = String.raw`\d+(?:\.\d+)?(?:\^\d+|\^\{[^}]+\})`;
  const varWithPow = String.raw`[A-Za-z](?:\^\d+|\^\{[^}]+\})`;
  /** Non-capturing wrapper so `\b…(?:…)*\b` applies to the whole expression, not only the last `|` branch. */
  const piece = String.raw`(?:${trigPiece}|${numWithPow}|${varWithPow}|\d+)`;
  const eqn = String.raw`\b${piece}(?:\s*[+\-=]\s*${piece})*\b`;
  const frac = String.raw`\d+\s*\/\s*\d+`;
  const asciiMathRe = new RegExp(String.raw`(?:${frac}|${eqn}|${varWithPow})`, 'gi');

  const out: string[] = [];
  let last = 0;
  const r = new RegExp(asciiMathRe.source, asciiMathRe.flags);
  let m: RegExpExecArray | null;
  while ((m = r.exec(plain)) !== null) {
    if (m.index > last) {
      out.push(escapeHtml(plain.slice(last, m.index)).replace(/\n/g, '<br/>'));
    }
    const span = m[0];
    if (shouldRenderAsciiMathSpan(span)) {
      out.push(renderKatexInline(asciiExprToTex(span)));
    } else {
      out.push(escapeHtml(span));
    }
    last = m.index + span.length;
  }
  if (last < plain.length) {
    out.push(escapeHtml(plain.slice(last)).replace(/\n/g, '<br/>'));
  }
  return out.join('');
}

/**
 * Readable plain text for renderers that cannot lay out KaTeX (html2canvas misplaces stacked
 * fractions), e.g. `$\frac{3}{8}$` becomes `3/8`.
 */
export function toPlainMathText(text: string): string {
  if (!text) return '';
  return normalizeQuizMathCopy(text)
    .replace(/\\[dt]?frac\{([^}]*)\}\{([^}]*)\}/g, '$1/$2')
    .replace(/\\sqrt\{([^}]*)\}/g, '√($1)')
    .replace(/\\square\b/g, '□')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\cdot/g, '·')
    .replace(/\\pm\b/g, '±')
    .replace(/\\(le|leq)\b/g, '≤')
    .replace(/\\(ge|geq)\b/g, '≥')
    .replace(/\\neq\b/g, '≠')
    .replace(/\\left\s*/g, '')
    .replace(/\\right\s*/g, '')
    .replace(/\\\(|\\\)|\\\[|\\\]/g, '')
    .replace(/\$\$?/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Split quiz copy into safe HTML + KaTeX for scientific notation, sqrt, frac, and $...$ / $$...$$.
 */
export function renderRichMathHtml(text: string, opts?: { displayBlock?: boolean }): string {
  if (!text) return '';
  const normalized = normalizeQuizMathCopy(text);
  const re =
    /(\$\$[\s\S]*?\$\$|\$[^\$\n]+\$|\\[dt]?frac\{[^}]+\}\{[^}]+\}|\\sqrt\{[^}]+\}|\\square\b|\d+(?:\.\d+)?\s*(?:\*|×)\s*10(?:\^\{[^}]+\}|\^\d+))/gi;
  const parts = normalized.split(re);
  const out: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const seg = parts[i];
    if (seg === undefined || seg === '') continue;
    if (i % 2 === 0) {
      out.push(renderPlainSegmentWithAsciiMath(seg));
      continue;
    }
    let raw = seg;
    let display = Boolean(opts?.displayBlock);
    if (raw.startsWith('$$') && raw.endsWith('$$')) {
      raw = raw.slice(2, -2).trim();
      display = true;
    } else if (raw.startsWith('$') && raw.endsWith('$')) {
      raw = raw.slice(1, -1).trim();
    } else {
      raw = normalizeAsciiMath(raw);
    }
    try {
      out.push(
        katex.renderToString(raw, {
          displayMode: display,
          throwOnError: true,
          strict: 'ignore',
        }),
      );
    } catch {
      out.push(escapeHtml(toPlainMathText(seg) || seg));
    }
  }
  return out.join('');
}
