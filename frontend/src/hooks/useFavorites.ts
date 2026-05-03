import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../auth/useAuth';

export function useFavorites() {
  const { user } = useAuth();
  const query = useQuery<number[]>({
    queryKey: ['favorites'],
    queryFn: async () => (await api.get<number[]>('/api/favorites')).data,
    enabled: !!user,
  });
  const set = useMemo(() => new Set(query.data ?? []), [query.data]);
  return { ids: query.data ?? [], set, isLoading: query.isLoading };
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ stationId, favorite }: { stationId: number; favorite: boolean }) => {
      if (favorite) {
        await api.put(`/api/favorites/${stationId}`);
      } else {
        await api.delete(`/api/favorites/${stationId}`);
      }
    },
    onMutate: async ({ stationId, favorite }) => {
      await qc.cancelQueries({ queryKey: ['favorites'] });
      const previous = qc.getQueryData<number[]>(['favorites']) ?? [];
      const next = favorite
        ? Array.from(new Set([...previous, stationId]))
        : previous.filter((id) => id !== stationId);
      qc.setQueryData<number[]>(['favorites'], next);
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx) qc.setQueryData(['favorites'], ctx.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}
