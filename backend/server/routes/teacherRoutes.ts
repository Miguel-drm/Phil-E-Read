import { Router } from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import Teacher from '../models/Teacher.js';
import admin from '../firebaseAdmin'; // Use the initialized admin instance

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload teacher profile image by teacherId (firebaseUid)
// This will always replace the old image with the new one in the database
const uploadProfileImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teacherId } = req.params;
    if (!req.file) {
      res.status(400).json({ error: 'No image file uploaded' });
      return;
    }
    // Store image as base64 string in the teacher document
    const imageBase64 = req.file.buffer.toString('base64');
    // This will overwrite any existing profileImage
    const teacher = await Teacher.findOneAndUpdate(
      { firebaseUid: teacherId },
      { profileImage: imageBase64 },
      { new: true }
    );
    if (!teacher) {
      res.status(404).json({ error: 'Teacher not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
};

// Get teacher profile image by teacherId (firebaseUid)
const getProfileImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teacherId } = req.params;
    const teacher = await Teacher.findOne({ firebaseUid: teacherId });
    if (!teacher || !teacher.profileImage) {
      res.json({ profileImage: null });
      return;
    }
    // Return as JSON with base64 string
    res.json({ profileImage: teacher.profileImage });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
};

// Sync teacher profile by firebaseUid
const syncTeacherProfile = async (req: Request, res: Response): Promise<void> => {
  const { firebaseUid, name, email, displayName, school, gradeLevel, phoneNumber } = req.body;
  console.log('SYNC CALLED:', { firebaseUid, name, email, displayName, school, gradeLevel, phoneNumber });
  if (!firebaseUid || !email) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  try {
    const updateFields = { name, email, displayName, school, gradeLevel, phoneNumber };
    const teacher = await Teacher.findOneAndUpdate(
      { firebaseUid },
      updateFields,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log('SYNC RESULT:', teacher);
    res.json({ success: true, teacher });
  } catch (error) {
    console.error('SYNC ERROR:', error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
};

// Make sure the more specific route is above the general one and both use router.get
router.get('/:teacherId/profile-image', getProfileImage);
router.get('/:teacherId', async (req: Request, res: Response) => {
  try {
    const { teacherId } = req.params;

    // Fetch text fields and banner from Firestore
    const userDoc = await admin.firestore().collection('users').doc(teacherId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Teacher not found in Firestore' });
    }
    const firestoreData = userDoc.data();

    // Fetch profile image from MongoDB
    const teacherMongo = await Teacher.findOne({ firebaseUid: teacherId });
    const profileImage = teacherMongo?.profileImage
      ? `data:image/png;base64,${teacherMongo.profileImage}`
      : null;

    // Merge and return
    res.json({ ...firestoreData, profileImage });
  } catch (error) {
    console.error('Error in /api/teachers/:teacherId:', error); // Log the error for debugging
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

// Get all teachers with profile images
router.get('/', async (req, res) => {
  try {
    // Fetch all teachers from Firestore
    const usersSnapshot = await admin.firestore().collection('users').where('role', '==', 'teacher').get();
    const teachers = [];
    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      // Fetch profile image from MongoDB
      const teacherMongo = await Teacher.findOne({ firebaseUid: doc.id });
      const profileImage = teacherMongo?.profileImage
        ? `data:image/png;base64,${teacherMongo.profileImage}`
        : null;
      teachers.push({ id: doc.id, ...data, profileImage });
    }
    res.json(teachers);
  } catch (error) {
    console.error('Error in GET /api/teachers:', error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

router.post('/:teacherId/profile-image', upload.single('image'), uploadProfileImage);
router.post('/sync', syncTeacherProfile);

export default router; 