// Cloudinary configuration
let cloudinary: any = null;

try {
  const { v2 } = await import('cloudinary');
  cloudinary = v2;
  
  // Configure Cloudinary
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
  const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret
    });
  } else {
    console.warn('Cloudinary configuration is missing. Please set up your .env file with Cloudinary credentials.');
  }
} catch (error) {
  console.warn('Cloudinary initialization failed:', error);
}

// Cloudinary upload widget configuration
export const cloudinaryConfig = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
};

// Cloudinary upload configuration
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const uploadPdf = async (file: File): Promise<string> => {
  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration is missing. Please set up your .env file with Cloudinary credentials.');
  }

  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('cloud_name', cloudName);

    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}; 