import React, { useEffect, useState } from 'react';
import * as StudentServiceModule from '../../services/studentService'; // Import as a namespace
import { gradeService, type ClassGrade } from '../../services/gradeService';

const Students: React.FC = () => {
  const [students, setStudents] = useState<StudentServiceModule.Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grades, setGrades] = useState<ClassGrade[]>([]);
  const [selectedGradeId, setSelectedGradeId] = useState<string | 'all' | ''>('all');

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const allGrades = await gradeService.getAllClassGrades();
        setGrades(allGrades);

        if (selectedGradeId === 'all') {
          const allStudents = await StudentServiceModule.studentService.getAllStudents();
          setStudents(allStudents);
        } else if (selectedGradeId) {
          const studentsInGrade = await gradeService.getStudentsByGrade(selectedGradeId);
          setStudents(studentsInGrade);
        }
      } catch (err) {
        setError('Failed to load data.');
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [selectedGradeId]);

  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGradeId(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 py-4">
        <div className="bg-white rounded-lg shadow h-[calc(100vh-6rem)] flex flex-col">
          <div className="px-3 py-3 border-b border-gray-200 sm:px-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Grades and Sections</h3>
            <div className="flex items-center space-x-4">
              <select
                value={selectedGradeId}
                onChange={handleGradeChange}
                className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                disabled={loading}
              >
                <option value="all">All Grades</option>
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))}
              </select>
              <span className="px-2 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-full">
                {students.length} students
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="text-gray-500 p-8">Loading students...</div>
            ) : error ? (
              <div className="text-red-500 p-8">{error}</div>
            ) : students.length > 0 ? (
              <table className="min-w-full mt-2 bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-blue-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{student.name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{student.id}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{student.grade}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{student.status}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{student.performance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-gray-500 p-8">No students found for this grade/section.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Students; 