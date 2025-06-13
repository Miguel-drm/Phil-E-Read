import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  type User,
  type UserCredential
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export type UserRole = 'admin' | 'parent' | 'teacher';

export interface AuthError {
  code: string;
  message: string;
}

export interface UserProfile {
  displayName?: string;
  email?: string;
  photoURL?: string;
  role?: UserRole;
}

// Function to determine user role based on email domain
const determineUserRole = (email: string): UserRole => {
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (domain === 'admin.com') {
    return 'admin';
  } else if (domain === 'teacher.edu.ph') {
    return 'teacher';
  } else {
    return 'parent';
  }
};

// Sign up with email and password
export const signUp = async (email: string, password: string, displayName?: string): Promise<UserCredential> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with display name if provided
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
    }

    // Create user document in Firestore with role determined by email
    if (userCredential.user) {
      const role = determineUserRole(email);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email,
        displayName: displayName || '',
        role: role,
        createdAt: new Date().toISOString()
      });
    }
    
    return userCredential;
  } catch (error) {
    throw error;
  }
};

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<UserCredential> => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw error;
  }
};

// Sign out
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

// Send password reset email
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw error;
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Update user profile
export const updateUserProfile = async (updates: UserProfile): Promise<void> => {
  try {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, updates);
      
      // Update user document in Firestore
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        ...updates
      }, { merge: true });
    } else {
      throw new Error('No user is currently signed in');
    }
  } catch (error) {
    throw error;
  }
};

// Get user profile data including role
export const getUserProfile = async (): Promise<UserProfile | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.data();
    
    if (!userData) {
      // If no user document exists, create one with default role
      const role = determineUserRole(user.email || '');
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: user.displayName || '',
        role: role,
        createdAt: new Date().toISOString()
      });
      
      return {
        displayName: user.displayName || undefined,
        email: user.email || undefined,
        photoURL: user.photoURL || undefined,
        role: role
      };
    }
    
    return {
      displayName: user.displayName || userData.displayName || undefined,
      email: user.email || undefined,
      photoURL: user.photoURL || undefined,
      role: userData.role || determineUserRole(user.email || '')
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return {
      displayName: user.displayName || undefined,
      email: user.email || undefined,
      photoURL: user.photoURL || undefined,
      role: determineUserRole(user.email || '')
    };
  }
}; 