import React, { useState, useEffect } from 'react';
import type { Story } from '../../services/storyService';
import { getStories, addStory, updateStory, deleteStory } from '../../services/storyService';
import Swal from 'sweetalert2';
import AddStoryModal from './AddStoryModal';

const StoriesManagement: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [filters, setFilters] = useState({
    language: ''
  });

  useEffect(() => {
    loadStories();
  }, [filters]);

  const loadStories = async () => {
    try {
      setLoading(true);
      const storiesData = await getStories(filters);
      setStories(storiesData);
    } catch (error) {
      console.error('Error loading stories:', error);
      Swal.fire('Error', 'Failed to load stories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStory = async (storyData: Omit<Story, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'isActive' | 'pdfUrl'>, file: File) => {
    try {
      await addStory({
        ...storyData,
        createdBy: 'admin',
      }, file);
      setShowAddModal(false);
      await loadStories();
      Swal.fire('Success', 'Story added successfully', 'success');
    } catch (error) {
      console.error('Error adding story:', error);
      Swal.fire('Error', 'Failed to add story', 'error');
    }
  };

  const handleEditStory = async (story: Story) => {
    try {
      if (!story.id) return;
      
      if (!story.title || !story.description || !story.language) {
        Swal.fire('Error', 'Please fill in all required fields', 'error');
        return;
      }

      await updateStory(story.id, {
        title: story.title,
        description: story.description,
        language: story.language
      });
      
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
        await deleteStory(id);
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

      {/* Filters - remove level filter, keep only language */}
      <div className="mb-6 flex gap-4">
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

      {/* Stories List */}
      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <div className="grid gap-6">
          {stories.length === 0 ? (
            <div className="text-center text-gray-500 py-10">No stories available.</div>
          ) : (
            stories.map((story) => (
              <div key={story.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{story.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Language: {story.language}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Description: {story.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingStory(story)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => story.id && handleDeleteStory(story.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-gray-600 line-clamp-3">PDF URL: <a href={story.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{story.pdfUrl}</a></p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Custom Add Story Modal */}
      <AddStoryModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddStory}
      />

      {/* Edit Story Modal */}
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

              {/* Add description field */}
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
                <label className="block text-sm font-medium text-gray-700">PDF URL</label>
                <input
                  type="text"
                  value={editingStory.pdfUrl}
                  readOnly
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">To change PDF, delete story and re-add with new PDF.</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Language</label>
                <select
                  value={editingStory.language}
                  onChange={(e) => setEditingStory({ ...editingStory, language: e.target.value as 'english' | 'tagalog' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="english">English</option>
                  <option value="tagalog">Tagalog</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-4">
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
      )}
    </div>
  );
};

export default StoriesManagement;