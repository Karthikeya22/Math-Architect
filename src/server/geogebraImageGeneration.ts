/**
 * GeoGebra is free for non-commercial educational use only.
 * See https://www.geogebra.org/license
 *
 * Server-only renderer via node-geogebra (headless Chromium).
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { GGBPool } = require('node-geogebra') as {
  GGBPool: new (opts?: { plotters?: number; ggb?: string; perspective?: string }) => {
    ready(): Promise<void>;
    getGGBPlotter(): Promise<{
      evalGGBScript(script: string[], width?: number, height?: number): Promise<void>;
      export64(format: string): Promise<string>;
      release(): Promise<void>;
    }>;
    release(): Promise<void>;
  };
};

const MAX_COMMANDS = 120;
const MAX_COMMAND_LEN = 500;

let pool: InstanceType<typeof GGBPool> | null = null;
let poolReady: Promise<void> | null = null;

export const isGeoGebraRenderEnabled = (env: NodeJS.ProcessEnv = process.env): boolean => {
  const raw = String(env.GEOGEBRA_RENDER_ENABLED || '').trim().toLowerCase();
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return env.NODE_ENV !== 'production';
};

const getPool = (): InstanceType<typeof GGBPool> => {
  if (!pool) {
    pool = new GGBPool({ plotters: 4, ggb: 'local', perspective: 'G' });
    poolReady = pool.ready();
  }
  return pool;
};

export const initGeoGebraPool = async (): Promise<void> => {
  if (!isGeoGebraRenderEnabled()) return;
  await getPool().ready();
};

export const releaseGeoGebraPool = async (): Promise<void> => {
  if (!pool) return;
  try {
    await pool.release();
  } catch {
    /* ignore shutdown errors */
  }
  pool = null;
  poolReady = null;
};

const stripDataUrlPrefix = (raw: string): string =>
  String(raw || '')
    .trim()
    .replace(/^data:image\/png;base64,/i, '');

export const validateGeoGebraCommands = (commands: unknown): string[] | null => {
  if (!Array.isArray(commands) || commands.length === 0) return null;
  if (commands.length > MAX_COMMANDS) return null;
  const out: string[] = [];
  for (const cmd of commands) {
    const line = String(cmd || '').trim();
    if (!line || line.length > MAX_COMMAND_LEN) return null;
    out.push(line);
  }
  return out;
};

export const renderGeoGebraPngBase64 = async (
  commands: string[],
  width = 800,
  height = 500,
): Promise<string | null> => {
  if (!isGeoGebraRenderEnabled()) return null;
  const script = validateGeoGebraCommands(commands);
  if (!script) return null;

  const w = Math.max(200, Math.min(1600, Math.floor(width)));
  const h = Math.max(150, Math.min(1200, Math.floor(height)));

  try {
    const ggbPool = getPool();
    if (poolReady) await poolReady;
    const plotter = await ggbPool.getGGBPlotter();
    try {
      await plotter.evalGGBScript(script, w, h);
      const raw = await plotter.export64('png');
      const b64 = stripDataUrlPrefix(raw);
      return b64 || null;
    } finally {
      await plotter.release();
    }
  } catch (error) {
    console.warn('[geogebra] render failed:', error);
    return null;
  }
};
