import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// vite.config exports a callback (so it can read mode for loadEnv); resolve it
// to a plain config object before merging since mergeConfig rejects callbacks.
const resolvedViteConfig =
  typeof viteConfig === 'function' ? viteConfig({ mode: 'test', command: 'serve' }) : viteConfig;

export default mergeConfig(
  resolvedViteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      globals: true,
    },
  }),
);
