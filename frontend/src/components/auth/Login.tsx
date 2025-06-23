import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import backgroundImage from '../../assets/img/bg.png';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

interface LoginProps {
  onSwitchToSignup: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const { signIn, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError('');
    if (email && password) {
      setLoading(true);
      try {
        await signIn(email, password);
        navigate('/auth-redirect');
      } catch (error: any) {
        const errorMessage = getErrorMessage(error.code);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await resetPassword(email);
      setResetEmailSent(true);
    } catch (error: any) {
      const errorMessage = getErrorMessage(error.code);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/user-disabled':
        return 'This account has been disabled';
      default:
        return 'An error occurred. Please try again';
    }
  };

  const emailError = touched && !email ? 'Email is required' : '';
  const passwordError = touched && !password ? 'Password is required' : '';

  // --- Reset Password View ---
  if (showResetPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative" style={{backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center'}}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-blue-700/60 to-blue-400/40"></div>
        <div className="bg-white/90 rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col gap-4 relative z-10 border border-blue-100">
          <div className="flex flex-col items-center mb-2">
            <img src="/assets/img/phil-logo.svg" alt="Phil-E-Read Logo" className="w-14 h-14 mb-2" />
            <h2 className="text-2xl font-extrabold text-blue-800 mb-1 tracking-tight">Reset Password</h2>
            <p className="text-gray-500 text-sm text-center">
              {resetEmailSent ? 'Check your email for password reset instructions' : 'Enter your email to receive reset instructions'}
            </p>
          </div>
          {!resetEmailSent ? (
            <>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  className={`w-full pl-10 pr-3 py-2 rounded-lg border ${error ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm bg-white`}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email address"
                />
              </div>
              {error && <div className="text-xs text-red-600 text-center">{error}</div>}
              <button
                onClick={handleResetPassword}
                disabled={loading}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-base shadow transition-colors"
              >
                {loading ? 'Sending...' : 'Send Reset Email'}
              </button>
            </>
          ) : (
            <div className="text-center">
              <div className="text-green-600 mb-4">
                <i className="fas fa-check-circle text-2xl"></i>
              </div>
              <p className="text-sm text-gray-600 mb-4">We've sent a password reset link to {email}</p>
            </div>
          )}
          <button
            onClick={() => { setShowResetPassword(false); setResetEmailSent(false); setError(''); }}
            className="w-full py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-base transition-colors"
          >Back to Login</button>
        </div>
        <footer className="absolute bottom-4 left-0 w-full text-center text-xs text-white/80 z-20">&copy; {new Date().getFullYear()} Phil-E-Read. All rights reserved.</footer>
      </div>
    );
  }

  // --- Login View ---
  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center'}}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-blue-700/60 to-blue-400/40"></div>
      <form onSubmit={handleSubmit} className="bg-white/90 rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col gap-5 relative z-10 border border-blue-100">
        <div className="flex flex-col items-center mb-2">
          <img src="/assets/img/phil-logo.svg" alt="Phil-E-Read Logo" className="w-22 h-22 mb-2" />
          <h2 className="text-2xl font-extrabold text-blue-800 mb-1 tracking-tight">Sign In</h2>
          <p className="text-gray-500 text-sm">Welcome back! Please login to your account.</p>
        </div>
        <div className="relative">
          <FaEnvelope className="absolute left-3 top-3 text-gray-400" />
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={`w-full pl-10 pr-3 py-2 rounded-lg border ${emailError ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm bg-white`}
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email address"
          />
          {emailError && <div className="text-xs text-red-500 mt-1 ml-1">{emailError}</div>}
        </div>
        <div className="relative">
          <FaLock className="absolute left-3 top-3 text-gray-400" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className={`w-full pl-10 pr-10 py-2 rounded-lg border ${passwordError ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm bg-white`}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
          />
          <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-2.5 text-gray-400 hover:text-blue-600 focus:outline-none">
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
          {passwordError && <div className="text-xs text-red-500 mt-1 ml-1">{passwordError}</div>}
        </div>
        {error && <div className="text-xs text-red-600 text-center font-medium bg-red-50 border border-red-200 rounded py-2 px-3 mb-1">{error}</div>}
        <div className="flex items-center justify-between mb-1">
          <label className="flex items-center text-sm text-gray-600">
            <input type="checkbox" className="mr-2 accent-blue-600" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
            Remember me
          </label>
          <button type="button" className="text-blue-600 hover:underline text-sm font-medium" onClick={() => setShowResetPassword(true)}>
            Forgot password?
          </button>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-base shadow transition-colors"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <div className="flex items-center my-2">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="mx-2 text-xs text-gray-400">or</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="w-full py-2 rounded-lg border border-blue-600 text-blue-700 hover:bg-blue-50 font-semibold text-base transition-colors"
        >
          Create an account
        </button>
      </form>
      <footer className="absolute bottom-4 left-0 w-full text-center text-xs text-white/80 z-20">&copy; {new Date().getFullYear()} Phil-E-Read. All rights reserved.</footer>
    </div>
  );
};

export default Login; 