// backend/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    sequence: { concurrent: false }, // tests share a DB
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    testTimeout: 15000,
  },
});
