import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['admin-reservations'] });
  qc.invalidateQueries({ queryKey: ['stations'] });
}

export function useAdminCancelReservation() {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await api.post(`/api/admin/reservations/${id}/cancel`);
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useAdminFinishReservation() {
  const qc = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (id) => {
      await api.post(`/api/admin/reservations/${id}/finish`);
    },
    onSuccess: () => invalidate(qc),
  });
}
