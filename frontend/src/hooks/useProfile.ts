import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { UserRole } from '@charging-station/shared';

export interface ProfileResponse {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  carModelId: number | null;
  carModel: {
    id: number;
    brand: string;
    model: string;
    batteryCapacityKwh: number;
  } | null;
}

export function useProfile(enabled = true) {
  return useQuery<ProfileResponse>({
    queryKey: ['profile'],
    enabled,
    queryFn: async () => (await api.get<ProfileResponse>('/api/profile')).data,
    staleTime: 60_000,
  });
}
