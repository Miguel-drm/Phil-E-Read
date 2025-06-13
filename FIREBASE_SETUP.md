# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication for your Phil IRI Dashboard project.

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "phil-iri-dashboard")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project console, click on "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" authentication:
   - Click on "Email/Password"
   - Toggle the "Enable" switch
   - Click "Save"

## Step 3: Get Your Firebase Configuration

1. In the Firebase console, click on the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to the "Your apps" section
4. Click the web icon (</>)
5. Register your app with a nickname (e.g., "phil-iri-web")
6. Copy the Firebase configuration object

## Step 4: Set Up Environment Variables

1. Create a `.env` file in your project root (same level as package.json)
2. Add your Firebase configuration using the following format:

```env
VITE_FIREBASE_API_KEY=AIzaSyDd4q-KKeLgTCXBpDmkHHn6p0qxTVpIqQ0
VITE_FIREBASE_AUTH_DOMAIN=phileread-capstone.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=phileread-capstone
VITE_FIREBASE_STORAGE_BUCKET=phileread-capstone.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=769182599109
VITE_FIREBASE_APP_ID=1:769182599109:web:eab22396d978cb211aadac
```

**Important:** 
- Replace the values above with your actual Firebase configuration
- The `.env` file should be added to `.gitignore` to keep your keys secure
- Never commit your actual Firebase keys to version control

## Step 5: Test the Authentication

1. Start your development server: `npm run dev`
2. Navigate to your app
3. Try creating a new account using the signup form
4. Try logging in with the created account
5. Test the logout functionality

## Features Included

### Authentication Features:
- ✅ User registration with email/password
- ✅ User login with email/password
- ✅ Password reset functionality
- ✅ Automatic session management
- ✅ Protected routes
- ✅ Loading states
- ✅ Error handling with user-friendly messages

### Security Features:
- ✅ Password validation (minimum 6 characters)
- ✅ Password confirmation on signup
- ✅ Email validation
- ✅ Firebase security rules (handled by Firebase)
- ✅ Environment variables for secure configuration

### User Experience:
- ✅ Smooth transitions between login/signup
- ✅ Loading indicators
- ✅ Error messages for common issues
- ✅ Responsive design
- ✅ Form validation

## Environment Variables Setup

The project is configured to use environment variables for better security. Here's how to set them up:

### Option 1: Using .env file (Recommended)
1. Create a `.env` file in your project root
2. Add your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your-actual-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### Option 2: Fallback Configuration
If you don't create a `.env` file, the app will use the fallback configuration in `src/config/firebase.ts`. However, this is not recommended for production.

## Troubleshooting

### Common Issues:

1. **"Firebase: Error (auth/operation-not-allowed)"**
   - Make sure Email/Password authentication is enabled in Firebase Console

2. **"Firebase: Error (auth/invalid-api-key)"**
   - Check that your Firebase configuration is correct
   - Ensure you're using the right project's configuration
   - Verify your `.env` file is in the correct location

3. **"Firebase: Error (auth/network-request-failed)"**
   - Check your internet connection
   - Verify Firebase project is active

4. **Authentication not persisting**
   - This is normal behavior - Firebase handles session persistence automatically
   - Users will stay logged in until they explicitly sign out

5. **Environment variables not loading**
   - Make sure the `.env` file is in the project root (same level as package.json)
   - Restart your development server after creating the `.env` file
   - Check that variable names start with `VITE_`

## Next Steps

After setting up Firebase authentication, you can:

1. Add additional authentication methods (Google, Facebook, etc.)
2. Implement user profile management
3. Add role-based access control
4. Set up Firebase Firestore for user data
5. Add email verification
6. Implement account deletion

## Security Best Practices

1. **Never commit your Firebase config to version control**
2. **Use environment variables for sensitive data**
3. Set up proper Firebase security rules
4. Regularly review your Firebase project settings
5. Monitor authentication usage in Firebase Console
6. Add `.env` to your `.gitignore` file

## Support

If you encounter any issues:
1. Check the Firebase documentation
2. Review the Firebase Console for error logs
3. Check the browser console for detailed error messages
4. Ensure all dependencies are properly installed
5. Verify your `.env` file is correctly formatted 