// shared/src/charging.test.ts
import { describe, it, expect } from 'vitest';
import { estimateChargingSeconds } from './charging.js';

describe('estimateChargingSeconds', () => {
  it('full charge from 0% on a 50kW charger with a 75kWh battery is 1h real (60s with factor 60)', () => {
    expect(estimateChargingSeconds(75, 0, 50, 60)).toBeCloseTo(90, 1);
    // Wait — 75 / 50 = 1.5h = 5400s real → / 60 = 90s. Correct.
  });

  it('with timeScaleFactor=1 returns physical seconds', () => {
    expect(estimateChargingSeconds(75, 0, 50, 1)).toBeCloseTo(5400, 0);
  });

  it('partial charge from 20% on the same setup is 0.8 of full', () => {
    expect(estimateChargingSeconds(75, 20, 50, 60)).toBeCloseTo(72, 1);
  });

  it('starting at 99% returns near zero', () => {
    expect(estimateChargingSeconds(75, 99, 50, 60)).toBeCloseTo(0.9, 1);
  });

  it('throws if station power is zero or negative', () => {
    expect(() => estimateChargingSeconds(75, 0, 0, 60)).toThrow();
    expect(() => estimateChargingSeconds(75, 0, -10, 60)).toThrow();
  });

  it('throws if battery capacity is non-positive', () => {
    expect(() => estimateChargingSeconds(0, 0, 50, 60)).toThrow();
  });

  it('throws if start percent is outside [0,99]', () => {
    expect(() => estimateChargingSeconds(75, -1, 50, 60)).toThrow();
    expect(() => estimateChargingSeconds(75, 100, 50, 60)).toThrow();
  });

  it('throws if timeScaleFactor is non-positive', () => {
    expect(() => estimateChargingSeconds(75, 0, 50, 0)).toThrow();
  });
});
