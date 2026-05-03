import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  // Vite by default reads .env from `root`. We point root at the monorepo root
  // (one level up from `frontend/`) so we don't have to duplicate VITE_* keys.
  const envDir = path.resolve(__dirname, '..');
  loadEnv(mode, envDir, '');
  return {
    plugins: [react()],
    envDir,
    server: { port: 5173 },
  };
});
