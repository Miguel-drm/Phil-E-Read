import mongoose, { Schema, Document } from 'mongoose';
import { ObjectId } from 'mongodb';

export interface IUserProfile extends Document {
  userId: string;
  displayName?: string;
  profileImageId?: ObjectId;
  bannerImageId?: ObjectId;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserProfileSchema: Schema = new Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    unique: true,
    trim: true
  },
  displayName: {
    type: String,
    trim: true
  },
  profileImageId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  bannerImageId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: ['teacher', 'student', 'parent', 'admin'],
    trim: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IUserProfile>('UserProfile', UserProfileSchema); 