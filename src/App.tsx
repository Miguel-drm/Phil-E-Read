import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthWrapper from './components/auth/AuthWrapper';
import RoleBasedRedirect from './components/auth/RoleBasedRedirect';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Dashboard Pages
import AdminDashboardPage from './pages/admin/AdminDashboard';
import TeacherDashboardPage from './pages/teacher/TeacherDashboard';
import ParentDashboardPage from './pages/parent/ParentDashboard';

// Teacher Pages
import Reading from './pages/teacher/Reading';
import ClassList from './pages/teacher/ClassList';
import MakeTest from './pages/teacher/MakeTest';
import Reports from './pages/teacher/Reports';
import Profile from './pages/teacher/Profile';
import ReadingSessionPage from './pages/teacher/ReadingSessionPage';

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<AuthWrapper />} />
          <Route path="/signup" element={<AuthWrapper />} />
          
          {/* Role-based redirect after login */}
          <Route path="/auth-redirect" element={<RoleBasedRedirect />} />
          
          {/* Protected Admin routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardLayout>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboardPage />} />
                    {/* Add more admin routes here */}
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          
          {/* Protected Teacher routes */}
          <Route
            path="/teacher/*"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <DashboardLayout>
                  <Routes>
                    <Route path="dashboard" element={<TeacherDashboardPage />} />
                    <Route path="reading" element={<Reading />} />
                    <Route path="class-list" element={<ClassList />} />
                    <Route path="make-test" element={<MakeTest />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="reading-session/:sessionId" element={<ReadingSessionPage />} />
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          
          {/* Protected Parent routes */}
          <Route
            path="/parent/*"
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <DashboardLayout>
                  <Routes>
                    <Route path="dashboard" element={<ParentDashboardPage />} />
                    {/* Add more parent routes here */}
                  </Routes>
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
