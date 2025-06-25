import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Routes, Route } from 'react-router-dom';
import ProfileOverview from './ProfileOverview';

const Profile: React.FC = () => {
  useAuth();

  return (
    <Routes>
      <Route index element={<ProfileOverview />} />
    </Routes>
  );
};

export default Profile; 