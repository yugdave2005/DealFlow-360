import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { normalizeRole } from '../lib/roles';

export default function RoleRoute({ allowedRoles }) {
  const { user, role, loading, isAuthenticated } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }
  
  const normalizedAllowed = allowedRoles?.map(r => normalizeRole(r)) || [];

  if (allowedRoles && allowedRoles.length > 0 && !normalizedAllowed.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }
  
  return <Outlet />;
}
