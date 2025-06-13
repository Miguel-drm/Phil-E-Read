# Firestore Setup and Troubleshooting Guide

## 1. Enable Firestore in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`phileread-capstone`)
3. In the left sidebar, click on **"Firestore Database"**
4. If not already enabled, click **"Create Database"**
5. Choose **"Start in test mode"** for development (allows read/write access)
6. Select a location (choose the closest to your users)

## 2. Check Firestore Security Rules

Go to Firestore Database → Rules and ensure you have these rules for testing:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all users under any document
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ Warning:** These rules allow full access. For production, you should implement proper authentication-based rules.

## 3. Verify Environment Variables

Make sure your `.env` file contains the correct Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=phileread-capstone.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=phileread-capstone
VITE_FIREBASE_STORAGE_BUCKET=phileread-capstone.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=769182599109
VITE_FIREBASE_APP_ID=1:769182599109:web:eab22396d978cb211aadac
```

## 4. Test Firestore Connection

1. Open your application in the browser
2. Go to the Class List page
3. Click the **"Test Firestore Connection"** button
4. Check the console for detailed logs
5. Review the test results

## 5. Common Issues and Solutions

### Issue: "Failed to fetch students"
**Possible causes:**
- Firestore not enabled
- Security rules blocking access
- Network connectivity issues
- Invalid Firebase configuration

**Solutions:**
1. Verify Firestore is enabled in Firebase Console
2. Check security rules allow read/write access
3. Verify internet connection
4. Check browser console for detailed error messages

### Issue: "Missing or insufficient permissions"
**Solution:** Update Firestore security rules to allow access

### Issue: "Firestore db instance is not available"
**Solution:** Check Firebase configuration and ensure all environment variables are set

## 6. Browser Console Debugging

Open browser developer tools (F12) and check the Console tab for:
- Firebase initialization logs
- Firestore query logs
- Error messages with error codes
- Network requests to Firestore

## 7. Sample Data

If the connection works but no students are found, the app will automatically add sample students for testing.

## 8. Production Considerations

For production deployment:
1. Implement proper Firestore security rules
2. Set up authentication-based access control
3. Configure proper indexes for queries
4. Monitor Firestore usage and costs

## 9. Firestore Indexes

If you see index-related errors, you may need to create composite indexes:
1. Go to Firestore Database → Indexes
2. Create indexes for queries that use multiple fields
3. Common indexes needed:
   - `teacherId` + `createdAt` (for student queries)
   - `teacherId` + `performance` (for performance filtering)

## 10. Support

If issues persist:
1. Check Firebase Console for any error messages
2. Review browser console logs
3. Verify all configuration steps above
4. Test with the provided FirestoreTest component 