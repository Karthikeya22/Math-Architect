import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const MAPPINGS_JSON = path.join(process.cwd(), 'data', 'processed', 'best-khan-mappings.json');

type MappingsFile = {
  generatedAt: string;
  byStandard: Record<
    string,
    {
      description: string;
      exercises: Array<{ title: string; url: string }>;
    }
  >;
};

const resolveSupabaseUrl = (raw: string | undefined): string | null => {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/^"|"$/g, '');
  const dashboardMatch = trimmed.match(/\/project\/([a-z0-9-]+)/i);
  if (dashboardMatch?.[1]) return `https://${dashboardMatch[1]}.supabase.co`;
  return trimmed;
};

const BATCH = 200;

const main = async () => {
  const supabaseUrl = resolveSupabaseUrl(process.env.SUPABASE_URL);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !key) {
    throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  }

  const jsonText = await fs.readFile(MAPPINGS_JSON, 'utf8');
  const data = JSON.parse(jsonText) as MappingsFile;

  const rows: Array<{
    set_id: string;
    standard_id: string;
    standard_description: string;
    content_kind: string;
    content_title: string;
    content_url: string;
    source_generated_at: string;
  }> = [];

  for (const [standardId, entry] of Object.entries(data.byStandard)) {
    for (const ex of entry.exercises) {
      rows.push({
        set_id: 'FL.BEST.Math',
        standard_id: standardId,
        standard_description: entry.description || '',
        content_kind: 'Exercise',
        content_title: ex.title,
        content_url: ex.url,
        source_generated_at: data.generatedAt,
      });
    }
  }

  const supabase = createClient(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await supabase.from('standard_practice_links').upsert(chunk, {
      onConflict: 'standard_id,content_url',
    });
    if (error) throw error;
    console.log(`Upserted ${Math.min(i + chunk.length, rows.length)} / ${rows.length}`);
  }

  console.log('Done. Total rows:', rows.length);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
