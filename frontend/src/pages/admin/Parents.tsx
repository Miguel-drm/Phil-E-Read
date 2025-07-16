import React, { useEffect, useState } from 'react';
import { getAllParents, deleteParent, getParentProfileById } from '../../services/authService';
import { Menu } from '@headlessui/react';
import { EllipsisVerticalIcon, FunnelIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import Loader from '../../components/Loader';
import ProfileOverviewParent from '../parent/ProfileOverviewParent';

interface Parent {
  id: string;
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  profileImage?: string;
}

const Parents: React.FC = () => {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [parentToDelete, setParentToDelete] = useState<Parent | null>(null);
  const [viewParent, setViewParent] = useState<Parent | null>(null);
  const [viewParentLoading, setViewParentLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState<'az' | 'za' | 'newest' | 'oldest'>('az');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const fetchParents = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllParents();
      setParents(data);
    } catch (err) {
      setError('Failed to load parents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParents();
  }, []);

  useEffect(() => {
    if (viewParent) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [viewParent]);

  const handleEdit = (parent: Parent) => {
    setSelectedParent(parent);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedParent(null);
  };

  const handleSaveSuccess = async () => {
    await fetchParents();
    handleModalClose();
  };

  const handleDeleteClick = (parent: Parent) => {
    setParentToDelete(parent);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!parentToDelete) return;
    setActionLoading(true);
    try {
      await deleteParent(parentToDelete.id);
      setParents(prev => prev.filter(p => p.id !== parentToDelete.id));
      setIsDeleteModalOpen(false);
      setParentToDelete(null);
    } catch (err) {
      // Optionally show error modal or toast
    } finally {
      setActionLoading(false);
    }
  };

  // Combine search and filter
  let displayedParents = [...parents];
  if (searchValue) {
    displayedParents = displayedParents.filter(p =>
      p.displayName?.toLowerCase().includes(searchValue.toLowerCase())
    );
  }
  if (filterType === 'az') {
    displayedParents.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
  } else if (filterType === 'za') {
    displayedParents.sort((a, b) => (b.displayName || '').localeCompare(a.displayName || ''));
  } else if (filterType === 'newest') {
    displayedParents.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
  } else if (filterType === 'oldest') {
    displayedParents.sort((a, b) => (a.id || '').localeCompare(b.id || ''));
  }

  const handleViewParent = async (parent: Parent) => {
    setViewParentLoading(true);
    try {
      const fullProfile = await getParentProfileById(parent.id);
      // Ensure profileImage is a data URL
      let profileImage = fullProfile.profileImage || parent.profileImage;
      if (profileImage && !profileImage.startsWith('data:image')) {
        profileImage = `data:image/png;base64,${profileImage}`;
      }
      setViewParent({ ...parent, ...fullProfile, profileImage });
    } catch (e) {
      setViewParent(parent); // fallback
    } finally {
      setViewParentLoading(false);
    }
  };

  return (
    <div className="p-8">
      {viewParentLoading ? (
        <Loader label="Loading profile..." />
      ) : viewParent ? (
        <ProfileOverviewParent parent={viewParent} readOnly onBack={() => setViewParent(null)} />
      ) : loading ? (
        <Loader label="Loading parents..." />
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : parents.length === 0 ? (
        <div className="text-gray-500">No parents found.</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] p-2 sm:p-6">
          <div className="flex justify-between mb-4 items-center">
            <h2 className="text-2xl font-bold text-gray-800">Parents</h2>
          </div>
          <div className="overflow-visible">
            <table className="min-w-full rounded-2xl">
              <thead>
                <tr className="bg-white shadow-sm rounded-t-2xl sticky top-0 z-10">
                  <th className="px-6 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider rounded-tl-2xl border-b border-gray-200">Name</th>
                  <th className="px-6 py-5 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Address</th>
                  <th className="px-6 py-5 text-center text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Phone</th>
                  <th className="px-6 py-5 text-right text-sm font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200" colSpan={2}>
                    <div className="flex justify-end items-center gap-2">
                      <button
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full shadow flex items-center justify-center"
                        onClick={() => setFilterOpen(f => !f)}
                        title="Filter"
                      >
                        <FunnelIcon className="w-5 h-5" />
                      </button>
                      <button
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full shadow flex items-center justify-center"
                        onClick={() => setSearchOpen(s => !s)}
                        title="Search"
                      >
                        <MagnifyingGlassIcon className="w-5 h-5" />
                      </button>
                      {searchOpen && (
                        <input
                          type="text"
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 transition-all duration-150 ml-2"
                          placeholder="Search by name..."
                          value={searchValue}
                          onChange={e => setSearchValue(e.target.value)}
                          autoFocus
                          style={{ minWidth: 180 }}
                        />
                      )}
                      {filterOpen && (
                        <div className="absolute right-24 top-12 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-48">
                          <button
                            className={`w-full text-left px-4 py-2 hover:bg-blue-50 ${filterType === 'az' ? 'font-bold text-blue-700' : ''}`}
                            onClick={() => { setFilterType('az'); setFilterOpen(false); }}
                          >
                            Name: A to Z
                          </button>
                          <button
                            className={`w-full text-left px-4 py-2 hover:bg-blue-50 ${filterType === 'za' ? 'font-bold text-blue-700' : ''}`}
                            onClick={() => { setFilterType('za'); setFilterOpen(false); }}
                          >
                            Name: Z to A
                          </button>
                          <button
                            className={`w-full text-left px-4 py-2 hover:bg-blue-50 ${filterType === 'newest' ? 'font-bold text-blue-700' : ''}`}
                            onClick={() => { setFilterType('newest'); setFilterOpen(false); }}
                          >
                            Newest Parent
                          </button>
                          <button
                            className={`w-full text-left px-4 py-2 hover:bg-blue-50 ${filterType === 'oldest' ? 'font-bold text-blue-700' : ''}`}
                            onClick={() => { setFilterType('oldest'); setFilterOpen(false); }}
                          >
                            Oldest Parent
                          </button>
                        </div>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedParents.map(parent => (
                  <tr
                    key={parent.id}
                    className="cursor-pointer hover:bg-blue-50 transition"
                    onClick={() => handleViewParent(parent)}
                  >
                    <td
                      className="px-6 py-6 whitespace-nowrap flex items-center gap-4"
                    >
                      <span className="w-16 h-16 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center overflow-hidden mr-2">
                        {parent.profileImage ? (
                          <img src={parent.profileImage} alt={parent.displayName || 'Profile'} className="w-full h-full object-cover rounded-full" />
                        ) : null}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-extrabold text-lg text-gray-900">{parent.displayName || 'N/A'}</span>
                        <span className="text-xs text-gray-400">{parent.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-700">{parent.address || 'N/A'}</td>
                    <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-700 text-center">{parent.phoneNumber || 'N/A'}</td>
                    <td className="px-6 py-6 whitespace-nowrap text-right text-sm font-medium relative align-middle">
                      <Menu as="div" className="relative inline-block text-left">
                        <Menu.Button className="flex items-center p-2 rounded-full hover:bg-gray-100 focus:outline-none">
                          <EllipsisVerticalIcon className="w-5 h-5 text-gray-500" />
                        </Menu.Button>
                        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-32 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10 p-1 flex flex-col gap-1">
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => handleEdit(parent)}
                                className={`w-full text-left px-4 py-2 text-sm rounded-md transition-colors ${active ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                                disabled={actionLoading}
                              >
                                Edit
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => handleDeleteClick(parent)}
                                className={`w-full text-left px-4 py-2 text-sm rounded-md transition-colors ${active ? 'bg-red-50 text-red-700' : 'text-red-600'}`}
                                disabled={actionLoading}
                              >
                                Delete
                              </button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Menu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={actionLoading}
        message={parentToDelete ? `Are you sure you want to delete ${parentToDelete.displayName || parentToDelete.email || 'this parent'}? This action cannot be undone.` : ''}
      />
    </div>
  );
};

export default Parents; 