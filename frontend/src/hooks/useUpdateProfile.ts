import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface UpdateProfileInput {
  fullName?: string;
  carModelId?: number | null;
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => (await api.patch('/api/profile', input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}
