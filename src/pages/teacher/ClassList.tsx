import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { studentService, type Student, type ImportedStudent } from '../../services/studentService';
import { gradeService, type ClassGrade } from '../../services/gradeService';
import * as XLSX from 'xlsx';
import { showInfo, showError, showSuccess, showConfirmation } from '../../services/alertService';
import Swal from 'sweetalert2';

const ClassList: React.FC = () => {
  const { currentUser, userRole, isProfileComplete } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [isImporting, setIsImporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [importedStudents, setImportedStudents] = useState<ImportedStudent[]>([]);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [classStats, setClassStats] = useState({
    totalStudents: 0,
    averageAttendance: 0,
    averageReadingLevel: 0,
    excellentPerformers: 0
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [grades, setGrades] = useState<ClassGrade[]>([]);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [isCreateGradeModalOpen, setIsCreateGradeModalOpen] = useState(false);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [deletingGradeId, setDeletingGradeId] = useState<string | null>(null);
  const [loadingStudentId, setLoadingStudentId] = useState<string | null>(null);
  const [loadingViewGradeId, setLoadingViewGradeId] = useState<string | null>(null);
  const [loadingAddStudentToGradeId, setLoadingAddStudentToGradeId] = useState<string | null>(null);
  const [loadingEditGradeId, setLoadingEditGradeId] = useState<string | null>(null);
  const [deletingAllStudents, setDeletingAllStudents] = useState(false);
  const [isCreatingGrade, setIsCreatingGrade] = useState(false);
  const [isAddingStudentToGrade, setIsAddingStudentToGrade] = useState(false);
  const [isDeletingSelectedGrades, setIsDeletingSelectedGrades] = useState(false);

  // Helper function to check if the current user has management permissions
  const canManage = (userRole === 'teacher' || userRole === 'admin') && isProfileComplete;

  // Load students on component mount
  useEffect(() => {
    if (currentUser?.uid) {
      loadStudents();
      loadClassStatistics();
    }
  }, [currentUser?.uid]);

  // Filter students when search query or filter changes
  useEffect(() => {
    filterStudents();
  }, [students, searchQuery, selectedFilter, sortBy]);

  const loadStudents = async () => {
    if (!currentUser?.uid) return;
    try {
      setIsLoading(true);
      const fetchedStudents = await studentService.getStudents(currentUser.uid);
      setStudents(fetchedStudents);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadClassStatistics = async () => {
    if (!currentUser?.uid) return;
    
    try {
      const stats = await studentService.getClassStatistics(currentUser.uid);
      setClassStats(stats);
    } catch (error) {
      console.error('Error loading class statistics:', error);
    }
  };

  const filterStudents = () => {
    // Only show students if a class is selected
    if (!selectedGrade || selectedGrade === 'all') {
      setFilteredStudents([]);
      return;
    }
    // Get the selected grade object
    const gradeObj = grades.find(g => g.id === selectedGrade);
    if (!gradeObj) {
      setFilteredStudents([]);
      return;
    }
    // Use the last loaded studentsInGrade from handleGradeSelect if available
    // Otherwise, fallback to filtering by grade name (for safety)
    let filtered = filteredStudents.length > 0 ? [...filteredStudents] : students.filter(student => String(student.grade) === gradeObj.name);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(student => {
        const matchesName = student.name.toLowerCase().includes(query);
        const matchesGrade = String(student.grade).toLowerCase().includes(query);
        const matchesPerformance = student.performance?.toLowerCase().includes(query) || false;
        return matchesName || matchesGrade || matchesPerformance;
      });
    }
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(student => student.performance === selectedFilter);
    }
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'readingLevel-desc':
          return String(b.readingLevel).localeCompare(String(a.readingLevel));
        case 'readingLevel-asc':
          return String(a.readingLevel).localeCompare(String(b.readingLevel));
        case 'attendance-desc':
          return b.attendance - a.attendance;
        case 'attendance-asc':
          return a.attendance - b.attendance;
        case 'performance':
          return a.performance.localeCompare(b.performance);
        default:
          return 0;
      }
    });
    setFilteredStudents(filtered);
  };

  // Add useEffect to monitor searchQuery changes
  useEffect(() => {
    if (students.length > 0) {
      console.log('Search query changed:', searchQuery);
      filterStudents();
    }
  }, [searchQuery, selectedFilter, sortBy, students]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];

    if (!allowedTypes.includes(file.type)) {
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    setIsImporting(true);

    try {
      const data = await readExcelFile(file);
      setImportedStudents(data);
      setShowImportPreview(true);
    } catch (error) {
    } finally {
      setIsImporting(false);
    }
  };

  const readExcelFile = (file: File): Promise<ImportedStudent[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          const students = jsonData.map((row: any) => ({
            name: row.Name || row.name || '',
            grade: row.Grade || row.grade || '',
            readingLevel: row.ReadingLevel || row.readingLevel || '',
            // parentId and parentName can be added here if available in import
          }));
          resolve(students);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  };

  const handleImportStudents = async () => {
    if (!currentUser?.uid) return;
    if (!selectedGrade || selectedGrade === 'all') {
      await Swal.fire({
        icon: 'warning',
        title: 'No Class Selected',
        text: 'Please select a class before importing students.'
      });
      return;
    }
    // Get the selected grade object
    const gradeObj = grades.find(g => g.id === selectedGrade);
    if (!gradeObj) {
      await Swal.fire({
        icon: 'warning',
        title: 'Invalid Class',
        text: 'The selected class could not be found.'
      });
      return;
    }
    // Import students to main collection and add to selected class subcollection
    await studentService.importStudents(
      importedStudents.map(s => ({ ...s, grade: gradeObj.name })),
      currentUser.uid
    );
    // Add each imported student to the selected class subcollection
    // (Find the student in the main collection by name and grade)
    const allStudents = await studentService.getStudents(currentUser.uid);
    for (const imported of importedStudents) {
      const match = allStudents.find(s => s.name === imported.name && String(s.grade) === String(gradeObj.name));
      if (match && match.id) {
        await gradeService.addStudentToGrade(selectedGrade, {
          studentId: match.id,
          name: match.name
        });
      }
    }
    // Reload students and statistics
    await loadStudents();
    await loadClassStatistics();
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancelImport = () => {
    setShowImportPreview(false);
    setImportedStudents([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    // No need to call showInfo here, as it's not used in the new implementation
  };

  const handleAddStudent = async () => {
    // No need to call showInfo here, as it's not used in the new implementation
  };

  const handleEditStudent = async (studentId: string) => {
    setLoadingStudentId(studentId);
    try {
      // No need to call showInfo here, as it's not used in the new implementation
    } finally {
      setLoadingStudentId(null);
    }
  };

  const handleViewProfile = async (studentId: string) => {
    setLoadingStudentId(studentId);
    try {
      // No need to call showInfo here, as it's not used in the new implementation
    } finally {
      setLoadingStudentId(null);
    }
  };

  const handleContactParent = (studentId: string, parentEmail: string) => {
    // No need to call showInfo here, as it's not used in the new implementation
  };

  const handleExportStudentData = async (studentId: string, studentName: string) => {
    // No need to call showInfo here, as it's not used in the new implementation
  };

  const handleMarkAttendance = async (studentId: string, studentName: string) => {
    // No need to call showInfo here, as it's not used in the new implementation
  };

  const handleViewHistory = async (studentId: string, studentName: string) => {
    // No need to call showInfo here, as it's not used in the new implementation
  };

  const handleDeleteAllStudents = async () => {
    const result = await showConfirmation(
      'Delete All Students',
      'Are you sure you want to delete ALL students? This action cannot be undone.',
      'Delete',
      'Cancel',
      'warning'
    );
    if (result.isConfirmed) {
      setDeletingAllStudents(true);
      try {
        const ids = students.map(s => s.id).filter((id): id is string => Boolean(id));
        if (ids.length > 0) {
          await studentService.batchDeleteStudents(ids);
        }
        await loadGrades();
        await Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'All students in the table have been deleted.',
          timer: 1800,
          showConfirmButton: false
        });
        // Clear filtered students and students arrays after deleting all
        setFilteredStudents([]);
        setStudents([]);
        await loadStudents(); // Re-fetch to ensure counts are correct if any were missed
        await loadClassStatistics();
      } catch (error) {
        showError('Failed to Delete', 'An error occurred while deleting students.');
      } finally {
        setDeletingAllStudents(false);
      }
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    const result = await showConfirmation(
      'Delete Student',
      `Are you sure you want to remove ${studentName} from the class? This action cannot be undone.`,
      'Delete',
      'Cancel',
      'warning'
    );
    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: 'Deleting Student',
          text: 'Please wait...', 
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        await studentService.deleteStudent(studentId);
        Swal.close();
        showSuccess('Student Removed', `${studentName} has been removed from the class.`);
        setFilteredStudents(prev => prev.filter(s => s.id !== studentId));
        setStudents(prev => prev.filter(s => s.id !== studentId));
        await loadGrades();
        await loadClassStatistics();
      } catch (error) {
        Swal.close();
        showError('Failed to Remove', 'An error occurred while removing the student.');
      }
    }
  };

  const handleExportClassList = async () => {
    // No need to call showInfo here, as it's not used in the new implementation
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'Excellent':
        return 'bg-green-100 text-green-800';
      case 'Good':
        return 'bg-blue-100 text-blue-800';
      case 'Needs Improvement':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Load grades and their student counts
  const loadGrades = async () => {
    setIsLoadingGrades(true);
    try {
      console.log('Starting to load grades...');
      const gradesData = await gradeService.getActiveGrades();
      console.log('Grades loaded successfully:', gradesData);
      // Get all students for the teacher
      let allStudents: Student[] = students;
      if (!allStudents.length && currentUser?.uid) {
        allStudents = await studentService.getStudents(currentUser.uid);
      }
      // Get student counts for each grade
      const gradesWithCounts = await Promise.all(gradesData.map(async (grade) => {
        try {
          if (grade.id) {
            const studentsInGrade = await gradeService.getStudentsInGrade(grade.id);
            // Only count students that exist in the main students collection
            const validStudentIds = allStudents.map(s => s.id);
            const filteredStudents = studentsInGrade.filter(sg => validStudentIds.includes(sg.studentId));
            return {
              ...grade,
              studentCount: filteredStudents.length
            };
          }
          return grade;
        } catch (error) {
          console.error(`Error getting students for grade ${grade.name}:`, error);
          return {
            ...grade,
            studentCount: 0
          };
        }
      }));
      console.log('Grades with counts:', gradesWithCounts);
      setGrades(gradesWithCounts);
      if (gradesWithCounts.length === 0) {
        console.log('No grades found in database');
      }
    } catch (error) {
      console.error('Error loading grades:', error);
      setGrades([]);
    } finally {
      setIsLoadingGrades(false);
    }
  };

  // Test Firestore connection
  const testFirestoreConnection = async () => {
    try {
      console.log('Testing Firestore connection...');
      const testData = await gradeService.getAllGrades();
      console.log('Firestore connection successful. Total grades:', testData.length);
      
      return true;
    } catch (error) {
      console.error('Firestore connection test failed:', error);
      return false;
    }
  };

  // Initialize sample grades if none exist
  const initializeSampleGrades = async () => {
    try {
      const sampleGrades = [
        {
          name: "Grade 1",
          description: "First grade students - ages 6-7",
          ageRange: "6-7 years",
          studentCount: 15,
          color: "blue",
          isActive: true,
          teacherId: "default"
        },
        {
          name: "Grade 2",
          description: "Second grade students - ages 7-8",
          ageRange: "7-8 years",
          studentCount: 18,
          color: "green",
          isActive: true,
          teacherId: "default"
        },
        {
          name: "Grade 3",
          description: "Third grade students - ages 8-9",
          ageRange: "8-9 years",
          studentCount: 16,
          color: "yellow",
          isActive: true,
          teacherId: "default"
        },
        {
          name: "Grade 4",
          description: "Fourth grade students - ages 9-10",
          ageRange: "9-10 years",
          studentCount: 14,
          color: "purple",
          isActive: true,
          teacherId: "default"
        },
        {
          name: "Grade 5",
          description: "Fifth grade students - ages 10-11",
          ageRange: "10-11 years",
          studentCount: 17,
          color: "red",
          isActive: true,
          teacherId: "default"
        },
        {
          name: "Grade 6",
          description: "Sixth grade students - ages 11-12",
          ageRange: "11-12 years",
          studentCount: 12,
          color: "gray",
          isActive: true,
          teacherId: "default"
        }
      ];

      for (const gradeData of sampleGrades) {
        await gradeService.createGrade(gradeData);
      }

      await loadGrades();
    } catch (error) {
      console.error('Error initializing grades:', error);
    }
  };

  // Handle grade selection
  const handleGradeSelect = async (gradeId: string) => {
    if (selectedGrade === gradeId) {
      // Do nothing if the same class is clicked
      return;
    }
    setSelectedGrade(gradeId);
    try {
      // Get students in the grade's subcollection
      const studentsInGrade = await gradeService.getStudentsInGrade(gradeId);
      const studentIds = studentsInGrade.map(s => s.studentId);
      // Only show students in the main collection that are also in the grade's subcollection
      const gradeStudents = students.filter(student => student.id && studentIds.includes(student.id));
      setFilteredStudents(gradeStudents);
    } catch (error) {
      console.error('Error loading students for grade:', error);
      showError('Error', 'Failed to load students for this grade');
    }
  };

  // View grade details
  const handleViewGrade = async (gradeId: string, gradeName: string) => {
    if (!currentUser?.uid) return;
    console.log(`[handleViewGrade] Setting loadingViewGradeId for grade: ${gradeId}`);
    setLoadingViewGradeId(gradeId);
    try {
      const grade = await gradeService.getGradeById(gradeId);
      const studentsInGradeSubcollection = await gradeService.getStudentsInGrade(gradeId);

      // Get the latest main student list
      const latestAllStudents = await studentService.getStudents(currentUser.uid);

      // Filter students from subcollection to only include those present in the main student list
      const validStudentsInGrade = studentsInGradeSubcollection.filter(sg => 
        latestAllStudents.some(s => s.id === sg.studentId)
      );

      if (grade) {
        await Swal.fire({
          title: gradeName,
          html: `
            <div class="text-left">
              <p class="mb-2"><strong>Description:</strong> ${grade.description}</p>
              <p class="mb-2"><strong>Age Range:</strong> ${grade.ageRange}</p>
              <p class="mb-4"><strong>Total Students:</strong> ${validStudentsInGrade.length}</p>
              
              <h3 class="text-lg font-semibold mb-2">Students in this Grade:</h3>
              <div class="max-h-60 overflow-y-auto">
                ${validStudentsInGrade.length > 0 ? `
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      ${validStudentsInGrade.map(student => `
                        <tr>
                          <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-900">${student.name}</td>
                          <td class="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onclick="window.removeStudent('${student.studentId}')"
                              class="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                ` : `
                  <p class="text-gray-500 italic">No students in this grade yet.</p>
                `}
              </div>
            </div>
          `,
          showConfirmButton: true,
          confirmButtonText: 'Close',
          showCancelButton: false,
          didOpen: () => {
            (window as any).removeStudent = async (studentId: string) => {
              try {
                await gradeService.removeStudentFromGrade(gradeId, studentId);
                showSuccess('Student Removed', 'The student has been removed from the grade.');
                handleViewGrade(gradeId, gradeName);
                await loadStudents();
                await loadGrades();
              } catch (error) {
                showError('Failed to Remove', 'An error occurred while removing the student.');
              }
            };
          },
          willClose: () => {
            delete (window as any).removeStudent;
          }
        });
      } else {
        showError('Grade Not Found', 'The selected grade could not be found.');
      }
    } catch (error) {
      console.error('Error viewing grade:', error);
      showError('Error', 'Failed to load grade details.');
    } finally {
      console.log(`[handleViewGrade] Clearing loadingViewGradeId for grade: ${gradeId}`);
      setLoadingViewGradeId(null);
    }
  };

  // Edit grade
  const handleEditGrade = async (gradeId: string, gradeName: string) => {
    console.log(`[handleEditGrade] Setting loadingEditGradeId for grade: ${gradeId}`);
    setLoadingEditGradeId(gradeId);
    try {
      // Placeholder for edit grade logic
      // In a real application, this would open a modal for editing or navigate to an edit page
      showInfo('Edit Grade', `Editing grade: ${gradeName} (ID: ${gradeId})`);
    } catch (error) {
      showError('Failed to Edit Grade', 'An error occurred while trying to edit the grade.');
    } finally {
      console.log(`[handleEditGrade] Clearing loadingEditGradeId for grade: ${gradeId}`);
      setLoadingEditGradeId(null);
    }
  };

  // Delete grade
  const handleDeleteGrade = async (gradeId: string, gradeName: string) => {
    const result = await showConfirmation(
      'Delete Grade',
      `Are you sure you want to delete the grade "${gradeName}"? This will remove the grade from your class list.`,
      'Delete',
      'Cancel',
      'warning'
    );
    if (result.isConfirmed) {
      try {
        await gradeService.deleteGrade(gradeId);
        showSuccess('Grade Deleted', `Grade "${gradeName}" has been deleted.`);
        await loadGrades();
      } catch (error: any) {
        const errorMsg = error && error.message ? error.message : 'An error occurred while deleting the grade.';
        showError('Failed to Delete', errorMsg);
      }
    }
  };

  // Add new grade
  const handleAddGrade = async () => {
    // Set loading state *after* preConfirm, just before API call
    try {
      const { value: formValues } = await Swal.fire({
        title: 'Create New Grade',
        html: `
          <div class="text-left p-4">
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
              <select id="grade-level" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Select grade level</option>
                <option value="Grade 1">Grade 1</option>
                <option value="Grade 2">Grade 2</option>
                <option value="Grade 3">Grade 3</option>
                <option value="Grade 4">Grade 4</option>
                <option value="Grade 5">Grade 5</option>
                <option value="Grade 6">Grade 6</option>
              </select>
            </div>
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Section</label>
              <input id="grade-section" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., Athena" />
            </div>
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea 
                id="grade-description" 
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                placeholder="e.g., First grade students"
                rows="2"
              ></textarea>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: isCreatingGrade ? '<span class="loader-spinner" style="display: inline-block; width: 16px; height: 16px; border: 2px solid #f3f3f3; border-top: 2px solid #ffffff; border-radius: 50%; animation: spin 1s linear infinite;"></span> Creating...' : 'Create Grade',
        cancelButtonText: 'Cancel',
        focusConfirm: false,
        allowOutsideClick: !isCreatingGrade,
        didOpen: () => {
          // SweetAlert2 handles enabling/disabling based on preConfirm and confirmButtonText.
          // No need to manually enable/disable here.
        },
        preConfirm: () => {
          const gradeLevel = (document.getElementById('grade-level') as HTMLSelectElement).value;
          const section = (document.getElementById('grade-section') as HTMLInputElement).value.trim();
          const description = (document.getElementById('grade-description') as HTMLTextAreaElement).value;

          if (!gradeLevel || !section || !description) {
            Swal.showValidationMessage('Please fill in all required fields');
            return false;
          }
          // Set loading state here, just before the form is confirmed and API call is expected
          setIsCreatingGrade(true);
          return { 
            name: `${gradeLevel} - ${section}`,
            description,
            ageRange: "6-12 years", // Default age range
            color: "blue" // Default color
          };
        }
      });

      if (formValues) {
        const gradeData = {
          name: formValues.name.trim(),
          description: formValues.description.trim(),
          ageRange: formValues.ageRange.trim(),
          studentCount: 0,
          color: formValues.color,
          isActive: true,
          teacherId: "default" // This should come from auth context
        };

        await gradeService.createGrade(gradeData);
        
        await Swal.fire({
          icon: 'success',
          title: 'Grade Created!',
          text: `Successfully created ${gradeData.name}`,
          timer: 2000,
          showConfirmButton: false
        });

        await loadGrades();
      }
    } catch (error) {
      console.error('Error creating grade:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to create grade. Please try again.'
      });
    } finally {
      setIsCreatingGrade(false);
    }
  };

  // Get color classes for grade cards
  const getGradeColorClasses = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'from-blue-50 to-indigo-50 border border-blue-200 text-blue-900',
      green: 'from-green-50 to-emerald-50 border border-green-200 text-green-900',
      yellow: 'from-yellow-50 to-orange-50 border border-yellow-200 text-yellow-900',
      purple: 'from-purple-50 to-pink-50 border border-purple-200 text-purple-900',
      red: 'from-red-50 to-rose-50 border border-red-200 text-red-900',
      gray: 'from-gray-50 to-slate-50 border border-gray-200 text-gray-900'
    };
    return colorMap[color] || colorMap.blue;
  };

  // Get badge color classes
  const getBadgeColorClasses = (color: string) => {
    const badgeMap: { [key: string]: string } = {
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      purple: 'bg-purple-100 text-purple-800',
      red: 'bg-red-100 text-red-800',
      gray: 'bg-gray-100 text-gray-800'
    };
    return badgeMap[color] || badgeMap.blue;
  };

  // Get text color classes
  const getTextColorClasses = (color: string) => {
    const textMap: { [key: string]: string } = {
      blue: 'text-blue-700',
      green: 'text-green-700',
      yellow: 'text-yellow-700',
      purple: 'text-purple-700',
      red: 'text-red-700',
      gray: 'text-gray-700'
    };
    return textMap[color] || textMap.blue;
  };

  // Load grades on component mount
  useEffect(() => {
    loadGrades();
  }, []);

  // Always select the first class if none is selected and grades are loaded
  useEffect(() => {
    if (grades.length > 0 && (!selectedGrade || selectedGrade === 'all')) {
      const firstGradeId = grades[0].id || '';
      setSelectedGrade(firstGradeId);
      // Load students for the first class
      (async () => {
        try {
          const studentsInGrade = await gradeService.getStudentsInGrade(firstGradeId);
          const studentIds = studentsInGrade.map(s => s.studentId);
          const gradeStudents = students.filter(student => student.id && studentIds.includes(student.id));
          setFilteredStudents(gradeStudents);
        } catch (error) {
          setFilteredStudents([]);
        }
      })();
    }
  }, [grades, students]);

  const handleGradeDotClick = (e: React.MouseEvent, gradeId: string) => {
    e.stopPropagation();
    setSelectedGrades(prev => {
      if (prev.includes(gradeId)) {
        return prev.filter(id => id !== gradeId);
      } else {
        return [...prev, gradeId];
      }
    });
  };

  const handleDeleteSelectedGrades = async () => {
    if (selectedGrades.length === 0) return;

    for (const gradeId of selectedGrades) {
      await gradeService.deleteGrade(gradeId);
    }
    
    setSelectedGrades([]);
    await loadGrades();
  };

  // Mock parent list (replace with real fetch in production)
  const mockParents = [
    { id: 'p1', name: 'John Smith', email: 'john.smith@email.com' },
    { id: 'p2', name: 'Jane Doe', email: 'jane.doe@email.com' },
    { id: 'p3', name: 'Michael Brown', email: 'michael.brown@email.com' },
    { id: 'p4', name: 'Emily Johnson', email: 'emily.johnson@email.com' },
  ];

  const handleLinkParent = async (studentId: string) => {
    // Fetch parents (replace with real fetch if available)
    const parents = mockParents;

    let search = '';
    let filteredParents = parents;

    const renderParentList = (searchValue: string) => {
      filteredParents = parents.filter(p =>
        p.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        p.email.toLowerCase().includes(searchValue.toLowerCase())
      );
      return `
        <input id="swal-parent-search" class="swal2-input" placeholder="Search parent..." value="${searchValue}" style="margin-bottom:8px;" />
        <div style="max-height:180px;overflow-y:auto;text-align:left;">
          ${filteredParents.map(p => `
            <div class="swal2-radio" style="margin-bottom:4px;">
              <input type="radio" name="parent" value="${p.id}" id="parent-${p.id}" />
              <label for="parent-${p.id}" style="margin-left:6px;cursor:pointer;">${p.name} <span style="color:#888;font-size:12px;">(${p.email})</span></label>
            </div>
          `).join('')}
        </div>
      `;
    };

    await Swal.fire({
      title: 'Link Parent',
      html: renderParentList(''),
      showCancelButton: true,
      confirmButtonText: 'Link',
      cancelButtonText: 'Cancel',
      focusConfirm: false,
      preConfirm: () => {
        const selected = (Swal.getPopup()?.querySelector('input[name="parent"]:checked') as HTMLInputElement)?.value;
        if (!selected) {
          Swal.showValidationMessage('Please select a parent');
          return false;
        }
        return selected;
      },
      didOpen: () => {
        const input = Swal.getPopup()?.querySelector('#swal-parent-search') as HTMLInputElement;
        if (input) {
          input.focus();
          input.addEventListener('input', (e) => {
            const value = (e.target as HTMLInputElement).value;
            Swal.update({ html: renderParentList(value) });
          });
        }
      },
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        const parent = parents.find(p => p.id === result.value);
        if (!parent) return;
        try {
          await studentService.updateStudent(studentId, {
            parentId: parent.id,
            parentName: parent.name,
          });
          showSuccess('Parent linked!', `${parent.name} is now linked to this student.`);
          await loadStudents();
        } catch (err) {
          showError('Failed to link parent', 'An error occurred while linking the parent.');
        }
      }
    });
  };

  const handleAddStudentsToGrade = async (gradeId: string, gradeName: string) => {
    setLoadingAddStudentToGradeId(gradeId); // Set loading for the icon here
    try {
      const { value: formValues } = await Swal.fire({
        title: `Add Student to ${gradeName}`,
        html: `
          <div class="text-left p-4">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input id="student-name" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., Juan Dela Cruz">
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Reading Level</label>
              <select id="student-reading-level" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Select reading level</option>
                <option value="Independent">Independent</option>
                <option value="Instructional">Instructional</option>
                <option value="Frustrational">Frustrational</option>
              </select>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Parent Name (optional)</label>
              <input id="student-parent-name" class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., Maria Dela Cruz">
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: isAddingStudentToGrade ? '<span class="loader-spinner" style="display: inline-block; width: 16px; height: 16px; border: 2px solid #f3f3f3; border-top: 2px solid #ffffff; border-radius: 50%; animation: spin 1s linear infinite;"></span> Adding...' : 'Add',
        cancelButtonText: 'Cancel',
        focusConfirm: false,
        allowOutsideClick: !isAddingStudentToGrade, // Disable outside clicks when loading
        didOpen: () => {
          // SweetAlert2 handles enabling/disabling based on preConfirm and confirmButtonText.
          // No need to manually enable/disable here.
        },
        preConfirm: () => {
          // This is for the modal's confirm button loading state
          setIsAddingStudentToGrade(true);

          const name = (document.getElementById('student-name') as HTMLInputElement).value.trim();
          const readingLevel = (document.getElementById('student-reading-level') as HTMLSelectElement).value;
          const parentName = (document.getElementById('student-parent-name') as HTMLInputElement).value.trim();
          if (!name || !readingLevel) {
            Swal.showValidationMessage('Please fill in all required fields');
            setIsAddingStudentToGrade(false); // Reset if validation fails
            return false;
          }
          return { name, readingLevel, parentName };
        }
      });

      if (formValues) {
        // Logic to add the student
        const newStudent = {
          name: formValues.name,
          grade: gradeName,
          readingLevel: formValues.readingLevel,
          attendance: 0,
          lastAssessment: new Date().toISOString().split('T')[0],
          status: 'active' as const,
          teacherId: currentUser?.uid || '',
          parentName: formValues.parentName || '',
          performance: 'Good' as Student['performance'],
        };
        const studentId = await studentService.addStudent(newStudent);
        await gradeService.addStudentToGrade(gradeId, { studentId, name: formValues.name });
        showSuccess('Student Added', `${formValues.name} has been added to ${gradeName}.`);
        await loadStudents();
        await loadGrades();
        await loadClassStatistics();
      }
    } catch (err) {
      showError('Failed to Add', 'An error occurred while adding the student.');
    } finally {
      // Ensure icon's loading state is reset, even if Swal.fire was dismissed without confirming
      setLoadingAddStudentToGradeId(null);
      // Ensure modal's loading state is reset too if not already
      setIsAddingStudentToGrade(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Completion Warning */}
      {!isProfileComplete && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="fas fa-exclamation-triangle text-yellow-400"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Profile Incomplete:</strong> Please complete your profile information to access all features. 
                Missing fields: {userRole === 'teacher' ? 'Phone Number, School, Bio' : 
                               userRole === 'parent' ? 'Phone Number, Grade Level' : 
                               'Phone Number, School'}.
                <a href="/profile" className="font-medium underline hover:text-yellow-600 ml-1">
                  Update Profile
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-2 sm:px-4 lg:px-6 py-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Class Grades Section */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-white rounded-lg shadow h-[calc(100vh-6rem)]">
              <div className="px-3 py-3 border-b border-gray-200 sm:px-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Class</h3>
                  <div className="flex items-center space-x-2">
                    {selectedGrades.length > 0 && (
                      <button
                        onClick={handleDeleteSelectedGrades}
                        className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        title={`Delete ${selectedGrades.length} selected grade(s)`}
                        disabled={isDeletingSelectedGrades || !canManage}
                      >
                        {isDeletingSelectedGrades ? (
                          <span className="loader-spinner" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #f3f3f3', borderTop: '2px solid #ffffff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <i className="fas fa-trash text-sm"></i>
                        )}
                      </button>
                    )}
                    <button
                      onClick={handleAddGrade}
                      className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      disabled={!canManage}
                    >
                      <i className="fas fa-plus text-sm"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="h-[calc(100%-3rem)] overflow-y-auto">
                <div className="divide-y divide-gray-200">
                  {grades.map((grade) => (
                    <div
                      key={grade.id}
                      className={`px-3 py-2 cursor-pointer transition-colors rounded-lg border ${
                        selectedGrade === grade.id
                          ? 'bg-blue-100 border-blue-500 shadow-md'
                          : 'hover:bg-gray-50 border-transparent'
                      } ${selectedGrades.includes(grade.id || '') ? 'bg-red-50' : ''}`}
                      style={{ marginBottom: '4px' }}
                      onClick={() => grade.id && handleGradeSelect(grade.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-4 h-4 flex items-center justify-center rounded-full border-2 cursor-pointer transition-transform hover:scale-125 ${
                              selectedGrades.includes(grade.id || '') ? 'border-green-500 bg-green-500' : 'border-gray-400 bg-white'
                            }`}
                            onClick={(e) => grade.id && handleGradeDotClick(e, grade.id)}
                          >
                            {selectedGrades.includes(grade.id || '') && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">{grade.name}</span>
                            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColorClasses(grade.color)}`}>
                              {grade.studentCount || 0} students
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                grade.id && handleViewGrade(grade.id, grade.name);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="View Students"
                              disabled={loadingViewGradeId === grade.id || !canManage}
                            >
                              {loadingViewGradeId === grade.id ? (
                                <span className="loader-spinner" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #f3f3f3', borderTop: '2px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                              ) : (
                                <i className="fas fa-eye"></i>
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                grade.id && handleAddStudentsToGrade(grade.id, grade.name);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Add Students"
                              disabled={loadingAddStudentToGradeId === grade.id || !canManage}
                            >
                              {loadingAddStudentToGradeId === grade.id ? (
                                <span className="loader-spinner" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #f3f3f3', borderTop: '2px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                              ) : (
                                <i className="fas fa-user-plus"></i>
                              )}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                grade.id && handleEditGrade(grade.id, grade.name);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Edit Grade"
                              disabled={loadingEditGradeId === grade.id || !canManage}
                            >
                              {loadingEditGradeId === grade.id ? (
                                <span className="loader-spinner" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #f3f3f3', borderTop: '2px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                              ) : (
                                <i className="fas fa-edit"></i>
                              )}
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (deletingGradeId === grade.id) return;
                                setDeletingGradeId(grade.id || null);
                                try {
                                  if (grade.id) await handleDeleteGrade(grade.id, grade.name);
                                } finally {
                                  setDeletingGradeId(null);
                                }
                              }}
                              className={`p-1 text-gray-400 hover:text-red-600 ${deletingGradeId === grade.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={`Delete ${grade.name}`}
                              aria-label={`Delete ${grade.name}`}
                              disabled={deletingGradeId === grade.id}
                            >
                              {deletingGradeId === grade.id ? (
                                <span className="loader-spinner" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #f3f3f3', borderTop: '2px solid #e3342f', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                              ) : (
                                <i className="fas fa-trash"></i>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Students Section */}
          <div className="col-span-12 lg:col-span-9">
            <div className="bg-white rounded-lg shadow h-[calc(100vh-6rem)] flex flex-col">
              <div className="px-3 py-3 border-b border-gray-200 sm:px-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-gray-900">Students</h3>
                  <span className="px-2 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-full">
                    {(selectedGrade && selectedGrade !== 'all') ? filteredStudents.length : 0} students
                  </span>
                </div>
                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="block w-full pl-2.5 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                  >
                    <option value="all">All Performance</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Needs Improvement">Needs Improvement</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="block w-full pl-2.5 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                  >
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="readingLevel-desc">Reading Level (High to Low)</option>
                    <option value="readingLevel-asc">Reading Level (Low to High)</option>
                    <option value="attendance-desc">Attendance (High to Low)</option>
                    <option value="attendance-asc">Attendance (Low to High)</option>
                    <option value="performance">Performance (A-Z)</option>
                  </select>
                </div>
              </div>
              <div className="px-3 py-3 border-b border-gray-100 sm:px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50">
                <div className="flex-1 flex items-center space-x-3">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <i className="fas fa-search text-gray-400"></i>
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, grade, contact, performance..."
                      className="block w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <button
                    onClick={handleDeleteAllStudents}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                    disabled={deletingAllStudents || !canManage}
                  >
                    {deletingAllStudents ? (
                      <span className="loader-spinner" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #f3f3f3', borderTop: '2px solid #e3342f', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    ) : (
                      'Delete All Students'
                    )}
                  </button>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      disabled={!canManage}
                    >
                      <i className="fas fa-file-import mr-1.5"></i>
                      Import
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
              {/* Students List */}
              <div className="flex-1 overflow-auto">
                {filteredStudents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full bg-gray-50">
                    <div className="text-center p-8">
                      <i className="fas fa-search text-4xl text-gray-400 mb-4"></i>
                      <p className="text-sm text-gray-500">
                        {searchQuery ? `No results for "${searchQuery}"` : 'No students found'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                        <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent</th>
                        <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                        <th scope="col" className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-blue-600 font-medium text-sm">
                                    {student.name.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{student.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{student.grade}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              {student.parentId ? (
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-900">{student.parentName}</span>
                                  <span className="px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                                    Linked
                                  </span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => student.id && handleLinkParent(student.id)}
                                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  <><i className="fas fa-link mr-1.5"></i>Link Parent</>
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-1.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getPerformanceColor(student.performance)}`}>
                              {student.performance}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => student.id && handleViewProfile(student.id)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View Profile"
                                disabled={loadingStudentId === student.id || !canManage}
                              >
                                {loadingStudentId === student.id ? (
                                  <span className="loader-spinner" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #f3f3f3', borderTop: '2px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                ) : (
                                  <i className="fas fa-eye"></i>
                                )}
                              </button>
                              <button
                                onClick={() => student.id && handleEditStudent(student.id)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Edit Student"
                                disabled={loadingStudentId === student.id || !canManage}
                              >
                                {loadingStudentId === student.id ? (
                                  <span className="loader-spinner" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #f3f3f3', borderTop: '2px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                ) : (
                                  <i className="fas fa-edit"></i>
                                )}
                              </button>
                              <button
                                onClick={() => student.id && handleDeleteStudent(student.id, student.name)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete Student"
                                disabled={!canManage}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Import Preview Modal */}
      {showImportPreview && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col pointer-events-auto">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Import Preview</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCancelImport}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportStudents}
                  disabled={isImporting}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                >
                  {isImporting ? (
                    <span className="loader-spinner" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #f3f3f3', borderTop: '2px solid #ffffff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  ) : (
                    'Import Students'
                  )}
                </button>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Found {importedStudents.length} students to import. Please review the data below:
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reading Level</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {importedStudents.map((student, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{student.name}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{student.grade}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">Level {student.readingLevel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassList; 