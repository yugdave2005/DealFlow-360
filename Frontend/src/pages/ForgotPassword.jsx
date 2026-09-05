import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestOtp = async (data) => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/v1/forgot-password', {
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
      const res = await fetch('http://localhost:5000/api/v1/auth/reset-password', {
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reset Password</h1>
          <p className="text-slate-500 mt-2">
            {step === 1 ? "Enter your email to receive a recovery code." : "Enter your recovery code and new password."}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSubmit(handleRequestOtp)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="you@company.com"
              />
              {errors.email && <span className="text-red-500 text-xs mt-1">{errors.email.message}</span>}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex justify-center items-center"
            >
              {isLoading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit(handleResetPassword)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">6-Digit Code</label>
              <input
                type="text"
                {...register('otp', { required: 'Code is required', minLength: 6, maxLength: 6 })}
                className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="123456"
                maxLength={6}
              />
              {errors.otp && <span className="text-red-500 text-xs mt-1">{errors.otp.message}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                {...register('newPassword', { required: 'New password is required' })}
                className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="••••••••"
              />
              {errors.newPassword && <span className="text-red-500 text-xs mt-1">{errors.newPassword.message}</span>}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex justify-center items-center"
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-sm">
          <Link to="/auth/login" className="text-slate-500 hover:text-slate-700 font-medium whitespace-nowrap">&larr; Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
