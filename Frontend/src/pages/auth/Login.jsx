import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import DealFlowLogo from '../../components/DealFlowLogo';
import { useAuth } from '../../context/AuthContext';
import { normalizeRole, ROLE_DEFAULT_ROUTES } from '../../lib/roles';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, defaultRoute, loading } = useAuth();

  // If already authenticated, do not allow staying on login page (e.g. via back button)
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(defaultRoute, { replace: true });
    }
  }, [isAuthenticated, loading, defaultRoute, navigate]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Login failed');
      }

      login(result.data.user, result.data.accessToken);

      toast.success('Welcome back to DealFlow360!');
      
      const normalizedRole = normalizeRole(result.data.user?.role);
      const targetRoute = ROLE_DEFAULT_ROUTES[normalizedRole] || '/sales/quotations';
      navigate(targetRoute, { replace: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = () => {
    window.location.href = `${API_BASE_URL}/auth/google?returnUrl=${encodeURIComponent(window.location.origin)}`;
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        <div className="bg-white rounded-xl border border-[#E6E1D9] shadow-df-md p-8">
          <div className="flex flex-col items-center mb-8">
            <DealFlowLogo variant="light" size="lg" className="mb-3" />
            <h1 className="text-xl font-semibold text-[#171717] mt-2">Welcome back</h1>
            <p className="text-sm text-[#96918A] mt-1">Sign in to your workspace</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate autoComplete="off">
            <div>
              <label className="df-label">Work email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#96918A]">
                  <Mail className="w-[18px] h-[18px]" />
                </div>
                <input
                  type="email"
                  autoComplete="off"
                  {...register('email', { 
                    required: 'Email address is required',
                    pattern: {
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                      message: 'Please enter a valid email format (e.g. name@company.com)'
                    }
                  })}
                  className={`df-input pl-10 ${errors.email ? 'border-[#C95757] focus:border-[#C95757] focus:ring-[#C95757]/15' : ''}`}
                  placeholder="you@company.com"
                />
              </div>
              {errors.email && <span className="text-[#C95757] text-xs mt-1 block font-medium">{errors.email.message}</span>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="df-label mb-0">Password</label>
                <Link to="/auth/forgot-password" className="text-xs text-[#D97757] hover:text-[#C96648] font-medium">Forgot password?</Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#96918A]">
                  <Lock className="w-[18px] h-[18px]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('password', { required: 'Password is required' })}
                  className={`df-input pl-10 pr-10 ${errors.password ? 'border-[#C95757] focus:border-[#C95757] focus:ring-[#C95757]/15' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#96918A] hover:text-[#6F6B66] transition-colors focus:outline-none cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
              {errors.password && <span className="text-[#C95757] text-xs mt-1 block font-medium">{errors.password.message}</span>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full df-btn-primary h-11 text-[15px] cursor-pointer"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center space-x-4">
            <div className="flex-1 border-t border-[#EEEAE4]"></div>
            <span className="text-xs text-[#96918A]">or continue with</span>
            <div className="flex-1 border-t border-[#EEEAE4]"></div>
          </div>

          <button
            type="button"
            onClick={loginWithGoogle}
            className="w-full mt-4 df-btn-secondary h-11 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            <span className="text-sm font-medium text-[#171717]">Sign in with Google</span>
          </button>

          <p className="mt-6 text-center text-sm text-[#6F6B66]">
            Don't have an account? <Link to="/auth/signup" className="text-[#D97757] hover:text-[#C96648] font-medium">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}