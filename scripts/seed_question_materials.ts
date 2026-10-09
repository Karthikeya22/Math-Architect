import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

dotenv.config();

type IxlRow = {
  platform: string;
  benchmark_code: string;
  benchmark_desc?: string;
  grade?: string;
  skill_id: number | string;
  skill_name: string;
  skill_url: string;
  permacode?: string;
};

type CpalmsRow = {
  platform: string;
  benchmark_code: string;
  resource_id: number | string;
  title?: string;
  description?: string;
  grade?: string;
  keywords?: string[];
  resource_type?: string;
  collection?: string;
  resource_url: string;
};

const IXL_JSON = path.join(process.cwd(), 'data', 'processed', 'ixl_flbest.json');
const CPALMS_JSON = path.join(process.cwd(), 'data', 'processed', 'cpalms_mfas.json');
const BATCH = 500;

const resolveSupabaseUrl = (rawUrl: string | undefined): string | null => {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim().replace(/^"|"$/g, '');
  const dashboardMatch = trimmed.match(/\/project\/([a-z0-9-]+)/i);
  if (dashboardMatch?.[1]) return `https://${dashboardMatch[1]}.supabase.co`;
  return trimmed.replace(/\/rest\/v1\/?$/i, '');
};

const inferDifficulty = (title: string, description: string): 'Easy' | 'Medium' | 'Hard' => {
  const text = `${title} ${description}`.toLowerCase();
  const hardSignals = ['multi-step', 'proof', 'justify', 'analyze', 'complex'];
  const easySignals = ['basic', 'intro', 'up to 10', 'count', 'identify'];
  if (hardSignals.some((token) => text.includes(token))) return 'Hard';
  if (easySignals.some((token) => text.includes(token))) return 'Easy';
  return 'Medium';
};

const normalizeGrade = (value: string | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.toLowerCase() === 'k') return 'Kindergarten';
  if (/^\d+$/.test(trimmed)) return `Grade ${trimmed}`;
  if (trimmed.toLowerCase().startsWith('grade')) return trimmed;
  return trimmed;
};

type QuestionMaterialInsert = {
  material_type: string;
  provider: string;
  provider_item_id: string;
  content_kind: string;
  standard_code: string;
  grade: string | null;
  title: string;
  description: string;
  url: string;
  keywords: string[];
  difficulty_hint: 'Easy' | 'Medium' | 'Hard';
  metadata: Record<string, unknown>;
  is_active: true;
};

const isValidMaterial = (row: QuestionMaterialInsert): boolean =>
  !!row.provider &&
  !!row.provider_item_id &&
  !!row.standard_code &&
  !!row.title &&
  !!row.url &&
  /^https?:\/\//i.test(row.url);

const reportActiveCoverage = async (supabase: SupabaseClient) => {
  const { data: standards, error: standardsErr } = await supabase.from('standards').select('code');
  if (standardsErr) {
    console.log(`Coverage check skipped: standards query failed (${standardsErr.code} ${standardsErr.message})`);
    return;
  }

  const { data: materials, error: materialsErr } = await supabase
    .from('question_materials')
    .select('standard_code')
    .eq('is_active', true);
  if (materialsErr) {
    console.log(
      `Coverage check skipped: question_materials query failed (${materialsErr.code} ${materialsErr.message})`
    );
    return;
  }

  const standardCodes = new Set((standards ?? []).map((row) => String((row as { code: string }).code)));
  const covered = new Set(
    (materials ?? [])
      .map((row) => (row as { standard_code: string | null }).standard_code)
      .filter((value): value is string => !!value && standardCodes.has(value))
  );

  console.log(
    `Coverage: ${covered.size} / ${standardCodes.size} standards have at least one active question_materials row.`
  );
};

const seed = async () => {
  const url = resolveSupabaseUrl(process.env.SUPABASE_URL);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const [ixlRaw, cpalmsRaw] = await Promise.all([
    fs.readFile(IXL_JSON, 'utf8'),
    fs.readFile(CPALMS_JSON, 'utf8'),
  ]);
  const ixl = JSON.parse(ixlRaw) as IxlRow[];
  const cpalms = JSON.parse(cpalmsRaw) as CpalmsRow[];
  console.log(`Loaded source rows: IXL=${ixl.length}, CPALMS=${cpalms.length}`);

  const ixlRows: QuestionMaterialInsert[] = ixl.map((row) => {
    const description = row.benchmark_desc || '';
    const title = row.skill_name || `IXL ${row.skill_id}`;
    return {
      material_type: 'reference_item',
      provider: 'IXL',
      provider_item_id: String(row.skill_id),
      content_kind: 'Skill',
      standard_code: row.benchmark_code,
      grade: normalizeGrade(row.grade),
      title,
      description,
      url: row.skill_url,
      keywords: [],
      difficulty_hint: inferDifficulty(title, description),
      metadata: {
        platform: row.platform,
        permacode: row.permacode ?? null,
      },
      is_active: true,
    };
  });

  const cpalmsRows: QuestionMaterialInsert[] = cpalms.map((row) => {
    const title = row.title || `CPALMS ${row.resource_id}`;
    const description = row.description || '';
    return {
      material_type: 'reference_item',
      provider: 'CPALMS_MFAS',
      provider_item_id: String(row.resource_id),
      content_kind: row.resource_type || 'Formative Assessment',
      standard_code: row.benchmark_code,
      grade: normalizeGrade(row.grade),
      title,
      description,
      url: row.resource_url,
      keywords: Array.isArray(row.keywords) ? row.keywords : [],
      difficulty_hint: inferDifficulty(title, description),
      metadata: {
        platform: row.platform,
        collection: row.collection ?? null,
      },
      is_active: true,
    };
  });

  const rows = [...ixlRows, ...cpalmsRows];
  const validRows = rows.filter(isValidMaterial);
  const skippedRows = rows.length - validRows.length;
  if (skippedRows > 0) {
    console.log(`Skipped invalid source rows: ${skippedRows}`);
  }
  if (!validRows.length) {
    throw new Error('No valid question_materials rows to upsert after validation');
  }

  const dedupedByProviderKey = new Map<string, QuestionMaterialInsert>();
  for (const row of validRows) {
    dedupedByProviderKey.set(`${row.provider}::${row.provider_item_id}`, row);
  }
  const dedupedRows = [...dedupedByProviderKey.values()];
  const duplicateRowsRemoved = validRows.length - dedupedRows.length;
  if (duplicateRowsRemoved > 0) {
    console.log(`Deduped duplicate provider/provider_item_id rows: ${duplicateRowsRemoved}`);
  }

  for (let i = 0; i < dedupedRows.length; i += BATCH) {
    const chunk = dedupedRows.slice(i, i + BATCH);
    const { error } = await supabase.from('question_materials').upsert(chunk, {
      onConflict: 'provider,provider_item_id',
    });
    if (error) throw error;
    console.log(`Upserted ${Math.min(i + chunk.length, dedupedRows.length)} / ${dedupedRows.length}`);
  }

  const { count: finalCount, error: finalCountErr } = await supabase
    .from('question_materials')
    .select('*', { count: 'exact', head: true });
  if (finalCountErr) throw finalCountErr;

  console.log(`Done. Valid rows prepared: ${validRows.length}. Total question_materials table rows: ${finalCount ?? 0}`);
  await reportActiveCoverage(supabase);
};

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
