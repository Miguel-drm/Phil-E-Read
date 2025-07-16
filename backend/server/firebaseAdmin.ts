import admin from 'firebase-admin';
// TODO: Update the path below to your actual service account key JSON file
import serviceAccount from './serviceAccountKey.json';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any)
  });
}

export default admin; 