const API_BASE = '/api/profile';

export const uploadProfileImage = async (userId: string, file: File, type: 'profile' | 'banner' = 'profile') => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('type', type);
  const res = await fetch(`${API_BASE}/${userId}/image`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload profile image');
  return res.json();
};

export const getProfileImageUrl = (userId: string) => {
  return `${API_BASE}/${userId}/image?type=profile`;
};

export const getBannerImageUrl = (userId: string) => {
  return `${API_BASE}/${userId}/image?type=banner`;
};

export const getProfile = async (userId: string) => {
  const res = await fetch(`${API_BASE}/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
};

export const updateProfile = async (userId: string, updates: any) => {
  const res = await fetch(`${API_BASE}/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
};

export const createProfile = async (data: { userId: string; role: string; displayName?: string }) => {
  const res = await fetch(`${API_BASE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create profile');
  return res.json();
};

/**
 * Upload profile or banner image with progress tracking.
 * @param userId - The user's ID
 * @param file - The image file
 * @param type - 'profile' or 'banner'
 * @param onProgress - Callback for upload progress (0-100)
 * @returns Promise resolving to the response JSON
 */
export const uploadProfileOrBannerImageWithProgress = (
  userId: string,
  file: File,
  type: 'profile' | 'banner' = 'profile',
  onProgress?: (percent: number) => void
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/${userId}/image`);

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (e) {
          reject(new Error('Failed to parse response'));
        }
      } else {
        reject(new Error('Failed to upload image'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.send(formData);
  });
}; 