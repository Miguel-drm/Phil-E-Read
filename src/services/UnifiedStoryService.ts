import axios from 'axios';
import type { Story, StoryFilters } from '../types/Story';

interface FileBuffer {
  buffer: Buffer | ArrayBuffer;
  originalname: string;
  mimetype: string;
  size: number;
}

class UnifiedStoryService {
  private static instance: UnifiedStoryService;
  private readonly API_URL = 'http://localhost:5000/api/stories';

  private constructor() {}

  public static getInstance(): UnifiedStoryService {
    if (!UnifiedStoryService.instance) {
      UnifiedStoryService.instance = new UnifiedStoryService();
    }
    return UnifiedStoryService.instance;
  }

  private validateLanguage(language: string | undefined): string {
    if (!language) {
      throw new Error('Language is required');
    }
    
    const normalizedLanguage = language.toLowerCase();
    if (!['english', 'tagalog'].includes(normalizedLanguage)) {
      throw new Error('Language must be either "english" or "tagalog"');
    }
    
    return normalizedLanguage;
  }

  private async fileToBuffer(file: File): Promise<FileBuffer> {
    const arrayBuffer = await file.arrayBuffer();
    return {
      buffer: arrayBuffer,
      originalname: file.name,
      mimetype: file.type,
      size: file.size
    };
  }

  public async createStory(storyData: Partial<Story>, file: File | FileBuffer): Promise<Story> {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Validate and normalize language
      const language = this.validateLanguage(storyData.language);
      
      // Add story data
      const normalizedData = {
        ...storyData,
        language,
        textContent: '',
        isActive: storyData.isActive ?? true
      };

      Object.entries(normalizedData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, typeof value === 'boolean' ? value.toString() : value.toString());
        }
      });
      
      // Add the PDF file
      if (file instanceof File) {
        formData.append('pdf', file);
      } else {
        const blob = new Blob([file.buffer], { type: file.mimetype });
        formData.append('pdf', blob, file.originalname);
      }

      // Send the request
      const response = await axios.post(this.API_URL, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        },
        withCredentials: false,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });
      
      console.log('Story created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating story:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Server response:', error.response.data);
        throw new Error(error.response.data.details || error.response.data.error || 'Failed to create story');
      }
      throw error;
    }
  }

  public async updateStory(id: string, storyData: Partial<Story>, file?: File | FileBuffer): Promise<Story> {
    try {
      const formData = new FormData();

      // Validate and normalize language if present
      const normalizedData = {
        ...storyData,
        ...(storyData.language && { language: this.validateLanguage(storyData.language) })
      };

      // Add story data
      Object.entries(normalizedData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, typeof value === 'boolean' ? value.toString() : value.toString());
        }
      });

      // Add PDF file if provided
      if (file) {
        if (file instanceof File) {
          formData.append('pdf', file);
        } else {
          const blob = new Blob([file.buffer], { type: file.mimetype });
          formData.append('pdf', blob, file.originalname);
        }
      }

      const response = await axios.put(`${this.API_URL}/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log('Story updated successfully:', response.data._id);
      return response.data;
    } catch (error) {
      console.error('Error updating story:', error);
      throw error;
    }
  }

  public async getStories(filters: Partial<StoryFilters> = {}): Promise<Story[]> {
    try {
      // Validate and normalize language if present
      const normalizedFilters = {
        ...filters,
        ...(filters.language && { language: this.validateLanguage(filters.language) })
      };

      const response = await axios.get(this.API_URL, { params: normalizedFilters });
      console.log('Stories fetched successfully, count:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Error fetching stories:', error);
      throw error;
    }
  }

  public async getStoryById(id: string): Promise<Story> {
    try {
      const response = await axios.get(`${this.API_URL}/${id}`);
      console.log('Story fetched successfully:', response.data._id);
      return response.data;
    } catch (error) {
      console.error('Error fetching story:', error);
      throw error;
    }
  }

  public async deleteStory(id: string): Promise<void> {
    try {
      await axios.delete(`${this.API_URL}/${id}`);
      console.log('Story deleted successfully:', id);
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  }

  public async searchStories(searchTerm: string): Promise<Story[]> {
    try {
      const response = await axios.get(`${this.API_URL}/search`, {
        params: { searchTerm }
      });
      console.log('Stories found:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('Error searching stories:', error);
      throw error;
    }
  }

  public getStoryPdfUrl(id: string): string {
    return `${this.API_URL}/${id}/pdf`;
  }

  public async downloadStoryPdf(id: string): Promise<Blob> {
    try {
      const response = await axios.get(`${this.API_URL}/${id}/pdf`, {
        responseType: 'blob'
      });
      console.log('PDF downloaded successfully');
      return response.data;
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  }

  public async getPDFContent(id: string): Promise<Buffer> {
    try {
      const response = await axios.get(`${this.API_URL}/${id}/pdf`, {
        responseType: 'arraybuffer'
      });
      return Buffer.from(response.data);
    } catch (error) {
      console.error('Error getting PDF content:', error);
      throw error;
    }
  }
}

export const unifiedStoryService = UnifiedStoryService.getInstance(); 