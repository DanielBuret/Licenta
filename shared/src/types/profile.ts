export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  carModelId: number | null;
  role: UserRole;
  createdAt: string;
}
