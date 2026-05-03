import { estimateChargingSeconds } from '@charging-station/shared';

const FACTOR = Number(import.meta.env.VITE_TIME_SCALE_FACTOR ?? '60');

export function estimateRemainingSeconds(
  batteryCapacityKwh: number,
  batteryStartPercent: number,
  stationPowerKw: number,
  chargingStartedAt: string,
): number {
  const total = estimateChargingSeconds(
    batteryCapacityKwh,
    batteryStartPercent,
    stationPowerKw,
    FACTOR,
  );
  const elapsed = (Date.now() - new Date(chargingStartedAt).getTime()) / 1000;
  return Math.max(0, total - elapsed);
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${String(r).padStart(2, '0')}s`;
}
