import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../config/firebase';

export interface Student {
  id?: string;
  name: string;
  grade: string;
  readingLevel: number;
  attendance: number;
  performance: 'Excellent' | 'Good' | 'Needs Improvement';
  lastAssessment: string;
  parentId?: string;
  parentName?: string;
  status: 'active' | 'pending' | 'inactive';
  teacherId: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface ImportedStudent {
  name: string;
  grade: string;
  readingLevel: number;
  parentId?: string;
  parentName?: string;
}

class StudentService {
  private collectionName = 'students';

  // Get all students for a teacher
  async getStudents(teacherId: string): Promise<Student[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('teacherId', '==', teacherId)
      );
      
      const querySnapshot = await getDocs(q);
      const students: Student[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        students.push({
          id: doc.id,
          ...data
        } as Student);
      });
      
      // Sort in memory instead of using orderBy in query
      students.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      
      return students;
    } catch (error) {
      console.error('Error getting students:', error);
      
      // If the query fails, try to get all documents and filter in memory
      try {
        const allDocs = await getDocs(collection(db, this.collectionName));
        const students: Student[] = [];
        
        allDocs.forEach((doc) => {
          const data = doc.data();
          if (data.teacherId === teacherId) {
            students.push({
              id: doc.id,
              ...data
            } as Student);
          }
        });
        
        return students;
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        throw new Error('Failed to fetch students');
      }
    }
  }

  // Get a single student by ID
  async getStudent(studentId: string): Promise<Student | null> {
    try {
      const docRef = doc(db, this.collectionName, studentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Student;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting student:', error);
      throw new Error('Failed to fetch student');
    }
  }

  // Add a new student
  async addStudent(studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...studentData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding student:', error);
      throw new Error('Failed to add student');
    }
  }

  // Update an existing student
  async updateStudent(studentId: string, studentData: Partial<Student>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, studentId);
      await updateDoc(docRef, {
        ...studentData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating student:', error);
      throw new Error('Failed to update student');
    }
  }

  // Delete a student
  async deleteStudent(studentId: string): Promise<void> {
    try {
      // Check authentication
      const auth = getAuth();
      if (!auth.currentUser) {
        throw new Error('No authenticated user');
      }

      console.log('Attempting to delete student:', {
        studentId,
        currentUser: auth.currentUser.uid
      });

      // Get student data first to verify ownership
      const studentRef = doc(db, this.collectionName, studentId);
      const studentDoc = await getDoc(studentRef);
      
      if (!studentDoc.exists()) {
        throw new Error('Student not found');
      }

      const studentData = studentDoc.data();
      console.log('Student data:', studentData);

      // Verify the current user owns this student record
      if (studentData.teacherId !== auth.currentUser.uid) {
        throw new Error('Unauthorized to delete this student');
      }

      // Start a batch write
      const batch = writeBatch(db);

      // Delete the student document
      batch.delete(studentRef);

      // Find and delete student from all grade collections
      const gradesRef = collection(db, 'classGrades');
      const gradesSnapshot = await getDocs(gradesRef);

      for (const gradeDoc of gradesSnapshot.docs) {
        const studentsRef = collection(gradeDoc.ref, 'students');
        const studentInGradeQuery = query(studentsRef, where('studentId', '==', studentId));
        const studentInGradeSnapshot = await getDocs(studentInGradeQuery);

        studentInGradeSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
      }

      // Commit the batch
      await batch.commit();
      console.log('Successfully deleted student and all related records');

    } catch (error) {
      console.error('Error deleting student:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to delete student');
    }
  }

  // Import multiple students
  async importStudents(students: ImportedStudent[], teacherId: string): Promise<string[]> {
    try {
      const batch = writeBatch(db);
      const studentIds: string[] = [];
      
      students.forEach((studentData) => {
        const docRef = doc(collection(db, this.collectionName));
        studentIds.push(docRef.id);
        
        batch.set(docRef, {
          ...studentData,
          attendance: 0,
          performance: 'Good' as const,
          lastAssessment: new Date().toISOString().split('T')[0],
          status: 'pending' as const,
          teacherId,
          parentId: studentData.parentId || null,
          parentName: studentData.parentName || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      return studentIds;
    } catch (error) {
      console.error('Error importing students:', error);
      throw new Error('Failed to import students');
    }
  }

  // Search students by name or grade
  async searchStudents(teacherId: string, searchTerm: string): Promise<Student[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('teacherId', '==', teacherId),
        orderBy('name')
      );
      
      const querySnapshot = await getDocs(q);
      const students: Student[] = [];
      
      querySnapshot.forEach((doc) => {
        const student = {
          id: doc.id,
          ...doc.data()
        } as Student;
        
        // Filter by search term
        if (student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.grade.toLowerCase().includes(searchTerm.toLowerCase())) {
          students.push(student);
        }
      });
      
      return students;
    } catch (error) {
      console.error('Error searching students:', error);
      throw new Error('Failed to search students');
    }
  }

  // Get students by performance level
  async getStudentsByPerformance(teacherId: string, performance: string): Promise<Student[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('teacherId', '==', teacherId),
        where('performance', '==', performance),
        orderBy('name')
      );
      
      const querySnapshot = await getDocs(q);
      const students: Student[] = [];
      
      querySnapshot.forEach((doc) => {
        students.push({
          id: doc.id,
          ...doc.data()
        } as Student);
      });
      
      return students;
    } catch (error) {
      console.error('Error getting students by performance:', error);
      throw new Error('Failed to fetch students by performance');
    }
  }

  // Get class statistics
  async getClassStatistics(teacherId: string): Promise<{
    totalStudents: number;
    averageAttendance: number;
    averageReadingLevel: number;
    excellentPerformers: number;
  }> {
    try {
      const students = await this.getStudents(teacherId);
      
      if (students.length === 0) {
        return {
          totalStudents: 0,
          averageAttendance: 0,
          averageReadingLevel: 0,
          excellentPerformers: 0
        };
      }
      
      const totalStudents = students.length;
      const averageAttendance = Math.round(
        students.reduce((sum, student) => sum + student.attendance, 0) / totalStudents
      );
      const averageReadingLevel = Math.round(
        (students.reduce((sum, student) => sum + student.readingLevel, 0) / totalStudents) * 10
      ) / 10;
      const excellentPerformers = students.filter(
        student => student.performance === 'Excellent'
      ).length;
      
      return {
        totalStudents,
        averageAttendance,
        averageReadingLevel,
        excellentPerformers
      };
    } catch (error) {
      console.error('Error getting class statistics:', error);
      throw new Error('Failed to fetch class statistics');
    }
  }
}

export const studentService = new StudentService();
export default studentService;