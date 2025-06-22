import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../../contexts/AuthContext';
import { gradeService, type ClassGrade } from '../../services/gradeService';
import { studentService, type Student } from '../../services/studentService';
import { readingSessionService, type ReadingSession } from '../../services/readingSessionService';
import { UnifiedStoryService } from '../../services/UnifiedStoryService';
import type { Story } from '../../types/Story';
import { useNavigate } from 'react-router-dom';
import { 
  PlayIcon, 
  PencilIcon, 
  TrashIcon,
} from '@heroicons/react/24/outline';

const Reading: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'sessions' | 'stories'>('sessions');
  const [grades, setGrades] = useState<ClassGrade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [readingSessions, setReadingSessions] = useState<ReadingSession[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(true);
  const [storiesError, setStoriesError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    if (!currentUser?.uid) return;
    try {
      const sessions = await readingSessionService.getTeacherSessions(currentUser.uid);
      setReadingSessions(sessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  }, [currentUser?.uid]);

  const loadStories = useCallback(async () => {
    try {
      setStoriesLoading(true);
      setStoriesError(null);
      const fetchedStories = await UnifiedStoryService.getInstance().getStories({}); // Fetch all stories initially
      // Map IStory[] to Story[] to ensure type compatibility
      setStories(fetchedStories.map(story => ({
        ...story,
        _id: story._id?.toString(),
        createdBy: story.createdBy?.toString?.() ?? story.createdBy,
        language: story.language as 'english' | 'tagalog',
      })));
    } catch (error) {
      console.error('Error loading stories:', error);
      setStoriesError('Failed to load stories. Please try again.');
      Swal.fire('Error', 'Failed to load stories', 'error');
    } finally {
      setStoriesLoading(false);
    }
  }, []);

  const loadGrades = useCallback(async () => {
    try {
      const gradesData = await gradeService.getActiveGrades();
      setGrades(gradesData);
    } catch (error) {
      console.error('Error loading grades:', error);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    if (!currentUser?.uid) return;
    try {
      const fetchedStudents = await studentService.getStudents(currentUser.uid);
      setStudents(fetchedStudents);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  }, [currentUser?.uid]);

  // Load grades, students, and sessions on component mount
  useEffect(() => {
    if (currentUser?.uid) {
      loadGrades();
      loadStudents();
      loadSessions();
      loadStories();
    }
  }, [currentUser?.uid, loadGrades, loadStudents, loadSessions, loadStories]);

  const loadStudentsByGrade = async (gradeId: string) => {
    try {
      const studentsInGrade = await gradeService.getStudentsInGrade(gradeId);
      const studentIds = studentsInGrade.map(s => s.studentId);
      const gradeStudents = students.filter(student => studentIds.includes(student.id || ''));
      return gradeStudents;
    } catch (error) {
      console.error('Error loading students for grade:', error);
      return [];
    }
  };

  const handleScheduleSession = async () => {
    try {
      const { value: formValues } = await Swal.fire({
        title: 'Reading Session',
        html: `
          <div class="text-left p-4">
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Session Title</label>
              <input 
                id="session-title" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="e.g., Group A - Level 2 Reading"
              >
            </div>
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Select Story</label>
              <select 
                id="session-story" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a story</option>
                ${stories.map(story => `
                  <option value="${story.title}" data-url="${story.pdfUrl}">${story.title}</option>
                `).join('')}
              </select>
            </div>
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Class/Grade</label>
              <select 
                id="session-grade" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a class</option>
                ${grades.map(grade => `
                  <option value="${grade.id}">${grade.name}</option>
                `).join('')}
              </select>
            </div>
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Students</label>
              <div id="student-list" class="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                <p class="text-sm text-gray-500 italic">Select a class to view students</p>
              </div>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Start Session',
        cancelButtonText: 'Cancel',
        focusConfirm: false,
        backdrop: 'rgba(0,0,0,0.6)',
        customClass: {
          popup: 'rounded-lg shadow-xl',
          title: 'text-xl font-semibold text-gray-900',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md',
          cancelButton: 'bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-md border border-gray-300'
        },
        didOpen: () => {
          const gradeSelect = document.getElementById('session-grade') as HTMLSelectElement;
          if (gradeSelect) {
            gradeSelect.addEventListener('change', async (e) => {
              const gradeId = (e.target as HTMLSelectElement).value;
              if (gradeId) {
                const gradeStudents = await loadStudentsByGrade(gradeId);
                const studentList = document.getElementById('student-list');
                if (studentList) {
                  studentList.innerHTML = gradeStudents.length > 0 
                    ? gradeStudents.map(student => `
                        <div class="flex items-center space-x-2 mb-2">
                          <input type="checkbox" id="student-${student.id}" value="${student.name}" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                          <label for="student-${student.id}" class="text-sm text-gray-700">${student.name}</label>
                        </div>
                      `).join('')
                    : '<p class="text-sm text-gray-500 italic">No students in this class</p>';
                }
              } else {
                const studentList = document.getElementById('student-list');
                if (studentList) {
                  studentList.innerHTML = '<p class="text-sm text-gray-500 italic">Select a class to view students</p>';
                }
              }
            });
          }
        },
        preConfirm: () => {
          const title = (document.getElementById('session-title') as HTMLInputElement).value;
          const storySelect = document.getElementById('session-story') as HTMLSelectElement;
          const book = storySelect.value;
          const storyUrl = storySelect.options[storySelect.selectedIndex].getAttribute('data-url') || '';
          const gradeId = (document.getElementById('session-grade') as HTMLSelectElement).value;
          
          const selectedStudents = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
            .map((checkbox: Element) => (checkbox as HTMLInputElement).value);

          if (!title || !book || !gradeId || selectedStudents.length === 0) {
            Swal.showValidationMessage('Please fill in all required fields and select at least one student');
            return false;
          }

          return {
            title,
            book,
            storyUrl,
            gradeId,
            students: selectedStudents,
            status: 'pending' as const,
            teacherId: currentUser?.uid
          };
        }
      });

      if (formValues && currentUser?.uid) {
        try {
          const sessionData = {
            ...formValues,
            teacherId: currentUser.uid,
            status: 'pending' as const
          };

          const sessionId = await readingSessionService.createSession(sessionData);
          const newSession = {
            id: sessionId,
            ...sessionData,
            createdAt: new Date()
          };
          
          setReadingSessions(prev => [...prev, newSession]);
          
          await Swal.fire({
            icon: 'success',
            title: 'Session Created!',
            text: 'The reading session has been created successfully.',
            timer: 2000,
            showConfirmButton: false
          });
        } catch (error) {
          console.error('Error creating session:', error);
          await Swal.fire({
            icon: 'error',
            title: 'Permission Error',
            text: 'You may not have permission to create reading sessions. Please check your role and try again.',
          });
        }
      }
    } catch (error) {
      console.error('Error in handleScheduleSession:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An unexpected error occurred. Please try again.',
      });
    }
  };

  const handleEditSession = async (session: ReadingSession) => {
    const { value: formValues } = await Swal.fire({
      title: 'Edit Reading Session',
      html: `
        <div class="text-left p-4">
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Session Title</label>
            <input 
              id="session-title" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              value="${session.title}"
            >
          </div>
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Select Story</label>
            <select 
              id="session-story" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a story</option>
              ${stories.map(story => `
                <option value="${story.title}" 
                        data-url="${story.pdfUrl}"
                        ${story.title === session.book ? 'selected' : ''}>
                  ${story.title}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Class/Grade</label>
            <select 
              id="session-grade" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a class</option>
              ${grades.map(grade => `
                <option value="${grade.id}" ${grade.id === session.gradeId ? 'selected' : ''}>${grade.name}</option>
              `).join('')}
            </select>
          </div>
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Students</label>
            <div id="student-list" class="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
              <p class="text-sm text-gray-500 italic">Select a class to view students</p>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Save Changes',
      cancelButtonText: 'Cancel',
      focusConfirm: false,
      backdrop: 'rgba(0,0,0,0.6)',
      customClass: {
        popup: 'rounded-lg shadow-xl',
        title: 'text-xl font-semibold text-gray-900',
        confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md',
        cancelButton: 'bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-md border border-gray-300'
      },
      didOpen: () => {
        const gradeSelect = document.getElementById('session-grade') as HTMLSelectElement;
        if (gradeSelect) {
          // Load initial students
          const loadInitialStudents = async () => {
            const gradeId = session.gradeId;
            if (gradeId) {
              const gradeStudents = await loadStudentsByGrade(gradeId);
              const studentList = document.getElementById('student-list');
              if (studentList) {
                studentList.innerHTML = gradeStudents.length > 0 
                  ? gradeStudents.map(student => `
                      <div class="flex items-center space-x-2 mb-2">
                        <input type="checkbox" id="student-${student.id}" value="${student.name}" 
                          class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          ${session.students.includes(student.name) ? 'checked' : ''}>
                        <label for="student-${student.id}" class="text-sm text-gray-700">${student.name}</label>
                      </div>
                    `).join('')
                  : '<p class="text-sm text-gray-500 italic">No students in this class</p>';
              }
            }
          };
          loadInitialStudents();

          // Handle grade change
          gradeSelect.addEventListener('change', async (e) => {
            const gradeId = (e.target as HTMLSelectElement).value;
            if (gradeId) {
              const gradeStudents = await loadStudentsByGrade(gradeId);
              const studentList = document.getElementById('student-list');
              if (studentList) {
                studentList.innerHTML = gradeStudents.length > 0 
                  ? gradeStudents.map(student => `
                      <div class="flex items-center space-x-2 mb-2">
                        <input type="checkbox" id="student-${student.id}" value="${student.name}" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                        <label for="student-${student.id}" class="text-sm text-gray-700">${student.name}</label>
                      </div>
                    `).join('')
                  : '<p class="text-sm text-gray-500 italic">No students in this class</p>';
              }
            } else {
              const studentList = document.getElementById('student-list');
              if (studentList) {
                studentList.innerHTML = '<p class="text-sm text-gray-500 italic">Select a class to view students</p>';
              }
            }
          });
        }
      },
      preConfirm: () => {
        const title = (document.getElementById('session-title') as HTMLInputElement).value;
        const storySelect = document.getElementById('session-story') as HTMLSelectElement;
        const book = storySelect.value;
        const storyUrl = storySelect.options[storySelect.selectedIndex].getAttribute('data-url') || '';
        const gradeId = (document.getElementById('session-grade') as HTMLSelectElement).value;
        
        const selectedStudents = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
          .map((checkbox: Element) => (checkbox as HTMLInputElement).value);

        if (!title || !book || !gradeId || selectedStudents.length === 0) {
          Swal.showValidationMessage('Please fill in all required fields and select at least one student');
          return false;
        }

        return {
          title,
          book,
          storyUrl,
          gradeId,
          students: selectedStudents,
          status: session.status,
          teacherId: currentUser?.uid
        };
      }
    });

    if (formValues && session.id) {
      try {
        await readingSessionService.updateSession(session.id, formValues);
        setReadingSessions(prev => 
          prev.map(s => s.id === session.id ? { ...s, ...formValues } : s)
        );
        
        await Swal.fire({
          icon: 'success',
          title: 'Session Updated!',
          text: 'The reading session has been updated successfully.',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error updating session:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to update the reading session. Please try again.',
        });
      }
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    const result = await Swal.fire({
      title: 'Delete Session',
      text: 'Are you sure you want to delete this session? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
    });

    if (result.isConfirmed && sessionId) {
      try {
        await readingSessionService.deleteSession(sessionId);
        setReadingSessions(prev => prev.filter(s => s.id !== sessionId));
        
        await Swal.fire({
          icon: 'success',
          title: 'Session Deleted!',
          text: 'The reading session has been deleted successfully.',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error deleting session:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete the reading session. Please try again.',
        });
      }
    }
  };

  const handleProceedSession = async (sessionId: string) => {
    try {
      await readingSessionService.updateSessionStatus(sessionId, 'in-progress');
      navigate(`/teacher/reading-session/${sessionId}`);
    } catch (error) {
      console.error('Error proceeding to session:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to start the reading session. Please try again.',
      });
    }
  };

  const handleViewStoryDetails = async (story: Story) => {
    await Swal.fire({
      title: story.title,
      html: `
        <div class="text-left">
        <div class="mb-4">
          <h3 class="text-sm font-semibold text-gray-600 mb-1">Language</h3>
          <p class="text-gray-800">${story.language || 'Not specified'}</p>
        </div>
          <div class="mb-4">
            <h3 class="text-sm font-semibold text-gray-600 mb-1">Description</h3>
            <p class="text-gray-800">${story.description || 'No description available'}</p>
          </div>
          <div class="mt-6">
            ${story.pdfUrl ? `
              <div class="space-y-3">
                <a href="${story.pdfUrl}" 
                   target="_blank" 
                   class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                   onclick="setTimeout(() => { window.close(); }, 1000);"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View PDF
                </a>
                <p class="text-xs text-gray-500 italic">
                  PDF may not be available. The story text content is available in the reading session.
                </p>
              </div>
            ` : '<p class="text-red-500">No PDF available</p>'}
          </div>
        </div>
      `,
      showCloseButton: true,
      showConfirmButton: false,
      width: '32rem',
      customClass: {
        container: 'story-details-modal',
        popup: 'rounded-lg shadow-xl',
        htmlContainer: 'p-6'
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-fluid px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Reading</h1>
            <p className="mt-1 text-sm text-gray-500">Manage reading sessions and explore stories</p>
        </div>
          <button
            onClick={handleScheduleSession}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center"
          >
            <i className="fas fa-plus mr-2"></i>
            Start New Session
          </button>
      </div>

      {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('sessions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'sessions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
              Active Sessions
          </button>
          <button
              onClick={() => setActiveTab('stories')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stories'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
              Stories
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'sessions' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Story</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                  {readingSessions.map((session) => (
                    <tr key={session.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{session.title}</div>
                        <div className="text-sm text-gray-500">
                          {session.createdAt ? new Date(session.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {session.students.join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{session.book}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          session.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : session.status === 'in-progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                        </span>
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                        {session.status === 'pending' && (
                          <button
                            onClick={() => session.id && handleProceedSession(session.id)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <PlayIcon className="h-4 w-4 mr-1.5" />
                            Proceed
                          </button>
                        )}
                        {session.status === 'in-progress' && (
                          <button
                            onClick={() => session.id && handleProceedSession(session.id)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors"
                          >
                            <PlayIcon className="h-4 w-4 mr-1.5" />
                            Continue
                          </button>
                        )}
                        <button
                          onClick={() => handleEditSession(session)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-yellow-600 hover:text-yellow-900 hover:bg-yellow-50 rounded-md transition-colors"
                        >
                          <PencilIcon className="h-4 w-4 mr-1.5" />
                          Edit
                        </button>
                      <button
                          onClick={() => session.id && handleDeleteSession(session.id)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors"
                      >
                          <TrashIcon className="h-4 w-4 mr-1.5" />
                          Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

        {activeTab === 'stories' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
            {storiesLoading ? (
              <div className="col-span-full text-center py-10">Loading stories...</div>
            ) : storiesError ? (
              <div className="col-span-full text-center py-10 text-red-500">{storiesError}</div>
            ) : stories.length === 0 ? (
              <div className="col-span-full text-center py-10 text-gray-500">No stories available.</div>
            ) : (
              stories.map((story) => (
  <div key={story._id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full">
    <div className="relative pb-[56.25%] bg-gray-200">
      {/* You might want to add a placeholder or actual cover image logic here if stories have one */}
      <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-lg">
        No Image
      </div>
    </div>
    <div className="p-4 flex-grow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium text-gray-900 line-clamp-1">{story.title}</h3>
      </div>
      <p className="text-sm text-gray-500 mb-4 line-clamp-2">
        {story.description || 'No description available'}
      </p>
      <div className="flex items-center justify-between mt-auto">
        <button 
          onClick={() => handleViewStoryDetails(story)}
          className="inline-flex items-center text-blue-600 hover:text-blue-900 text-sm font-medium"
        >
          <span>View Details</span>
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  </div>
))
            )}
        </div>
      )}
      </div>
    </div>
  );
};

export default Reading;