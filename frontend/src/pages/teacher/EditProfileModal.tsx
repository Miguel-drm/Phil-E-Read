import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateUserProfile } from '../../services/authService';
import { showSuccess, showError } from '../../services/alertService';
import { uploadProfileOrBannerImageWithProgress } from '../../services/userProfileService';

const bannerUrl = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, refreshUserProfile, currentUser } = useAuth();
  const [editAvatar, setEditAvatar] = useState<string | undefined>(userProfile?.photoURL);
  const [editBanner, setEditBanner] = useState<string>(bannerUrl);
  const [editBio, setEditBio] = useState(userProfile?.bio || '');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [avatarUploadProgress, setAvatarUploadProgress] = useState(0);
  const [bannerUploadProgress, setBannerUploadProgress] = useState(0);

  if (!isOpen) return null;

  const handleEditAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setEditAvatar(URL.createObjectURL(file));
    }
  };
  const handleEditBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setEditBanner(URL.createObjectURL(file));
    }
  };
  const handleResetBanner = () => {
    setBannerFile(null);
    setEditBanner(bannerUrl);
  };
  const handleEditCancel = () => {
    onClose();
    setEditAvatar(userProfile?.photoURL);
    setEditBanner(bannerUrl);
    setEditBio(userProfile?.bio || '');
    setBannerFile(null);
    setAvatarFile(null);
  };
  const handleEditSave = async () => {
    if (!currentUser) {
      showError('No user', 'You must be signed in to update your profile.');
      return;
    }
    setSavingEdit(true);
    try {
      // Upload avatar if changed
      if (avatarFile) {
        await uploadProfileOrBannerImageWithProgress(
          currentUser.uid,
          avatarFile,
          'profile',
          (percent) => setAvatarUploadProgress(percent)
        );
      }
      // Upload banner if changed
      if (bannerFile) {
        await uploadProfileOrBannerImageWithProgress(
          currentUser.uid,
          bannerFile,
          'banner',
          (percent) => setBannerUploadProgress(percent)
        );
      }
      // Optionally update bio or other fields here (call your updateProfile if needed)
      // await updateProfile(currentUser.uid, { bio: editBio });

      await refreshUserProfile();
      showSuccess('Profile updated!');
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      showError('Update failed', message);
    } finally {
      setSavingEdit(false);
      setAvatarUploadProgress(0);
      setBannerUploadProgress(0);
    }
  };

  // Overlay click handler to close modal if clicked outside content
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleEditCancel();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-60"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="flex items-center justify-between bg-white rounded-t-2xl px-8 py-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
          <button className="text-gray-400 text-2xl font-bold hover:text-gray-700 transition-colors" onClick={handleEditCancel} aria-label='Close'>&times;</button>
        </div>
        <div className="p-8 pt-4">
          {/* Profile Picture */}
          <div className="flex flex-col items-center mb-6 mt-2">
            <div className="relative w-28 h-28 mb-2">
              {editAvatar ? (
                <img
                  src={editAvatar}
                  alt="Avatar Preview"
                  className="w-28 h-28 rounded-full object-cover border-4 border-white shadow"
                  onError={e => (e.currentTarget.src = '')}
                  style={{ background: '#e0e7ef', objectFit: 'cover' }}
                />
              ) : (
                <div className="w-28 h-28 rounded-full flex items-center justify-center bg-gray-200 border-4 border-white shadow">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-14 h-14 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5a8.25 8.25 0 1115 0v.75A2.25 2.25 0 0117.25 22.5h-10.5A2.25 2.25 0 014.5 20.25v-.75z" />
                  </svg>
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-gray-100 rounded-full p-2 shadow border border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors" title="Change profile photo">
                <input type="file" accept="image/*" className="hidden" onChange={handleEditAvatarChange} />
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 19.5V6.75A2.25 2.25 0 014.5 4.5h3.379c.414 0 .789.252.937.64l.574 1.53a.75.75 0 00.7.48h4.38a.75.75 0 00.7-.48l.574-1.53a1 1 0 01.937-.64H19.5a2.25 2.25 0 012.25 2.25v12.75a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 19.5z" />
                  <circle cx="12" cy="13" r="3.25" />
                </svg>
              </label>
            </div>
            {avatarUploadProgress > 0 && avatarUploadProgress < 100 && (
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${avatarUploadProgress}%` }} />
              </div>
            )}
            <span className="text-sm text-gray-500">Change Profile Picture</span>
          </div>
          {/* Banner */}
          <div className="mb-6">
            <div className="relative w-full h-24 rounded-xl overflow-hidden mb-2">
              <img
                src={editBanner}
                alt="Banner Preview"
                className="object-cover w-full h-full"
                style={{ background: '#e0e7ef' }}
              />
              <label className="absolute bottom-2 right-2 bg-gray-100 rounded-full p-2 shadow border border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors" title="Change banner photo">
                <input type="file" accept="image/*" className="hidden" onChange={handleEditBannerChange} />
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-700">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 19.5V6.75A2.25 2.25 0 014.5 4.5h3.379c.414 0 .789.252.937.64l.574 1.53a.75.75 0 00.7.48h4.38a.75.75 0 00.7-.48l.574-1.53a1 1 0 01.937-.64H19.5a2.25 2.25 0 012.25 2.25v12.75a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 19.5z" />
                  <circle cx="12" cy="13" r="3.25" />
                </svg>
              </label>
              <button className="absolute top-2 right-2 bg-white rounded-full px-3 py-1 text-xs text-gray-600 border border-gray-200 shadow hover:bg-gray-100" onClick={handleResetBanner}>Reset</button>
            </div>
            {bannerUploadProgress > 0 && bannerUploadProgress < 100 && (
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${bannerUploadProgress}%` }} />
              </div>
            )}
            <span className="text-sm text-gray-500">Change Banner</span>
          </div>
          {/* Bio */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px]"
              value={editBio}
              onChange={e => setEditBio(e.target.value)}
              placeholder="Write something about yourself..."
              maxLength={300}
            />
            <div className="text-xs text-gray-400 text-right mt-1">{editBio.length}/300</div>
          </div>
          {/* Actions */}
          <div className="flex justify-end gap-3 mt-8">
            <button
              className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              onClick={handleEditCancel}
              disabled={savingEdit}
            >
              Cancel
            </button>
            <button
              className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              onClick={handleEditSave}
              disabled={savingEdit}
            >
              {savingEdit ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal; 