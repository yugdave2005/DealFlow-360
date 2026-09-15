import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { normalizeRole, ROLE_DEFAULT_ROUTES } from '../../lib/roles';
import DealFlowLogo from '../../components/DealFlowLogo';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token') || searchParams.get('accessToken');
    const userStr = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Google authentication failed or was cancelled');
      navigate('/auth/login', { replace: true });
      return;
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        login(user, token);
        toast.success(`Welcome to DealFlow360, ${user.name || user.email}!`);
        
        const normalizedRole = normalizeRole(user.role);
        const targetRoute = ROLE_DEFAULT_ROUTES[normalizedRole] || '/sales/quotations';
        navigate(targetRoute, { replace: true });
      } catch (err) {
        console.error('Error parsing OAuth user data:', err);
        toast.error('Failed to complete Google Sign-In');
        navigate('/auth/login', { replace: true });
      }
    } else if (token) {
      // Token only fallback
      localStorage.setItem('accessToken', token);
      navigate('/sales/quotations', { replace: true });
    } else {
      navigate('/auth/login', { replace: true });
    }
  }, [searchParams, login, navigate]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center space-y-4">
        <DealFlowLogo variant="light" size="lg" className="animate-pulse" />
        <div className="w-8 h-8 border-3 border-[#D97757] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-[#6F6B66]">Completing secure authentication...</p>
      </div>
    </div>
  );
}
