import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateUserProfile } from '../../services/authService';
import { showSuccess, showError, showConfirmation } from '../../services/alertService';
import Swal from 'sweetalert2';
import { EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import Cropper from 'react-easy-crop';
import { uploadProfileImage, getProfileImageUrl, getBannerImageUrl } from '../../services/userProfileService';

// Helper to convert base64 to File
function dataURLtoFile(dataurl: string, filename: string) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

const Profile: React.FC = () => {
  const { currentUser, userProfile, refreshUserProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Profile image state
  const [profileImageCacheBuster, setProfileImageCacheBuster] = useState(0);
  const [bannerImageCacheBuster, setBannerImageCacheBuster] = useState(0);
  const [showProfileCropper, setShowProfileCropper] = useState(false);
  const [showBannerCropper, setShowBannerCropper] = useState(false);
  const [selectedProfileFile, setSelectedProfileFile] = useState<File | null>(null);
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null);
  const [profileCrop, setProfileCrop] = useState({ x: 0, y: 0 });
  const [profileZoom, setProfileZoom] = useState(1);
  const [profileCroppedAreaPixels, setProfileCroppedAreaPixels] = useState<any>(null);
  const [bannerCrop, setBannerCrop] = useState({ x: 0, y: 0 });
  const [bannerZoom, setBannerZoom] = useState(1);
  const [bannerCroppedAreaPixels, setBannerCroppedAreaPixels] = useState<any>(null);

  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    address: '',
    relationshipToChild: '',
    occupation: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    preferredContactMethod: '',
    alternateEmail: '',
    nationality: '',
    profilePhoto: '',
    languagesSpoken: '',
    notes: '',
  });

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

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        displayName: userProfile.displayName || '',
        email: userProfile.email || '',
        phoneNumber: userProfile.phoneNumber || '',
        address: userProfile.address || '',
        relationshipToChild: userProfile.relationshipToChild || '',
        occupation: userProfile.occupation || '',
        emergencyContactName: userProfile.emergencyContactName || '',
        emergencyContactNumber: userProfile.emergencyContactNumber || '',
        preferredContactMethod: userProfile.preferredContactMethod || '',
        alternateEmail: userProfile.alternateEmail || '',
        nationality: userProfile.nationality || '',
        profilePhoto: userProfile.profilePhoto || '',
        languagesSpoken: userProfile.languagesSpoken || '',
        notes: userProfile.notes || '',
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
        address: profileData.address,
        relationshipToChild: profileData.relationshipToChild,
        occupation: profileData.occupation,
        emergencyContactName: profileData.emergencyContactName,
        emergencyContactNumber: profileData.emergencyContactNumber,
        preferredContactMethod: profileData.preferredContactMethod,
        alternateEmail: profileData.alternateEmail,
        nationality: profileData.nationality,
        profilePhoto: profileData.profilePhoto,
        languagesSpoken: profileData.languagesSpoken,
        notes: profileData.notes,
      });
      await refreshUserProfile();
      setIsEditing(false);
      showSuccess('Profile Updated', 'Your profile has been updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Update Failed', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleChangePassword = async () => {
    if (!currentUser || !currentUser.email) {
      showError('Error', 'No user is signed in or email is unavailable.');
      return;
    }
    const result = await showConfirmation(
      'Change Password',
      `Send password reset email to ${currentUser.email}?`,
      'Send Email',
      'Cancel'
    );
    if (result.isConfirmed) {
      setIsChangingPassword(true);
      try {
        await sendPasswordResetEmail(auth, currentUser.email);
        showSuccess('Email Sent', 'Password reset instructions have been sent to your email.');
      } catch (error: any) {
        console.error('Error sending password reset email:', error);
        showError('Email Failed', error.message || 'Failed to send password reset email.');
      } finally {
        setIsChangingPassword(false);
      }
    }
  };

  const handleUpdatePreferences = () => {
    // showSuccess('Preferences Updated', 'Your preferences have been saved successfully!');
  };

  const handleExportData = async () => {
    setIsExportingData(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); 
      showSuccess('Export Started', 'Your data export will be available for download shortly.');
    } catch (error: any) {
      console.error('Error exporting data:', error);
      showError('Export Failed', error.message || 'An error occurred during data export.');
    } finally {
      setIsExportingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) {
      showError('Error', 'No user is currently signed in.');
      return;
    }
    const confirmResult = await showConfirmation(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted. Are you absolutely sure?',
      'Delete Account',
      'Cancel',
      'warning'
    );
    if (confirmResult.isConfirmed) {
      const { value: password } = await Swal.fire({
        title: 'Please Confirm Password',
        input: 'password',
        inputLabel: 'Enter your current password to confirm deletion',
        inputPlaceholder: 'Password',
        inputAttributes: {
          autocapitalize: 'off',
          autocorrect: 'off',
        },
        showCancelButton: true,
        confirmButtonText: 'Confirm',
        showLoaderOnConfirm: true,
        preConfirm: (passwordInput) => {
          if (!passwordInput) {
            Swal.showValidationMessage('Password is required.');
          }
          return passwordInput;
        },
        allowOutsideClick: () => !Swal.isLoading()
      });
      if (password) {
        setIsDeletingAccount(true);
        try {
          const credential = EmailAuthProvider.credential(currentUser.email || '', password);
          await reauthenticateWithCredential(currentUser, credential);
          if (currentUser.uid) {
            await deleteDoc(doc(db, 'users', currentUser.uid));
          }
          await deleteUser(currentUser);
          showSuccess('Account Deleted', 'Your account and all associated data have been permanently deleted.');
          await signOut();
        } catch (error: any) {
          console.error('Error deleting account:', error);
          if (error.code === 'auth/wrong-password') {
            showError('Deletion Failed', 'Incorrect password. Please try again.');
          } else if (error.code === 'auth/requires-recent-login') {
            showError('Deletion Failed', 'Please log in again and try deleting your account. (For security reasons).');
          } else {
            showError('Deletion Failed', error.message || 'An error occurred during account deletion.');
          }
        } finally {
          setIsDeletingAccount(false);
        }
      }
    }
  };

  // Handle profile image file selection
  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      setSelectedProfileFile(file);
      setShowProfileCropper(true);
    } else {
      showError('Invalid file', 'Please select a JPG or PNG image.');
    }
  };

  // Handle banner image file selection
  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      setSelectedBannerFile(file);
      setShowBannerCropper(true);
    } else {
      showError('Invalid file', 'Please select a JPG or PNG image.');
    }
  };

  // Get cropped image as base64
  const getCroppedImg = async (imageSrc: string, cropPixels: any) => {
    const image = new window.Image();
    image.src = imageSrc;
    await new Promise((resolve) => { image.onload = resolve; });
    const canvas = document.createElement('canvas');
    canvas.width = cropPixels.width;
    canvas.height = cropPixels.height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(
      image,
      cropPixels.x,
      cropPixels.y,
      cropPixels.width,
      cropPixels.height,
      0,
      0,
      cropPixels.width,
      cropPixels.height
    );
    return canvas.toDataURL('image/jpeg');
  };

  // When cropping is done
  const handleProfileCropComplete = async (_croppedArea: any, croppedAreaPixels: any) => {
    setProfileCroppedAreaPixels(croppedAreaPixels);
  };
  const handleBannerCropComplete = async (_croppedArea: any, croppedAreaPixels: any) => {
    setBannerCroppedAreaPixels(croppedAreaPixels);
  };

  // Upload cropped profile image to backend
  const handleProfileCropSave = async () => {
    if (selectedProfileFile && profileCroppedAreaPixels && currentUser) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageDataUrl = e.target?.result as string;
        const croppedImg = await getCroppedImg(imageDataUrl, profileCroppedAreaPixels);
        setShowProfileCropper(false);
        const file = dataURLtoFile(croppedImg, selectedProfileFile.name);
        try {
          await uploadProfileImage(currentUser.uid, file, 'profile');
          showSuccess('Profile Image Updated', 'Your profile image has been updated!');
          setProfileImageCacheBuster(Date.now());
        } catch (err) {
          showError('Upload Failed', 'Could not upload profile image.');
        }
      };
      reader.readAsDataURL(selectedProfileFile);
    }
  };

  // Upload cropped banner image to backend
  const handleBannerCropSave = async () => {
    if (selectedBannerFile && bannerCroppedAreaPixels && currentUser) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageDataUrl = e.target?.result as string;
        const croppedImg = await getCroppedImg(imageDataUrl, bannerCroppedAreaPixels);
        setShowBannerCropper(false);
        const file = dataURLtoFile(croppedImg, selectedBannerFile.name);
        try {
          await uploadProfileImage(currentUser.uid, file, 'banner');
          showSuccess('Banner Image Updated', 'Your banner image has been updated!');
          setBannerImageCacheBuster(Date.now());
        } catch (err) {
          showError('Upload Failed', 'Could not upload banner image.');
        }
      };
      reader.readAsDataURL(selectedBannerFile);
    }
  };

  return (
    <div className="profile-page px-4 sm:px-6 md:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account information and preferences</p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          {isEditing ? (
            <>
              <button
                onClick={handleCancelEdit}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <span className="loader-spinner" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #f3f3f3', borderTop: '2px solid #ffffff', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '8px' }} />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <i className="fas fa-edit mr-2"></i>
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('personal')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'personal'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Personal Information
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'preferences'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Preferences
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'security'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Security
          </button>
        </nav>
      </div>

      {/* Personal Information Tab */}
      {activeTab === 'personal' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h2>
            <div className="flex flex-col items-center mb-6 w-full">
              {/* Banner Image */}
              <div className="relative w-full max-w-2xl mb-4">
                <img
                  src={getBannerImageUrl(currentUser?.uid || '') + (bannerImageCacheBuster ? `?cb=${bannerImageCacheBuster}` : '')}
                  alt="Banner"
                  className="w-full h-32 md:h-48 object-cover rounded-lg border border-gray-200"
                  onError={e => (e.currentTarget.src = '/default-banner.png')}
                />
                <button
                  className="absolute top-2 right-2 bg-white bg-opacity-80 rounded px-3 py-1 text-sm shadow hover:bg-opacity-100"
                  onClick={() => document.getElementById('banner-image-input')?.click()}
                  type="button"
                >
                  Change Banner
                </button>
                <input
                  id="banner-image-input"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleBannerFileChange}
                  className="hidden"
                />
                {showBannerCropper && selectedBannerFile && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-4 rounded shadow-lg w-[90vw] max-w-2xl">
                      <h2 className="text-lg font-semibold mb-2">Crop Banner Image</h2>
                      <div className="relative w-full h-40 md:h-64 bg-gray-100">
                        <Cropper
                          image={URL.createObjectURL(selectedBannerFile)}
                          crop={bannerCrop}
                          zoom={bannerZoom}
                          aspect={4}
                          onCropChange={setBannerCrop}
                          onZoomChange={setBannerZoom}
                          onCropComplete={handleBannerCropComplete}
                        />
                      </div>
                      <div className="flex gap-2 mt-4 justify-end">
                        <button className="btn btn-primary" onClick={handleBannerCropSave}>Save</button>
                        <button className="btn btn-secondary" onClick={() => setShowBannerCropper(false)}>Cancel</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Profile Image */}
              <div className="relative flex flex-col items-center mb-2">
                <img
                  src={getProfileImageUrl(currentUser?.uid || '') + (profileImageCacheBuster ? `?cb=${profileImageCacheBuster}` : '')}
                  alt="Profile"
                  className="rounded-full w-24 h-24 object-cover border border-gray-200"
                  onError={e => (e.currentTarget.src = '/default-profile.png')}
                />
                <button
                  className="mt-2 bg-white border border-gray-300 rounded px-3 py-1 text-sm shadow hover:bg-gray-100"
                  onClick={() => document.getElementById('profile-image-input')?.click()}
                  type="button"
                >
                  Change Profile
                </button>
                <input
                  id="profile-image-input"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleProfileFileChange}
                  className="hidden"
                />
                {showProfileCropper && selectedProfileFile && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-4 rounded shadow-lg w-[90vw] max-w-md">
                      <h2 className="text-lg font-semibold mb-2">Crop Profile Image</h2>
                      <div className="relative w-64 h-64 bg-gray-100">
                        <Cropper
                          image={URL.createObjectURL(selectedProfileFile)}
                          crop={profileCrop}
                          zoom={profileZoom}
                          aspect={1}
                          onCropChange={setProfileCrop}
                          onZoomChange={setProfileZoom}
                          onCropComplete={handleProfileCropComplete}
                        />
                      </div>
                      <div className="flex gap-2 mt-4 justify-end">
                        <button className="btn btn-primary" onClick={handleProfileCropSave}>Save</button>
                        <button className="btn btn-secondary" onClick={() => setShowProfileCropper(false)}>Cancel</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={profileData.displayName}
                  onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                  disabled={!isEditing}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled={true}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileData.phoneNumber}
                  onChange={(e) => setProfileData({...profileData, phoneNumber: e.target.value})}
                  disabled={!isEditing}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={profileData.address}
                  onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                  disabled={!isEditing}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relationship to Child(ren)</label>
                <input type="text" value={profileData.relationshipToChild} onChange={(e) => setProfileData({...profileData, relationshipToChild: e.target.value})} disabled={!isEditing} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
                <input type="text" value={profileData.occupation} onChange={(e) => setProfileData({...profileData, occupation: e.target.value})} disabled={!isEditing} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Name</label>
                <input type="text" value={profileData.emergencyContactName} onChange={(e) => setProfileData({...profileData, emergencyContactName: e.target.value})} disabled={!isEditing} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact Number</label>
                <input type="tel" value={profileData.emergencyContactNumber} onChange={(e) => setProfileData({...profileData, emergencyContactNumber: e.target.value})} disabled={!isEditing} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Contact Method</label>
                <input type="text" value={profileData.preferredContactMethod} onChange={(e) => setProfileData({...profileData, preferredContactMethod: e.target.value})} disabled={!isEditing} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Email</label>
                <input type="email" value={profileData.alternateEmail} onChange={(e) => setProfileData({...profileData, alternateEmail: e.target.value})} disabled={!isEditing} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
                <input type="text" value={profileData.nationality} onChange={(e) => setProfileData({...profileData, nationality: e.target.value})} disabled={!isEditing} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Languages Spoken</label>
                <input type="text" value={profileData.languagesSpoken} onChange={(e) => setProfileData({...profileData, languagesSpoken: e.target.value})} disabled={!isEditing} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes / Additional Information</label>
                <textarea value={profileData.notes} onChange={(e) => setProfileData({...profileData, notes: e.target.value})} disabled={!isEditing} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100" rows={2} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
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
                    onChange={(e) => setPreferences({
                      ...preferences,
                      notifications: {...preferences.notifications, email: e.target.checked}
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
                    onChange={(e) => setPreferences({
                      ...preferences,
                      notifications: {...preferences.notifications, push: e.target.checked}
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
                    onChange={(e) => setPreferences({
                      ...preferences,
                      notifications: {...preferences.notifications, sms: e.target.checked}
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

      {/* Security Tab */}
      {activeTab === 'security' && (
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
                  {isChangingPassword ? (
                    <>
                      <span className="loader-spinner" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #f3f3f3', borderTop: '2px solid #ffffff', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '8px' }} />
                      Sending...
                    </>
                  ) : (
                    'Change Password'
                  )}
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
                  {isExportingData ? (
                    <>
                      <span className="loader-spinner" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #f3f3f3', borderTop: '2px solid #ffffff', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '8px' }} />
                      Exporting...
                    </>
                  ) : (
                    'Export Data'
                  )}
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
                  {isDeletingAccount ? (
                    <>
                      <span className="loader-spinner" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #f3f3f3', borderTop: '2px solid #ffffff', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '8px' }} />
                      Deleting...
                    </>
                  ) : (
                    'Delete Account'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 