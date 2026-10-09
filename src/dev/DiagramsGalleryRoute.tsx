import React from 'react';
import { MotionDiagram, type MotionDiagramName } from '../components/motion-diagrams';

const SCENES: Array<{ name: MotionDiagramName; title: string; note: string }> = [
  { name: 'Atlas', title: 'Auth', note: 'Standards lattice on a plinth' },
  { name: 'Pin', title: 'Studio', note: 'Pinned standard above quiz sheets' },
  { name: 'Assemble', title: 'Loading · quiz', note: 'Cards seating onto a clipboard' },
  { name: 'Probe', title: 'Loading · analysis', note: 'Skill strip with a gap + loupe' },
  { name: 'Deck', title: 'Loading · slides', note: 'Lesson slides fanning' },
  { name: 'Gaps', title: 'Gap analysis', note: 'Skill bars with a recessed gap' },
  { name: 'Lesson', title: 'Remedial', note: 'Board with fraction bar + slide' },
  { name: 'Blank', title: 'Empty question', note: 'Empty card + chalk question mark' },
];

const DiagramsGalleryRoute: React.FC = () => (
  <div className="min-h-screen p-8" style={{ background: 'var(--app-bg)' }}>
    <h1 className="text-2xl font-semibold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
      Motion diagrams
    </h1>
    <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
      Premium SVG scenes with pointer parallax. Loading scenes use ambient play.
    </p>
    <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
      {SCENES.map((s) => (
        <article
          key={s.name}
          className="app-card p-6 flex flex-col items-center gap-3"
          style={{ background: '#fff' }}
        >
          <MotionDiagram
            name={s.name}
            width={240}
            plate="#ffffff"
            play={s.name === 'Assemble' || s.name === 'Probe' || s.name === 'Deck'}
          />
          <div className="text-center">
            <p className="font-semibold">{s.name}</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {s.title} — {s.note}
            </p>
          </div>
        </article>
      ))}
    </div>
  </div>
);

export default DiagramsGalleryRoute;
