import "../loadEnv.ts";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const resolveSupabaseProjectUrl = (rawUrl: string | undefined): string | null => {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim().replace(/^"|"$/g, "");

  // Accept dashboard URLs and convert to project URL used by Supabase APIs.
  const dashboardMatch = trimmed.match(/\/project\/([a-z0-9-]+)/i);
  if (dashboardMatch?.[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }
  return trimmed;
};

const supabaseUrl = resolveSupabaseProjectUrl(process.env.SUPABASE_URL);
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdminClient: SupabaseClient | null =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;
