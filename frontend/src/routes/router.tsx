import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <div>HomePage placeholder</div>,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <div>RegisterPage placeholder</div>,
  },
  {
    path: '/dashboard',
    element: <div>DashboardPage placeholder</div>,
  },
  {
    path: '*',
    element: <div>404</div>,
  },
]);
