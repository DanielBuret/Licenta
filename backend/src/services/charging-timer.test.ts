// backend/src/services/charging-timer.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../lib/prisma.js';
import { chargingTimer } from './charging-timer.js';
import { resetDb, makeUser, makeStation } from '../test/db.js';
import { reservationService } from './reservation-service.js';

const ALICE = '00000000-0000-0000-0000-00000000a11c';

describe('chargingTimer.tick', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('does not promote a reservation younger than 15s', async () => {
    await makeUser(ALICE);
    const st = await makeStation();
    const r = await reservationService.create({
      stationId: st.id,
      userId: ALICE,
      batteryLevelStart: 20,
    });
    await chargingTimer.tick();
    const after = await prisma.reservation.findUnique({ where: { id: r.id } });
    expect(after?.status).toBe('reserved');
  });

  it('promotes a reservation older than 15s to charging', async () => {
    await makeUser(ALICE);
    const st = await makeStation();
    const r = await reservationService.create({
      stationId: st.id,
      userId: ALICE,
      batteryLevelStart: 20,
    });
    // Backdate
    await prisma.reservation.update({
      where: { id: r.id },
      data: { reservedAt: new Date(Date.now() - 16_000) },
    });
    const promotedIds = await chargingTimer.tick();
    expect(promotedIds.map(String)).toContain(String(r.id));
    const after = await prisma.reservation.findUnique({ where: { id: r.id } });
    expect(after?.status).toBe('charging');
    expect(after?.chargingStartedAt).not.toBeNull();
  });

  it('is idempotent (already-charging rows are not modified)', async () => {
    await makeUser(ALICE);
    const st = await makeStation();
    const r = await reservationService.create({
      stationId: st.id,
      userId: ALICE,
      batteryLevelStart: 20,
    });
    await prisma.reservation.update({
      where: { id: r.id },
      data: { reservedAt: new Date(Date.now() - 30_000) },
    });
    await chargingTimer.tick();
    const beforeStartedAt = (await prisma.reservation.findUnique({
      where: { id: r.id },
    }))!.chargingStartedAt!;
    const promoted = await chargingTimer.tick();
    expect(promoted).toEqual([]);
    const afterStartedAt = (await prisma.reservation.findUnique({
      where: { id: r.id },
    }))!.chargingStartedAt!;
    expect(afterStartedAt.getTime()).toBe(beforeStartedAt.getTime());
  });
});
