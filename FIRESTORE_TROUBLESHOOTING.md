# Firestore Troubleshooting Guide

## Common Issues and Solutions

### 1. "Load Failed" Error

#### Possible Causes:
- Firestore collection doesn't exist yet
- Security rules are blocking access
- Firebase configuration issues
- Network connectivity problems
- Authentication issues

#### Debugging Steps:

1. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for error messages in the Console tab
   - Check for any Firebase-related errors

2. **Test Connection**
   - Click the "Test Connection" button in the Class Grades section
   - This will test basic Firestore connectivity

3. **Check Firebase Console**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Navigate to Firestore Database
   - Check if the `classGrades` collection exists

4. **Verify Security Rules**
   - In Firebase Console, go to Firestore Database > Rules
   - Ensure rules allow read access for authenticated users
   - Deploy updated rules if needed

5. **Check Authentication**
   - Ensure you're logged in to the application
   - Check if the user has proper permissions

### 2. Collection Doesn't Exist

#### Solution:
1. **Initialize Sample Data**
   - Click "Initialize Grades" button
   - This will create the collection and sample data

2. **Manual Creation**
   - Go to Firebase Console
   - Navigate to Firestore Database
   - Click "Start collection"
   - Collection ID: `classGrades`
   - Add a sample document

### 3. Permission Denied

#### Solution:
1. **Check Security Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /classGrades/{gradeId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
     }
   }
   ```

2. **Deploy Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

### 4. Configuration Issues

#### Check Environment Variables:
1. **Create .env file** in project root:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

2. **Restart Development Server**
   ```bash
   npm run dev
   ```

### 5. Network Issues

#### Solution:
1. **Check Internet Connection**
2. **Try Different Network**
3. **Check Firewall Settings**
4. **Clear Browser Cache**

### 6. Authentication Issues

#### Solution:
1. **Ensure User is Logged In**
2. **Check Auth State**
3. **Re-authenticate if Needed**

## Debugging Tools

### 1. Browser Console Logs
Look for these log messages:
- `GradeService: Starting to fetch active grades...`
- `GradeService: Query executed, documents found: X`
- `Grades loaded successfully: [...]`

### 2. Test Connection Button
- Click "Test Connection" in Class Grades section
- This will test basic Firestore connectivity
- Shows success/error messages

### 3. Firebase Console
- Check Firestore Database for data
- Monitor Authentication status
- Review Security Rules

## Quick Fixes

### If Collection is Empty:
1. Click "Initialize Grades" button
2. This creates sample data automatically

### If Connection Fails:
1. Check Firebase configuration
2. Verify environment variables
3. Restart development server

### If Permission Denied:
1. Check if user is authenticated
2. Verify security rules
3. Deploy updated rules

## Getting Help

If issues persist:
1. Check browser console for specific error messages
2. Verify Firebase project settings
3. Ensure proper authentication
4. Test with Firebase Console directly

## Common Error Messages

- **"permission-denied"** - Check authentication and security rules
- **"not-found"** - Collection doesn't exist, initialize data
- **"unavailable"** - Network or service issue
- **"invalid-argument"** - Configuration problem

This guide should help resolve most Firestore connection issues. 