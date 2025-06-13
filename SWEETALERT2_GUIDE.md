# SweetAlert2 Integration Guide

This guide covers the SweetAlert2 integration in your Phil IRI Dashboard project, providing beautiful, customizable alerts and confirmations.

## 🎯 **What's Included**

### **Alert Types Available:**
- ✅ Success alerts with auto-dismiss
- ✅ Error alerts with detailed messages
- ✅ Warning alerts for important notices
- ✅ Info alerts for general information
- ✅ Confirmation dialogs with custom buttons
- ✅ Delete confirmations with danger styling
- ✅ Loading alerts with spinners
- ✅ Input prompts with validation
- ✅ Toast notifications
- ✅ Custom HTML alerts

## 🚀 **Quick Start**

### **Basic Usage:**
```typescript
import { showSuccess, showError, showConfirmation } from '../services/alertService';

// Success alert
showSuccess('Operation Completed', 'Your action was successful!');

// Error alert
showError('Operation Failed', 'Something went wrong. Please try again.');

// Confirmation dialog
const result = await showConfirmation('Delete Item', 'Are you sure?');
if (result.isConfirmed) {
  // User clicked "Yes"
}
```

## 📋 **Available Functions**

### **1. Success Alerts**
```typescript
showSuccess(title: string, message?: string)
```
- Auto-dismisses after 3 seconds
- Shows progress bar
- Green checkmark icon

**Example:**
```typescript
showSuccess('Welcome back!', 'You have successfully signed in.');
```

### **2. Error Alerts**
```typescript
showError(title: string, message?: string)
```
- Requires user confirmation
- Red error icon
- Detailed error messages

**Example:**
```typescript
showError('Sign In Failed', 'Invalid email or password.');
```

### **3. Warning Alerts**
```typescript
showWarning(title: string, message?: string)
```
- Yellow warning icon
- For important notices

**Example:**
```typescript
showWarning('Weak Password', 'Password should be at least 6 characters.');
```

### **4. Info Alerts**
```typescript
showInfo(title: string, message?: string)
```
- Blue info icon
- For general information

**Example:**
```typescript
showInfo('Coming Soon', 'This feature will be available in the next update.');
```

### **5. Confirmation Dialogs**
```typescript
showConfirmation(
  title: string, 
  message: string, 
  confirmText?: string,
  cancelText?: string
)
```
- Returns a promise with user's choice
- Customizable button text

**Example:**
```typescript
const result = await showConfirmation(
  'Delete Student',
  'Are you sure you want to remove this student?',
  'Yes, Delete',
  'Cancel'
);

if (result.isConfirmed) {
  // Delete the student
  deleteStudent(studentId);
}
```

### **6. Delete Confirmations**
```typescript
showDeleteConfirmation(itemName?: string)
```
- Pre-configured for delete operations
- Red danger styling
- Standard delete messaging

**Example:**
```typescript
const result = await showDeleteConfirmation('John Doe');
if (result.isConfirmed) {
  // Delete the item
}
```

### **7. Loading Alerts**
```typescript
showLoading(title?: string)
```
- Shows spinner
- Prevents user interaction
- Use with `closeAlert()` to dismiss

**Example:**
```typescript
const loadingAlert = showLoading('Processing your request...');
try {
  await someAsyncOperation();
  closeAlert();
  showSuccess('Completed!');
} catch (error) {
  closeAlert();
  showError('Failed!');
}
```

### **8. Input Prompts**
```typescript
showInput(
  title: string, 
  inputPlaceholder?: string,
  inputType?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'
)
```
- Returns user input
- Built-in validation
- Multiple input types

**Example:**
```typescript
const result = await showInput('Enter Student Name', 'John Doe', 'text');
if (result.isConfirmed) {
  const studentName = result.value;
  // Use the input value
}
```

### **9. Toast Notifications**
```typescript
showToast(
  message: string, 
  type?: 'success' | 'error' | 'warning' | 'info',
  duration?: number
)
```
- Non-intrusive notifications
- Auto-dismiss
- Multiple positions

**Example:**
```typescript
showToast('Session started successfully!', 'success', 3000);
```

### **10. Custom HTML Alerts**
```typescript
showCustomAlert(
  title: string,
  html: string,
  icon?: 'success' | 'error' | 'warning' | 'info' | 'question'
)
```
- Supports HTML content
- Rich formatting options

