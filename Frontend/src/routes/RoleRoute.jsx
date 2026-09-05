import { Navigate, Outlet } from 'react-router-dom';

export default function RoleRoute({ allowedRoles }) {
  const userStr = localStorage.getItem('user');
  let userRole = null;
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      userRole = user?.role;
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
    }
  }
  
  if (!userRole || (allowedRoles && !allowedRoles.includes(userRole))) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <Outlet />;
}

