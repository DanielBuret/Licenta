import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface CreateStationInput {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  powerKw: number;
}

export interface UpdateStationInput extends Partial<CreateStationInput> {
  id: number;
}

export function useCreateStation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateStationInput) =>
      (await api.post('/api/admin/stations', input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stations'] }),
  });
}

export function useUpdateStation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }: UpdateStationInput) =>
      (await api.patch(`/api/admin/stations/${id}`, rest)).data,
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['stations'] });
      qc.invalidateQueries({ queryKey: ['station', id] });
    },
  });
}

export function useDeleteStation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/admin/stations/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stations'] }),
  });
}
