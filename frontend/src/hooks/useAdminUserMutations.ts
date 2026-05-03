import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { UserRole } from '@charging-station/shared';
import type { AdminUser } from './useAdminUsers';

export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  carModelId?: number | null;
  role?: UserRole;
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['admin-users'] });
}

export function useCreateAdminUser() {
  const qc = useQueryClient();
  return useMutation<AdminUser, Error, CreateUserInput>({
    mutationFn: async (input) => (await api.post<AdminUser>('/api/admin/users', input)).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useDeleteAdminUser() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await api.delete(`/api/admin/users/${id}`);
    },
    onSuccess: () => invalidate(qc),
  });
}

export function useSetAdminUserRole() {
  const qc = useQueryClient();
  return useMutation<AdminUser, Error, { id: string; role: UserRole }>({
    mutationFn: async ({ id, role }) =>
      (await api.patch<AdminUser>(`/api/admin/users/${id}/role`, { role })).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useSetAdminUserEmail() {
  const qc = useQueryClient();
  return useMutation<AdminUser, Error, { id: string; email: string }>({
    mutationFn: async ({ id, email }) =>
      (await api.patch<AdminUser>(`/api/admin/users/${id}/email`, { email })).data,
    onSuccess: () => invalidate(qc),
  });
}

export function useSetAdminUserPassword() {
  return useMutation<void, Error, { id: string; password: string }>({
    mutationFn: async ({ id, password }) => {
      await api.patch(`/api/admin/users/${id}/password`, { password });
    },
  });
}
