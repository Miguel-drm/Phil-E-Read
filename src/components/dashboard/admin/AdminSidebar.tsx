import React from 'react';
import { Link } from 'react-router-dom';
import {
  HomeIcon,
  UserGroupIcon,
  BookOpenIcon,
  CogIcon,
} from '@heroicons/react/24/outline';

const AdminSidebar: React.FC = () => {
  return (
    <div className="w-64 bg-gray-800 text-white h-full fixed top-0 left-0 flex flex-col pt-20">
      <nav className="flex-1 px-2 py-4 space-y-2">
        <Link to="/admin/dashboard" className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md">
          <HomeIcon className="h-5 w-5 mr-3" />
          Dashboard
        </Link>
        <Link to="/admin/users" className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md">
          <UserGroupIcon className="h-5 w-5 mr-3" />
          Users
        </Link>
        <Link to="/admin/content" className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md">
          <BookOpenIcon className="h-5 w-5 mr-3" />
          Content
        </Link>
        <Link to="/admin/settings" className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-md">
          <CogIcon className="h-5 w-5 mr-3" />
          Settings
        </Link>
      </nav>
    </div>
  );
};

export default AdminSidebar; 