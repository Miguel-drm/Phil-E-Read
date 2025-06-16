import React, { useEffect, useState } from 'react';
import { getAllTeachers, updateTeacherProfile, deleteTeacher } from '../../services/authService';

interface Teacher {
  id: string;
  displayName?: string;
  email?: string;
}

const Teachers: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editError, setEditError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTeachers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllTeachers();
      setTeachers(data);
    } catch (err) {
      setError('Failed to load teachers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleEdit = (teacher: Teacher) => {
    setEditingId(teacher.id);
    setEditName(teacher.displayName || '');
    setEditError('');
  };

  const handleEditSave = async (teacherId: string) => {
    if (!editName.trim()) {
      setEditError('Name is required.');
      return;
    }
    if (editName.trim().length < 2) {
      setEditError('Name must be at least 2 characters.');
      return;
    }
    setActionLoading(true);
    try {
      await updateTeacherProfile(teacherId, { displayName: editName.trim() });
      setEditingId(null);
      setEditName('');
      setEditError('');
      await fetchTeachers();
      alert('Teacher updated successfully.');
    } catch (err) {
      setEditError('Failed to update teacher.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditName('');
    setEditError('');
  };

  const handleDelete = async (teacherId: string) => {
    if (!window.confirm('Are you sure you want to delete this teacher? This action cannot be undone.')) return;
    setActionLoading(true);
    try {
      await deleteTeacher(teacherId);
      await fetchTeachers();
      alert('Teacher deleted successfully.');
    } catch (err) {
      alert('Failed to delete teacher.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Teachers</h1>
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : teachers.length === 0 ? (
        <div className="text-gray-500">No teachers found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-blue-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingId === teacher.id ? (
                      <>
                        <input
                          type="text"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="border rounded px-2 py-1 text-sm w-40"
                          disabled={actionLoading}
                        />
                        {editError && <div className="text-xs text-red-500 mt-1">{editError}</div>}
                      </>
                    ) : (
                      teacher.displayName || '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{teacher.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingId === teacher.id ? (
                      <>
                        <button
                          onClick={() => handleEditSave(teacher.id)}
                          className="mr-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                          disabled={actionLoading}
                        >
                          Save
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 text-xs"
                          disabled={actionLoading}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(teacher)}
                          className="mr-2 px-3 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-xs"
                          disabled={actionLoading}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(teacher.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                          disabled={actionLoading}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Teachers; 