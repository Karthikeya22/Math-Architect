const UNICODE_UNKNOWN = /[⊥‽]/g;

/** Common TeX control words that models double-escape as \\frac, \\sqrt, etc. */
const TEX_COMMAND =
  'frac|dfrac|tfrac|sqrt|times|div|cdot|pm|mp|square|boxed|text|left|right|le|leq|ge|geq|neq|approx|angle|overline|underline|cdotp|ast|circ|infty|pi|theta|alpha|beta|gamma|phi|degree|circ|mathbf|mathrm|operatorname';

const wrapInlineMath = (tex: string): string => `$${tex}$`;

const isBoxToken = (token: string): boolean => /[□☐▢▣▭▯⬜]/.test(token);

const normalizeUnknownToken = (token: string): string => {
  const trimmed = token.trim();
  if (!trimmed || trimmed === '?' || isBoxToken(trimmed)) return '\\square';
  if (trimmed.startsWith('\\')) return trimmed;
  return '\\square';
};

/**
 * Repair common AI quiz copy issues before KaTeX rendering: mojibake placeholders,
 * bare \\times fragments, delimiter forms, and unbalanced $ delimiters.
 */
export function normalizeQuizMathCopy(input: string): string {
  if (!input) return '';

  let text = String(input)
    .replace(/\u00a0/g, ' ')
    .replace(UNICODE_UNKNOWN, '?')
    .replace(/!!\s*⊥/g, '?')
    .replace(/!!\s*\?/g, '?')
    .replace(/(\d+)\s*!+\s*\?/g, '$1 ?')
    .trim();

  // Collapse double-escaped TeX commands: \\frac → \frac (repeat for triple-escape).
  const doubleEscaped = new RegExp(String.raw`\\\\(${TEX_COMMAND})\b`, 'gi');
  for (let i = 0; i < 3; i++) {
    const next = text.replace(doubleEscaped, '\\$1');
    if (next === text) break;
    text = next;
  }

  // LaTeX delimiters → dollar math KaTeX already understands.
  // Note: in String.replace, '$$' is an escape for a single '$', so use '$$$$' for '$$'.
  text = text.replace(/\\\(|\\\)/g, '$');
  text = text.replace(/\\\[|\\\]/g, '$$$$');

  // Sizing commands are noise in stems/options; keep the brackets/parens.
  text = text.replace(/\\left\s*/g, '');
  text = text.replace(/\\right\s*/g, '');

  text = text.replace(
    /(\b\d+(?:\.\d+)?)\s*\\times\s*([?□☐]|\\square|\\boxed\{\?\}|\\text\{\?\})\s*=\s*(\d+(?:\.\d+)?)/gi,
    (_, left: string, unknown: string, right: string) =>
      wrapInlineMath(`${left} \\times ${normalizeUnknownToken(unknown)} = ${right}`),
  );

  text = text.replace(
    /(\b\d+(?:\.\d+)?)\s*(?:×|x|\*)\s*([?□☐])\s*=\s*(\d+(?:\.\d+)?)/gi,
    (_, left: string, _unknown: string, right: string) =>
      wrapInlineMath(`${left} \\times \\square = ${right}`),
  );

  text = text.replace(
    /(\b\d+(?:\.\d+)?)\s+\?\s*=\s*(\d+(?:\.\d+)?)\b/g,
    (_, left: string, right: string) => wrapInlineMath(`${left} \\times \\square = ${right}`),
  );

  // Empty stacked fractions render as a barren bar that reads like "[/]".
  text = text.replace(/\\[dt]?frac\{\s*\}\{\s*\}/g, () => wrapInlineMath('\\square'));

  // Literal blank-fraction markers and empty bracket blanks from model copy.
  text = text.replace(/\[\/\]/g, () => wrapInlineMath('\\square'));
  text = text.replace(/\[\s*_+\s*\]/g, () => wrapInlineMath('\\square'));
  text = text.replace(/\[\s*\]/g, () => wrapInlineMath('\\square'));

  // Bare \square outside math delimiters (leave tokens already inside $...$).
  text = text.replace(/\$\$[\s\S]*?\$\$|\$[^$\n]*\$|\\square\b/g, (match) =>
    match === '\\square' || match.startsWith('\\square')
      ? wrapInlineMath('\\square')
      : match,
  );

  // Incomplete \frac{a}{b … (missing closing brace) → readable a/b.
  text = text.replace(
    /\\[dt]?frac\{([^}]*)\}\{([^}]*?)(?=\s|[),.;:!?]|$)/g,
    (_match, num: string, den: string) => {
      const a = (num || '').trim() || '\\square';
      const b = (den || '').trim() || '\\square';
      return wrapInlineMath(`${a}/${b}`);
    },
  );

  const dollarCount = (text.match(/\$/g) || []).length;
  if (dollarCount % 2 === 1) {
    text = `${text}$`;
  }

  return text;
}
