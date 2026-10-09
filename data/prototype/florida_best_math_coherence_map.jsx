import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronRight, X, BookOpen, Map, Filter, ArrowUpRight, Lightbulb, CheckCircle2, Compass, Layers } from 'lucide-react';

// ============================================================
// FLORIDA B.E.S.T. MATH STANDARDS — SAMPLE DATA (Grades 4–7)
// ============================================================

const STRANDS = {
  NSO: { name: 'Number Sense & Operations', color: '#1E40AF', tint: '#EFF4FB' },
  FR:  { name: 'Fractions',                  color: '#B45309', tint: '#FBF5EC' },
  AR:  { name: 'Algebraic Reasoning',        color: '#6D28D9', tint: '#F4F0FB' },
  GR:  { name: 'Geometric Reasoning',        color: '#15803D', tint: '#EEF6F0' },
  DP:  { name: 'Data Analysis & Probability', color: '#0E7490', tint: '#EDF6F8' },
};

const STANDARDS = [
  // ---- Grade 4 ----
  { code: 'MA.4.NSO.1.1', grade: 4, strand: 'NSO', lane: 0,
    title: 'Place value to 1,000,000',
    text: 'Express how the value of a digit in a multi-digit whole number changes if the digit moves one place to the left or right.' },
  { code: 'MA.4.NSO.2.2', grade: 4, strand: 'NSO', lane: 1,
    title: 'Multi-digit multiplication',
    text: 'Multiply two whole numbers, up to three digits by up to two digits, with procedural reliability.' },
  { code: 'MA.4.FR.1.1',  grade: 4, strand: 'FR',  lane: 0,
    title: 'Equivalent fractions',
    text: 'Model and express a fraction as the result of dividing the numerator by the denominator using visual representations.' },
  { code: 'MA.4.FR.2.2',  grade: 4, strand: 'FR',  lane: 1,
    title: 'Add/subtract like fractions',
    text: 'Add and subtract fractions with like denominators, including mixed numbers and fractions greater than one.' },
  { code: 'MA.4.AR.1.2',  grade: 4, strand: 'AR',  lane: 0,
    title: 'Real-world problems (4 ops)',
    text: 'Solve real-world problems involving multiplication and division of whole numbers, including problems with remainders.' },
  { code: 'MA.4.GR.1.1',  grade: 4, strand: 'GR',  lane: 0,
    title: 'Classify shapes',
    text: 'Identify and classify two-dimensional figures based on attributes (parallel sides, perpendicular sides, angles).' },
  { code: 'MA.4.DP.1.2',  grade: 4, strand: 'DP',  lane: 0,
    title: 'Interpret data displays',
    text: 'Determine the mode, median or range to interpret a given numerical data set on a line plot.' },

  // ---- Grade 5 ----
  { code: 'MA.5.NSO.1.1', grade: 5, strand: 'NSO', lane: 0,
    title: 'Decimals to thousandths',
    text: 'Express how the value of a digit changes by a power of 10 in multi-digit numbers with decimals to the thousandths.' },
  { code: 'MA.5.NSO.2.1', grade: 5, strand: 'NSO', lane: 1,
    title: 'Multi-digit multiplication (fluency)',
    text: 'Multiply multi-digit whole numbers including using a standard algorithm with procedural fluency.' },
  { code: 'MA.5.NSO.2.2', grade: 5, strand: 'NSO', lane: 2,
    title: 'Multi-digit division',
    text: 'Divide multi-digit whole numbers, up to five digits by two digits, using a standard algorithm.' },
  { code: 'MA.5.FR.2.1',  grade: 5, strand: 'FR',  lane: 0,
    title: 'Add/subtract unlike fractions',
    text: 'Add and subtract fractions with unlike denominators, including mixed numbers and fractions greater than 1.' },
  { code: 'MA.5.FR.2.2',  grade: 5, strand: 'FR',  lane: 1,
    title: 'Multiply fractions',
    text: 'Extend previous understanding to multiply a fraction by a fraction, including mixed numbers and fractions greater than 1.' },
  { code: 'MA.5.AR.1.2',  grade: 5, strand: 'AR',  lane: 0,
    title: 'Solve multi-step problems',
    text: 'Solve real-world problems involving the addition, subtraction or multiplication of fractions, including mixed numbers.' },
  { code: 'MA.5.GR.3.1',  grade: 5, strand: 'GR',  lane: 0,
    title: 'Volume of right rect. prisms',
    text: 'Explore volume as an attribute of three-dimensional figures by packing them with unit cubes.' },
  { code: 'MA.5.DP.1.1',  grade: 5, strand: 'DP',  lane: 0,
    title: 'Display & interpret numerical data',
    text: 'Collect and represent numerical data, including fractional values, using line plots.' },

  // ---- Grade 6 ----
  { code: 'MA.6.NSO.1.1', grade: 6, strand: 'NSO', lane: 0,
    title: 'Extend to negative numbers',
    text: 'Extend previous understanding of numbers to define rational numbers; plot, order and compare on a number line.' },
  { code: 'MA.6.NSO.2.1', grade: 6, strand: 'NSO', lane: 1,
    title: 'Operations with positive rationals',
    text: 'Multiply and divide positive multi-digit numbers with decimals to the thousandths, with procedural fluency.' },
  { code: 'MA.6.AR.1.3',  grade: 6, strand: 'AR',  lane: 0,
    title: 'Equivalent algebraic expressions',
    text: 'Generate equivalent algebraic expressions using the properties of operations.' },
  { code: 'MA.6.AR.2.3',  grade: 6, strand: 'AR',  lane: 1,
    title: 'One-step equations & inequalities',
    text: 'Given a mathematical or real-world context, write and solve one-step equations involving any of the four operations.' },
  { code: 'MA.6.AR.3.2',  grade: 6, strand: 'AR',  lane: 2,
    title: 'Ratios & unit rates',
    text: 'Given a real-world context, determine a ratio, a rate or a unit rate between two quantities.' },
  { code: 'MA.6.GR.2.1',  grade: 6, strand: 'GR',  lane: 0,
    title: 'Area of polygons',
    text: 'Derive a formula for the area of a right triangle using a rectangle. Apply a formula to find the area.' },
  { code: 'MA.6.DP.1.2',  grade: 6, strand: 'DP',  lane: 0,
    title: 'Measures of center & variation',
    text: 'Given a numerical data set, calculate and interpret mean, median, mode and range.' },

  // ---- Grade 7 ----
  { code: 'MA.7.NSO.2.2', grade: 7, strand: 'NSO', lane: 1,
    title: 'Ops with rational numbers (fluency)',
    text: 'Add, subtract, multiply and divide rational numbers with procedural fluency.' },
  { code: 'MA.7.AR.1.2',  grade: 7, strand: 'AR',  lane: 0,
    title: 'Equivalence of linear expressions',
    text: 'Determine whether two linear expressions are equivalent.' },
  { code: 'MA.7.AR.2.1',  grade: 7, strand: 'AR',  lane: 1,
    title: 'Two-step equations',
    text: 'Write and solve one-variable, two-step equations, where all terms are rational numbers.' },
  { code: 'MA.7.AR.3.3',  grade: 7, strand: 'AR',  lane: 2,
    title: 'Proportional relationships',
    text: 'Solve mathematical and real-world problems involving proportional relationships.' },
  { code: 'MA.7.GR.1.5',  grade: 7, strand: 'GR',  lane: 0,
    title: 'Circumference & area of circles',
    text: 'Solve real-world problems involving the area of circles and surface area of right circular cylinders.' },
  { code: 'MA.7.DP.1.3',  grade: 7, strand: 'DP',  lane: 0,
    title: 'Compare data distributions',
    text: 'Given two numerical or graphical representations of data, compare measures of center and variation.' },
];

