// backend/src/index.ts
import { buildApp } from './server.js';
import { env } from './config/env.js';
import { chargingTimer } from './services/charging-timer.js';

const app = buildApp();
const stopTimer = chargingTimer.start(1000);

const server = app.listen(env.PORT, () => {
  console.log(`Backend listening on http://localhost:${env.PORT}`);
  console.log(`Charging timer running (1Hz, TIME_SCALE_FACTOR=${env.TIME_SCALE_FACTOR})`);
});

function shutdown() {
  console.log('Shutting down…');
  stopTimer();
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
