import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { ReservationStatus } from '@charging-station/shared';

export interface AdminReservation {
  id: number;
  status: ReservationStatus;
  queuePosition: 1 | 2;
  batteryLevelStart: number;
  reservedAt: string;
  chargingStartedAt: string | null;
  chargingEndedAt: string | null;
  user: { id: string; fullName: string; email: string };
  station: { id: number; name: string };
}

export function useAdminReservations(status?: ReservationStatus) {
  return useQuery<AdminReservation[]>({
    queryKey: ['admin-reservations', status ?? 'all'],
    queryFn: async () => {
      const params = status ? { status } : {};
      return (await api.get<AdminReservation[]>('/api/admin/reservations', { params })).data;
    },
  });
}
