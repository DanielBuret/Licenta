// backend/src/services/reservation-service.test.ts
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { reservationService } from './reservation-service.js';
import { resetDb, makeUser, makeStation } from '../test/db.js';
import { prisma } from '../lib/prisma.js';

const ALICE = '00000000-0000-0000-0000-00000000a11c';
const BOB = '00000000-0000-0000-0000-00000000b0b0';

describe('reservationService.create', () => {
  beforeAll(async () => {
    await resetDb();
  });

  beforeEach(async () => {
    await resetDb();
  });

  it('creates a reservation at queue_position=1 when station empty', async () => {
    await makeUser(ALICE);
    const st = await makeStation();
    const r = await reservationService.create({
      stationId: st.id,
      userId: ALICE,
      batteryLevelStart: 20,
    });
    expect(r.queuePosition).toBe(1);
    expect(r.status).toBe('reserved');
  });

  it('creates queue_position=2 when an active row already exists', async () => {
    await makeUser(ALICE);
    await makeUser(BOB);
    const st = await makeStation();
    await reservationService.create({
      stationId: st.id,
      userId: ALICE,
      batteryLevelStart: 10,
    });
    const r = await reservationService.create({
      stationId: st.id,
      userId: BOB,
      batteryLevelStart: 30,
    });
    expect(r.queuePosition).toBe(2);
  });

  it('rejects when station already has 2 active reservations', async () => {
    await makeUser(ALICE);
    await makeUser(BOB);
    await makeUser('00000000-0000-0000-0000-00000000cccc', 'C');
    const st = await makeStation();
    await reservationService.create({
      stationId: st.id,
      userId: ALICE,
      batteryLevelStart: 10,
    });
    await reservationService.create({
      stationId: st.id,
      userId: BOB,
      batteryLevelStart: 30,
    });
    await expect(
      reservationService.create({
        stationId: st.id,
        userId: '00000000-0000-0000-0000-00000000cccc',
        batteryLevelStart: 50,
      }),
    ).rejects.toThrow(/full/i);
  });

  it('rejects when the user already holds an active reservation', async () => {
    await makeUser(ALICE);
    const s1 = await makeStation('S1');
    const s2 = await makeStation('S2');
    await reservationService.create({
      stationId: s1.id,
      userId: ALICE,
      batteryLevelStart: 10,
    });
    await expect(
      reservationService.create({
        stationId: s2.id,
        userId: ALICE,
        batteryLevelStart: 20,
      }),
    ).rejects.toThrow(/already/i);
  });

  it('rejects invalid battery percent', async () => {
    await makeUser(ALICE);
    const st = await makeStation();
    await expect(
      reservationService.create({
        stationId: st.id,
        userId: ALICE,
        batteryLevelStart: 100,
      }),
    ).rejects.toThrow();
  });
});

describe('reservationService.cancel', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('cancels own reserved row', async () => {
    await makeUser(ALICE);
    const st = await makeStation();
    const r = await reservationService.create({
      stationId: st.id,
      userId: ALICE,
      batteryLevelStart: 10,
    });
    const after = await reservationService.cancel({
      reservationId: r.id,
      callerId: ALICE,
    });
    expect(after.status).toBe('cancelled');
  });

  it('promotes queue_position=2 to 1 when active row is cancelled', async () => {
    await makeUser(ALICE);
    await makeUser(BOB);
    const st = await makeStation();
    const a = await reservationService.create({
      stationId: st.id,
      userId: ALICE,
      batteryLevelStart: 10,
    });
    const b = await reservationService.create({
      stationId: st.id,
      userId: BOB,
      batteryLevelStart: 30,
    });
    await reservationService.cancel({ reservationId: a.id, callerId: ALICE });
    const refreshed = await prisma.reservation.findUnique({
      where: { id: b.id },
    });
    expect(refreshed?.queuePosition).toBe(1);
    expect(refreshed?.status).toBe('reserved');
    // reservedAt should have been updated to start a fresh grace
    expect(refreshed!.reservedAt.getTime()).toBeGreaterThanOrEqual(b.reservedAt.getTime());
  });

  it('rejects when caller is not the owner', async () => {
    await makeUser(ALICE);
    await makeUser(BOB);
    const st = await makeStation();
    const r = await reservationService.create({
      stationId: st.id,
      userId: ALICE,
      batteryLevelStart: 10,
    });
    await expect(reservationService.cancel({ reservationId: r.id, callerId: BOB })).rejects.toThrow(
      /not the owner|forbidden/i,
    );
  });

  it('rejects already terminal rows', async () => {
    await makeUser(ALICE);
    const st = await makeStation();
    const r = await reservationService.create({
      stationId: st.id,
      userId: ALICE,
      batteryLevelStart: 10,
    });
    await reservationService.cancel({ reservationId: r.id, callerId: ALICE });
    await expect(
      reservationService.cancel({ reservationId: r.id, callerId: ALICE }),
    ).rejects.toThrow(/terminal|already/i);
  });
});
