export type CoherenceStrandStyle = {
  name: string;
  color: string;
  tint: string;
};

const STRAND_STYLES: Record<string, CoherenceStrandStyle> = {
  NSO: { name: 'Number Sense & Operations', color: '#1E40AF', tint: '#EFF4FB' },
  FR: { name: 'Fractions', color: '#B45309', tint: '#FBF5EC' },
  F: { name: 'Functions', color: '#BE185D', tint: '#FDF2F8' },
  AR: { name: 'Algebraic Reasoning', color: '#6D28D9', tint: '#F4F0FB' },
  A: { name: 'Algebra', color: '#6D28D9', tint: '#F4F0FB' },
  M: { name: 'Measurement', color: '#0D9488', tint: '#E6F7F4' },
  GR: { name: 'Geometric Reasoning', color: '#15803D', tint: '#EEF6F0' },
  DP: { name: 'Data Analysis & Probability', color: '#0E7490', tint: '#EDF6F8' },
  FL: { name: 'Financial Literacy', color: '#475569', tint: '#F1F5F9' },
  LT: { name: 'Logic & Theorems', color: '#A855F7', tint: '#F6F0FE' },
  T: { name: 'Trigonometry', color: '#0D9488', tint: '#E6F7F4' },
  C: { name: 'Calculus', color: '#DB2777', tint: '#FDF2F8' },
};

const FALLBACK_COLORS = ['#1E40AF', '#B45309', '#6D28D9', '#15803D', '#0E7490', '#0D9488', '#475569'];

const hashStrand = (code: string) => {
  let hash = 0;
  for (let i = 0; i < code.length; i++) hash = (hash + code.charCodeAt(i) * (i + 1)) % FALLBACK_COLORS.length;
  return FALLBACK_COLORS[hash] ?? '#475569';
};

export const strandStyleFor = (code: string, title?: string): CoherenceStrandStyle => {
  const known = STRAND_STYLES[code];
  if (known) return known;
  const color = hashStrand(code);
  return {
    name: title?.trim() || code,
    color,
    tint: `${color}14`,
  };
};

export const compareStrandCodes = (left: string, right: string) => {
  const order = ['NSO', 'FR', 'F', 'AR', 'A', 'M', 'GR', 'DP', 'FL', 'LT', 'T', 'C'];
  const li = order.indexOf(left);
  const ri = order.indexOf(right);
  if (li !== -1 && ri !== -1) return li - ri;
  if (li !== -1) return -1;
  if (ri !== -1) return 1;
  return left.localeCompare(right);
};
