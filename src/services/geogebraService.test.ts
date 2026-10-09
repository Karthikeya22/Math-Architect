import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateGeoGebraImage, isGeoGebraVisualsEnabled } from './geogebraService';

describe('geogebraService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('is disabled unless env flag is true', () => {
    vi.stubEnv('VITE_GEOGEBRA_VISUALS_ENABLED', 'false');
    expect(isGeoGebraVisualsEnabled()).toBe(false);
    vi.stubEnv('VITE_GEOGEBRA_VISUALS_ENABLED', 'true');
    expect(isGeoGebraVisualsEnabled()).toBe(true);
  });

  it('returns null when disabled', async () => {
    vi.stubEnv('VITE_GEOGEBRA_VISUALS_ENABLED', 'false');
    const result = await generateGeoGebraImage(['ShowAxes(false)']);
    expect(result).toBeNull();
  });

  it('posts commands to the render endpoint when enabled', async () => {
    vi.stubEnv('VITE_GEOGEBRA_VISUALS_ENABLED', 'true');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({ base64: Buffer.from('png').toString('base64') }),
      ),
    );

    const result = await generateGeoGebraImage(['ShowAxes(false)'], 640, 400);
    expect(result).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith(
      '/api/geogebra/render',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
