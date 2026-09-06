import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthLayout() {
  const { isAuthenticated, defaultRoute, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D97757]"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={defaultRoute} replace />;
  }

  return (
    <div className="auth-layout">
      <Outlet />
    </div>
  );
}
