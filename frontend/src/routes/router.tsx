import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { HomePage } from '../pages/HomePage';
import { DashboardPage } from '../pages/DashboardPage';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { AdminRoute } from '../auth/AdminRoute';
import { AdminLayout } from '../pages/admin/AdminLayout';
import { AdminMap } from '../pages/admin/AdminMap';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { index: true, element: <AdminMap /> },
      { path: 'stations', element: <AdminMap /> },
      { path: 'users', element: <AdminUsersPage /> },
    ],
  },
  {
    path: '*',
    element: <div>404</div>,
  },
]);
