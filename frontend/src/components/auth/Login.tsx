import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import backgroundImage from '../../assets/img/bg.png';// Make sure to place bg.png in src/assets

interface LoginProps {
  onSwitchToSignup: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        // Redirect to auth-redirect after successful sign-in
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

  if (showResetPassword) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center px-4 relative"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-md flex flex-col gap-4 relative z-10">
          <div className="mb-2 text-center">
            <h2 className="text-2xl font-bold text-blue-700 mb-1">Reset Password</h2>
            <p className="text-gray-500 text-sm">
              {resetEmailSent 
                ? 'Check your email for password reset instructions'
                : 'Enter your email to receive reset instructions'
              }
            </p>
          </div>
          
          {!resetEmailSent ? (
            <>
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  className={`w-full px-4 py-2 rounded-lg border ${error ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm`}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              {error && <div className="text-xs text-red-600 text-center">{error}</div>}
              <button
                onClick={handleResetPassword}
                disabled={loading}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-base transition-colors"
              >
                {loading ? 'Sending...' : 'Send Reset Email'}
              </button>
            </>
          ) : (
            <div className="text-center">
              <div className="text-green-600 mb-4">
                <i className="fas fa-check-circle text-2xl"></i>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                We've sent a password reset link to {email}
              </p>
            </div>
          )}
          
          <button
            onClick={() => {
              setShowResetPassword(false);
              setResetEmailSent(false);
              setError('');
            }}
            className="w-full py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold text-base transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black opacity-40"></div>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-md flex flex-col gap-4 relative z-10">
        <div className="mb-2 text-center">
          <h2 className="text-2xl font-bold text-blue-700 mb-1">Sign In</h2>
          <p className="text-gray-500 text-sm">Welcome back! Please login to your account.</p>
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={`w-full px-4 py-2 rounded-lg border ${emailError ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm`}
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          {emailError && <div className="text-xs text-red-500 mt-1">{emailError}</div>}
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className={`w-full px-4 py-2 rounded-lg border ${passwordError ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm`}
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {passwordError && <div className="text-xs text-red-500 mt-1">{passwordError}</div>}
        </div>
        {error && <div className="text-xs text-red-600 text-center">{error}</div>}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-base transition-colors"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowResetPassword(true)}
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            Forgot your password?
          </button>
        </div>
        <div className="text-center text-sm text-gray-500 mt-2">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="text-blue-600 hover:underline font-medium"
          >
            Sign up
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login; 