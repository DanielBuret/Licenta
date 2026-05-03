import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { UserRole } from '@charging-station/shared';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
  carModel: {
    id: number;
    brand: string;
    model: string;
    batteryCapacityKwh: number;
  } | null;
}

export function useAdminUsers() {
  return useQuery<AdminUser[]>({
    queryKey: ['admin-users'],
    queryFn: async () => (await api.get<AdminUser[]>('/api/admin/users')).data,
  });
}
