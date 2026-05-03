import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useProfile } from '../hooks/useProfile';

export function AdminRoute({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const location = useLocation();
  const { data: profile, isLoading: profileLoading } = useProfile(!!session);

  if (authLoading || (session && profileLoading)) {
    return <div>Se încarcă…</div>;
  }
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
