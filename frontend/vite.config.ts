import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'), // Fix this path
        }
      },
      // Add build configuration
      build: {
        rollupOptions: {
          external: [], // Ensure this is empty or doesn't include react-redux
        },
        commonjsOptions: {
          include: [/node_modules/],
          transformMixedEsModules: true
        }
      },
      optimizeDeps: {
        include: ['react-redux'] // Force include react-redux in optimization
      }
    };
});