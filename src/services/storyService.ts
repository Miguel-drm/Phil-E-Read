import type { Story } from '../types/Story';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/stories';

class StoryService {
  async createStory(formData: FormData): Promise<Story> {
    try {
      const response = await axios.post(API_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error in createStory:', error);
      throw error;
    }
  }

  async getStoryById(id: string): Promise<Story> {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  }

  async getStories(options: { grade?: string; searchTerm?: string } = {}): Promise<Story[]> {
    const response = await axios.get(API_URL, { params: options });
    return response.data;
  }

  async updateStory(id: string, data: FormData): Promise<Story> {
    const response = await axios.put(`${API_URL}/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  async deleteStory(id: string): Promise<void> {
    await axios.delete(`${API_URL}/${id}`);
  }

  getStoryPdfUrl(id: string): string {
    return `${API_URL}/${id}/pdf`;
  }
}

export const storyService = new StoryService(); 