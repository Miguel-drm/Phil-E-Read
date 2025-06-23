import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChange, signIn, signUp, signOutUser, resetPassword, getUserProfile, isProfileComplete } from '../services/authService';
import type { UserProfile, UserRole } from '../services/authService';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  userRole: UserRole | null;
  loading: boolean;
  isProfileComplete: boolean;
  signIn: (email: string, password: string) => Promise<UserProfile | null>;
  signUp: (email: string, password: string, displayName?: string) => Promise<UserProfile | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUserProfile: () => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile and role
  const fetchAndSetUserProfile = async () => {
    try {
      const profile = await getUserProfile();
      setUserProfile(profile);
      setUserRole(profile?.role || null);
      return profile;
    } catch (error) {
      setUserProfile(null);
      setUserRole(null);
      return null;
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChange(async (user) => {
      setCurrentUser(user);
      if (user) {
        setLoading(true);
        await fetchAndSetUserProfile();
        setLoading(false);
      } else {
        setUserProfile(null);
        setUserRole(null);
        setLoading(false);
      }
    });
    return unsubscribe;
    // eslint-disable-next-line
  }, []);

  // Sign in and immediately fetch profile
  const handleSignIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signIn(email, password);
      const profile = await fetchAndSetUserProfile();
      setLoading(false);
      return profile;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Sign up, then sign in, then fetch profile
  const handleSignUp = async (email: string, password: string, displayName?: string) => {
    setLoading(true);
    try {
      await signUp(email, password, displayName);
      await signIn(email, password);
      const profile = await fetchAndSetUserProfile();
      setLoading(false);
      return profile;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Sign out and clear state
  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOutUser();
    } finally {
      setCurrentUser(null);
      setUserProfile(null);
      setUserRole(null);
      setLoading(false);
      localStorage.clear();
      sessionStorage.clear();
    }
  };

  // Password reset
  const handleResetPassword = async (email: string) => {
    setLoading(true);
    try {
      await resetPassword(email);
    } finally {
      setLoading(false);
    }
  };

  // Manual profile refresh
  const refreshUserProfile = async () => {
    setLoading(true);
    try {
      const profile = await fetchAndSetUserProfile();
      setLoading(false);
      return profile;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const value: AuthContextType = {
    currentUser,
    userProfile,
    userRole,
    loading,
    isProfileComplete: userProfile ? isProfileComplete(userProfile) : false,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 