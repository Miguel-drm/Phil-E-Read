import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthWrapper from './components/auth/AuthWrapper';
import RoleBasedRedirect from './components/auth/RoleBasedRedirect';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import StoriesManagement from './pages/admin/StoriesManagement';
import Teachers from './pages/admin/Teachers';
import Students from './pages/admin/Students';

// Dashboard Pages
import AdminDashboardPage from './pages/admin/AdminDashboard';
import TeacherDashboardPage from './pages/teacher/TeacherDashboard';
import ParentDashboardPage from './pages/parent/ParentDashboard';
import MyChildrenPage from './pages/parent/MyChildren';

// Teacher Pages
import Reading from './pages/teacher/Reading';
import ClassList from './pages/teacher/ClassList';
import MakeTest from './pages/teacher/MakeTest';
import Reports from './pages/teacher/Reports';
import Profile from './pages/teacher/Profile';
import ReadingSessionPage from './pages/teacher/ReadingSessionPage';

// Parent Pages
import ProgressPage from './pages/parent/Progress';
import AssignmentsPage from './pages/parent/Assignments';
import ReportsPage from './pages/parent/Reports';
import ParentProfilePage from './pages/parent/Profile';

// Admin Pages
import AdminReportsPage from './pages/admin/AdminReports';
import AdminSettingsPage from './pages/admin/AdminSettings';

const AuthGate: React.FC = () => {
  const { loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<AuthWrapper />} />
      <Route path="/signup" element={<AuthWrapper />} />
      
      {/* Role-based redirect after login */}
      <Route path="/auth-redirect" element={<RoleBasedRedirect />} />
      
      {/* Protected Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="teachers" element={<Teachers />} />
        <Route path="stories" element={<StoriesManagement />} />
        <Route path="students" element={<Students />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        {/* Add more admin routes here */}
      </Route>
      
      {/* Protected Teacher routes */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<TeacherDashboardPage />} />
        <Route path="reading" element={<Reading />} />
        <Route path="class-list" element={<ClassList />} />
        <Route path="make-test" element={<MakeTest />} />
        <Route path="reports" element={<Reports />} />
        <Route path="profile" element={<Profile />} />
        <Route path="reading-session/:sessionId" element={<ReadingSessionPage />} />
      </Route>
      
      {/* Protected Parent routes */}
      <Route
        path="/parent"
        element={
          <ProtectedRoute allowedRoles={['parent']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<ParentDashboardPage />} />
        <Route path="children" element={<MyChildrenPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="assignments" element={<AssignmentsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="profile" element={<ParentProfilePage />} />
        {/* Add more parent routes here */}
      </Route>
      
      {/* Redirect root to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

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
                    <Route path="teachers" element={<Teachers />} />
                    <Route path="stories" element={<StoriesManagement />} />
                    <Route path="students" element={<Students />} />
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
                    <Route path="profile/*" element={<Profile />} />
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
                    <Route path="children" element={<MyChildrenPage />} />
                    <Route path="progress" element={<ProgressPage />} />
                    <Route path="assignments" element={<AssignmentsPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="profile" element={<ParentProfilePage />} />
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
