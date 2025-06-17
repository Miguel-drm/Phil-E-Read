import React, { useEffect, useState } from 'react';
import { getAllTeachers, updateTeacherProfile, deleteTeacher } from '../../services/authService';
import EditTeacherDetailsModal from '../../components/admin/EditTeacherDetailsModal';

interface Teacher {
  id: string;
  displayName?: string;
  email?: string;
  phoneNumber?: string;
  school?: string;
  gradeLevel?: string;
}

const Teachers: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

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
    setSelectedTeacher(teacher);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTeacher(null);
  };

  const handleSaveSuccess = async () => {
    await fetchTeachers();
    handleModalClose();
  };

  const handleDelete = async (teacherId: string) => {
    if (!window.confirm('Are you sure you want to delete this teacher? This action cannot be undone.')) return;
    setActionLoading(true);
    try {
      await deleteTeacher(teacherId);
      setTeachers(prev => prev.filter(t => t.id !== teacherId));
      alert('Teacher deleted successfully.');
    } catch (err) {
      alert('Failed to delete teacher.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-8">
     
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : teachers.length === 0 ? (
        <div className="text-gray-500">No teachers found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">School</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Grade Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">Phone Number</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-blue-50 border-b border-gray-200 last:border-b-0">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">
                    {teacher.displayName || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">{teacher.email || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">{teacher.school || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">{teacher.gradeLevel || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-r border-gray-200">{teacher.phoneNumber || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedTeacher && (
        <EditTeacherDetailsModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          teacher={selectedTeacher}
          onSaveSuccess={handleSaveSuccess}
        />
      )}
    </div>
  );
};

export default Teachers; 