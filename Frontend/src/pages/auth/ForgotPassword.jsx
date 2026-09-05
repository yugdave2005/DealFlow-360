import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { KeyRound, Mail, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

  const handleRequestOtp = async (data) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email })
      });
      setEmail(data.email);
      setStep(2);
      toast.info('If that email exists, an OTP has been sent.');
    } catch (err) {
      toast.error('Failed to request OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (data) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: data.otp, newPassword: data.newPassword })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Reset failed');

      toast.success('Password successfully reset. Please log in.');
      navigate('/auth/login');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#FFFFFF] rounded-2xl border border-[#EBE8E2] shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#F5EFEB] border border-[#E8DFD8] flex items-center justify-center text-[#B85D19] mx-auto shadow-xs">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#1E1B18] tracking-tight">Reset Password</h1>
          <p className="text-xs sm:text-sm text-[#78716C]">
            {step === 1 ? "Enter your work email to receive a secure recovery code." : "Enter your recovery code and choose a new password."}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSubmit(handleRequestOtp)} className="space-y-4" noValidate autoComplete="off">
            <div>
              <label className="block text-xs font-semibold text-[#44403C] mb-1.5">Work Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  autoComplete="off"
                  {...register('email', { 
                    required: 'Email address is required',
                    pattern: {
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                      message: 'Please enter a valid email format'
                    }
                  })}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-[#FBF9F7] border ${errors.email ? 'border-rose-400 focus:ring-rose-500' : 'border-[#EBE8E2] focus:ring-[#B85D19]/20 focus:border-[#B85D19]'} text-sm text-[#1E1B18] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 transition-all`}
                  placeholder="you@company.com"
                />
              </div>
              {errors.email && <span className="text-rose-600 text-xs mt-1 block font-medium">{errors.email.message}</span>}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#B85D19] hover:bg-[#9E4E13] text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-colors flex justify-center items-center text-sm cursor-pointer disabled:opacity-60"
            >
              {isLoading ? 'Sending...' : 'Send Recovery OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit(handleResetPassword)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#44403C] mb-1.5">6-Digit Code</label>
              <input
                type="text"
                {...register('otp', { required: 'Code is required', minLength: 6, maxLength: 6 })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBF9F7] border border-[#EBE8E2] text-sm text-[#1E1B18] font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-[#B85D19]/20 focus:border-[#B85D19]"
                placeholder="123456"
                maxLength={6}
              />
              {errors.otp && <span className="text-rose-600 text-xs mt-1">{errors.otp.message}</span>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#44403C] mb-1.5">New Password</label>
              <input
                type="password"
                {...register('newPassword', { required: 'New password is required' })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBF9F7] border border-[#EBE8E2] text-sm text-[#1E1B18] focus:outline-none focus:ring-2 focus:ring-[#B85D19]/20 focus:border-[#B85D19]"
                placeholder="••••••••"
              />
              {errors.newPassword && <span className="text-rose-600 text-xs mt-1">{errors.newPassword.message}</span>}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#B85D19] hover:bg-[#9E4E13] text-white font-bold py-2.5 px-4 rounded-xl shadow-xs transition-colors flex justify-center items-center text-sm cursor-pointer disabled:opacity-60"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="pt-2 text-center text-xs">
          <Link to="/auth/login" className="text-[#78716C] hover:text-[#1E1B18] font-semibold inline-flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}