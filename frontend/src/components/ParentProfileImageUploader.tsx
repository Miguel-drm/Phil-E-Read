import React, { useRef } from 'react';

interface ParentProfileImageUploaderProps {
  firebaseUid: string;
  onUploadSuccess?: () => void;
}

const ParentProfileImageUploader: React.FC<ParentProfileImageUploaderProps> = ({ firebaseUid, onUploadSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    const response = await fetch(`/api/parents/${firebaseUid}/profile-image`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (data.success) {
      alert('Profile image uploaded!');
      if (onUploadSuccess) onUploadSuccess();
    } else {
      alert('Upload failed: ' + (data.error || 'Unknown error'));
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 text-white px-4 py-2 rounded">
        Upload Profile Image
      </button>
    </div>
  );
};

export default ParentProfileImageUploader;
