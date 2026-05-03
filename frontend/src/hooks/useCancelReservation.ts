import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useCancelReservation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await api.post(`/api/reservations/${id}/cancel`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-reservations'] });
      qc.invalidateQueries({ queryKey: ['stations'] });
    },
  });
}
