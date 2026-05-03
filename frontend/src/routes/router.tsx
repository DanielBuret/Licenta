import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <div>HomePage placeholder</div>,
  },
  {
    path: '/login',
    element: <div>LoginPage placeholder</div>,
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
