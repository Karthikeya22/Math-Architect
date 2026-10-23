/**
 * Remove a bare "Look at the number line." style opener from a stem whose figure
 * was not published, so the text never points at a picture the student cannot see.
 * Only short pointer sentences with no numbers or detail are removed.
 */
export const dropFigurePointer = (text: string): string =>
  String(text || '').replace(/^\s*Look at the(?: \w+){1,4}\.\s+(?=\S)/i, (match) =>
    /[\d:,]/.test(match) ? match : '',
  );
