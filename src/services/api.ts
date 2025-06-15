import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const getReadingSession = async (sessionId: string) => {
  try {
    const sessionRef = doc(db, 'reading-sessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);

    if (!sessionSnap.exists()) {
      throw new Error('Reading session not found');
    }

    return { id: sessionSnap.id, ...sessionSnap.data() };
  } catch (error) {
    console.error('Error fetching reading session:', error);
    throw error;
  }
};