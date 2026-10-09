/**
 * Dev-only fixture gallery for the deterministic visual primitives.
 *
 * Mounted at hash `#/dev/visuals` only when `import.meta.env.DEV` is true.
 * Renders one realistic example of each visualType plus the JSON spec, and a
 * live tester at the bottom that runs the schema and semantic alignment
 * validators against any spec + question stem you paste.
 */
import React, { useMemo, useState } from 'react';
import {
  isDeterministicVisualSpecType,
  normalizeVisualSpec,
  renderDeterministicVisualSvg,
} from '../utils/visualSpec';
import { validateQuestionVisualSpec } from '../server/visualSpecValidation';
import { validateVisualSpecAgainstQuestion } from '../server/visualSpecAnswerAlignment';
import { getPreferredVisualPolicy } from '../utils/standardVisualPreferences';
import { questionStemRequiresImage } from '../utils/questionStemRequiresImage';
import type { VisualSpec } from '../types';

interface Fixture {
  label: string;
  spec: VisualSpec;
  stem: string;
  correctOption: string;
}

const FIXTURES: Fixture[] = [
  {
    label: 'ten_frame — 7 filled',
    spec: { visualType: 'ten_frame', values: [1, 1, 1, 1, 1, 1, 1, 0, 0, 0] },
    stem: 'Count the dots shown in the ten frame. There are 7.',
    correctOption: '7',
  },
  {
    label: 'number_line — mark 3 and 7',
    spec: { visualType: 'number_line', min: 0, max: 10, tickStep: 1, values: [3, 7] },
    stem: 'On the number line, mark 3 and 7.',
    correctOption: '3 and 7',
  },
  {
    label: 'fraction_bar — 3/8 shaded',
    spec: { visualType: 'fraction_bar', totalParts: 8, shadedParts: 3 },
    stem: 'Which bar shows 3/8 shaded?',
    correctOption: '3/8',
  },
  {
    label: 'fraction_circle — 5/6 shaded',
    spec: { visualType: 'fraction_circle', totalParts: 6, shadedParts: 5 },
    stem: 'Which circle shows 5/6 shaded?',
    correctOption: '5/6',
  },
  {
    label: 'array_model — 3×4 with all dots',
    spec: {
      visualType: 'array_model',
      gridRows: 3,
      gridCols: 4,
      values: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    },
    stem: 'Show a 3 by 4 array of stars. The product is 12.',
    correctOption: '12',
  },
  {
    label: 'area_model — 23 × 47 partial product',
    spec: {
      visualType: 'area_model',
      gridRows: 2,
      gridCols: 2,
      rowLabels: ['20', '3'],
      colLabels: ['40', '7'],
      cellLabels: ['800', '140', '120', '21'],
    },
    stem:
      'Use the area model to find 23 × 47. Decompose 23 as 20 and 3, and 47 as 40 and 7.',
    correctOption: '1081',
  },
  {
    label: 'coordinate_plane — three plotted points',
    spec: {
      visualType: 'coordinate_plane',
      xMin: -5,
      xMax: 5,
      yMin: -5,
      yMax: 5,
      points: [
        { x: 2, y: 3, label: 'A' },
        { x: -3, y: 1, label: 'B' },
        { x: 0, y: -4, label: 'C' },
      ],
      xLabel: 'x',
      yLabel: 'y',
    },
    stem: 'Plot points A (2, 3), B (-3, 1), and C (0, -4) on the coordinate plane.',
    correctOption: '(2, 3), (-3, 1), (0, -4)',
  },
  {
    label: 'geometric_shape — triangle with side labels',
    spec: {
      visualType: 'geometric_shape',
      shapeName: 'triangle',
      sideLabels: ['5 cm', '5 cm', '5 cm'],
    },
    stem: 'A triangle has three sides each measuring 5 cm.',
    correctOption: '5 cm',
  },
  {
    label: 'geometric_shape — hexagon',
    spec: { visualType: 'geometric_shape', shapeName: 'hexagon' },
    stem: 'How many sides does a hexagon have?',
    correctOption: '6',
  },
  {
    label: 'bar_model — 12 + 12 + ?',
    spec: {
      visualType: 'bar_model',
      segmentLabels: ['12', '12', '?'],
      segmentWeights: [1, 1, 1],
      segmentShaded: [1, 1, 0],
    },
    stem: 'Sam has 12 marbles and gets 12 more. How many in all?',
    correctOption: '24',
  },
  {
    label: 'clock_face — 3:15',
    spec: { visualType: 'clock_face', hour: 3, minute: 15 },
    stem: 'What time does the clock show? 3:15.',
    correctOption: '3:15',
  },
  {
    label: 'line_plot — books read',
    spec: {
      visualType: 'line_plot',
      xLabel: 'Books Read',
      values: [2, 2, 3, 5, 5, 5, 8],
    },
    stem: 'The line plot shows books read by 7 students.',
    correctOption: 'Books Read',
  },
  {
    label: 'table — practice minutes',
    spec: {
      visualType: 'table',
      title: 'Flute Practice',
      columns: ['Day', 'Minutes'],
      rows: [
        ['Monday', '20'],
        ['Tuesday', '25'],
        ['Wednesday', '20'],
      ],
    },
    stem: 'The table shows Day and Minutes of practice.',
    correctOption: 'Day, Minutes',
  },
  {
    label: 'bar_chart — pets',
    spec: {
      visualType: 'bar_chart',
      categories: ['dogs', 'cats', 'fish'],
      values: [4, 2, 3],
      xLabel: 'pet',
      yLabel: 'count',
    },
    stem: 'Pets owned by students: 4 dogs, 2 cats, 3 fish.',
    correctOption: '4 dogs',
  },
];

