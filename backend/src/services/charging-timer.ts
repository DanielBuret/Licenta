// backend/src/services/charging-timer.ts
import { prisma } from '../lib/prisma.js';

export const chargingTimer = {
  async tick(): Promise<bigint[]> {
    const result = await prisma.$queryRaw<Array<{ id: bigint }>>`
      UPDATE reservations
         SET status = 'charging',
             charging_started_at = now()
       WHERE status = 'reserved'
         AND queue_position = 1
         AND reserved_at + interval '15 seconds' <= now()
       RETURNING id
    `;
    return result.map((r) => r.id);
  },

  start(intervalMs = 1000) {
    const handle = setInterval(() => {
      this.tick().catch((err) => {
        console.error('chargingTimer tick failed', err);
      });
    }, intervalMs);
    return () => clearInterval(handle);
  },
};
