/**
 * GeoGebra is free for non-commercial educational use only.
 * See https://www.geogebra.org/license
 *
 * Client wrapper — rendering runs on the server via POST /api/geogebra/render.
 */

export const isGeoGebraVisualsEnabled = (): boolean => {
  const raw = String(import.meta.env.VITE_GEOGEBRA_VISUALS_ENABLED || '').trim().toLowerCase();
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return Boolean(import.meta.env.DEV);
};

const stripDataUrlPrefix = (raw: string): string =>
  String(raw || '')
    .trim()
    .replace(/^data:image\/png;base64,/i, '');

const GEOGEBRA_CLIENT_TIMEOUT_MS = 45_000;

export const generateGeoGebraImage = async (
  commands: string[],
  width = 800,
  height = 500,
): Promise<string | null> => {
  if (!isGeoGebraVisualsEnabled()) return null;
  if (!Array.isArray(commands) || commands.length === 0) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEOGEBRA_CLIENT_TIMEOUT_MS);

  try {
    const res = await fetch('/api/geogebra/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands, width, height }),
      signal: controller.signal,
    });

    if (res.status === 204 || !res.ok) return null;

    const body = (await res.json()) as { base64?: string };
    const b64 = stripDataUrlPrefix(String(body.base64 || ''));
    return b64 || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};
