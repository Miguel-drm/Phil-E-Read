import mongoose from 'mongoose';
import UserProfile, { IUserProfile } from '../models/UserProfile';
import { GridFSService } from './gridfsService';

export class UserProfileService {
  static async createProfile(userId: string, role: string, displayName?: string): Promise<IUserProfile> {
    try {
      const profile = new UserProfile({
        userId,
        role,
        displayName
      });
      return await profile.save();
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  static async getProfile(userId: string): Promise<IUserProfile | null> {
    try {
      return await UserProfile.findOne({ userId });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  static async updateProfileImage(userId: string, imageBuffer: Buffer, filename: string, type: 'profile' | 'banner' = 'profile'): Promise<IUserProfile | null> {
    try {
      const profile = await UserProfile.findOne({ userId });
      if (!profile) {
        throw new Error('Profile not found');
      }

      // Delete old image if it exists
      if (type === 'profile' && profile.profileImageId) {
        await GridFSService.deleteFile(profile.profileImageId.toString());
      }
      if (type === 'banner' && profile.bannerImageId) {
        await GridFSService.deleteFile(profile.bannerImageId.toString());
      }

      // Upload new image
      const metadata = {
        userId,
        contentType: 'image',
        type
      };
      
      const fileId = await GridFSService.uploadFile(imageBuffer, filename, metadata);
      
      // Update profile with new image ID
      if (type === 'profile') {
        profile.profileImageId = fileId;
      } else if (type === 'banner') {
        profile.bannerImageId = fileId;
      }
      return await profile.save();
    } catch (error) {
      console.error('Error updating profile image:', error);
      throw error;
    }
  }

  static async getProfileImage(userId: string, type: 'profile' | 'banner' = 'profile'): Promise<{ buffer: Buffer; metadata: any } | null> {
    try {
      const profile = await UserProfile.findOne({ userId });
      if (!profile) return null;
      let imageId;
      if (type === 'profile') imageId = profile.profileImageId;
      if (type === 'banner') imageId = profile.bannerImageId;
      if (!imageId) return null;
      return await GridFSService.downloadFile(imageId.toString());
    } catch (error) {
      console.error('Error fetching profile image:', error);
      throw error;
    }
  }

  static async updateProfile(userId: string, updates: Partial<IUserProfile>): Promise<IUserProfile | null> {
    try {
      // Prevent updating userId and profileImageId/bannerImageId through this method
      const { userId: _, profileImageId: __, bannerImageId: ___, ...safeUpdates } = updates;
      
      return await UserProfile.findOneAndUpdate(
        { userId },
        { $set: safeUpdates },
        { new: true }
      );
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  static async deleteProfile(userId: string): Promise<void> {
    try {
      const profile = await UserProfile.findOne({ userId });
      if (!profile) {
        return;
      }

      // Delete profile and banner images if they exist
      if (profile.profileImageId) {
        await GridFSService.deleteFile(profile.profileImageId.toString());
      }
      if (profile.bannerImageId) {
        await GridFSService.deleteFile(profile.bannerImageId.toString());
      }

      await profile.deleteOne();
    } catch (error) {
      console.error('Error deleting user profile:', error);
      throw error;
    }
  }
} 