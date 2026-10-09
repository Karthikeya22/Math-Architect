/**
 * Visual-path telemetry rollup. Reads `questions.generation_metadata` from
 * Supabase and reports counts grouped by visual_path, visual_type, strand,
 * and standard. Helps you see e.g. "MA.4.FR.2.1 is 80% deterministic_svg
 * and 0% gemini_image — good. MA.5.AR.1.2 is 60% no_visual — investigate."
 *
 * Usage:
 *   tsx scripts/report_visual_paths.ts                  # all standards
 *   tsx scripts/report_visual_paths.ts MA.4.FR.2.1      # one standard
 *
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env
 */
import dotenv from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

dotenv.config();

const resolveSupabaseUrl = (rawUrl: string | undefined): string | null => {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim().replace(/^"|"$/g, '');
  const dashboardMatch = trimmed.match(/\/project\/([a-z0-9-]+)/i);
  if (dashboardMatch?.[1]) return `https://${dashboardMatch[1]}.supabase.co`;
  return trimmed.replace(/\/rest\/v1\/?$/i, '');
};

const PAGE = 1000;

interface QuestionRow {
  generation_metadata: {
    standard_code?: string | null;
    strand_code?: string | null;
    grade_token?: string | null;
    visual_path?: string | null;
    visual_type?: string | null;
  } | null;
}

const fetchAllQuestions = async (
  supabase: SupabaseClient,
  filterStandard: string | null,
): Promise<QuestionRow[]> => {
  const all: QuestionRow[] = [];
  let from = 0;
  for (;;) {
    let query = supabase
      .from('questions')
      .select('generation_metadata')
      .range(from, from + PAGE - 1);
    if (filterStandard) {
      query = query.contains('generation_metadata', { standard_code: filterStandard });
    }
    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to read questions table: ${error.message}`);
    }
    const rows = (data || []) as QuestionRow[];
    all.push(...rows);
    if (rows.length < PAGE) break;
    from += PAGE;
  }
  return all;
};

interface BucketCounts {
  total: number;
  byPath: Map<string, number>;
  byType: Map<string, number>;
}

const emptyBucket = (): BucketCounts => ({
  total: 0,
  byPath: new Map(),
  byType: new Map(),
});

const tally = (bucket: BucketCounts, path: string, type: string) => {
  bucket.total += 1;
  bucket.byPath.set(path, (bucket.byPath.get(path) || 0) + 1);
  bucket.byType.set(type, (bucket.byType.get(type) || 0) + 1);
};

const formatBucket = (label: string, bucket: BucketCounts): string => {
  if (bucket.total === 0) return `${label}: (no rows)`;
  const pct = (n: number) => `${((n / bucket.total) * 100).toFixed(1)}%`;
  const pathLines = [...bucket.byPath.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `      ${k.padEnd(22)} ${String(v).padStart(5)}  ${pct(v)}`)
    .join('\n');
  const typeLines = [...bucket.byType.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `      ${k.padEnd(22)} ${String(v).padStart(5)}  ${pct(v)}`)
    .join('\n');
  return [
    `${label}  total=${bucket.total}`,
    '    by visual_path:',
    pathLines || '      (none)',
    '    by visual_type:',
    typeLines || '      (none)',
  ].join('\n');
};

const main = async () => {
  const url = resolveSupabaseUrl(process.env.SUPABASE_URL);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
  }
  const supabase = createClient(url, key);

  const filterStandard = process.argv[2] || null;
  const rows = await fetchAllQuestions(supabase, filterStandard);
  if (rows.length === 0) {
    console.log(`No question rows found${filterStandard ? ` for ${filterStandard}` : ''}.`);
    return;
  }

  const overall = emptyBucket();
  const byStrand = new Map<string, BucketCounts>();
  const byStandard = new Map<string, BucketCounts>();

  for (const row of rows) {
    const meta = row.generation_metadata || {};
    const path = meta.visual_path || 'unspecified';
    const type = meta.visual_type || 'none';
    const strand = meta.strand_code || 'unknown';
    const standard = meta.standard_code || 'unknown';

    tally(overall, path, type);
    if (!byStrand.has(strand)) byStrand.set(strand, emptyBucket());
    tally(byStrand.get(strand)!, path, type);
    if (!byStandard.has(standard)) byStandard.set(standard, emptyBucket());
    tally(byStandard.get(standard)!, path, type);
  }

  console.log('=================================================================');
  console.log(filterStandard ? `Visual-path report for ${filterStandard}` : 'Visual-path report (all standards)');
  console.log('=================================================================');
  console.log(formatBucket('OVERALL', overall));
  console.log('-----------------------------------------------------------------');

  if (!filterStandard) {
    console.log('PER STRAND');
    for (const [strand, bucket] of [...byStrand.entries()].sort()) {
      console.log(formatBucket(`  strand=${strand}`, bucket));
    }
    console.log('-----------------------------------------------------------------');
    console.log('TOP 25 STANDARDS BY VOLUME');
    const sortedStandards = [...byStandard.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 25);
    for (const [code, bucket] of sortedStandards) {
      console.log(formatBucket(`  standard=${code}`, bucket));
    }
  } else {
    for (const [code, bucket] of byStandard.entries()) {
      console.log(formatBucket(`standard=${code}`, bucket));
    }
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
