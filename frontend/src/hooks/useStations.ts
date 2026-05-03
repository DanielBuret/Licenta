import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface StationListItem {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  powerKw: number;
  activeReservations: number;
  hasCharging: boolean;
  hasReserved: boolean;
}

export function useStations() {
  return useQuery<StationListItem[]>({
    queryKey: ['stations'],
    queryFn: async () => (await api.get<StationListItem[]>('/api/stations')).data,
  });
}
