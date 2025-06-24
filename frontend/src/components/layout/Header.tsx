import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

interface HeaderProps {
  isMobile: boolean;
  onMenuToggle: () => void;
  isSidebarCollapsed?: boolean;
  onShowSessionsModal?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  isMobile,
  onMenuToggle,
  isSidebarCollapsed = false,
  onShowSessionsModal
}) => {
  const { currentUser, userRole, signOut } = useAuth();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const getPageTitle = () => {
    const pathParts = location.pathname.split('/');
    // If the route is /teacher/reading-session/:sessionId, show 'Reading Session'
    if (
      pathParts.includes('reading-session') &&
      pathParts[pathParts.length - 2] === 'reading-session'
    ) {
      return 'Reading Session';
    }
    const path = pathParts.pop();
    return path ? path.charAt(0).toUpperCase() + path.slice(1) : 'Dashboard';
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm z-[999]">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center">
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none transition-colors duration-200"
            >
              <span className="sr-only">Toggle menu</span>
              <span className="relative block h-6 w-6">
                {/* Hamburger icon always on mobile, toggles on collapse for desktop/tablet */}
                {isMobile ? (
                  <svg
                    className="h-6 w-6"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <>
                    <svg
                      className={`absolute inset-0 h-6 w-6 transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-100' : 'opacity-0'}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <svg
                      className={`absolute inset-0 h-6 w-6 transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </>
                )}
              </span>
            </button>
            <h1 className="text-xl font-semibold text-gray-900 ml-4">{getPageTitle()}</h1>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none transition-colors duration-200"
              >
                <span className="sr-only">View notifications</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              {isNotificationsOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-gray-700">No new notifications</div>
                  </div>
                </div>
              )}
            </div>
            {/* Upcoming Sessions Button for larger screens */}
            {!isMobile && onShowSessionsModal && (
              <button
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition-all duration-200 text-sm font-semibold"
                onClick={onShowSessionsModal}
              >
                <i className="fas fa-calendar-alt mr-2"></i>
                Upcoming Sessions
              </button>
            )}
            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 focus:outline-none"
              >
                {/* Avatar with overlapping chevron dropdown icon */}
                <div className="relative h-8 w-8">
                  <div className="h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    {currentUser?.displayName?.[0] || currentUser?.email?.[0] || 'U'}
                  </div>
                  {/* Chevron dropdown icon, overlapping bottom-right */}
                  <span className="absolute -bottom-1 -right-2 bg-gray-100 rounded-full flex items-center justify-center shadow border border-gray-200" style={{ width: '1rem', height: '1rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="#111" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 ml-2">
                  {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
                </span>
              </button>
              {isProfileOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    <div className="px-4 py-2 text-sm text-gray-700">
                      {currentUser?.email}
                    </div>
                    <div className="px-4 py-2 text-xs text-gray-500">
                      {userRole}
                    </div>
                    {/* Upcoming Sessions in dropdown for mobile only */}
                    {isMobile && onShowSessionsModal && (
                      <button
                        onClick={onShowSessionsModal}
                        className="block w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 focus:outline-none flex items-center gap-2"
                      >
                        <i className="fas fa-calendar-alt"></i>
                        Upcoming Sessions
                      </button>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 