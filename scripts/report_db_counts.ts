/**
 * Row counts for Supabase tables. Distinguishes current telemetry schema vs legacy ai_quiz_*.
 *
 * Writes from the app (after hardening):
 *   POST /api/ai-quiz-generations -> quiz_sessions, questions
 *   POST /api/ai-quiz-generations/:id/attempt -> question_attempts
 *
 * Seeds (run after migrations, with .env pointing at the same project):
 *   npm run extract:standards
 *   tsx scripts/seed_standards.ts
 *   npm run seed:practice-links
 *   npm run seed:question-materials
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
  if (dashboardMatch?.[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }
  return trimmed.replace(/\/rest\/v1\/?$/i, '');
};

const PAGE = 1000;

const parseStrandFromStandardCode = (standardCode: string): string | null => {
  const parts = standardCode.split('.');
  if (parts.length >= 3 && parts[2]) {
    return String(parts[2]).trim() || null;
  }
  return null;
};

const countTable = async (supabase: SupabaseClient, table: string, label?: string) => {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  const prefix = label ? `${label}: ` : '';
  if (error) {
    if (error.code === '42P01') {
      console.log(`${prefix}${table}: NOT PRESENT (expected if legacy table was removed)`);
      return;
    }
    console.log(`${prefix}${table}: ERROR ${error.code} ${error.message}`);
  } else {
    console.log(`${prefix}${table}: ${count ?? 0}`);
  }
};

const countWithFilter = async (
  supabase: SupabaseClient,
  table: string,
  label: string,
  applyFilter: (query: any) => any
) => {
  const baseQuery = supabase.from(table).select('*', { count: 'exact', head: true });
  const { count, error } = await applyFilter(baseQuery);
  if (error) {
    console.log(`${label}: ERROR ${error.code} ${error.message}`);
  } else {
    console.log(`${label}: ${count ?? 0}`);
  }
};

const reportLatestSessionLinkage = async (supabase: SupabaseClient) => {
  const { data: latestSession, error: latestErr } = await supabase
    .from('quiz_sessions')
    .select('id, created_at, user_id, standard_code')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestErr) {
    console.log(`latest session lookup: ERROR ${latestErr.code} ${latestErr.message}`);
    return;
  }

  if (!latestSession) {
    console.log('latest session linkage: no quiz_sessions rows found');
    return;
  }

  const sessionId = String(latestSession.id);
  console.log('--- Latest session linkage sanity check ---');
  console.log(
    `latest session: ${sessionId} (created_at=${latestSession.created_at}, user_id=${latestSession.user_id}, standard_code=${latestSession.standard_code ?? 'n/a'})`
  );

  const [{ count: questionCount, error: questionErr }, { count: attemptCount, error: attemptErr }] =
    await Promise.all([
      supabase.from('questions').select('*', { count: 'exact', head: true }).eq('session_id', sessionId),
      supabase
        .from('question_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId),
    ]);

  if (questionErr) {
    console.log(`questions for latest session: ERROR ${questionErr.code} ${questionErr.message}`);
  } else {
    console.log(`questions for latest session: ${questionCount ?? 0}`);
  }

  if (attemptErr) {
    console.log(`question_attempts for latest session: ERROR ${attemptErr.code} ${attemptErr.message}`);
  } else {
    console.log(`question_attempts for latest session: ${attemptCount ?? 0}`);
  }

  const [{ data: questions, error: questionsFetchErr }, { data: attempts, error: attemptsFetchErr }] =
    await Promise.all([
      supabase.from('questions').select('id').eq('session_id', sessionId),
      supabase.from('question_attempts').select('question_id').eq('session_id', sessionId),
    ]);

  if (questionsFetchErr || attemptsFetchErr) {
    const errors = [questionsFetchErr, attemptsFetchErr]
      .filter(Boolean)
      .map((e) => `${e?.code ?? 'UNKNOWN'} ${e?.message ?? 'unknown error'}`)
      .join('; ');
    console.log(`latest session question/attempt linkage: ERROR ${errors}`);
    return;
  }

  const questionIds = new Set((questions ?? []).map((row) => String((row as { id: string }).id)));
  const attemptRows = attempts ?? [];
  const nullQuestionIds = attemptRows.filter((row) => !(row as { question_id: string | null }).question_id).length;
  const linkedAttemptCount = attemptRows.filter((row) => {
    const questionId = (row as { question_id: string | null }).question_id;
    return !!questionId && questionIds.has(String(questionId));
  }).length;
  const orphanedAttemptCount = attemptRows.length - linkedAttemptCount - nullQuestionIds;

  console.log(
    `latest session attempt linkage: linked=${linkedAttemptCount}, null_question_id=${nullQuestionIds}, orphaned_question_id=${orphanedAttemptCount}`
  );
};

const printNewestRows = async (
  supabase: SupabaseClient,
  table: string,
  columns: string,
  orderColumn: string,
  label: string,
  limit = 5
) => {
  const { data, error } = await supabase
    .from(table)
    .select(columns)
    .order(orderColumn, { ascending: false })
    .limit(limit);
  if (error) {
    if (error.code === '42P01') {
      console.log(`${label}: table not present`);
      return;
    }
    console.log(`${label}: ERROR ${error.code} ${error.message}`);
    return;
  }
  const rows = data ?? [];
  if (!rows.length) {
    console.log(`${label}: none`);
    return;
  }
  console.log(`${label}:`);
  for (const row of rows) {
    console.log(`  ${JSON.stringify(row)}`);
  }
};

const main = async () => {
  const supabaseUrl = resolveSupabaseUrl(process.env.SUPABASE_URL);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('--- Current schema (app writes here) ---');
  const currentTables = [
    'quiz_sessions',
    'questions',
    'question_attempts',
    'standards',
    'standard_practice_links',
    'question_materials',
  ];
  for (const table of currentTables) {
    await countTable(supabase, table);
  }

  const { count: qmActive, error: qmErr } = await supabase
    .from('question_materials')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  if (!qmErr) {
    console.log(`question_materials (is_active=true only): ${qmActive ?? 0}`);
  }

  console.log('--- Legacy ai_quiz_* (post-backfill may be static) ---');
  for (const table of ['ai_quiz_generations', 'ai_quiz_questions', 'ai_quiz_attempts']) {
    await countTable(supabase, table);
  }

  const standardCodes: string[] = [];
  const standardMetaByCode = new Map<string, { grade: string; strand: string }>();
  let sFrom = 0;
  while (true) {
    const { data, error } = await supabase
      .from('standards')
      .select('code, grade, strand')
      .range(sFrom, sFrom + PAGE - 1);
    if (error) {
      console.log(`standards pagination: ERROR ${error.message}`);
      break;
    }
    if (!data?.length) break;
    for (const row of data as { code: string; grade: string; strand: string | null }[]) {
      const code = String(row.code);
      standardCodes.push(code);
      const parsedStrand = parseStrandFromStandardCode(code);
      standardMetaByCode.set(code, {
        grade: String(row.grade || 'UNKNOWN'),
        strand: String(row.strand || parsedStrand || 'UNKNOWN'),
      });
    }
    if (data.length < PAGE) break;
    sFrom += PAGE;
  }

  const materialStandardCodes = new Set<string>();
  const providerCounts = new Map<string, number>();
  const bankCountByGradeStrand = new Map<string, number>();
  let mFrom = 0;
  while (true) {
    const { data, error } = await supabase
      .from('question_materials')
      .select('standard_code, provider, material_type')
      .eq('is_active', true)
      .range(mFrom, mFrom + PAGE - 1);
    if (error) {
      console.log(`question_materials pagination: ERROR ${error.message}`);
      break;
    }
    if (!data?.length) break;
    for (const row of data as { standard_code: string; provider: string; material_type: string | null }[]) {
      materialStandardCodes.add(String(row.standard_code));
      const p = String(row.provider || 'UNKNOWN');
      providerCounts.set(p, (providerCounts.get(p) || 0) + 1);

      const materialType = String(row.material_type || '').toLowerCase();
      const isBaseBankMaterial = materialType === '' || materialType === 'reference_item';
      if (!isBaseBankMaterial) continue;
      const standardMeta = standardMetaByCode.get(String(row.standard_code));
      if (!standardMeta) continue;
      const key = `${standardMeta.grade} | ${standardMeta.strand}`;
      bankCountByGradeStrand.set(key, (bankCountByGradeStrand.get(key) || 0) + 1);
    }
    if (data.length < PAGE) break;
    mFrom += PAGE;
  }

  if (standardCodes.length) {
    const withMaterials = standardCodes.filter((c) => materialStandardCodes.has(c)).length;
    const withoutMaterials = standardCodes.length - withMaterials;
    console.log(
      `Coverage: ${withMaterials} / ${standardCodes.length} standards have at least one active question_materials row (${withoutMaterials} with zero).`
    );
  }

  if (providerCounts.size) {
    const lines = [...providerCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([p, n]) => `${p}: ${n}`)
      .join('; ');
    console.log(`question_materials by provider (active rows scanned): ${lines}`);
  }

  if (bankCountByGradeStrand.size) {
    const strandLines = [...bankCountByGradeStrand.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([gradeStrand, n]) => `${gradeStrand}: ${n}`)
      .join('; ');
    console.log(`Base question bank count by class/strand (new rows included): ${strandLines}`);
  } else {
    console.log('Base question bank count by class/strand: none');
  }

  console.log('--- User, gap, and activity telemetry ---');
  for (const table of ['app_users', 'gap_analyses', 'activity_events']) {
    await countTable(supabase, table);
  }
  await countWithFilter(supabase, 'app_users', 'app_users (is_guest=true)', (query) =>
    query.eq('is_guest', true)
  );
  await countWithFilter(supabase, 'app_users', 'app_users (is_guest=false)', (query) =>
    query.eq('is_guest', false)
  );
  await countWithFilter(supabase, 'gap_analyses', 'gap_analyses (with session_id)', (query) =>
    query.not('session_id', 'is', null)
  );
  await countWithFilter(supabase, 'activity_events', 'activity_events (with quiz_session_id)', (query) =>
    query.not('quiz_session_id', 'is', null)
  );

  console.log('--- Recent rows (newest first) ---');
  await printNewestRows(
    supabase,
    'quiz_sessions',
    'id, created_at, user_id, standard_code, score, completed_at',
    'created_at',
    'quiz_sessions newest'
  );
  await printNewestRows(
    supabase,
    'gap_analyses',
    'id, created_at, user_id, standard_code, confidence_score, session_id',
    'created_at',
    'gap_analyses newest'
  );
  await printNewestRows(
    supabase,
    'activity_events',
    'id, created_at, user_id, action, quiz_session_id',
    'created_at',
    'activity_events newest'
  );

  await reportLatestSessionLinkage(supabase);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