// Prerequisite → builds-toward
const CONNECTIONS = [
  // NSO progression
  ['MA.4.NSO.1.1', 'MA.5.NSO.1.1'],
  ['MA.4.NSO.2.2', 'MA.5.NSO.2.1'],
  ['MA.5.NSO.2.1', 'MA.5.NSO.2.2'],
  ['MA.5.NSO.1.1', 'MA.6.NSO.2.1'],
  ['MA.5.NSO.2.2', 'MA.6.NSO.2.1'],
  ['MA.6.NSO.1.1', 'MA.7.NSO.2.2'],
  ['MA.6.NSO.2.1', 'MA.7.NSO.2.2'],
  // FR progression
  ['MA.4.FR.1.1', 'MA.5.FR.2.1'],
  ['MA.4.FR.2.2', 'MA.5.FR.2.1'],
  ['MA.5.FR.2.1', 'MA.5.FR.2.2'],
  ['MA.5.FR.2.2', 'MA.6.NSO.2.1'],
  // AR progression
  ['MA.4.AR.1.2', 'MA.5.AR.1.2'],
  ['MA.5.AR.1.2', 'MA.6.AR.3.2'],
  ['MA.6.AR.1.3', 'MA.7.AR.1.2'],
  ['MA.6.AR.2.3', 'MA.7.AR.2.1'],
  ['MA.6.AR.3.2', 'MA.7.AR.3.3'],
  ['MA.6.NSO.1.1', 'MA.7.AR.2.1'],
  // GR progression
  ['MA.4.GR.1.1', 'MA.5.GR.3.1'],
  ['MA.5.GR.3.1', 'MA.6.GR.2.1'],
  ['MA.6.GR.2.1', 'MA.7.GR.1.5'],
  // DP progression
  ['MA.4.DP.1.2', 'MA.5.DP.1.1'],
  ['MA.5.DP.1.1', 'MA.6.DP.1.2'],
  ['MA.6.DP.1.2', 'MA.7.DP.1.3'],
];

