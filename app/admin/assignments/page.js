'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '../../components/MainLayout';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import { supabase } from '../../../lib/supabase';
import { assignStudentToEmployer, deleteStudentAssignment } from '../../../lib/api';
import styles from './assignments.module.css';

export default function EmployerAssignments() {
  const router = useRouter();
  const { user, isAuthenticated, userRole } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  
  // State for data
  const [students, setStudents] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for form
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedEmployer, setSelectedEmployer] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  
  // Redirect if not admin
  useEffect(() => {
    if (isAuthenticated && userRole !== 'admin') {
      showInfo("You don't have permission to access the admin area.");
      router.push('/');
    } else if (!isAuthenticated) {
      showInfo("Please log in to access the admin dashboard.");
      router.push('/auth/login');
    }
  }, [isAuthenticated, userRole, router, showInfo]);
  
  // Load data
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || userRole !== 'admin') return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch students with approved applications
        const { data: studentsData, error: studentsError } = await supabase
          .from('profiles')
          .select(`
            id,
            first_name,
            last_name, 
            student_id,
            email
          `)
          .eq('role', 'student');
        
        if (studentsError) {
          throw new Error(`Failed to fetch students: ${studentsError.message}`);
        }
        
        // Fetch approved applications separately
        const { data: approvedApplicationsData, error: approvedApplicationsError } = await supabase
          .from('applications')
          .select('student_id')
          .eq('status', 'approved');
        
        if (approvedApplicationsError) {
          throw new Error(`Failed to fetch approved applications: ${approvedApplicationsError.message}`);
        }
        
        // Get unique student IDs with approved applications
        const approvedStudentIds = [...new Set(approvedApplicationsData.map(app => app.student_id))];
        
        // Filter to only students with approved applications
        const approvedStudents = studentsData.filter(student => 
          approvedStudentIds.includes(student.id)
        );
        
        setStudents(approvedStudents);
        
        // Fetch employers
        const { data: employersData, error: employersError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, company_name, email')
          .eq('role', 'employer');
        
        if (employersError) {
          throw new Error(`Failed to fetch employers: ${employersError.message}`);
        }
        
        setEmployers(employersData);
        
        // Fetch current assignments
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('evaluations')
          .select(`
            id,
            student_id,
            employer_id,
            work_term,
            submission_date,
            status,
            student:profiles!student_id(first_name, last_name, student_id, email),
            employer:profiles!employer_id(first_name, last_name, company_name, email)
          `);
        
        if (assignmentsError) {
          throw new Error(`Failed to fetch assignments: ${assignmentsError.message}`);
        }
        
        setAssignments(assignmentsData || []);
        setFilteredAssignments(assignmentsData || []);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        showError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [isAuthenticated, userRole, showError]);
  
  // Filter assignments when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredAssignments(assignments);
      return;
    }
    
    const term = searchTerm.toLowerCase();
    const filtered = assignments.filter(assignment => {
      const studentName = `${assignment.student.first_name} ${assignment.student.last_name}`.toLowerCase();
      const employerName = `${assignment.employer.first_name} ${assignment.employer.last_name}`.toLowerCase();
      const companyName = (assignment.employer.company_name || '').toLowerCase();
      
      return studentName.includes(term) || 
        employerName.includes(term) || 
        companyName.includes(term);
    });
    
    setFilteredAssignments(filtered);
  }, [searchTerm, assignments]);
  
  // Handle assignment form submission
  const handleAssignmentSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedStudent || !selectedEmployer) {
      showError('Please select a student and employer');
      return;
    }
    
    try {
      setFormSubmitting(true);
      
      // Check if assignment already exists
      const existingAssignment = assignments.find(
        a => a.student_id === selectedStudent && 
             a.employer_id === selectedEmployer
      );
      
      if (existingAssignment) {
        showError('This student is already assigned to this employer');
        return;
      }
      
      // Use the RPC function instead of direct insert
      const data = await assignStudentToEmployer(selectedEmployer, selectedStudent);
      
      if (!data) {
        throw new Error('Failed to create assignment: No data returned from server');
      }
      
      // Fetch the newly created assignment to get all details
      const { data: newAssignmentData, error: fetchError } = await supabase
        .from('evaluations')
        .select(`
          id,
          employer_id,
          student_id,
          submission_date,
          student:profiles!student_id(first_name, last_name, student_id, email),
          employer:profiles!employer_id(first_name, last_name, company_name, email)
        `)
        .eq('employer_id', selectedEmployer)
        .eq('student_id', selectedStudent)
        .single();
      
      if (fetchError) {
        throw new Error(`Failed to fetch new assignment: ${fetchError.message}`);
      }
      
      // Add the new assignment to the list
      setAssignments(prev => [...prev, newAssignmentData]);
      setFilteredAssignments(prev => [...prev, newAssignmentData]);
      
      // Reset form
      setSelectedStudent('');
      setSelectedEmployer('');
      
      showSuccess('Student assigned to employer successfully');
    } catch (err) {
      console.error('Error creating assignment:', err);
      showError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };
  
  // Handle assignment deletion
  const handleDeleteAssignment = async (assignmentId) => {
    try {
      setIsLoading(true);
      
      // Use the RPC function instead of direct delete
      await deleteStudentAssignment(assignmentId);
      
      // Remove the assignment from the list
      setAssignments(prev => prev.filter(a => a.id !== assignmentId));
      setFilteredAssignments(prev => prev.filter(a => a.id !== assignmentId));
      
      showSuccess('Assignment deleted successfully');
    } catch (err) {
      console.error('Error deleting assignment:', err);
      showError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  return (
    <MainLayout>
      <div className="container">
        <div className={styles.pageHeader}>
          <div>
            <Link href="/admin/dashboard" className={styles.backLink}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={styles.backIcon}>
                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
              </svg>
              Back to Dashboard
            </Link>
            <h1>Student-Employer Assignments</h1>
            <p>Assign students to employers for work term evaluations</p>
          </div>
        </div>
        
        {isLoading && !formSubmitting ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading data...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => router.push('/admin/dashboard')} className={styles.returnButton}>
              Return to Dashboard
            </button>
          </div>
        ) : (
          <div className={styles.content}>
            {/* Assignment Form */}
            <div className={styles.formSection}>
              <h2>Create New Assignment</h2>
              <form onSubmit={handleAssignmentSubmit} className={styles.assignmentForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="student">Student:</label>
                  <select 
                    id="student" 
                    value={selectedStudent} 
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    required
                    className={styles.select}
                  >
                    <option value="">Select a student</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.first_name} {student.last_name} ({student.student_id || 'No ID'})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="employer">Employer:</label>
                  <select 
                    id="employer" 
                    value={selectedEmployer} 
                    onChange={(e) => setSelectedEmployer(e.target.value)}
                    required
                    className={styles.select}
                  >
                    <option value="">Select an employer</option>
                    {employers.map(employer => (
                      <option key={employer.id} value={employer.id}>
                        {employer.first_name} {employer.last_name} ({employer.company_name || 'No Company'})
                      </option>
                    ))}
                  </select>
                </div>
                
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={formSubmitting}
                >
                  {formSubmitting ? 'Creating...' : 'Create Assignment'}
                </button>
              </form>
            </div>
            
            {/* Assignments List */}
            <div className={styles.listSection}>
              <div className={styles.listHeader}>
                <h2>Current Assignments</h2>
                <div className={styles.searchContainer}>
                  <input 
                    type="text" 
                    placeholder="Search assignments..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
              </div>
              
              {filteredAssignments.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>
                    {searchTerm ? 'No assignments match your search criteria' : 'No assignments found'}
                  </p>
                </div>
              ) : (
                <div className={styles.table}>
                  <table>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Employer</th>
                        <th>Assignment Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAssignments.map(assignment => (
                        <tr key={assignment.id}>
                          <td>
                            <div className={styles.userCell}>
                              <span className={styles.userName}>
                                {assignment.student.first_name} {assignment.student.last_name}
                              </span>
                              <span className={styles.userEmail}>
                                {assignment.student.email}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className={styles.userCell}>
                              <span className={styles.userName}>
                                {assignment.employer.first_name} {assignment.employer.last_name}
                              </span>
                              <span className={styles.userEmail}>
                                {assignment.employer.company_name || 'No Company'}
                              </span>
                            </div>
                          </td>
                          <td>{formatDate(assignment.submission_date)}</td>
                          <td>
                            <div className={styles.actions}>
                              <Link 
                                href={`/admin/assignments/${assignment.id}`}
                                className={styles.viewButton}
                                title="View Details"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={styles.actionIcon}>
                                  <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                                  <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                </svg>
                              </Link>
                              <button 
                                onClick={() => handleDeleteAssignment(assignment.id)}
                                className={styles.deleteButton}
                                title="Delete Assignment"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={styles.actionIcon}>
                                  <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 