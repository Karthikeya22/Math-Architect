import { describe, expect, it } from 'vitest';
import type { RemedialSlide } from '../types';
import { buildRemedialPptx, buildSlideBodyRuns, presenterNotesText } from './remedialPptx';

const TRY_IT: RemedialSlide = {
  slideNumber: 6,
  layout: 'try_it',
  title: 'Make wholes from extra parts',
  content: '- Keep fifths as fifths.',
  keyPoints: ['Keep fifths as fifths.'],
  talkingPoints: ['Count fifths first.', 'Ask: how many fifths make 1 whole?'],
  checkQuestion: { prompt: 'What is 6/5 + 2/5?', answer: '8/5 = 1 3/5' },
  vocabulary: [{ term: 'greater than one', meaning: 'More than one whole.' }],
  gapAddressed: 'Decompose greater fractions',
  visualDescription: '',
};

class FakeSlide {
  texts: unknown[] = [];
  images: Array<{ data: string }> = [];
  notes = '';
  background: unknown;
  addText(text: unknown) { this.texts.push(text); return this; }
  addShape() { return this; }
  addImage(options: { data: string }) { this.images.push(options); return this; }
  addNotes(notes: string) { this.notes = notes; return this; }
}

class FakePptx {
  layout = '';
  slides: FakeSlide[] = [];
  ShapeType = { rect: 'rect', roundRect: 'roundRect', line: 'line' };
  addSlide() { const slide = new FakeSlide(); this.slides.push(slide); return slide; }
}

describe('presenterNotesText', () => {
  it('carries the gap, the teacher script, the answer and word meanings', () => {
    expect(presenterNotesText(TRY_IT)).toBe(
      [
        'Fixing: Decompose greater fractions',
        '',
        '- Count fifths first.',
        '- Ask: how many fifths make 1 whole?',
        '',
        'Answer: 8/5 = 1 3/5',
        '',
        'Words: greater than one - More than one whole.',
      ].join('\n'),
    );
  });
});

describe('buildSlideBodyRuns', () => {
  it('puts the practice problem on the slide but keeps its answer off it', () => {
    const text = buildSlideBodyRuns(TRY_IT, 'try_it').map((run) => run.text).join(' ');
    expect(text).toContain('What is 6/5 + 2/5?');
    expect(text).not.toContain('1 3/5');
  });

  it('falls back to the markdown body for old saved decks', () => {
    const runs = buildSlideBodyRuns(
      { slideNumber: 1, title: 'Old', content: '**Bold** idea', visualDescription: '', vocabulary: ['sum'] },
      'concept',
    );
    expect(runs.map((run) => run.text)).toEqual(['Bold idea']);
  });
});

describe('buildRemedialPptx', () => {
  it('adds images without the data: prefix and writes speaker notes', () => {
    const withImage: RemedialSlide = { ...TRY_IT, layout: 'model', generatedImageBase64: 'data:image/jpeg;base64,AAAA' };
    const pres = buildRemedialPptx(FakePptx as never, [withImage, TRY_IT]) as unknown as FakePptx;
    expect(pres.layout).toBe('LAYOUT_16x9');
    expect(pres.slides).toHaveLength(2);
    expect(pres.slides[0].images).toEqual([expect.objectContaining({ data: 'image/jpeg;base64,AAAA' })]);
    expect(pres.slides[1].images).toEqual([]);
    expect(pres.slides[1].notes).toContain('Answer: 8/5 = 1 3/5');
  });
});
