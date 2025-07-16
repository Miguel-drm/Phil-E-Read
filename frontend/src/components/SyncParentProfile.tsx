import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const SyncParentProfile = () => {
  const { currentUser, userProfile } = useAuth();

  useEffect(() => {
    if (currentUser && userProfile && userProfile.role === 'parent') {
      fetch('http://localhost:5000/api/parents/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: currentUser.uid,
          name: userProfile.displayName || '',
          email: userProfile.email || '',
          displayName: userProfile.displayName || '',
          address: userProfile.address || '',
          phoneNumber: userProfile.phoneNumber || '',
          profileImage: userProfile.profilePhoto || ''
        }),
      });
    }
  }, [currentUser, userProfile]);

  return null;
};

export default SyncParentProfile;
