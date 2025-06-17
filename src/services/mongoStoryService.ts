import mongoose from 'mongoose';
import Story from '../models/Story';
import type { IStory } from '../models/Story';
import { GridFSService } from './gridfsService';

interface StoryInput {
  title: string;
  description: string;
  grade: string;
  textContent: string;
  language?: string;
  createdBy?: string;
  readingLevel?: string;
  categories?: string[];
  isActive?: boolean;
}

export const mongoStoryService = {
  async createStory(storyData: StoryInput, file: Buffer): Promise<IStory> {
    try {
      // Upload PDF to GridFS
      const pdfFileId = await GridFSService.uploadFile(file, `${storyData.title.replace(/\s+/g, '-').toLowerCase()}.pdf`, {
        contentType: 'application/pdf',
        grade: storyData.grade
      });

      // Create the story with the GridFS file ID
      const story = new Story({
        ...storyData,
        textContent: storyData.textContent || '',
        pdfFileId: pdfFileId,
        isActive: true
      });
      
      await story.save();
      return story;
    } catch (error) {
      console.error('Error creating story:', error);
      throw error;
    }
  },

  async getStories(filters?: { readingLevel?: string; categories?: string[]; language?: string; title?: string }): Promise<IStory[]> {
    try {
      let query = Story.find({ isActive: true });

      if (filters) {
        if (filters.readingLevel) {
          query = query.where('readingLevel').equals(filters.readingLevel);
        }
        if (filters.categories && filters.categories.length > 0) {
          query = query.where('categories').in(filters.categories);
        }
        if (filters.language) {
          query = query.where('language').equals(filters.language);
        }
        if (filters.title) {
          query = query.where('title').equals(filters.title);
        }
      }

      return await query
        .sort({ createdAt: -1 })
        .populate('createdBy', 'name email')
        .exec();
    } catch (error) {
      console.error('Error fetching stories:', error);
      throw error;
    }
  },

  async getStoryById(id: string): Promise<IStory | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }

      return await Story.findById(id)
        .populate('createdBy', 'name email')
        .exec();
    } catch (error) {
      console.error('Error fetching story:', error);
      throw error;
    }
  },

  async getPDFContent(id: string): Promise<Buffer> {
    try {
      const story = await Story.findById(id);
      if (!story || !story.pdfFileId) {
        throw new Error('Story or PDF not found');
      }

      const { buffer } = await GridFSService.downloadFile(story.pdfFileId.toString());
      return buffer;
    } catch (error) {
      console.error('Error getting PDF content:', error);
      throw error;
    }
  },

  async updateStory(id: string, updateData: Partial<StoryInput> & { pdfData?: Buffer }): Promise<IStory | null> {
    try {
      const story = await Story.findById(id);
      if (!story) {
        return null;
      }

      // If there's new PDF data, update it in GridFS
      if (updateData.pdfData) {
        // Delete old PDF if it exists
        if (story.pdfFileId) {
          await GridFSService.deleteFile(story.pdfFileId.toString());
        }

        // Upload new PDF
        const newPdfFileId = await GridFSService.uploadFile(
          updateData.pdfData,
          `${(updateData.title || story.title).replace(/\s+/g, '-').toLowerCase()}.pdf`,
          {
            contentType: 'application/pdf',
            grade: updateData.grade || story.grade
          }
        );

        story.pdfFileId = newPdfFileId;
        
        // Remove pdfData from updateData as we've handled it
        delete updateData.pdfData;
      }

      // Update other fields
      Object.assign(story, updateData);
      await story.save();
      return story;
    } catch (error) {
      console.error('Error updating story:', error);
      throw error;
    }
  },

  async deleteStory(id: string): Promise<IStory | null> {
    try {
      const story = await Story.findById(id);
      if (!story) {
        return null;
      }

      // Delete PDF from GridFS if it exists
      if (story.pdfFileId) {
        await GridFSService.deleteFile(story.pdfFileId.toString());
      }

      await story.deleteOne();
      return story;
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  },

  async searchStories(searchTerm: string): Promise<IStory[]> {
    try {
      return await Story.find(
        { 
          $and: [
            { isActive: true },
            {
              $or: [
                { title: { $regex: searchTerm, $options: 'i' } },
                { description: { $regex: searchTerm, $options: 'i' } }
              ]
            }
          ]
        }
      )
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email')
      .exec();
    } catch (error) {
      console.error('Error searching stories:', error);
      throw error;
    }
  }
};
