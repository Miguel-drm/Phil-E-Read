import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { currentUser, userRole } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  if (!currentUser) {
    return null; // ProtectedRoute will handle redirection
  }

  // Enhanced responsive detection
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      
      // Auto-close mobile sidebar on larger screens
      if (width >= 1024) {
        setSidebarOpen(false);
      }
      
      // Auto-collapse sidebar on tablet for better space usage
      if (width >= 768 && width < 1024) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Scroll detection for back to top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setShowBackToTop(scrollTop > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Calculate main content margin based on sidebar state
  const getMainContentMargin = () => {
    if (isMobile) return '';
    if (sidebarCollapsed) return 'ml-0';
    return 'ml-64';
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden flex flex-col md:flex-row">
      {/* Sidebar */}
      <Sidebar
        userRole={userRole}
        isMobile={isMobile}
        isTablet={isTablet}
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        onToggleCollapse={toggleSidebarCollapse}
      />
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out w-full min-w-0 ${getMainContentMargin()}`}> 
        {/* Header */}
        <Header
          isMobile={isMobile}
          isTablet={isTablet}
          onMenuToggle={toggleSidebar}
          onSidebarToggle={toggleSidebarCollapse}
          sidebarCollapsed={sidebarCollapsed}
        />
        {/* Content Container */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 w-full min-w-0 pt-[var(--header-height,56px)] md:pt-0">
          <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 lg:py-8 pb-[env(safe-area-inset-bottom)]">
            {children}
          </div>
        </main>
      </div>
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out flex items-center justify-center group"
          aria-label="Back to top"
          title="Back to top"
        >
          <KeyboardArrowUpIcon 
            className="text-white group-hover:scale-110 transition-transform duration-200" 
            fontSize="large"
          />
        </button>
      )}
    </div>
  );
};

export default DashboardLayout; 