'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '../../../components/MainLayout';
import { useAuth } from '../../../components/AuthContext';
import { useToast } from '../../../components/ToastContext';
import { supabase } from '../../../../lib/supabase';
import styles from './assignmentDetails.module.css';

export default function AssignmentDetails({ params }) {
  const assignmentId = params.id;
  const router = useRouter();
  const { user, isAuthenticated, userRole } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  
  // State
  const [assignment, setAssignment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [comments, setComments] = useState('');
  const [error, setError] = useState(null);
  
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
  
  // Load assignment data
  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      if (!isAuthenticated || userRole !== 'admin') return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch the assignment with related student and employer details
        const { data, error } = await supabase
          .from('evaluations')
          .select(`
            id,
            student_id,
            employer_id,
            work_term,
            submission_date,
            status,
            comments,
            evaluation_data,
            evaluation_url,
            student:profiles!student_id(id, first_name, last_name, student_id, email),
            employer:profiles!employer_id(id, first_name, last_name, company_name, email)
          `)
          .eq('id', assignmentId)
          .single();
        
        if (error) {
          throw new Error(`Failed to fetch assignment: ${error.message}`);
        }
        
        if (!data) {
          throw new Error('Assignment not found');
        }
        
        setAssignment(data);
        setComments(data.comments || '');
        
      } catch (err) {
        console.error('Error fetching assignment details:', err);
        setError(err.message);
        showError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAssignmentDetails();
  }, [isAuthenticated, userRole, assignmentId, showError]);
  
  // Handle status update
  const handleStatusUpdate = async (newStatus) => {
    try {
      setStatusUpdateLoading(true);
      
      const { data, error } = await supabase
        .from('evaluations')
        .update({
          status: newStatus,
          comments: comments,
          review_date: new Date().toISOString()
        })
        .eq('id', assignmentId)
        .select();
      
      if (error) {
        throw new Error(`Failed to update status: ${error.message}`);
      }
      
      setAssignment({ ...assignment, status: newStatus, comments });
      showSuccess(`Evaluation ${newStatus} successfully`);
      
    } catch (err) {
      console.error('Error updating status:', err);
      showError(err.message);
    } finally {
      setStatusUpdateLoading(false);
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
  
  // Determine status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'assigned': return '#2563eb';
      case 'pending': return '#7c3aed';
      case 'submitted': return '#ea580c';
      case 'approved': return '#16a34a';
      case 'rejected': return '#dc2626';
      default: return '#4b5563';
    }
  };
  
  return (
    <MainLayout>
      <div className="container">
        <div className={styles.pageHeader}>
          <Link href="/admin/assignments" className={styles.backLink}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={styles.backIcon}>
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
            Back to Assignments
          </Link>
          <h1>Assignment Details</h1>
        </div>
        
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading assignment details...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => router.push('/admin/assignments')} className={styles.returnButton}>
              Return to Assignments
            </button>
          </div>
        ) : (
          <div className={styles.content}>
            {/* Assignment Info Section */}
            <div className={styles.detailsSection}>
              <h2>Assignment Information</h2>
              <div className={styles.infoBox}>
                <div className={styles.infoRow}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Status:</span>
                    <div style={{
                      display: 'inline-block',
                      backgroundColor: getStatusColor(assignment.status),
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '999px',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {assignment.status}
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Work Term:</span>
                    <span>{assignment.work_term}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Assignment Date:</span>
                    <span>{formatDate(assignment.submission_date)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Student Info Section */}
            <div className={styles.detailsSection}>
              <h2>Student Information</h2>
              <div className={styles.infoBox}>
                <div className={styles.infoRow}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Name:</span>
                    <span>{assignment.student.first_name} {assignment.student.last_name}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Student ID:</span>
                    <span>{assignment.student.student_id || 'N/A'}</span>
                  </div>
                </div>
                <div className={styles.infoRow}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Email:</span>
                    <span>{assignment.student.email}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Employer Info Section */}
            <div className={styles.detailsSection}>
              <h2>Employer Information</h2>
              <div className={styles.infoBox}>
                <div className={styles.infoRow}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Supervisor:</span>
                    <span>{assignment.employer.first_name} {assignment.employer.last_name}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Company:</span>
                    <span>{assignment.employer.company_name || 'N/A'}</span>
                  </div>
                </div>
                <div className={styles.infoRow}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Email:</span>
                    <span>{assignment.employer.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 