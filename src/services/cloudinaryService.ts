// Cloudinary configuration
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Cloudinary upload widget configuration
export const cloudinaryConfig = {
  cloudName,
  uploadPreset
};

export const uploadPdf = async (file: File): Promise<string> => {
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration is missing. Please set up your .env file with Cloudinary credentials.');
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    throw new Error(`File size exceeds 10MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
  }

  try {
    // Only include allowed parameters for unsigned uploads
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'story_pdfs');

    // Use upload endpoint with no resource_type or type parameters
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    const data = await response.json();
    console.log('Cloudinary response:', data);

    if (!response.ok) {
      throw new Error(`Upload failed: ${data.error?.message || 'Unknown error'}`);
    }

    return data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

export const getCloudinaryUrl = (publicId: string): string => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    throw new Error('Cloudinary cloud name is not configured');
  }
  return `https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}`;
};