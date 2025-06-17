import { useState, useEffect } from 'react';
import { storyService } from '../../services/storyService';
import Swal from 'sweetalert2';
import type { Story } from '../../types/Story';
import AddStoryModal from './AddStoryModal';
import { useAuth } from '../../contexts/AuthContext';

interface StoryFilters {
  grade?: string;
  language?: string;
  searchTerm?: string;
}

export default function StoriesManagement() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [filters, setFilters] = useState<StoryFilters>({
    language: '',
    grade: ''
  });
  const { currentUser } = useAuth();

  useEffect(() => {
    loadStories();
  }, [filters]); // Reload when filters change

  const loadStories = async () => {
    try {
      setLoading(true);
      const storiesData = await storyService.getStories({
        grade: filters.grade,
        searchTerm: filters.language ? `language:${filters.language}` : undefined
      });
      setStories(storiesData);
    } catch (error) {
      console.error('Error loading stories:', error);
      Swal.fire('Error', 'Failed to load stories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStory = async (storyData: Partial<Story>, file: File) => {
    try {
      if (!currentUser?.uid) {
        Swal.fire('Error', 'You must be logged in to add a story', 'error');
        return;
      }

      // Validate required fields
      if (!storyData.title?.trim() || !storyData.description?.trim() || !storyData.grade) {
        Swal.fire('Error', 'Please fill in all required fields', 'error');
        return;
      }

      // Validate file
      if (!file || file.type !== 'application/pdf') {
        Swal.fire('Error', 'Please upload a valid PDF file', 'error');
        return;
      }

      const formData = new FormData();
      formData.append('title', storyData.title.trim());
      formData.append('description', storyData.description.trim());
      formData.append('grade', storyData.grade);
      formData.append('pdf', file);
      
      if (storyData.language) {
        formData.append('language', storyData.language);
      }
      if (storyData.readingLevel) {
        formData.append('readingLevel', storyData.readingLevel);
      }
      if (storyData.categories?.length) {
        formData.append('categories', JSON.stringify(storyData.categories));
      }

      const result = await storyService.createStory(formData);
      if (result) {
        setShowAddModal(false);
        await loadStories();
        Swal.fire('Success', 'Story added successfully', 'success');
      }
    } catch (error) {
      console.error('Error adding story:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add story';
      Swal.fire('Error', errorMessage, 'error');
    }
  };

  const handleEditStory = async (story: Story) => {
    try {
      if (!story._id) return;
      
      if (!story.title || !story.description || !story.grade) {
        Swal.fire('Error', 'Please fill in all required fields', 'error');
        return;
      }

      const formData = new FormData();
      formData.append('title', story.title);
      formData.append('description', story.description);
      formData.append('grade', story.grade);
      if (story.language) {
        formData.append('language', story.language);
      }
      if (story.readingLevel) {
        formData.append('readingLevel', story.readingLevel);
      }
      if (story.categories) {
        formData.append('categories', JSON.stringify(story.categories));
      }

      await storyService.updateStory(story._id, formData);
      await loadStories();
      setEditingStory(null);
      Swal.fire('Success', 'Story updated successfully', 'success');
    } catch (error) {
      console.error('Error updating story:', error);
      Swal.fire('Error', 'Failed to update story', 'error');
    }
  };

  const handleDeleteStory = async (id: string) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        await storyService.deleteStory(id);
        await loadStories();
        Swal.fire('Deleted!', 'Story has been deleted.', 'success');
      }
    } catch (error) {
      console.error('Error deleting story:', error);
      Swal.fire('Error', 'Failed to delete story', 'error');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Stories Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add New Story
        </button>
      </div>

      <div className="mb-6 flex gap-4">
        <select
          value={filters.grade}
          onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
          className="border rounded-lg px-4 py-2"
        >
          <option value="">All Grades</option>
          <option value="1">Grade 1</option>
          <option value="2">Grade 2</option>
          <option value="3">Grade 3</option>
        </select>

        <select
          value={filters.language}
          onChange={(e) => setFilters({ ...filters, language: e.target.value })}
          className="border rounded-lg px-4 py-2"
        >
          <option value="">All Languages</option>
          <option value="english">English</option>
          <option value="tagalog">Tagalog</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <div className="grid gap-6">
          {stories.length === 0 ? (
            <div className="text-center text-gray-500 py-10">No stories available.</div>
          ) : (
            stories.map((story) => (
              <div key={story._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{story.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Grade: {story.grade}
                    </p>
                    {story.language && (
                      <p className="text-sm text-gray-500 mt-1">
                        Language: {story.language}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Description: {story.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingStory(story)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => story._id && handleDeleteStory(story._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <AddStoryModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddStory}
      />

      {editingStory && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">Edit Story</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={editingStory.title}
                  onChange={(e) => setEditingStory({ ...editingStory, title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={editingStory.description}
                  onChange={(e) => setEditingStory({ ...editingStory, description: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Grade</label>
                <select
                  value={editingStory.grade}
                  onChange={(e) => setEditingStory({ ...editingStory, grade: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="1">Grade 1</option>
                  <option value="2">Grade 2</option>
                  <option value="3">Grade 3</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Language</label>
                <select
                  value={editingStory.language}
                  onChange={(e) => setEditingStory({ ...editingStory, language: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="english">English</option>
                  <option value="tagalog">Tagalog</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setEditingStory(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleEditStory(editingStory)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}