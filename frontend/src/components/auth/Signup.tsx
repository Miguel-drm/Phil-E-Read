import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import backgroundImage from '../../assets/img/bg.png'; // Make sure to place bg.png in src/assets
import Swal from 'sweetalert2';
import { FaEnvelope, FaLock, FaUser, FaEye, FaEyeSlash, FaInfoCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getUserProfile } from '../../services/authService';

interface SignupProps {
  onSwitchToLogin: () => void;
}

const getPasswordStrength = (password: string) => {
  if (password.length < 6) return { label: 'Weak', color: 'bg-red-400' };
  if (password.match(/[A-Z]/) && password.match(/[0-9]/) && password.length >= 8) return { label: 'Strong', color: 'bg-green-500' };
  if (password.length >= 6) return { label: 'Medium', color: 'bg-yellow-400' };
  return { label: '', color: '' };
};

const Signup: React.FC<SignupProps> = ({ onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signUp, signIn, refreshUserProfile } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email: string): boolean => {
    const domain = email.split('@')[1]?.toLowerCase();
    return domain === 'admin.com' || domain === 'teacher.edu.ph' || domain?.includes('.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError('');
    
    if (!validateEmail(email)) {
      setError('Please use a valid email address');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    if (name && email && password) {
      setLoading(true);
      try {
        await signUp(email, password, name);
        await signIn(email, password);
        await refreshUserProfile();
        const profile = await getUserProfile();
        await Swal.fire({
          icon: 'success',
          title: 'Account Created Successfully!',
          text: 'Redirecting to your dashboard...',
          timer: 1500,
          timerProgressBar: true,
          showConfirmButton: false
        });
        const userRole = profile?.role;
        if (userRole === 'admin') navigate('/admin/dashboard');
        else if (userRole === 'teacher') navigate('/teacher/dashboard');
        else navigate('/parent/dashboard');
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setTouched(false);
      } catch (error: any) {
        const errorMessage = getErrorMessage(error.code);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled. Please contact support';
      default:
        return 'An error occurred. Please try again';
    }
  };

  const nameError = touched && !name ? 'Name is required' : '';
  const emailError = touched && !email ? 'Email is required' : '';
  const passwordError = touched && !password ? 'Password is required' : '';
  const confirmPasswordError = touched && password !== confirmPassword ? 'Passwords do not match' : '';
  const passwordStrength = getPasswordStrength(password);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center'}}>
      <form onSubmit={handleSubmit} className="bg-white/90 rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col gap-5 relative z-10 border border-blue-100">
        <div className="flex flex-col items-center mb-2">
          <img src="/assets/img/phil-logo.svg" alt="Phil-E-Read Logo" className="w-22 h-22 mb-2" />
          <h2 className="text-2xl font-extrabold text-blue-800 mb-1 tracking-tight">Create Account</h2>
          <p className="text-gray-500 text-sm">Join us and start your journey!</p>
        </div>
        <div className="relative">
          <FaUser className="absolute left-3 top-3 text-gray-400" />
          <input
            id="name"
            type="text"
            autoComplete="name"
            className={`w-full pl-10 pr-3 py-2 rounded-lg border ${nameError ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm bg-white`}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Full Name"
          />
          {nameError && <div className="text-xs text-red-500 mt-1 ml-1">{nameError}</div>}
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
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <FaInfoCircle className="inline-block mr-1" />
            Use @admin.com for admin, @teacher.edu.ph for teacher, or any other email for parent
          </div>
        </div>
        <div className="relative">
          <FaLock className="absolute left-3 top-3 text-gray-400" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className={`w-full pl-10 pr-10 py-2 rounded-lg border ${passwordError ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm bg-white`}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
          />
          <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-2.5 text-gray-400 hover:text-blue-600 focus:outline-none">
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
          {password && (
            <div className="flex items-center gap-2 mt-1 ml-1">
              <div className={`w-20 h-2 rounded-full ${passwordStrength.color}`}></div>
              <span className={`text-xs font-semibold ${passwordStrength.label === 'Strong' ? 'text-green-600' : passwordStrength.label === 'Medium' ? 'text-yellow-600' : 'text-red-600'}`}>{passwordStrength.label}</span>
            </div>
          )}
          {passwordError && <div className="text-xs text-red-500 mt-1 ml-1">{passwordError}</div>}
        </div>
        <div className="relative">
          <FaLock className="absolute left-3 top-3 text-gray-400" />
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className={`w-full pl-10 pr-10 py-2 rounded-lg border ${confirmPasswordError ? 'border-red-400' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm bg-white`}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
          />
          <button type="button" onClick={() => setShowConfirmPassword(v => !v)} className="absolute right-3 top-2.5 text-gray-400 hover:text-blue-600 focus:outline-none">
            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
          {confirmPasswordError && <div className="text-xs text-red-500 mt-1 ml-1">{confirmPasswordError}</div>}
        </div>
        {error && <div className="text-xs text-red-600 text-center font-medium bg-red-50 border border-red-200 rounded py-2 px-3 mb-1">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-base shadow transition-colors"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
        <div className="flex items-center my-2">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="mx-2 text-xs text-gray-400">or</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="w-full py-2 rounded-lg border border-blue-600 text-blue-700 hover:bg-blue-50 font-semibold text-base transition-colors"
        >
          Sign in
        </button>
      </form>
      <footer className="absolute bottom-4 left-0 w-full text-center text-xs text-white/80 z-20">&copy; {new Date().getFullYear()} Phil-E-Read. All rights reserved.</footer>
    </div>
  );
};

export default Signup; 