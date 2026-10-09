import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    return {
      // Default enables vision-check retry for quiz images (see aiService.ts). Override with VITE_IMAGE_SELF_VALIDATION=false in .env.
      define: {
        'import.meta.env.VITE_IMAGE_SELF_VALIDATION': JSON.stringify(
          env.VITE_IMAGE_SELF_VALIDATION ?? 'true',
        ),
        'import.meta.env.VITE_GEOGEBRA_VISUALS_ENABLED': JSON.stringify(
          env.VITE_GEOGEBRA_VISUALS_ENABLED ?? (mode === 'development' ? 'true' : 'false'),
        ),
      },
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        tailwindcss(),
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      }
    };
});
