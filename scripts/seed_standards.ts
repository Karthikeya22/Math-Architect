import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

type StandardRow = {
  code: string;
  description: string;
  grade: string;
  clarifications?: string[];
  instructional_items?: string[];
  purpose_and_strategies?: string[];
  misconceptions?: string[];
  tiered_instruction?: string[];
};

const INPUT_JSON = path.join(process.cwd(), 'data', 'processed', 'standards.json');
const BATCH_SIZE = 200;

const resolveSupabaseUrl = (rawUrl: string | undefined): string | null => {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim().replace(/^"|"$/g, '');
  const dashboardMatch = trimmed.match(/\/project\/([a-z0-9-]+)/i);
  if (dashboardMatch?.[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }
  return trimmed.replace(/\/rest\/v1\/?$/i, '');
};

const main = async () => {
  const supabaseUrl = resolveSupabaseUrl(process.env.SUPABASE_URL);
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  }

  const raw = await fs.readFile(INPUT_JSON, 'utf8');
  const rows = JSON.parse(raw) as StandardRow[];

  const payload = rows
    .map((row) => ({
      code: String(row.code || '').trim(),
      description: String(row.description || '').trim(),
      grade: String(row.grade || '').trim(),
      clarifications: Array.isArray(row.clarifications) ? row.clarifications : [],
      examples: Array.isArray(row.instructional_items) ? row.instructional_items : [],
      purpose_and_strategies: Array.isArray(row.purpose_and_strategies)
        ? row.purpose_and_strategies
        : [],
      misconceptions: Array.isArray(row.misconceptions) ? row.misconceptions : [],
      tiered_instruction: Array.isArray(row.tiered_instruction) ? row.tiered_instruction : [],
    }))
    .filter((row) => row.code && row.description && row.grade);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (let i = 0; i < payload.length; i += BATCH_SIZE) {
    const chunk = payload.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('standards').upsert(chunk, { onConflict: 'code' });
    if (error) throw error;
    console.log(`Upserted ${Math.min(i + chunk.length, payload.length)} / ${payload.length}`);
  }

  console.log(`Done. Total standards upserted: ${payload.length}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
