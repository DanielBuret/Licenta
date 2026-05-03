export type ReservationStatus = 'reserved' | 'charging' | 'completed' | 'cancelled';

export type QueuePosition = 1 | 2;

export interface Reservation {
  id: number;
  stationId: number;
  userId: string;
  batteryLevelStart: number;
  status: ReservationStatus;
  queuePosition: QueuePosition;
  reservedAt: string;
  chargingStartedAt: string | null;
  chargingEndedAt: string | null;
}

export interface ReservationWithUser extends Reservation {
  userFullName: string;
  carModelLabel: string | null;
  batteryCapacityKwh: number | null;
}

export const ACTIVE_STATUSES: ReadonlyArray<ReservationStatus> = ['reserved', 'charging'] as const;
