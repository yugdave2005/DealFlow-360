import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import DealFlowLogo from '../../components/DealFlowLogo';
import { 
  Briefcase, 
  UserCheck, 
  CreditCard, 
  Truck, 
  User,
  CheckCircle2,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff
} from 'lucide-react';

const ROLES = [
  {
    id: 'SALES_REP',
    title: 'Sales Representative',
    icon: Briefcase
  },
  {
    id: 'SALES_MANAGER',
    title: 'Sales Manager',
    icon: UserCheck
  },
  {
    id: 'FINANCE',
    title: 'Finance Controller',
    icon: CreditCard
  },
  {
    id: 'OPERATIONS',
    title: 'Operations / Fulfillment',
    icon: Truck
  },
  {
    id: 'CUSTOMER',
    title: 'Customer Client',
    icon: User
  }
];

export default function Signup() {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      role: 'SALES_REP'
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const selectedRole = watch('role');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';

  const handleRoleSelect = (roleId) => {
    setValue('role', roleId, { shouldValidate: true });
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Signup failed');
      
      localStorage.setItem('accessToken', result.data.accessToken);
      localStorage.setItem('user', JSON.stringify(result.data.user));

      toast.success(`Account created successfully!`);
      
      const role = result.data.user.role;
      if (role === 'ADMIN' || role === 'SALES_MANAGER' || role === 'SALES_REP') {
        navigate('/sales/dashboard');
      } else if (role === 'FINANCE') {
        navigate('/sales/invoices');
      } else if (role === 'OPERATIONS') {
        navigate('/sales/fulfillment');
      } else if (role === 'CUSTOMER') {
        navigate('/customer/quotations/current');
      } else {
        navigate('/sales/dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'An error occurred during signup');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-200/80">
        <div className="p-6 sm:p-10">
          <div className="flex flex-col items-center mb-8">
            <DealFlowLogo variant="light" size="lg" className="mb-2" />
            <p className="text-slate-500 mt-1 text-sm text-center">
              Create your account to start managing quotes, approvals, and deals.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-5 h-5" />
                </div>
                <input 
                  type="text" 
                  {...register('name', { required: 'Name is required' })} 
                  className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white text-slate-900 placeholder-slate-400 transition-all text-sm sm:text-base"
                  placeholder="Jane Doe" 
                />
              </div>
              {errors.name && <span className="text-red-500 text-xs mt-1 block">{errors.name.message}</span>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input 
                  type="email" 
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })} 
                  className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white text-slate-900 placeholder-slate-400 transition-all text-sm sm:text-base"
                  placeholder="jane@company.com" 
                />
              </div>
              {errors.email && <span className="text-red-500 text-xs mt-1 block">{errors.email.message}</span>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  {...register('password', { 
                    required: 'Password is required', 
                    minLength: { value: 8, message: 'Password must be at least 8 characters' } 
                  })} 
                  className="w-full pl-11 pr-11 py-2.5 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white text-slate-900 placeholder-slate-400 transition-all text-sm sm:text-base"
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
              {errors.password && <span className="text-red-500 text-xs mt-1 block">{errors.password.message}</span>}
            </div>

            {/* Role Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Select Role
                </label>
                <span className="text-xs text-slate-500">
                  Choose your account type
                </span>
              </div>
              <input type="hidden" {...register('role', { required: 'Please select a role' })} value={selectedRole} />
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {ROLES.map((role) => {
                  const Icon = role.icon;
                  const isSelected = selectedRole === role.id;
                  return (
                    <button
                      type="button"
                      key={role.id}
                      onClick={() => handleRoleSelect(role.id)}
                      className={`relative flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all ${
                        isSelected 
                          ? 'border-indigo-600 bg-indigo-50/70 shadow-xs text-indigo-950 font-semibold ring-1 ring-indigo-600/20' 
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-medium'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${
                        isSelected ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs sm:text-sm text-left truncate">
                        {role.title}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 ml-auto shrink-0 fill-indigo-600 text-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 shadow-xs"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating account...</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center space-x-4">
            <div className="flex-1 border-t border-slate-200"></div>
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">or continue with</span>
            <div className="flex-1 border-t border-slate-200"></div>
          </div>

          <button 
            type="button"
            onClick={loginWithGoogle}
            className="w-full mt-4 bg-white border border-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-lg hover:bg-slate-50 transition-colors flex justify-center items-center gap-2.5 shadow-xs text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account? <Link to="/auth/login" className="text-indigo-600 hover:text-indigo-500 font-semibold">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