// Practice problems indexed by standard code
const PROBLEMS = {
  'MA.5.FR.2.1': [
    { tag: 'Foundational', q: 'Compute: 2/3 + 1/4', a: '11/12',
      hint: 'Common denominator is 12. 2/3 = 8/12 and 1/4 = 3/12.' },
    { tag: 'Application', q: 'Maya read 3/8 of her book Monday and 1/4 Tuesday. What fraction did she read in total?',
      a: '5/8', hint: 'Use a common denominator of 8: 1/4 = 2/8.' },
    { tag: 'Reasoning', q: 'Without computing exactly, is 7/8 + 11/12 less than, equal to, or greater than 2? Justify.',
      a: 'Less than 2', hint: 'Each addend is less than 1, so their sum is less than 2.' },
  ],
  'MA.5.FR.2.2': [
    { tag: 'Foundational', q: 'Compute: 2/5 × 3/4', a: '6/20 = 3/10',
      hint: 'Multiply numerators and denominators, then simplify.' },
    { tag: 'Application', q: 'A recipe needs 2/3 cup flour. You make 3/4 of the recipe. How much flour?',
      a: '1/2 cup', hint: '2/3 × 3/4 = 6/12 = 1/2.' },
  ],
  'MA.6.NSO.1.1': [
    { tag: 'Foundational', q: 'Plot −3, 0, 1.5, and −0.5 on a number line.', a: 'See number line',
      hint: '0 is between negatives and positives. −0.5 is halfway between 0 and −1.' },
    { tag: 'Application', q: 'A submarine is at −85 ft. A diver is at −30 ft. Who is closer to sea level?',
      a: 'The diver', hint: 'Closer to 0 means closer to sea level.' },
  ],
  'MA.6.AR.2.3': [
    { tag: 'Foundational', q: 'Solve: x + 7 = 15', a: 'x = 8',
      hint: 'Subtract 7 from both sides.' },
    { tag: 'Application', q: 'A book costs $12 after a $3 discount. Write & solve an equation for original price p.',
      a: 'p − 3 = 12, p = $15', hint: 'Set up: original − discount = sale price.' },
  ],
  'MA.6.AR.3.2': [
    { tag: 'Foundational', q: 'A store sells 3 oranges for $2.40. What is the unit rate?',
      a: '$0.80 per orange', hint: 'Divide $2.40 ÷ 3.' },
    { tag: 'Application', q: 'A car drives 180 miles in 3 hours. At this rate, how far in 5 hours?',
      a: '300 miles', hint: 'Unit rate is 60 mph; multiply by 5.' },
  ],
  'MA.7.AR.2.1': [
    { tag: 'Foundational', q: 'Solve: 3x + 5 = 20', a: 'x = 5',
      hint: 'Subtract 5, then divide by 3.' },
    { tag: 'Application', q: 'A taxi charges $4 plus $2 per mile. Total cost was $18. How many miles?',
      a: '7 miles', hint: 'Set up 2m + 4 = 18.' },
    { tag: 'Reasoning', q: 'Explain why solving 2x − 3 = 11 and 2x = 14 give the same x.',
      a: 'Equivalent equations', hint: 'Adding 3 to both sides preserves equality.' },
  ],
  'MA.7.AR.3.3': [
    { tag: 'Foundational', q: 'If 5 notebooks cost $12.50, what is the cost of 8?',
      a: '$20', hint: 'Unit price is $2.50; multiply by 8.' },
    { tag: 'Application', q: 'On a map, 2 cm represents 15 miles. How many miles do 7 cm represent?',
      a: '52.5 miles', hint: 'Set up the proportion 2/15 = 7/x.' },
  ],
  'MA.4.NSO.2.2': [
    { tag: 'Foundational', q: 'Compute: 47 × 23', a: '1,081',
      hint: 'Use the standard algorithm or area model.' },
    { tag: 'Application', q: 'A theater has 28 rows of 36 seats. How many seats?',
      a: '1,008 seats', hint: 'Multiply 28 × 36.' },
  ],
  'MA.5.NSO.2.1': [
    { tag: 'Foundational', q: 'Compute: 234 × 56', a: '13,104',
      hint: 'Standard algorithm: multiply by ones, then tens.' },
  ],
  'MA.5.NSO.2.2': [
    { tag: 'Foundational', q: 'Compute: 1,248 ÷ 16', a: '78',
      hint: 'Long division.' },
  ],
  'MA.6.NSO.2.1': [
    { tag: 'Foundational', q: 'Compute: 4.5 × 0.3', a: '1.35',
      hint: 'Multiply 45 × 3 = 135, then place decimal.' },
  ],
  'MA.6.AR.1.3': [
    { tag: 'Foundational', q: 'Simplify: 3(x + 4) − 2x', a: 'x + 12',
      hint: 'Distribute first, then combine like terms.' },
  ],
  'MA.7.AR.1.2': [
    { tag: 'Foundational', q: 'Are 2(x + 3) and 2x + 6 equivalent?', a: 'Yes',
      hint: 'Distribute to check.' },
  ],
  'MA.7.NSO.2.2': [
    { tag: 'Foundational', q: 'Compute: −3/4 × 8/9', a: '−2/3',
      hint: 'Multiply, simplify, keep the negative sign.' },
  ],
};

