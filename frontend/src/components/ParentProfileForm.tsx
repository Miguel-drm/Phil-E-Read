import React, { useState } from 'react';

interface ParentProfile {
  name?: string;
  email?: string;
  address?: string;
  phoneNumber?: string;
  profilePhoto?: string;
}

interface ParentProfileFormProps {
  initialProfile?: ParentProfile;
  onSave: (profile: ParentProfile & { profileImage: string }) => void;
}

const ParentProfileForm: React.FC<ParentProfileFormProps> = ({ initialProfile = {}, onSave }) => {
  const [profile, setProfile] = useState<ParentProfile>(initialProfile);
  const [imagePreview, setImagePreview] = useState<string>(profile.profilePhoto ? `data:image/png;base64,${profile.profilePhoto}` : '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1];
          setProfile((prev) => ({ ...prev, profilePhoto: base64 }));
          setImagePreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      ...profile,
      profileImage: profile.profilePhoto || '',
    };
    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Name</label>
        <input name="name" value={profile.name || ''} onChange={handleChange} className="border p-2 rounded w-full" />
      </div>
      <div>
        <label>Email</label>
        <input name="email" value={profile.email || ''} onChange={handleChange} className="border p-2 rounded w-full" />
      </div>
      <div>
        <label>Address</label>
        <input name="address" value={profile.address || ''} onChange={handleChange} className="border p-2 rounded w-full" />
      </div>
      <div>
        <label>Phone Number</label>
        <input name="phoneNumber" value={profile.phoneNumber || ''} onChange={handleChange} className="border p-2 rounded w-full" />
      </div>
      <div>
        <label>Profile Image</label>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        {imagePreview && <img src={imagePreview} alt="Preview" className="w-24 h-24 rounded-full mt-2" />}
      </div>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
    </form>
  );
};

export default ParentProfileForm;
