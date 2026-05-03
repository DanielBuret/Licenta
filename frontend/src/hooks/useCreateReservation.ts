import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

interface CreateInput {
  stationId: number;
  batteryLevelStart: number;
}

export function useCreateReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateInput) => {
      const res = await api.post('/api/reservations', input);
      return res.data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['stations'] });
      qc.invalidateQueries({ queryKey: ['station', vars.stationId] });
      qc.invalidateQueries({ queryKey: ['my-reservations'] });
    },
  });
}
