import type pptxgen from 'pptxgenjs';
import type { RemedialSlide, RemedialSlideLayout } from '../types';
import { SLIDE_LAYOUT_LABELS, isLegacySlide, resolveSlideLayout, toVocabEntries } from './remedialDeck';

/** Same hex tones as the `.slide-tone--*` classes, without the leading #. */
const TONES: Record<RemedialSlideLayout, { bg: string; ink: string; line: string }> = {
  gap_overview: { bg: 'EEF0FF', ink: '4338CA', line: 'C7CBF8' },
  concept: { bg: 'F2EDFD', ink: '6D28D9', line: 'DACFFB' },
  model: { bg: 'E3F6F2', ink: '0F766E', line: 'B4E6DC' },
  worked_example: { bg: 'E8F1FC', ink: '1D4ED8', line: 'BFD6F6' },
  mistake_fix: { bg: 'FFF4E2', ink: 'B45309', line: 'FCD9A4' },
  try_it: { bg: 'E8F5EC', ink: '15803D', line: 'BFE3CA' },
};

const INK = '171525';
const BODY = '2E2A40';
const MUTED = '6B6783';

type Run = pptxgen.TextProps;

const label = (text: string, color: string): Run => ({
  text: text.toUpperCase(),
  options: { fontSize: 11, bold: true, color, charSpacing: 1, breakLine: true, paraSpaceAfter: 4 },
});

const para = (text: string, size = 18, extra: pptxgen.TextPropsOptions = {}): Run => ({
  text,
  options: { fontSize: size, color: BODY, breakLine: true, paraSpaceAfter: 8, ...extra },
});

const bullets = (items: string[], size = 18): Run[] =>
  items.map((text) => para(text, size, { bullet: { indent: 18 } }));

const numbered = (items: string[], size = 17): Run[] =>
  items.map((text) => para(text, size, { bullet: { type: 'number', indent: 22 } }));

