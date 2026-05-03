import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useFinishReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await api.post(`/api/reservations/${id}/finish`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-reservations'] });
      qc.invalidateQueries({ queryKey: ['stations'] });
    },
  });
}
