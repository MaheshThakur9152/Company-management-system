import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:3002',
            changeOrigin: true,
            secure: false
          }
        }
      },
      plugins: [react()],
      build: {
        sourcemap: false
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.').replaceAll('\\', '/'),
          '@components': path.resolve(__dirname, 'src/components').replaceAll('\\', '/'),
          '@pages': path.resolve(__dirname, 'src/pages').replaceAll('\\', '/'),
          '@services': path.resolve(__dirname, 'src/services').replaceAll('\\', '/'),
          '@utils': path.resolve(__dirname, 'src/utils').replaceAll('\\', '/'),
          '@types': path.resolve(__dirname, 'src/types').replaceAll('\\', '/'),
          '@styles': path.resolve(__dirname, 'src/styles').replaceAll('\\', '/'),
        }
      }
    };
});
