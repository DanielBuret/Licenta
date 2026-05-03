// shared/src/charging.ts
export function estimateChargingSeconds(
  batteryCapacityKwh: number,
  batteryStartPercent: number,
  stationPowerKw: number,
  timeScaleFactor: number,
): number {
  if (!Number.isFinite(batteryCapacityKwh) || batteryCapacityKwh <= 0) {
    throw new Error('batteryCapacityKwh must be a positive number');
  }
  if (!Number.isFinite(stationPowerKw) || stationPowerKw <= 0) {
    throw new Error('stationPowerKw must be a positive number');
  }
  if (!Number.isFinite(timeScaleFactor) || timeScaleFactor <= 0) {
    throw new Error('timeScaleFactor must be a positive number');
  }
  if (
    !Number.isFinite(batteryStartPercent) ||
    batteryStartPercent < 0 ||
    batteryStartPercent > 99
  ) {
    throw new Error('batteryStartPercent must be in [0, 99]');
  }

  const energyKwh = (batteryCapacityKwh * (100 - batteryStartPercent)) / 100;
  const realSeconds = (energyKwh / stationPowerKw) * 3600;
  return realSeconds / timeScaleFactor;
}