const stripMarkdown = (text: string) => text.replace(/\*\*/g, '').replace(/^#+\s*/gm, '');

/** Body text for every layout except mistake_fix, which is drawn as two boxes. */
export const buildSlideBodyRuns = (slide: RemedialSlide, layout: RemedialSlideLayout): Run[] => {
  const tone = TONES[layout];
  const points = slide.keyPoints ?? [];
  if (isLegacySlide(slide)) return [para(stripMarkdown(slide.content), 16)];

  switch (layout) {
    case 'gap_overview': {
      const vocab = toVocabEntries(slide.vocabulary).slice(0, 3);
      return [
        label('Today we will fix', tone.ink),
        ...bullets(points),
        ...(vocab.length ? [label('Words to know', tone.ink)] : []),
        ...vocab.map((entry) => para(entry.meaning ? `${entry.term}: ${entry.meaning}` : entry.term, 15)),
      ];
    }
    case 'concept': {
      const [bigIdea, ...rest] = points;
      return [...(bigIdea ? [para(bigIdea, 22, { bold: true, color: INK })] : []), ...bullets(rest)];
    }
    case 'model':
      return numbered(points, 18);
    case 'worked_example': {
      const example = slide.workedExample;
      if (!example) return numbered(points, 18);
      return [
        label('Problem', tone.ink),
        para(example.problem, 20, { bold: true, color: INK }),
        ...numbered(example.steps),
        ...(example.answer ? [label('Answer', tone.ink), para(example.answer, 18, { bold: true, color: INK })] : []),
        ...(points.length ? [para(`Remember: ${points.join(' ')}`, 14, { color: MUTED })] : []),
      ];
    }
    case 'mistake_fix':
      return bullets(points);
    case 'try_it': {
      const check = slide.checkQuestion;
      return [
        ...(check ? [label('Try this', tone.ink), para(check.prompt, 22, { bold: true, color: INK })] : []),
        ...(points.length ? [label('Takeaway', tone.ink), ...bullets(points)] : []),
      ];
    }
  }
};

export const presenterNotesText = (slide: RemedialSlide): string => {
  const lines: string[] = [];
  if (slide.gapAddressed) lines.push(`Fixing: ${slide.gapAddressed}`, '');
  for (const point of slide.talkingPoints ?? []) lines.push(`- ${point}`);
  if (slide.checkQuestion?.answer) lines.push('', `Answer: ${slide.checkQuestion.answer}`);
  const vocab = toVocabEntries(slide.vocabulary).filter((entry) => entry.meaning);
  if (vocab.length) lines.push('', `Words: ${vocab.map((entry) => `${entry.term} - ${entry.meaning}`).join('; ')}`);
  return lines.join('\n').trim();
};

/** pptxgenjs wants `image/png;base64,...` rather than a full data URL. */
const toPptxImageData = (dataUrl: string) => dataUrl.replace(/^data:/, '');

export const buildRemedialPptx = (PptxGen: typeof pptxgen, slides: RemedialSlide[]): pptxgen => {
  const pres = new PptxGen();
  pres.layout = 'LAYOUT_16x9';

  slides.forEach((s, index) => {
    const layout = resolveSlideLayout(s, index);
    const tone = TONES[layout];
    const slide = pres.addSlide();
    const image = s.generatedImageBase64;
    const textWidth = image ? 5.2 : 9;

    slide.background = { color: 'FFFFFF' };
    slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.07, fill: { color: tone.ink }, line: { color: tone.ink } });
    slide.addText(SLIDE_LAYOUT_LABELS[layout], {
      x: 0.5, y: 0.25, w: 2.6, h: 0.36,
      shape: pres.ShapeType.roundRect, rectRadius: 0.18,
      fill: { color: tone.bg }, line: { color: tone.line, width: 0.75 },
      fontSize: 12, bold: true, color: tone.ink, align: 'center', valign: 'middle',
    });
    slide.addText(`${index + 1} / ${slides.length}`, {
      x: 8.0, y: 0.25, w: 1.5, h: 0.36, fontSize: 12, color: MUTED, align: 'right', valign: 'middle',
    });
    slide.addText(s.title, {
      x: 0.5, y: 0.72, w: 9, h: 0.8, fontSize: 28, bold: true, color: INK, valign: 'top', fit: 'shrink',
    });
    if (s.subtitle) {
      slide.addText(s.subtitle, { x: 0.5, y: 1.48, w: 9, h: 0.4, fontSize: 15, color: MUTED, valign: 'top' });
    }

    const bodyTop = 2.0;
    const bodyHeight = 2.9;

    if (layout === 'mistake_fix' && s.misconception && !isLegacySlide(s)) {
      const boxWidth = image ? textWidth : 4.35;
      const boxHeight = image ? 1.4 : bodyHeight;
      const second = image ? { x: 0.5, y: bodyTop + 1.5 } : { x: 0.5 + boxWidth + 0.3, y: bodyTop };
      slide.addText(
        [label('Not this', 'B42318'), para(s.misconception.wrong, 22, { bold: true, color: INK, strike: 'sngStrike' }), para(s.misconception.why, 14)],
        { x: 0.5, y: bodyTop, w: boxWidth, h: boxHeight, fill: { color: 'FDF1F0' }, line: { color: 'F3C7C2', width: 1.5 }, valign: 'top', margin: 12 },
      );
      slide.addText(
        [label('Do this', '15803D'), para(s.misconception.fix, 22, { bold: true, color: INK }), ...(s.keyPoints?.length ? [para(s.keyPoints.join(' '), 14)] : [])],
        { ...second, w: boxWidth, h: boxHeight, fill: { color: 'ECF8F0' }, line: { color: 'BFE3CA', width: 1.5 }, valign: 'top', margin: 12 },
      );
    } else {
      slide.addText(buildSlideBodyRuns(s, layout), {
        x: 0.5, y: bodyTop, w: textWidth, h: bodyHeight, valign: 'top', fit: 'shrink',
      });
    }

    if (image) {
      slide.addImage({ data: toPptxImageData(image), x: 5.95, y: bodyTop + 0.1, w: 3.55, h: 2.37 });
    }

    slide.addShape(pres.ShapeType.line, { x: 0.5, y: 5.05, w: 9, h: 0, line: { color: 'E7E2EF', width: 0.75 } });
    if (s.gapAddressed) {
      slide.addText(`Fixing: ${s.gapAddressed}`, { x: 0.5, y: 5.1, w: 6, h: 0.35, fontSize: 11, bold: true, color: tone.ink });
    }
    const terms = toVocabEntries(s.vocabulary).map((entry) => entry.term).slice(0, 3);
    if (terms.length) {
      slide.addText(terms.join('  ·  '), { x: 6.5, y: 5.1, w: 3, h: 0.35, fontSize: 11, color: MUTED, align: 'right' });
    }

    const notes = presenterNotesText(s);
    if (notes) slide.addNotes(notes);
  });

  return pres;
};