// ============================================================
// LAYOUT MATH
// ============================================================

const STRAND_ORDER = ['NSO', 'FR', 'AR', 'GR', 'DP'];
const GRADES = [4, 5, 6, 7];

const COL_WIDTH = 260;
const COL_GAP = 0;
const LANE_PADDING_TOP = 16;
const NODE_HEIGHT = 64;
const NODE_GAP = 8;
const HEADER_HEIGHT = 56;
const NODE_PADDING_X = 28;

// Compute lane heights based on max nodes in any (strand) across grades
function computeLayout() {
  const laneCounts = {};
  for (const s of STRAND_ORDER) laneCounts[s] = 0;
  for (const g of GRADES) {
    for (const s of STRAND_ORDER) {
      const count = STANDARDS.filter(st => st.grade === g && st.strand === s).length;
      laneCounts[s] = Math.max(laneCounts[s], count);
    }
  }

  const laneHeights = {};
  for (const s of STRAND_ORDER) {
    laneHeights[s] = LANE_PADDING_TOP * 2 + (laneCounts[s] * NODE_HEIGHT) + ((laneCounts[s] - 1) * NODE_GAP);
  }

  const laneTops = {};
  let cursor = HEADER_HEIGHT;
  for (const s of STRAND_ORDER) {
    laneTops[s] = cursor;
    cursor += laneHeights[s];
  }
  const totalHeight = cursor;

  // Position each standard
  const positions = {};
  for (const std of STANDARDS) {
    const colIdx = GRADES.indexOf(std.grade);
    const x = NODE_PADDING_X + colIdx * (COL_WIDTH + COL_GAP);
    const y = laneTops[std.strand] + LANE_PADDING_TOP + std.lane * (NODE_HEIGHT + NODE_GAP);
    const w = COL_WIDTH - NODE_PADDING_X * 2;
    positions[std.code] = { x, y, w, h: NODE_HEIGHT };
  }

  const totalWidth = NODE_PADDING_X * 2 + GRADES.length * COL_WIDTH + (GRADES.length - 1) * COL_GAP;

  return { positions, laneTops, laneHeights, totalHeight, totalWidth };
}

// ============================================================
// COMPONENT
// ============================================================

