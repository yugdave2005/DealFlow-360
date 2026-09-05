import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import DealFlowLogo from '../../components/DealFlowLogo';
import { useAuth } from '../../context/AuthContext';
import { normalizeRole, ROLE_DEFAULT_ROUTES } from '../../lib/roles';

export default function Login() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';

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
      
      // Direct redirect to role dashboard (use location.href to ensure AuthContext reads new localStorage on reload)
      const normalizedRole = normalizeRole(result.data.user?.role);
      const targetRoute = ROLE_DEFAULT_ROUTES[normalizedRole] || '/sales/dashboard';
      window.location.href = targetRoute;
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-200/80">
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <DealFlowLogo variant="light" size="lg" className="mb-2" />
            <p className="text-slate-500 text-sm mt-1">Sign in to your enterprise account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate autoComplete="off">
            {/* Dummy hidden inputs to defeat aggressive browser autofill */}
            <input type="text" name="fake_email_prevent_autofill" style={{ display: 'none' }} tabIndex="-1" autoComplete="off" />
            <input type="password" name="fake_password_prevent_autofill" style={{ display: 'none' }} tabIndex="-1" autoComplete="new-password" />

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
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
                  className={`w-full pl-11 pr-4 py-2.5 rounded-lg bg-slate-50 border ${errors.email ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-indigo-600'} focus:outline-none focus:ring-2 focus:bg-white text-slate-900 placeholder-slate-400 transition-all text-sm sm:text-base`}
                  placeholder="you@company.com"
                />
              </div>
              {errors.email && <span className="text-rose-500 text-xs mt-1 block font-medium">{errors.email.message}</span>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                <Link to="/auth/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-500 font-medium">Forgot password?</Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  {...register('password', { required: 'Password is required' })}
                  className={`w-full pl-11 pr-11 py-2.5 rounded-lg bg-slate-50 border ${errors.password ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-200 focus:ring-indigo-600'} focus:outline-none focus:ring-2 focus:bg-white text-slate-900 placeholder-slate-400 transition-all text-sm sm:text-base`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <span className="text-rose-500 text-xs mt-1 block font-medium">{errors.password.message}</span>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex justify-center items-center shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center space-x-4">
            <div className="flex-1 border-t border-slate-200"></div>
            <span className="text-sm text-slate-400">or continue with</span>
            <div className="flex-1 border-t border-slate-200"></div>
          </div>

          <button
            onClick={loginWithGoogle}
            className="w-full mt-6 bg-white border border-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-lg hover:bg-slate-50 transition-colors flex justify-center items-center gap-2 shadow-xs"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </button>

          <p className="mt-8 text-center text-sm text-slate-500">
            Don't have an account? <Link to="/auth/signup" className="text-indigo-600 hover:text-indigo-500 font-medium">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
