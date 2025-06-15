import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { uploadPdf } from './cloudinaryService';
import { getAuth } from 'firebase/auth';

export interface Story {
  id?: string;
  title: string;
  description: string;
  createdBy?: string; // User ID of the creator
  language?: string;
  pdfUrl: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const storiesCollection = collection(db, 'stories');

export const addStory = async (story: Omit<Story, 'id' | 'createdAt' | 'updatedAt' | 'pdfUrl'>, file: File): Promise<string> => {
  try {
    const now = new Date().toISOString();
    
    // Upload PDF to Cloudinary
    const pdfUrl = await uploadPdf(file);

    const storyData = {
      ...story,
      pdfUrl: pdfUrl,
      createdAt: now,
      updatedAt: now,
      isActive: true
    };
    
    const docRef = await addDoc(storiesCollection, storyData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding story:', error);
    throw error;
  }
};

export const getStories = async (filters?: { level?: string; category?: string; language?: string }): Promise<Story[]> => {
  try {
    let q = query(storiesCollection, where('isActive', '==', true));
    
    if (filters?.level) {
      q = query(q, where('level', '==', filters.level));
    }
    
    if (filters?.category) {
      q = query(q, where('category', '==', filters.category));
    }
    
    if (filters?.language) {
      q = query(q, where('language', '==', filters.language));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Story));
  } catch (error) {
    console.error('Error getting stories:', error);
    throw error;
  }
};

export const getStoryById = async (id: string): Promise<Story | null> => {
  try {
    const docRef = doc(db, 'stories', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Story;
    }
    return null;
  } catch (error) {
    console.error('Error getting story:', error);
    throw error;
  }
};

export const updateStory = async (id: string, story: Partial<Story>): Promise<void> => {
  try {
    const docRef = doc(db, 'stories', id);
    const updateData = {
      ...story,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating story:', error);
    throw error;
  }
};

export const deleteStory = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, 'stories', id);
    await updateDoc(docRef, {
      isActive: false,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deleting story:', error);
    throw error;
  }
};

class StoryService {
  private collectionName = 'stories';

  async createStory(storyData: {
    title: string;
    description: string;
    language?: string;
    pdfUrl: string;
  }): Promise<string> {
    try {
      const auth = getAuth();
      if (!auth.currentUser) {
        throw new Error('No authenticated user');
      }

      const docRef = await addDoc(collection(db, this.collectionName), {
        ...storyData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating story:', error);
      throw new Error('Failed to create story');
    }
  }

  async updateStory(storyId: string, storyData: {
    title?: string;
    description?: string;
    language?: string;
    pdfUrl?: string;
  }): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, storyId);
      await updateDoc(docRef, {
        ...storyData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating story:', error);
      throw new Error('Failed to update story');
    }
  }

  // ...existing code for other methods...
}

export const storyService = new StoryService();
export default storyService;