const PolicyDemo: React.FC = () => {
  const [code, setCode] = useState('MA.4.FR.2.1');
  const policy = useMemo(() => getPreferredVisualPolicy(code), [code]);
  return (
    <section style={{ marginTop: 32, padding: 16, border: '1px solid #cbd5e1', borderRadius: 12 }}>
      <h2 style={{ margin: 0, marginBottom: 12 }}>Per-standard policy</h2>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="MA.X.Y.Z.W"
        style={{
          fontSize: 16,
          padding: '8px 12px',
          border: '1px solid #cbd5e1',
          borderRadius: 8,
          width: '100%',
          maxWidth: 400,
        }}
      />
      <pre style={{ marginTop: 12 }}>{JSON.stringify(policy, null, 2)}</pre>
    </section>
  );
};

const SpecTester: React.FC = () => {
  const [stem, setStem] = useState(
    'Which bar shows 3/8 shaded? The correct answer is 3/8.',
  );
  const [json, setJson] = useState(
    JSON.stringify(
      { visualType: 'fraction_bar', totalParts: 8, shadedParts: 3 },
      null,
      2,
    ),
  );

  const result = useMemo(() => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch (err) {
      return { error: `Invalid JSON: ${(err as Error).message}` };
    }
    const normalized = normalizeVisualSpec(parsed);
    const schemaError = validateQuestionVisualSpec(parsed);
    const semanticError = validateVisualSpecAgainstQuestion({
      text: stem,
      options: ['placeholder'],
      correctAnswerIndex: 0,
      visualSpec: parsed,
    });
    const stemRequiresImage = questionStemRequiresImage(stem);
    const isDeterministic = isDeterministicVisualSpecType(
      (parsed as { visualType?: string }).visualType,
    );
    const svg = isDeterministic ? renderDeterministicVisualSvg(normalized) : null;
    return {
      schemaError,
      semanticError,
      stemRequiresImage,
      isDeterministic,
      svg,
    };
  }, [json, stem]);

  return (
    <section style={{ marginTop: 32, padding: 16, border: '1px solid #cbd5e1', borderRadius: 12 }}>
      <h2 style={{ margin: 0, marginBottom: 12 }}>Live spec tester</h2>
      <label style={{ display: 'block', marginBottom: 12 }}>
        <div style={{ fontWeight: 600 }}>Stem (with correct option appended)</div>
        <textarea
          value={stem}
          onChange={(e) => setStem(e.target.value)}
          rows={3}
          style={{ width: '100%', fontSize: 14, padding: 8, fontFamily: 'monospace' }}
        />
      </label>
      <label style={{ display: 'block', marginBottom: 12 }}>
        <div style={{ fontWeight: 600 }}>visualSpec JSON</div>
        <textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          rows={10}
          style={{ width: '100%', fontSize: 14, padding: 8, fontFamily: 'monospace' }}
        />
      </label>
      <pre style={{ background: '#f8fafc', padding: 12, borderRadius: 8 }}>
        {JSON.stringify(result, (_k, v) => (typeof v === 'string' && v.startsWith('<svg') ? '<SVG>' : v), 2)}
      </pre>
      {'svg' in result && result.svg ? (
        <div
          style={{ marginTop: 12, border: '1px dashed #cbd5e1', borderRadius: 8 }}
          dangerouslySetInnerHTML={{ __html: result.svg }}
        />
      ) : null}
    </section>
  );
};

const VisualGalleryRoute: React.FC = () => {
  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 24, fontFamily: 'Inter, Arial, sans-serif' }}>
      <h1 style={{ marginTop: 0 }}>Visual Fixture Gallery</h1>
      <p style={{ color: '#475569' }}>
        Dev-only sanity check for the deterministic SVG primitives. Each card shows what the
        AI is expected to produce for a given visualType. Use the live tester below to paste a
        spec and see the full validator chain run on it.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: 16,
          marginTop: 16,
        }}
      >
        {FIXTURES.map((fixture) => {
          const normalized = normalizeVisualSpec(fixture.spec);
          const svg = renderDeterministicVisualSvg(normalized);
          const schemaError = validateQuestionVisualSpec(fixture.spec);
          const semanticError = validateVisualSpecAgainstQuestion({
            text: fixture.stem,
            options: [fixture.correctOption, 'a', 'b', 'c'],
            correctAnswerIndex: 0,
            visualSpec: fixture.spec,
          });
          return (
            <article
              key={fixture.label}
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: 12,
                padding: 12,
                background: '#fff',
              }}
            >
              <h3 style={{ margin: 0, marginBottom: 8 }}>{fixture.label}</h3>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>
                <em>{fixture.stem}</em>
              </div>
              <div
                style={{ background: '#f8fafc', borderRadius: 8, marginBottom: 8 }}
                dangerouslySetInnerHTML={{ __html: svg || '<div>render failed</div>' }}
              />
              <details>
                <summary style={{ cursor: 'pointer' }}>spec JSON</summary>
                <pre style={{ fontSize: 12, overflowX: 'auto' }}>
                  {JSON.stringify(fixture.spec, null, 2)}
                </pre>
              </details>
              <div style={{ marginTop: 8, fontSize: 12 }}>
                <div>schema:&nbsp;{schemaError ? <span style={{ color: '#dc2626' }}>{schemaError}</span> : <span style={{ color: '#059669' }}>OK</span>}</div>
                <div>semantic:&nbsp;{semanticError ? <span style={{ color: '#dc2626' }}>{semanticError}</span> : <span style={{ color: '#059669' }}>OK</span>}</div>
              </div>
            </article>
          );
        })}
      </div>

      <PolicyDemo />
      <SpecTester />
    </main>
  );
};

export default VisualGalleryRoute;
