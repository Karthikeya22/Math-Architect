import fs from 'node:fs/promises';
import path from 'node:path';

const SOURCE_CSV = path.join(
  process.cwd(),
  'data',
  'raw',
  'Florida B.E.S.T. Math Standard Mappings.csv',
);

const OUTPUT_JSON = path.join(process.cwd(), 'data', 'processed', 'best-khan-mappings.json');

/** Parse one CSV line with RFC4180-style quoted fields. */
const parseCsvLine = (line: string): string[] => {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (c === ',' && !inQuotes) {
      fields.push(current);
      current = '';
      continue;
    }
    current += c;
  }
  fields.push(current);
  return fields;
};

const isBadKhanUrl = (url: string): boolean => {
  const u = url.trim().toLowerCase();
  if (!u.startsWith('https://www.khanacademy.org/') && !u.startsWith('http://www.khanacademy.org/')) {
    return true;
  }
  if (u.includes('/internal-courses/')) return true;
  if (u.includes('/test-everything')) return true;
  return false;
};

type ExerciseRow = { title: string; url: string };

type ByStandardEntry = {
  description: string;
  exercises: ExerciseRow[];
};

type DedupedExercise = {
  url: string;
  title: string;
  standardIds: string[];
};

const main = async () => {
  const raw = (await fs.readFile(SOURCE_CSV, 'utf8')).replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/).filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error(`Expected header + rows in ${SOURCE_CSV}`);
  }

  const header = parseCsvLine(lines[0]);
  const expected = ['Set ID', 'Standard ID', 'Standard Description', 'Content Kind', 'Content Title', 'Content URL'];
  if (header.length !== expected.length || !expected.every((h, i) => header[i] === h)) {
    throw new Error(`Unexpected CSV header. Got: ${header.join(' | ')}`);
  }

  let inputRowCount = 0;
  let exerciseRowsRaw = 0;
  let exerciseRowsAfterFilters = 0;

  const byStandard = new Map<string, ByStandardEntry>();
  const urlToStandards = new Map<string, Set<string>>();
  const urlToTitle = new Map<string, string>();

  for (let li = 1; li < lines.length; li++) {
    const row = parseCsvLine(lines[li]);
    if (row.length < 6) continue;
    inputRowCount++;

    const standardId = row[1];
    const description = row[2];
    const contentKind = row[3];
    const contentTitle = row[4];
    const contentUrl = row[5];

    if (contentKind !== 'Exercise') continue;
    exerciseRowsRaw++;
    if (isBadKhanUrl(contentUrl)) continue;
    exerciseRowsAfterFilters++;

    if (!byStandard.has(standardId)) {
      byStandard.set(standardId, { description, exercises: [] });
    } else {
      const entry = byStandard.get(standardId)!;
      if (!entry.description && description) entry.description = description;
    }

    const entry = byStandard.get(standardId)!;
    const seenUrls = new Set(entry.exercises.map((e) => e.url));
    if (!seenUrls.has(contentUrl)) {
      entry.exercises.push({ title: contentTitle, url: contentUrl });
    }

    if (!urlToStandards.has(contentUrl)) {
      urlToStandards.set(contentUrl, new Set());
      urlToTitle.set(contentUrl, contentTitle);
    }
    urlToStandards.get(contentUrl)!.add(standardId);
  }

  const byStandardObj: Record<string, ByStandardEntry> = {};
  for (const [id, data] of byStandard) {
    byStandardObj[id] = data;
  }

  const exercisesByUrl: DedupedExercise[] = [];
  for (const [url, standardIds] of urlToStandards) {
    exercisesByUrl.push({
      url,
      title: urlToTitle.get(url) || '',
      standardIds: [...standardIds].sort(),
    });
  }
  exercisesByUrl.sort((a, b) => a.url.localeCompare(b.url));

  const standardCountWithExercises = Object.keys(byStandardObj).length;
  const uniqueExerciseUrls = exercisesByUrl.length;

  const payload = {
    generatedAt: new Date().toISOString(),
    sourceCsv: path.relative(process.cwd(), SOURCE_CSV).replace(/\\/g, '/'),
    stats: {
      inputRowCount,
      exerciseRowsRaw,
      exerciseRowsAfterFilters,
      uniqueExerciseUrls,
      standardCountWithExercises,
    },
    byStandard: byStandardObj,
    exercisesByUrl,
  };

  await fs.mkdir(path.dirname(OUTPUT_JSON), { recursive: true });
  await fs.writeFile(OUTPUT_JSON, JSON.stringify(payload, null, 2), 'utf8');

  console.log('Wrote', OUTPUT_JSON);
  console.log(JSON.stringify(payload.stats, null, 2));
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
