import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Routes, Route } from 'react-router-dom';
import ProfileOverview from './ProfileOverview';

const Profile: React.FC = () => {
<<<<<<< HEAD
  const { currentUser, userProfile, refreshUserProfile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    school: '',
    gradeLevel: '',
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

  // Load user profile data when component mounts or userProfile changes
  useEffect(() => {
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
    
      // Refresh the user profile to get updated data
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
    // showInfo('Changes Cancelled', 'Your changes have been discarded.');
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
      // In a real application, you would implement the logic here to:
      // 1. Fetch all relevant user data (profile, class lists, student data, etc.)
      // 2. Format it (e.g., as JSON, CSV, or an Excel file).
      // 3. Initiate a download for the user.
      
      // Simulate an asynchronous operation
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
          return passwordInput; // Return the password for further processing
        },
        allowOutsideClick: () => !Swal.isLoading()
      });

      if (password) {
        setIsDeletingAccount(true);
        try {
          // Re-authenticate user
          const credential = EmailAuthProvider.credential(currentUser.email || '', password);
          await reauthenticateWithCredential(currentUser, credential);

          // Delete user document from Firestore
          if (currentUser.uid) {
            await deleteDoc(doc(db, 'users', currentUser.uid));
          }

          // Delete user from Firebase Auth
          await deleteUser(currentUser);

          showSuccess('Account Deleted', 'Your account and all associated data have been permanently deleted.');
          await signOut(); // Sign out the user after deletion
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
=======
  useAuth();
>>>>>>> origin/Jbranch

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      setSelectedFile(file);
      setShowCropper(true);
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
  const handleCropComplete = async (_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    if (selectedFile && croppedAreaPixels) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageDataUrl = e.target?.result as string;
        const croppedImg = await getCroppedImg(imageDataUrl, croppedAreaPixels);
        setProfileImage(croppedImg);
        setShowCropper(false);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  return (
    <div className="profile-page px-4 sm:px-6 md:px-8">
      <Routes>
        <Route index element={<ProfileOverview />} />
      </Routes>
    </div>
  );
};

export default Profile; 