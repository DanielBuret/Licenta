import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface MyReservation {
  id: number;
  stationId: number;
  status: 'reserved' | 'charging' | 'completed' | 'cancelled';
  queuePosition: 1 | 2;
  batteryLevelStart: number;
  reservedAt: string;
  chargingStartedAt: string | null;
  chargingEndedAt: string | null;
  station?: { id: number; name: string; address: string; powerKw: number };
}

export function useMyReservations() {
  return useQuery<MyReservation[]>({
    queryKey: ['my-reservations'],
    queryFn: async () => (await api.get<MyReservation[]>('/api/reservations/me')).data,
  });
}