**Example:**
```typescript
const htmlContent = `
  <div class="text-left">
    <p><strong>Student:</strong> John Doe</p>
    <p><strong>Reading Level:</strong> 3.2</p>
    <p><strong>Progress:</strong> 85%</p>
  </div>
`;

showCustomAlert('Student Details', htmlContent, 'info');
```

## 🎨 **Customization**

### **Theme Configuration:**
The alerts use a custom theme that matches your dashboard design:
- Rounded corners
- Shadow effects
- Custom button styling
- Smooth animations
- Responsive design

### **Button Styling:**
- **Confirm buttons:** Blue gradient with hover effects
- **Cancel buttons:** Gray with hover effects
- **Danger buttons:** Red for delete operations
- **All buttons:** Rounded corners and smooth transitions

## 🔧 **Best Practices**

### **1. Use Appropriate Alert Types**
- **Success:** For completed operations
- **Error:** For failed operations
- **Warning:** For important notices
- **Info:** For general information
- **Confirmation:** For destructive actions

### **2. Provide Clear Messages**
```typescript
// Good
showError('Login Failed', 'Invalid email or password. Please check your credentials.');

// Bad
showError('Error', 'Something went wrong.');
```

### **3. Handle Async Operations**
```typescript
const handleDelete = async () => {
  const result = await showDeleteConfirmation('this student');
  
  if (result.isConfirmed) {
    const loadingAlert = showLoading('Deleting student...');
    
    try {
      await deleteStudent(studentId);
      closeAlert();
      showSuccess('Student Deleted', 'The student has been removed successfully.');
    } catch (error) {
      closeAlert();
      showError('Delete Failed', 'Unable to delete student. Please try again.');
    }
  }
};
```

### **4. Use Toast for Non-Critical Notifications**
```typescript
// For minor updates
showToast('Settings saved', 'success');

// For important actions
showSuccess('Profile Updated', 'Your profile has been saved successfully.');
```

## 📱 **Responsive Design**

All alerts are fully responsive and work well on:
- Desktop computers
- Tablets
- Mobile phones
- Different screen orientations

## 🎯 **Integration Examples**

### **Authentication Flow:**
```typescript
const handleLogin = async () => {
  try {
    await signIn(email, password);
    showSuccess('Welcome back!', 'You have successfully signed in.');
  } catch (error) {
    showError('Sign In Failed', getErrorMessage(error.code));
  }
};
```

### **Data Operations:**
```typescript
const handleSaveData = async () => {
  const loadingAlert = showLoading('Saving your changes...');
  
  try {
    await saveData(data);
    closeAlert();
    showSuccess('Data Saved', 'Your changes have been saved successfully.');
  } catch (error) {
    closeAlert();
    showError('Save Failed', 'Unable to save data. Please try again.');
  }
};
```

### **User Confirmations:**
```typescript
const handleLogout = async () => {
  const result = await showConfirmation(
    'Sign Out',
    'Are you sure you want to sign out?',
    'Yes, Sign Out',
    'Cancel'
  );
  
  if (result.isConfirmed) {
    await signOut();
    showToast('Signed out successfully', 'success');
  }
};
```

## 🚨 **Error Handling**

### **Firebase Authentication Errors:**
```typescript
const getErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/invalid-email':
      return 'Invalid email address';
    default:
      return 'An error occurred. Please try again';
  }
};
```

## 🔄 **Migration from Basic Alerts**

### **Before (Basic Alert):**
```typescript
alert('Operation completed successfully!');
```

### **After (SweetAlert2):**
```typescript
showSuccess('Success!', 'Operation completed successfully!');
```

## 📚 **Additional Resources**

- [SweetAlert2 Official Documentation](https://sweetalert2.github.io/)
- [SweetAlert2 GitHub Repository](https://github.com/sweetalert2/sweetalert2)
- [SweetAlert2 Examples](https://sweetalert2.github.io/#examples)

## 🎉 **Benefits**

1. **Better UX:** Beautiful, modern alerts
2. **Consistent Design:** Matches your dashboard theme
3. **Accessibility:** Keyboard navigation and screen reader support
4. **Responsive:** Works on all devices
5. **Customizable:** Easy to modify and extend
6. **Type Safety:** Full TypeScript support
7. **Performance:** Lightweight and fast

Your dashboard now has professional-grade alerts that enhance the user experience significantly! 