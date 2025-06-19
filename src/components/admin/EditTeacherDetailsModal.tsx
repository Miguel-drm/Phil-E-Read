import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { updateTeacherProfile } from '../../services/authService';

interface Teacher {
  id: string;
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  school?: string;
  gradeLevel?: string;
}

interface EditTeacherDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher | null;
  onSaveSuccess: () => void;
}

const EditTeacherDetailsModal: React.FC<EditTeacherDetailsModalProps> = ({ isOpen, onClose, teacher, onSaveSuccess }) => {
  const [profileData, setProfileData] = useState<Teacher>({
    id: '',
    displayName: '',
    email: '',
    phoneNumber: '',
    school: '',
    gradeLevel: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (teacher) {
      setProfileData({
        id: teacher.id,
        displayName: teacher.displayName || '',
        email: teacher.email || '',
        phoneNumber: teacher.phoneNumber || '',
        school: teacher.school || '',
        gradeLevel: teacher.gradeLevel || '',
      });
    }
  }, [teacher]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!profileData.id) {
      Swal.fire('Error', 'Teacher ID is missing.', 'error');
      return;
    }

    if (!profileData.displayName?.trim()) {
      Swal.fire('Validation Error', 'Display Name is required.', 'error');
      return;
    }
    if (profileData.displayName.trim().length < 2) {
      Swal.fire('Validation Error', 'Display Name must be at least 2 characters.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await updateTeacherProfile(profileData.id, {
        displayName: profileData.displayName,
        phoneNumber: profileData.phoneNumber || null,
        school: profileData.school || null,
        gradeLevel: profileData.gradeLevel || null,
      });
      Swal.fire('Success', 'Teacher profile updated successfully!', 'success');
      onSaveSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating teacher profile:', error);
      Swal.fire('Error', 'Failed to update teacher profile. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full mx-4 my-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Teacher Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
            <input
              type="text"
              name="displayName"
              value={profileData.displayName}
              onChange={handleInputChange}
              disabled={isSaving}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              value={profileData.email || 'N/A'}
              disabled={true}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={profileData.phoneNumber}
              onChange={handleInputChange}
              disabled={isSaving}
              placeholder="N/A"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
            {!isSaving && !profileData.phoneNumber && <p className="text-xs text-gray-500 mt-1">Will display as N/A if empty</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">School</label>
            <input
              type="text"
              name="school"
              value={profileData.school}
              onChange={handleInputChange}
              disabled={isSaving}
              placeholder="N/A"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
            {!isSaving && !profileData.school && <p className="text-xs text-gray-500 mt-1">Will display as N/A if empty</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
            <input
              type="text"
              name="gradeLevel"
              value={profileData.gradeLevel}
              onChange={handleInputChange}
              disabled={isSaving}
              placeholder="N/A"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
            {!isSaving && !profileData.gradeLevel && <p className="text-xs text-gray-500 mt-1">Will display as N/A if empty</p>}
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <span className="flex items-center">
                <span className="loader-spinner mr-2" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #f3f3f3', borderTop: '2px solid #ffffff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                Saving...
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTeacherDetailsModal; 