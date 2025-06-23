import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const RoleBasedRedirect: React.FC = () => {
  const { currentUser, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Still loading user or role — do nothing yet
    if (loading) return;

    // User not logged in
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // User logged in, but role not fetched yet
    if (!userRole) {
      console.warn('User logged in but role is missing.');
      return;
    }

    // Role-based redirect
    switch (userRole) {
      case 'admin':
        navigate('/admin/dashboard');
        break;
      case 'teacher':
        navigate('/teacher/dashboard');
        break;
      case 'parent':
        navigate('/parent/dashboard');
        break;
      default:
        console.error('Invalid user role:', userRole);
        navigate('/login');
        break;
    }
  }, [currentUser, userRole, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
};

export default RoleBasedRedirect; 