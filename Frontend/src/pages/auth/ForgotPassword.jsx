import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  KeyRound, 
  Mail, 
  ArrowLeft, 
  CheckCircle2, 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import DealFlowLogo from '../../components/DealFlowLogo';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: 6-Box OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [isResendActive, setIsResendActive] = useState(false);

  const inputRefs = useRef([]);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval = null;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setIsResendActive(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // Step 1: Send OTP to Email
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to request reset code');

      setStep(2);
      setResendTimer(60);
      setIsResendActive(false);
      setOtpDigits(['', '', '', '', '', '']);
      toast.success(`Verification code dispatched to ${cleanEmail}`);
      setTimeout(() => inputRefs.current[0]?.focus(), 150);
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP code');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Handle OTP input across 6 boxes
  const handleOtpChange = (index, value) => {
    // Only accept numeric input
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal && value !== '') return;

    const newDigits = [...otpDigits];

    if (cleanVal.length > 1) {
      // User typed or pasted multiple digits in this box
      const pastedChars = cleanVal.slice(0, 6).split('');
      pastedChars.forEach((char, idx) => {
        if (index + idx < 6) {
          newDigits[index + idx] = char;
        }
      });
      setOtpDigits(newDigits);
      const nextIdx = Math.min(index + pastedChars.length, 5);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    // Auto-advance to next box if digit entered
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        // Move to previous box if current box is already empty
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    pasted.split('').forEach((char, idx) => {
      if (idx < 6) newDigits[idx] = char;
    });
    setOtpDigits(newDigits);
    const targetFocus = Math.min(pasted.length, 5);
    inputRefs.current[targetFocus]?.focus();
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      toast.error('Please enter all 6 digits of your verification code');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: fullOtp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid or expired OTP code');

      toast.success('Code verified! Please create your new password.');
      setStep(3);
    } catch (err) {
      toast.error(err.message || 'Verification failed. Please check the code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (!isResendActive) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to resend code');

      setResendTimer(60);
      setIsResendActive(false);
      setOtpDigits(['', '', '', '', '', '']);
      toast.success('A new 6-digit code has been dispatched to your email');
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.message || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Save New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otpDigits.join(''),
          newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reset password');

      toast.success('Password successfully reset! You can now log in.');
      navigate('/auth/login', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Reset failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="mb-6">
        <DealFlowLogo variant="light" size="lg" />
      </div>

      <div className="w-full max-w-md bg-[#FFFFFF] rounded-3xl border border-[#EBE8E2] shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden p-8 space-y-6">
        
        {/* Header with Step Indicator */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#F5EFEB] border border-[#E8DFD8] flex items-center justify-center text-[#B85D19] mx-auto shadow-xs">
            {step === 1 ? (
              <Mail className="w-6 h-6" />
            ) : step === 2 ? (
              <ShieldCheck className="w-6 h-6 text-[#B85D19]" />
            ) : (
              <KeyRound className="w-6 h-6 text-[#B85D19]" />
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 pt-1">
            <span className={`h-1.5 rounded-full transition-all duration-300 ${step >= 1 ? 'w-6 bg-[#B85D19]' : 'w-2 bg-[#EBE8E2]'}`} />
            <span className={`h-1.5 rounded-full transition-all duration-300 ${step >= 2 ? 'w-6 bg-[#B85D19]' : 'w-2 bg-[#EBE8E2]'}`} />
            <span className={`h-1.5 rounded-full transition-all duration-300 ${step >= 3 ? 'w-6 bg-[#B85D19]' : 'w-2 bg-[#EBE8E2]'}`} />
          </div>

          <h1 className="text-2xl font-bold text-[#1E1B18] tracking-tight">
            {step === 1 && 'Forgot Password'}
            {step === 2 && 'Enter Verification Code'}
            {step === 3 && 'Create New Password'}
          </h1>
          
          <p className="text-xs sm:text-sm text-[#78716C] max-w-xs mx-auto">
            {step === 1 && 'Enter your verified work email address to receive a 6-digit recovery code.'}
            {step === 2 && (
              <span>
                We sent a 6-digit security code to <strong className="text-[#1E1B18]">{email}</strong>
              </span>
            )}
            {step === 3 && 'Your code has been verified. Choose a strong new password for your account.'}
          </p>
        </div>

        {/* STEP 1: Enter Email */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4" noValidate autoComplete="off">
            <div>
              <label className="block text-xs font-semibold text-[#44403C] mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  autoComplete="off"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-[#FBF9F7] border border-[#EBE8E2] text-sm text-[#1E1B18] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#B85D19]/20 focus:border-[#B85D19] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full bg-[#B85D19] hover:bg-[#9E4E13] text-white font-bold py-3 px-4 rounded-xl shadow-xs transition-colors flex justify-center items-center gap-2 text-sm cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Sending Code...</span>
              ) : (
                <>
                  <span>Send Recovery Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: 6 Individual Input Boxes for OTP */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-center text-[#44403C]">
                6-Digit Security Code
              </label>

              {/* 6 Box Grid */}
              <div className="flex justify-between items-center gap-2 sm:gap-2.5 max-w-sm mx-auto" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className={`w-12 h-14 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-black rounded-2xl bg-[#FBF9F7] border transition-all ${
                      digit
                        ? 'border-[#B85D19] text-[#1E1B18] ring-2 ring-[#B85D19]/20 bg-white'
                        : 'border-[#EBE8E2] text-[#1E1B18] hover:border-[#D4CCC5]'
                    } focus:outline-none focus:border-[#B85D19] focus:ring-2 focus:ring-[#B85D19]/30 shadow-xs`}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={isLoading || otpDigits.join('').length !== 6}
              className="w-full bg-[#B85D19] hover:bg-[#9E4E13] text-white font-bold py-3 px-4 rounded-xl shadow-xs transition-colors flex justify-center items-center gap-2 text-sm cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Verifying Code...</span>
              ) : (
                <>
                  <span>Verify OTP</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Resend Code / Timer Action */}
            <div className="flex items-center justify-between text-xs pt-1 px-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[#78716C] hover:text-[#1E1B18] font-medium transition-colors cursor-pointer"
              >
                Change Email
              </button>

              {isResendActive ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-[#B85D19] hover:text-[#9E4E13] font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Resend Code</span>
                </button>
              ) : (
                <span className="text-[#A8A29E] font-medium">
                  Resend in <strong className="text-[#44403C] font-mono">0:{String(resendTimer).padStart(2, '0')}</strong>
                </span>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: Enter New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Identity verified via 6-digit OTP code</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#44403C] mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-xl bg-[#FBF9F7] border border-[#EBE8E2] text-sm text-[#1E1B18] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#B85D19]/20 focus:border-[#B85D19] transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1E1B18] p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#44403C] mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  minLength={8}
                  className={`w-full px-4 py-3 rounded-xl bg-[#FBF9F7] border ${
                    confirmPassword && confirmPassword !== newPassword
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-[#EBE8E2] focus:ring-[#B85D19]/20 focus:border-[#B85D19]'
                  } text-sm text-[#1E1B18] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 transition-all pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1E1B18] p-1 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <span className="text-rose-600 text-xs mt-1 block">Passwords do not match</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !newPassword || newPassword.length < 8 || newPassword !== confirmPassword}
              className="w-full bg-[#B85D19] hover:bg-[#9E4E13] text-white font-bold py-3 px-4 rounded-xl shadow-xs transition-colors flex justify-center items-center gap-2 text-sm cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Updating Password...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Update Password & Sign In</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Navigation */}
        <div className="pt-2 text-center text-xs border-t border-[#F5EFEB]">
          <Link
            to="/auth/login"
            className="text-[#78716C] hover:text-[#1E1B18] font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
          </Link>
        </div>

      </div>
    </div>
  );
}