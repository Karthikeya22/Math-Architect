import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const resolveProjectUrl = (value: string | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  const dashboardMatch = trimmed.match(/\/project\/([a-z0-9-]+)/i);
  if (dashboardMatch?.[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }
  return trimmed;
};

const supabaseUrl = resolveProjectUrl(rawUrl);

/** True when browser Supabase env vars are set (URL + anon key). */
export const isSupabaseBrowserConfigured = (): boolean =>
  Boolean(supabaseUrl && anonKey && anonKey !== 'missing-key');

let cachedClient: SupabaseClient | null = null;

/**
 * Returns the browser Supabase client. Throws if VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are missing
 * so callers never hit a silent invalid host.
 */
export const getSupabaseBrowserClient = (): SupabaseClient => {
  if (!isSupabaseBrowserConfigured() || !supabaseUrl || !anonKey) {
    throw new Error(
      'Supabase browser client is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    );
  }
  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, anonKey);
  }
  return cachedClient;
};
