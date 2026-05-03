// backend/src/index.ts
import { buildApp } from './server.js';
import { env } from './config/env.js';

const app = buildApp();
app.listen(env.PORT, () => {
  console.log(`Backend listening on http://localhost:${env.PORT}`);
});
