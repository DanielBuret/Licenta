import { useQuery } from '@tanstack/react-query';
import type { CarModel } from '@charging-station/shared';
import { api } from '../lib/api';

export function useCarModels() {
  return useQuery<CarModel[]>({
    queryKey: ['car-models'],
    queryFn: async () => {
      const res = await api.get<CarModel[]>('/api/car-models');
      return res.data;
    },
    staleTime: 5 * 60_000,
  });
}
