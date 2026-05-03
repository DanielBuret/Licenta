import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface StationDetailReservation {
  id: number;
  status: 'reserved' | 'charging';
  queuePosition: 1 | 2;
  batteryLevelStart: number;
  reservedAt: string;
  chargingStartedAt: string | null;
  userId: string;
  userFullName: string;
  carModelLabel: string | null;
  batteryCapacityKwh: number | null;
}

export interface StationDetail {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  powerKw: number;
  activeReservations: StationDetailReservation[];
}

export function useStationDetail(id: number | null) {
  return useQuery<StationDetail>({
    queryKey: ['station', id],
    enabled: id != null,
    queryFn: async () => (await api.get<StationDetail>(`/api/stations/${id}`)).data,
    refetchInterval: 1000,
  });
}
