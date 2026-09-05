import { Navigate, Outlet } from 'react-router-dom';

export default function RoleRoute({ allowedRoles }) {
  const userRole = 'SALES_REP'; // Placeholder for actual role check
  
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <Outlet />;
}
