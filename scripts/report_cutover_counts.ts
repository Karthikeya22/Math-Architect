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

const countTable = async (client: SupabaseClient, table: string) => {
  const { count, error } = await client.from(table).select('*', { count: 'exact', head: true });
  if (error) {
    if (error.code === '42P01') return `${table}: NOT PRESENT (expected if legacy table was removed)`;
    return `${table}: ERROR ${error.code} ${error.message}`;
  }
  return `${table}: ${count ?? 0}`;
};

const main = async () => {
  const url = resolveSupabaseUrl(process.env.SUPABASE_URL);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');

  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  console.log('--- Current schema (app writes here) ---');
  for (const table of ['quiz_sessions', 'questions', 'question_attempts']) {
    console.log(await countTable(supabase, table));
  }

  console.log('--- Legacy ai_quiz_* (post-backfill may be static) ---');
  for (const table of ['ai_quiz_generations', 'ai_quiz_questions', 'ai_quiz_attempts']) {
    console.log(await countTable(supabase, table));
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
