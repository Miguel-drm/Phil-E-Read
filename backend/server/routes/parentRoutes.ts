import { Router } from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import Parent from '../models/Parent';
import admin from '../firebaseAdmin';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload parent profile image by parentId (firebaseUid)
const uploadProfileImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { parentId } = req.params;
    if (!req.file) {
      res.status(400).json({ error: 'No image file uploaded' });
      return;
    }
    const imageBase64 = req.file.buffer.toString('base64');
    const parent = await Parent.findOneAndUpdate(
      { firebaseUid: parentId },
      { profileImage: imageBase64 },
      { new: true }
    );
    if (!parent) {
      res.status(404).json({ error: 'Parent not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
};

// Get parent profile image by parentId (firebaseUid)
const getProfileImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { parentId } = req.params;
    const parent = await Parent.findOne({ firebaseUid: parentId });
    if (!parent || !parent.profileImage) {
      res.json({ profileImage: null });
      return;
    }
    res.json({ profileImage: parent.profileImage });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
};

// Get all parents with profile images
router.get('/', async (req, res) => {
  try {
    // Fetch all parents from Firestore
    const usersSnapshot = await admin.firestore().collection('users').where('role', '==', 'parent').get();
    const parents = [];
    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      // Fetch profile image from MongoDB
      const parentMongo = await Parent.findOne({ firebaseUid: doc.id });
      const profileImage = parentMongo?.profileImage
        ? `data:image/png;base64,${parentMongo.profileImage}`
        : null;
      parents.push({
        id: doc.id,
        displayName: data.displayName || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || '',
        school: data.school || '',
        gradeLevel: data.gradeLevel || '',
        profileImage,
        ...data,
      });
    }
    res.json(parents);
  } catch (error) {
    console.error('Error in GET /api/parents:', error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

// Get a single parent's full profile by ID
router.get('/:parentId', (req, res) => {
  (async () => {
    try {
      const { parentId } = req.params;
      // Fetch text fields from Firestore
      const userDoc = await admin.firestore().collection('users').doc(parentId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'Parent not found in Firestore' });
      }
      const firestoreData = userDoc.data();
      // Fetch profile image from MongoDB
      const parentMongo = await Parent.findOne({ firebaseUid: parentId });
      const profileImage = parentMongo?.profileImage
        ? `data:image/png;base64,${parentMongo.profileImage}`
        : null;
      // Merge and return
      res.json({ ...firestoreData, profileImage });
    } catch (error) {
      console.error('Error in /api/parents/:parentId:', error);
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: message });
    }
  })();
});

// Sync parent profile (create or update)
router.post('/sync', (req, res) => {
  (async () => {
    try {
      const { firebaseUid, name, email, displayName, address, phoneNumber, profileImage, banner } = req.body;
      if (!firebaseUid || !email) {
        return res.status(400).json({ error: 'firebaseUid and email are required' });
      }
      // Upsert parent profile in MongoDB
      const parent = await Parent.findOneAndUpdate(
        { firebaseUid },
        {
          firebaseUid,
          name: name || displayName || '',
          email,
          address: address || '',
          phoneNumber: phoneNumber || '',
          profileImage: profileImage || '',
          banner: banner || '',
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      res.json({ success: true, parent });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: message });
    }
  })();
});

router.get('/:parentId/profile-image', getProfileImage);
router.post('/:parentId/profile-image', upload.single('image'), uploadProfileImage);

export default router;