export default function FloridaMathCoherenceMap() {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [strandFilter, setStrandFilter] = useState(new Set(STRAND_ORDER));
  const [problemIdx, setProblemIdx] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const layout = useMemo(() => computeLayout(), []);
  const standardsByCode = useMemo(() => {
    const map = {};
    for (const s of STANDARDS) map[s.code] = s;
    return map;
  }, []);

  // Connected sets for the selected node
  const { upstream, downstream } = useMemo(() => {
    if (!selected) return { upstream: new Set(), downstream: new Set() };
    const up = new Set();
    const down = new Set();
    // Walk backwards
    const walkUp = (code) => {
      for (const [from, to] of CONNECTIONS) {
        if (to === code && !up.has(from)) {
          up.add(from);
          walkUp(from);
        }
      }
    };
    const walkDown = (code) => {
      for (const [from, to] of CONNECTIONS) {
        if (from === code && !down.has(to)) {
          down.add(to);
          walkDown(to);
        }
      }
    };
    walkUp(selected);
    walkDown(selected);
    return { upstream: up, downstream: down };
  }, [selected]);

  const isVisible = (code) => {
    const std = standardsByCode[code];
    return strandFilter.has(std.strand);
  };

  const toggleStrand = (s) => {
    const next = new Set(strandFilter);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    if (next.size === 0) return; // keep at least one
    setStrandFilter(next);
  };

  const selectedStd = selected ? standardsByCode[selected] : null;
  const problems = selected ? (PROBLEMS[selected] || []) : [];

  useEffect(() => {
    setProblemIdx(0);
    setShowHint(false);
    setShowAnswer(false);
  }, [selected]);

  // Build curved path between two nodes
  const buildPath = (from, to) => {
    const a = layout.positions[from];
    const b = layout.positions[to];
    const x1 = a.x + a.w;
    const y1 = a.y + a.h / 2;
    const x2 = b.x;
    const y2 = b.y + b.h / 2;
    const dx = (x2 - x1) * 0.5;
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  };

  const connectionStyle = (from, to) => {
    if (!selected) {
      return { stroke: '#D1D5DB', strokeWidth: 1.25, opacity: 0.65 };
    }
    const involves = (from === selected || to === selected);
    const inChain = (upstream.has(from) && (to === selected || upstream.has(to))) ||
                    (downstream.has(to) && (from === selected || downstream.has(from)));
    if (involves || inChain) {
      const fromStd = standardsByCode[from];
      return { stroke: STRANDS[fromStd.strand].color, strokeWidth: 2, opacity: 0.85 };
    }
    return { stroke: '#E5E7EB', strokeWidth: 1, opacity: 0.25 };
  };

  return (
    <div className="w-full min-h-screen" style={{
      background: 'linear-gradient(180deg, #FAF8F3 0%, #F5F1E8 100%)',
      fontFamily: '"Manrope", -apple-system, BlinkMacSystemFont, sans-serif',
      color: '#1A1F2E',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');
        .font-display { font-family: 'Fraunces', Georgia, serif; font-optical-sizing: auto; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .map-scroll::-webkit-scrollbar { height: 10px; width: 10px; }
        .map-scroll::-webkit-scrollbar-track { background: transparent; }
        .map-scroll::-webkit-scrollbar-thumb { background: #D6CFBE; border-radius: 6px; }
        .map-scroll::-webkit-scrollbar-thumb:hover { background: #B8AE96; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 280ms ease-out; }
      `}</style>

      {/* HEADER */}
      <header className="px-8 py-6 border-b" style={{ borderColor: '#E5DCC5', background: 'rgba(255,253,247,0.7)', backdropFilter: 'blur(8px)' }}>
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, #1E40AF, #6D28D9)',
              boxShadow: '0 4px 12px rgba(30,64,175,0.25)',
            }}>
              <Compass className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: '#7A6E54' }}>
                Florida B.E.S.T. Math Standards
              </div>
              <h1 className="font-display text-3xl font-medium leading-tight tracking-tight" style={{ color: '#1A1F2E' }}>
                Coherence <span className="italic" style={{ color: '#B45309' }}>Atlas</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm" style={{ color: '#5C5544' }}>
            <Layers className="w-4 h-4" />
            <span>{STANDARDS.length} benchmarks</span>
            <span className="opacity-40">·</span>
            <span>{CONNECTIONS.length} prerequisite links</span>
            <span className="opacity-40">·</span>
            <span>Grades 4–7</span>
          </div>
        </div>
      </header>

      {/* CONTROLS */}
      <div className="px-8 py-4 border-b" style={{ borderColor: '#E5DCC5' }}>
        <div className="max-w-[1400px] mx-auto flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold" style={{ color: '#7A6E54' }}>
            <Filter className="w-3.5 h-3.5" />
            Strands
          </div>
          {STRAND_ORDER.map(s => {
            const active = strandFilter.has(s);
            return (
              <button
                key={s}
                onClick={() => toggleStrand(s)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: active ? STRANDS[s].color : 'transparent',
                  color: active ? 'white' : STRANDS[s].color,
                  border: `1.5px solid ${STRANDS[s].color}`,
                  opacity: active ? 1 : 0.55,
                  letterSpacing: '0.02em',
                }}
              >
                {s} · {STRANDS[s].name}
              </button>
            );
          })}
          {selected && (
            <button
              onClick={() => setSelected(null)}
              className="ml-auto px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5"
              style={{ background: '#1A1F2E', color: '#FAF8F3' }}
            >
              <X className="w-3.5 h-3.5" />
              Clear selection
            </button>
          )}
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="max-w-[1400px] mx-auto flex gap-0 px-8 py-6" style={{ minHeight: 'calc(100vh - 180px)' }}>

        {/* MAP */}
        <div className={`flex-1 transition-all duration-300 ${selected ? 'pr-6' : ''}`}>
          <div className="rounded-2xl overflow-hidden border map-scroll" style={{
            borderColor: '#E5DCC5',
            background: '#FFFDF7',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px -8px rgba(60,40,10,0.08)',
            overflowX: 'auto',
            overflowY: 'auto',
            maxHeight: '78vh',
          }}>
            <svg
              width={layout.totalWidth}
              height={layout.totalHeight}
              style={{ display: 'block' }}
            >
              {/* Strand lane backgrounds */}
              {STRAND_ORDER.map(s => (
                <g key={`lane-${s}`}>
                  <rect
                    x={0}
                    y={layout.laneTops[s]}
                    width={layout.totalWidth}
                    height={layout.laneHeights[s]}
                    fill={STRANDS[s].tint}
                    opacity={strandFilter.has(s) ? 1 : 0.3}
                  />
                  <text
                    x={12}
                    y={layout.laneTops[s] + 18}
                    fontSize={10}
                    fontWeight={700}
                    letterSpacing={1.5}
                    fill={STRANDS[s].color}
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    {s.toUpperCase()}
                  </text>
                </g>
              ))}

              {/* Grade column headers */}
              {GRADES.map((g, i) => {
                const x = NODE_PADDING_X + i * COL_WIDTH;
                return (
                  <g key={`grade-${g}`}>
                    <line
                      x1={x - NODE_PADDING_X / 2}
                      y1={HEADER_HEIGHT}
                      x2={x - NODE_PADDING_X / 2}
                      y2={layout.totalHeight}
                      stroke="#E5DCC5"
                      strokeWidth={1}
                      strokeDasharray="2 4"
                    />
                    <text
                      x={x + (COL_WIDTH - NODE_PADDING_X * 2) / 2}
                      y={32}
                      fontSize={11}
                      fontWeight={700}
                      letterSpacing={2}
                      fill="#7A6E54"
                      textAnchor="middle"
                      style={{ fontFamily: 'JetBrains Mono, monospace' }}
                    >
                      GRADE
                    </text>
                    <text
                      x={x + (COL_WIDTH - NODE_PADDING_X * 2) / 2}
                      y={50}
                      fontSize={22}
                      fontWeight={500}
                      fill="#1A1F2E"
                      textAnchor="middle"
                      style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic' }}
                    >
                      {g}
                    </text>
                  </g>
                );
              })}

              {/* Connection lines */}
              <g>
                {CONNECTIONS.map(([from, to]) => {
                  if (!isVisible(from) || !isVisible(to)) return null;
                  const style = connectionStyle(from, to);
                  return (
                    <path
                      key={`${from}-${to}`}
                      d={buildPath(from, to)}
                      fill="none"
                      stroke={style.stroke}
                      strokeWidth={style.strokeWidth}
                      opacity={style.opacity}
                      style={{ transition: 'all 280ms ease' }}
                    />
                  );
                })}
              </g>

              {/* Standard nodes */}
              <g>
                {STANDARDS.map(std => {
                  if (!isVisible(std.code)) return null;
                  const pos = layout.positions[std.code];
                  const isSelected = selected === std.code;
                  const isHovered = hovered === std.code;
                  const isUpstream = upstream.has(std.code);
                  const isDownstream = downstream.has(std.code);
                  const isInChain = isSelected || isUpstream || isDownstream;
                  const dimmed = selected && !isInChain;
                  const color = STRANDS[std.strand].color;

                  return (
                    <g
                      key={std.code}
                      style={{
                        cursor: 'pointer',
                        transition: 'opacity 200ms ease',
                        opacity: dimmed ? 0.3 : 1,
                      }}
                      onClick={() => setSelected(std.code)}
                      onMouseEnter={() => setHovered(std.code)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      {/* Selection halo */}
                      {isSelected && (
                        <rect
                          x={pos.x - 4}
                          y={pos.y - 4}
                          width={pos.w + 8}
                          height={pos.h + 8}
                          rx={12}
                          fill="none"
                          stroke={color}
                          strokeWidth={2}
                          opacity={0.4}
                        />
                      )}
                      {/* Node body */}
                      <rect
                        x={pos.x}
                        y={pos.y}
                        width={pos.w}
                        height={pos.h}
                        rx={10}
                        fill="white"
                        stroke={isSelected ? color : (isHovered ? color : '#E5DCC5')}
                        strokeWidth={isSelected ? 2 : (isHovered ? 1.5 : 1)}
                        style={{
                          filter: isHovered || isSelected
                            ? `drop-shadow(0 4px 12px ${color}33)`
                            : 'drop-shadow(0 1px 2px rgba(0,0,0,0.05))',
                          transition: 'all 200ms ease',
                        }}
                      />
                      {/* Strand stripe */}
                      <rect
                        x={pos.x}
                        y={pos.y}
                        width={4}
                        height={pos.h}
                        rx={2}
                        fill={color}
                      />
                      {/* Code */}
                      <text
                        x={pos.x + 14}
                        y={pos.y + 22}
                        fontSize={10}
                        fontWeight={600}
                        fill={color}
                        style={{ fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.02em' }}
                      >
                        {std.code}
                      </text>
                      {/* Title */}
                      <text
                        x={pos.x + 14}
                        y={pos.y + 42}
                        fontSize={13}
                        fontWeight={600}
                        fill="#1A1F2E"
                      >
                        {std.title.length > 30 ? std.title.slice(0, 28) + '…' : std.title}
                      </text>
                      {/* Indicator: has problems */}
                      {PROBLEMS[std.code] && (
                        <g>
                          <circle
                            cx={pos.x + pos.w - 14}
                            cy={pos.y + 14}
                            r={4}
                            fill={color}
                          />
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* HINT */}
          {!selected && (
            <div className="mt-4 px-4 py-3 rounded-lg flex items-start gap-3 text-sm fade-in" style={{
              background: '#FFFDF7', border: '1px dashed #D6CFBE', color: '#5C5544',
            }}>
              <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#B45309' }} />
              <div>
                <strong style={{ color: '#1A1F2E' }}>Tap any benchmark</strong> to see its description, prerequisites, what it builds toward, and aligned practice problems.
                The colored stripe indicates the strand; a small dot means problems are available.
              </div>
            </div>
          )}
        </div>

        {/* SIDE PANEL */}
        {selectedStd && (
          <aside className="w-[420px] flex-shrink-0 fade-in" style={{ minWidth: 380 }}>
            <div className="rounded-2xl border overflow-hidden sticky top-6" style={{
              borderColor: '#E5DCC5',
              background: '#FFFDF7',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 32px -8px rgba(60,40,10,0.10)',
            }}>
              {/* Panel header */}
              <div style={{
                padding: '20px 24px 16px',
                background: STRANDS[selectedStd.strand].tint,
                borderBottom: `1px solid ${STRANDS[selectedStd.strand].color}33`,
              }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-[0.16em] font-bold px-2 py-1 rounded" style={{
                    color: 'white',
                    background: STRANDS[selectedStd.strand].color,
                  }}>
                    {STRANDS[selectedStd.strand].name}
                  </span>
                  <button
                    onClick={() => setSelected(null)}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                    style={{ background: 'rgba(0,0,0,0.05)' }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="font-mono text-xs font-semibold mb-2" style={{ color: STRANDS[selectedStd.strand].color }}>
                  {selectedStd.code}
                </div>
                <h2 className="font-display text-2xl font-medium leading-tight tracking-tight" style={{ color: '#1A1F2E' }}>
                  {selectedStd.title}
                </h2>
              </div>

              {/* Description */}
              <div className="px-6 py-5">
                <div className="text-[11px] uppercase tracking-wider font-bold mb-2" style={{ color: '#7A6E54' }}>
                  Benchmark
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#3A3528' }}>
                  {selectedStd.text}
                </p>
              </div>

              {/* Connections */}
              <div className="px-6 pb-4 space-y-3">
                {upstream.size > 0 && (
                  <div>
                    <div className="text-[11px] uppercase tracking-wider font-bold mb-2 flex items-center gap-1.5" style={{ color: '#7A6E54' }}>
                      <ArrowUpRight className="w-3 h-3 rotate-[225deg]" /> Builds on
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[...upstream].map(code => {
                        const s = standardsByCode[code];
                        return (
                          <button
                            key={code}
                            onClick={() => setSelected(code)}
                            className="px-2 py-1 rounded text-[11px] font-mono font-semibold transition-colors"
                            style={{
                              background: STRANDS[s.strand].tint,
                              color: STRANDS[s.strand].color,
                              border: `1px solid ${STRANDS[s.strand].color}33`,
                            }}
                          >
                            {code}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {downstream.size > 0 && (
                  <div>
                    <div className="text-[11px] uppercase tracking-wider font-bold mb-2 flex items-center gap-1.5" style={{ color: '#7A6E54' }}>
                      <ArrowUpRight className="w-3 h-3" /> Builds toward
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[...downstream].map(code => {
                        const s = standardsByCode[code];
                        return (
                          <button
                            key={code}
                            onClick={() => setSelected(code)}
                            className="px-2 py-1 rounded text-[11px] font-mono font-semibold transition-colors"
                            style={{
                              background: STRANDS[s.strand].tint,
                              color: STRANDS[s.strand].color,
                              border: `1px solid ${STRANDS[s.strand].color}33`,
                            }}
                          >
                            {code}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Practice problems */}
              <div className="border-t px-6 py-5" style={{ borderColor: '#E5DCC5', background: '#FBF8F0' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[11px] uppercase tracking-wider font-bold flex items-center gap-1.5" style={{ color: '#7A6E54' }}>
                    <BookOpen className="w-3 h-3" /> Practice
                  </div>
                  {problems.length > 1 && (
                    <div className="flex items-center gap-1">
                      {problems.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => { setProblemIdx(i); setShowHint(false); setShowAnswer(false); }}
                          className="w-6 h-6 rounded-full text-[11px] font-mono font-bold transition-colors"
                          style={{
                            background: i === problemIdx ? STRANDS[selectedStd.strand].color : 'transparent',
                            color: i === problemIdx ? 'white' : '#7A6E54',
                            border: `1px solid ${i === problemIdx ? STRANDS[selectedStd.strand].color : '#D6CFBE'}`,
                          }}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {problems.length > 0 ? (
                  <div className="fade-in" key={problemIdx}>
                    <div className="text-[10px] uppercase tracking-[0.12em] font-bold mb-2" style={{
                      color: STRANDS[selectedStd.strand].color,
                    }}>
                      {problems[problemIdx].tag}
                    </div>
                    <div className="text-[15px] leading-relaxed font-medium mb-4" style={{ color: '#1A1F2E' }}>
                      {problems[problemIdx].q}
                    </div>

                    <div className="space-y-2">
                      {!showHint && !showAnswer && (
                        <button
                          onClick={() => setShowHint(true)}
                          className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                          style={{ background: 'white', color: '#B45309', border: '1px solid #E5DCC5' }}
                        >
                          <Lightbulb className="w-4 h-4" /> Show a hint
                        </button>
                      )}
                      {showHint && (
                        <div className="px-3 py-2.5 rounded-lg text-sm fade-in" style={{
                          background: '#FEF3C7', color: '#78350F', border: '1px solid #FCD34D',
                        }}>
                          <div className="flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{problems[problemIdx].hint}</span>
                          </div>
                        </div>
                      )}
                      {!showAnswer && (
                        <button
                          onClick={() => setShowAnswer(true)}
                          className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2"
                          style={{
                            background: STRANDS[selectedStd.strand].color,
                            color: 'white',
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4" /> Reveal answer
                        </button>
                      )}
                      {showAnswer && (
                        <div className="px-3 py-2.5 rounded-lg text-sm fade-in" style={{
                          background: '#DCFCE7', color: '#14532D', border: '1px solid #86EFAC',
                        }}>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="text-[10px] uppercase tracking-wider font-bold mb-0.5">Answer</div>
                              <div className="font-semibold">{problems[problemIdx].a}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm py-2" style={{ color: '#7A6E54' }}>
                    No practice problems yet for this benchmark. <span className="italic">Add some via the authoring tool.</span>
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      <footer className="px-8 py-6 text-center text-xs" style={{ color: '#7A6E54', borderTop: '1px solid #E5DCC5' }}>
        Prototype showing a slice of grades 4–7. Full atlas would span K–12 with all FL B.E.S.T. benchmarks and curated problem banks.
      </footer>
    </div>
  );
}
