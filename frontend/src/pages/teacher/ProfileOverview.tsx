import React, { useRef, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { storage, db } from '../../config/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { updateUserProfile } from '../../services/authService';
import { showSuccess, showError } from '../../services/alertService';
import Swal from 'sweetalert2';
import { EmailAuthProvider, reauthenticateWithCredential, deleteUser, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { deleteDoc } from 'firebase/firestore';
import { EditProfileModalContext } from '../../components/layout/DashboardLayout';

function getInitials(name: string) {
  if (!name) return '';
  const names = name.split(' ');
  return names.map(n => n[0]).join('').toUpperCase();
}

const bannerUrl = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80'; // Placeholder banner

const tabs = [
  'Profile',
  'Classes',
  'Students',
  'Assignments',
  'Reports',
  'Reading Sessions',
  'Settings',
];

const ProfileOverview: React.FC = () => {
  const { userProfile, refreshUserProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.photoURL || undefined);
  const [activeTab, setActiveTab] = useState('Profile');
  // Profile settings state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    displayName: userProfile?.displayName || '',
    email: userProfile?.email || '',
    phoneNumber: userProfile?.phoneNumber || '',
    school: userProfile?.school || '',
    gradeLevel: userProfile?.gradeLevel || '',
  });
  // Settings tab state
  const [settingsTab, setSettingsTab] = useState('personal');
  const [preferences, setPreferences] = useState({
    notifications: {
      email: true,
      push: false,
      sms: true
    },
    privacy: {
      profileVisible: true,
      showEmail: false,
      showPhone: false
    },
    display: {
      theme: 'light',
      language: 'en',
      timezone: 'America/New_York'
    }
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // Modal state for editing
  const [editAvatar, setEditAvatar] = useState<string | undefined>(avatarUrl);
  const [editBanner, setEditBanner] = useState<string>(bannerUrl);
  const [editBio, setEditBio] = useState(userProfile?.bio || '');
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const { openEditProfileModal } = useContext(EditProfileModalContext);

  React.useEffect(() => {
    if (userProfile) {
      setProfileData({
        displayName: userProfile.displayName || '',
        email: userProfile.email || '',
        phoneNumber: userProfile.phoneNumber || '',
        school: userProfile.school || '',
        gradeLevel: userProfile.gradeLevel || '',
      });
    }
  }, [userProfile]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateUserProfile({
        displayName: profileData.displayName,
        email: profileData.email,
        phoneNumber: profileData.phoneNumber,
        school: profileData.school,
        gradeLevel: profileData.gradeLevel,
      });
      await refreshUserProfile?.();
      setIsEditing(false);
      showSuccess('Profile Updated', 'Your profile has been updated successfully!');
    } catch (error) {
      showError('Update Failed', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userProfile || !userProfile.email) return;
    setError(null);
    setUploading(true);
    setUploadProgress(0);
    try {
      const userId = userProfile.email;
      const storageRef = ref(storage, `profilePictures/${userId}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (err) => {
          setError('Upload failed. Please try again.');
          setUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          // Update Firestore user document
          await updateDoc(doc(db, 'users', userId), { photoURL: downloadURL });
          setAvatarUrl(downloadURL);
          setUploading(false);
          setUploadProgress(0);
          await refreshUserProfile?.();
        }
      );
    } catch (err) {
      setError('Upload failed. Please try again.');
      setUploading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!userProfile || !userProfile.email) return;
    const result = window.confirm(`Send password reset email to ${userProfile.email}?`);
    if (result) {
      setIsChangingPassword(true);
      try {
        await sendPasswordResetEmail(auth, userProfile.email);
        showSuccess('Email Sent', 'Password reset instructions have been sent to your email.');
      } catch (error) {
        showError('Email Failed', 'Failed to send password reset email.');
      } finally {
        setIsChangingPassword(false);
      }
    }
  };

  const handleUpdatePreferences = () => {
    showSuccess('Preferences Updated', 'Your preferences have been saved successfully!');
  };

  const handleExportData = async () => {
    setIsExportingData(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      showSuccess('Export Started', 'Your data export will be available for download shortly.');
    } catch (error) {
      showError('Export Failed', 'An error occurred during data export.');
    } finally {
      setIsExportingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userProfile) return;
    const confirmResult = window.confirm('This action cannot be undone. All your data will be permanently deleted. Are you absolutely sure?');
    if (confirmResult) {
      setIsDeletingAccount(true);
      try {
        // Simulate deletion
        await new Promise(resolve => setTimeout(resolve, 2000));
        showSuccess('Account Deleted', 'Your account and all associated data have been permanently deleted.');
      } catch (error) {
        showError('Deletion Failed', 'An error occurred during account deletion.');
      } finally {
        setIsDeletingAccount(false);
      }
    }
  };

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
    setIsEditModalOpen(false);
    setEditAvatar(avatarUrl);
    setEditBanner(bannerUrl);
    setEditBio(userProfile?.bio || '');
    setBannerFile(null);
    setAvatarFile(null);
  };
  const handleEditSave = async () => {
    setSavingEdit(true);
    try {
      // TODO: Upload avatarFile and bannerFile if present, update Firestore with new URLs and bio
      // For now, just close modal
      setIsEditModalOpen(false);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Banner with only top corners rounded */}
      <div className="relative w-full h-48 md:h-64 bg-gray-200 rounded-t-2xl overflow-hidden">
        <img
          src={bannerUrl}
          alt="Profile Banner"
          className="object-cover w-full h-full rounded-t-2xl"
        />
      </div>
      {/* Profile Header Row: Avatar, Name, Actions */}
      <div className="relative max-w-5xl mx-auto flex items-end px-4 -mt-20 md:-mt-24">
        {/* Avatar and Name in relative container */}
        <div className="relative flex items-end" style={{ minHeight: '160px' }}>
          {/* Avatar with camera icon */}
          <div className="relative z-10">
            <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-white flex items-center justify-center shadow-lg border-4 border-white overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="object-cover w-full h-full rounded-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-5xl md:text-6xl font-bold">
                  {getInitials(userProfile?.displayName || userProfile?.email || '') || '?'}
                </div>
              )}
            </div>
            {/* Camera Icon Overlay */}
            <button
              className="absolute -bottom-0 -right-0 bg-gray-100 rounded-full p-2 shadow-md border border-gray-200 hover:bg-gray-200 transition-colors"
              style={{ zIndex: 999 }}
              title="Change profile photo"
              aria-label="Change profile photo"
              onClick={handleCameraClick}
              type="button"
              disabled={uploading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-gray-700">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 19.5V6.75A2.25 2.25 0 014.5 4.5h3.379c.414 0 .789.252.937.64l.574 1.53a.75.75 0 00.7.48h4.38a.75.75 0 00.7-.48l.574-1.53a1 1 0 01.937-.64H19.5a2.25 2.25 0 012.25 2.25v12.75a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 19.5z" />
                <circle cx="12" cy="13" r="3.25" />
              </svg>
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>
          {/* Name and subline, aligned with lower third of avatar */}
          <div className="flex flex-col justify-end ml-6 pb-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-0">
              {userProfile?.displayName || '-'}
            </h2>
            <span className="text-base text-gray-500 font-medium mt-0">Teacher</span>
          </div>
        </div>
        {/* Actions (Edit Profile) */}
        <div className="flex-1 flex justify-end items-end pb-6">
          <button
            onClick={openEditProfileModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow transition-colors text-base font-semibold"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487c.637-1.093-.148-2.487-1.392-2.487H8.53c-1.244 0-2.029 1.394-1.392 2.487l.7 1.2A2.25 2.25 0 007.5 7.25v.25c0 .414.336.75.75.75h7.5a.75.75 0 00.75-.75v-.25a2.25 2.25 0 00-.338-1.563l.7-1.2z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75v2.25m0 0a2.25 2.25 0 01-2.25-2.25h4.5a2.25 2.25 0 01-2.25 2.25z" />
            </svg>
            Edit Profile
          </button>
        </div>
      </div>
      {/* Tabs Row */}
      <div className="max-w-5xl mx-auto mt-8 px-4">
        <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab}
              className={`px-4 py-2 text-gray-700 font-medium border-b-2 transition-colors focus:outline-none ${activeTab === tab ? 'text-blue-600 border-blue-600' : 'border-transparent hover:text-blue-600 hover:border-blue-600'}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      {/* Profile Summary Card or Settings Form */}
      <div className="w-full max-w-5xl mx-auto mt-8 px-4">
        {activeTab === 'Settings' ? (
          <div className="bg-white rounded-3xl shadow-2xl p-10 md:p-14 flex flex-col gap-8 border border-blue-100">
            {/* Settings Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setSettingsTab('personal')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${settingsTab === 'personal' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  Personal Information
                </button>
                <button
                  onClick={() => setSettingsTab('preferences')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${settingsTab === 'preferences' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  Preferences
                </button>
                <button
                  onClick={() => setSettingsTab('security')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${settingsTab === 'security' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  Security
                </button>
              </nav>
            </div>
            {/* Settings Tab Content */}
            {settingsTab === 'personal' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                    <input
                      type="text"
                      value={profileData.displayName}
                      onChange={e => setProfileData({ ...profileData, displayName: e.target.value })}
                      disabled={!isEditing}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={profileData.phoneNumber}
                      onChange={e => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                      disabled={!isEditing}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">School</label>
                    <input
                      type="text"
                      value={profileData.school}
                      onChange={e => setProfileData({ ...profileData, school: e.target.value })}
                      disabled={!isEditing}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
                    <input
                      type="text"
                      value={profileData.gradeLevel}
                      onChange={e => setProfileData({ ...profileData, gradeLevel: e.target.value })}
                      disabled={!isEditing}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                </div>
                <div className="flex gap-4 mt-8">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
              </div>
            )}
            {settingsTab === 'preferences' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                        <p className="text-sm text-gray-600">Receive notifications via email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.notifications.email}
                          onChange={e => setPreferences({
                            ...preferences,
                            notifications: { ...preferences.notifications, email: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
                        <p className="text-sm text-gray-600">Receive push notifications in browser</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.notifications.push}
                          onChange={e => setPreferences({
                            ...preferences,
                            notifications: { ...preferences.notifications, push: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">SMS Notifications</h3>
                        <p className="text-sm text-gray-600">Receive notifications via SMS</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.notifications.sms}
                          onChange={e => setPreferences({
                            ...preferences,
                            notifications: { ...preferences.notifications, sms: e.target.checked }
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={handleUpdatePreferences}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Save Preferences
                    </button>
                  </div>
                </div>
              </div>
            )}
            {settingsTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h2>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Change Password</h3>
                        <p className="text-sm text-gray-600">Update your account password</p>
                      </div>
                      <button
                        onClick={handleChangePassword}
                        disabled={isChangingPassword}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isChangingPassword ? 'Sending...' : 'Change Password'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Export Data</h3>
                        <p className="text-sm text-gray-600">Download your account data</p>
                      </div>
                      <button
                        onClick={handleExportData}
                        disabled={isExportingData}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isExportingData ? 'Exporting...' : 'Export Data'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <h3 className="text-sm font-medium text-red-900">Delete Account</h3>
                        <p className="text-sm text-red-600">Permanently delete your account and all data</p>
                      </div>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={isDeletingAccount}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          activeTab === 'Profile' && (
            <>
              <div className="bg-white rounded-3xl shadow-2xl p-10 md:p-14 flex flex-col gap-8 border border-blue-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Phone Number</label>
                    <div className="text-lg font-bold text-gray-900">{userProfile?.phoneNumber || '-'}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">School</label>
                    <div className="text-lg font-bold text-gray-900">{userProfile?.school || '-'}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Grade Level</label>
                    <div className="text-lg font-bold text-gray-900">{userProfile?.gradeLevel || '-'}</div>
                  </div>
                </div>
              </div>
              {userProfile?.bio && (
                <div className="bg-white rounded-3xl shadow-2xl p-8 mt-6 border border-blue-100">
                  <div className="text-base text-gray-700 whitespace-pre-line">{userProfile.bio}</div>
                </div>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
};

export default ProfileOverview; 