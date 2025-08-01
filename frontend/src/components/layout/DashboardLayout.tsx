import React, { useState, useEffect, createContext } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import UpcomingSessions from '../dashboard/teacher/UpcomingSessions';
import { Outlet } from 'react-router-dom';
import EditProfileModal from '../../pages/teacher/EditProfileModal';

export const EditProfileModalContext = createContext({ openEditProfileModal: () => {} });

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

const sessionsData = [
  {
    id: '1',
    title: 'Group Reading - Level 3',
    time: 'Today, 10:30 AM',
    type: 'group',
    icon: 'fas fa-book',
    iconColor: 'text-[#3498DB]',
    bgColor: 'bg-blue-100',
    students: ['S', 'M', 'J'],
    studentCount: 6
  },
  {
    id: '2',
    title: 'Comprehension Assessment',
    time: 'Tomorrow, 1:15 PM',
    type: 'assessment',
    icon: 'fas fa-clipboard-check',
    iconColor: 'text-[#27AE60]',
    bgColor: 'bg-green-100',
    students: ['A', 'B', 'C'],
    studentCount: 8
  },
  {
    id: '3',
    title: 'Individual Reading - Emma',
    time: 'Jun 12, 9:00 AM',
    type: 'individual',
    icon: 'fas fa-user-edit',
    iconColor: 'text-purple-500',
    bgColor: 'bg-purple-100',
    students: [],
    studentCount: 1,
    level: 'Level 4 Reader'
  },
  {
    id: '4',
    title: 'Guided Reading - Group B',
    time: 'Jun 13, 11:30 AM',
    type: 'group',
    icon: 'fas fa-users',
    iconColor: 'text-orange-500',
    bgColor: 'bg-orange-100',
    students: ['T', 'R', 'K'],
    studentCount: 7
  }
];

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { currentUser, userRole } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  if (!currentUser) {
    return null; 
  }

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      if (width >= 1024) {
        setSidebarOpen(false);
      }
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

  const getMainContentMargin = () => {
    if (isMobile) return '';
    if (sidebarCollapsed) return 'ml-0';
    return 'ml-64';
  };

  const handleHeaderMenuClick = () => {
    if (isMobile) {
      toggleSidebar();
    } else {
      toggleSidebarCollapse();
    }
  };

  const openEditProfileModal = () => setIsEditProfileModalOpen(true);
  const closeEditProfileModal = () => setIsEditProfileModalOpen(false);

  return (
    <EditProfileModalContext.Provider value={{ openEditProfileModal }}>
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
        {/* Content Container */}
        <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out w-full min-w-0 ${getMainContentMargin()}`}>
          {/* Header */}
          <Header
            isMobile={isMobile}
            onMenuToggle={handleHeaderMenuClick}
            isSidebarCollapsed={sidebarCollapsed}
            {...(userRole === 'teacher' ? { onShowSessionsModal: () => setShowSessionsModal(true) } : {})}
          />
          <main className="overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 w-full min-w-0 pt-2 sm:pt-[var(--header-height,56px)] md:pt-0">
            <div className="w-full h-full flex flex-col px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 lg:py-8 pb-[env(safe-area-inset-bottom)]">
              {children ? children : <Outlet />}
            </div>
          </main>
        </div>
        {/* Upcoming Sessions Modal (global) */}
        {showSessionsModal && (
          <div className="fixed inset-0 z-50 flex justify-end items-start bg-black bg-opacity-10">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm mt-20 mr-8 relative h-[32rem] flex flex-col">
              <button
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
                onClick={() => setShowSessionsModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <div className="flex-1 overflow-y-auto pr-2">
                <UpcomingSessions sessions={sessionsData} />
              </div>
            </div>
          </div>
        )}
        {/* Edit Profile Modal (global, covers sidebar) */}
        {isEditProfileModalOpen && (
          <EditProfileModal isOpen={isEditProfileModalOpen} onClose={closeEditProfileModal} />
        )}
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
            />
          </button>
        )}
      </div>
    </EditProfileModalContext.Provider>
  );
};

export default DashboardLayout; 