'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '../../components/MainLayout';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import { supabase, getAdminClient } from '../../../lib/supabase';
import styles from './dashboard.module.css';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, userRole } = useAuth();
  const { showError, showInfo } = useToast();
  
  // Redirect if not admin
  useEffect(() => {
    // Check URL parameters
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const noRedirect = searchParams.get('noredirect') === 'true';
      
      // Skip redirect check if noRedirect parameter is present
      if (noRedirect) {
        console.log('Skipping redirect check due to noredirect parameter');
        return;
      }
    }
    
    if (isAuthenticated && userRole !== 'admin') {
      showInfo("You don't have permission to access the admin dashboard.");
      router.push('/');
    } else if (!isAuthenticated) {
      showInfo("Please log in to access the admin dashboard.");
      router.push('/auth/login');
    }
  }, [isAuthenticated, userRole, router, showInfo]);
  
  // State for applications
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real applications data from the database
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Use the secure RPC function to get all applications
        const { data: appData, error: appError } = await supabase
          .rpc('get_all_applications');
        
        if (appError) {
          console.error('Error fetching applications:', appError);
          throw new Error(`Failed to fetch applications: ${appError.message}`);
        }
        
        // Log raw application data for debugging
        console.log('Raw applications data:', appData);
        
        // Get student profiles for the applications
        const studentIds = [...new Set(appData.map(app => app.student_id))];
        
        // Fetch all relevant student profiles
        const { data: studentData, error: studentError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, student_id')
          .in('id', studentIds);
          
        if (studentError) {
          console.error('Error fetching student profiles:', studentError);
        }
        
        // Log student data for debugging
        console.log('Student data:', studentData);
        
        // Create a lookup map for student data
        const studentMap = {};
        if (studentData) {
          studentData.forEach(student => {
            studentMap[student.id] = student;
          });
        }
        
        // Format applications for display
        const formattedApplications = appData.map(app => {
          const student = studentMap[app.student_id] || {};
          
          // Create a proper date object and format it
          let formattedDate = 'N/A';
          try {
            if (app.submission_date) {
              const date = new Date(app.submission_date);
              if (!isNaN(date.getTime())) {
                formattedDate = date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });
              }
            }
          } catch (e) {
            console.error('Error formatting date:', app.submission_date, e);
          }
          
          return {
            id: app.id,
            studentName: student 
              ? `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown Student'
              : 'Unknown Student',
            studentId: student?.student_id || 'N/A',
            // Get major directly from the application, not the student
            major: app.major || 'N/A',
            date: formattedDate,
            status: app.status || 'pending',
            studentUUID: app.student_id,
            // Store raw data for debugging
            rawSubmissionDate: app.submission_date,
            rawData: app
          };
        });
        
        setApplications(formattedApplications);
      } catch (err) {
        console.error('Error loading applications:', err);
        setError(err.message);
        showError(`Database error: ${err.message}. Please contact an administrator.`);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated && userRole === 'admin') {
      fetchApplications();
    }
  }, [isAuthenticated, userRole, showError]);

  // Handle status change
  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      setIsLoading(true);
      
      // Update application status directly - our RLS policies allow admins to do this
      const { error } = await supabase
        .from('applications')
        .update({
          status: newStatus,
          review_date: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq('id', applicationId);
      
      if (error) {
        console.error('Error updating application:', error);
        throw new Error(`Failed to update application: ${error.message}`);
      }
      
      // Update local state
      const updatedApplications = applications.map(app => {
        if (app.id === applicationId) {
          return { ...app, status: newStatus };
        }
        return app;
      });
      
      // Update applications in state
      setApplications(updatedApplications);
      
      // Show success message
      showInfo(`Application status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating application status:', error);
      showError(`Failed to update application status: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Retry loading data
  const handleRetry = () => {
    if (isAuthenticated && userRole === 'admin') {
      setError(null);
      setIsLoading(true);
      // Re-trigger the effect
      const fetchTrigger = setTimeout(() => {
        clearTimeout(fetchTrigger);
      }, 100);
    }
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const badgeClass = {
      pending: styles.badgePending,
      approved: styles.badgeSuccess,
      rejected: styles.badgeDanger
    }[status] || styles.badgePending;

    return <span className={`${styles.badge} ${badgeClass}`}>{status}</span>;
  };

  return (
    <MainLayout>
      <div className={styles.dashboardContainer}>
        <div className={styles.dashboardHeader}>
          <h1>Admin Dashboard</h1>
          <p>Review and manage student applications</p>
        </div>
        
        <div className={styles.searchFilterBar}>
          <div className={styles.filterButtons} style={{ display: 'flex', gap: '12px' }}>
            <Link href="/admin/applications" className={styles.actionButton}>
              View All Applications
            </Link>
            
            <Link href="/admin/assignments" className={styles.actionButton}>
              Manage Assignments
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loadingState}>Loading applications from database...</div>
        ) : error ? (
          <div className={styles.warningBanner}>
            <div className={styles.bannerContent}>
              <h3>Error Loading Data</h3>
              <p>{error}</p>
              <button 
                onClick={handleRetry}
                className={styles.bannerButton}
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <h2>Student Applications</h2>
              <Link href="/admin/applications" className={styles.viewAllLink}>
                View All
              </Link>
            </div>
            
            {applications.length === 0 ? (
              <div className={styles.noResults}>
                No applications found in the database.
              </div>
            ) : (
              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Student ID</th>
                      <th>Program</th>
                      <th>Date Applied</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map(app => (
                      <tr key={app.id}>
                        <td>{app.studentName}</td>
                        <td>{app.studentId}</td>
                        <td>
                          {app.major !== 'N/A' ? (
                            app.major
                          ) : (
                            <span className={styles.noData}>
                              No major specified
                              {app.rawData?.major ? ` (Raw: ${app.rawData.major})` : ''}
                            </span>
                          )}
                        </td>
                        <td>
                          {app.date !== 'N/A' ? (
                            app.date
                          ) : (
                            <span className={styles.noData}>
                              Invalid date
                              {app.rawSubmissionDate ? ` (Raw: ${app.rawSubmissionDate})` : ''}
                            </span>
                          )}
                        </td>
                        <td>
                          <StatusBadge status={app.status} />
                        </td>
                        <td>
                          {app.status === 'pending' && (
                            <div className={styles.actionButtons}>
                              <button 
                                className={`${styles.actionButton} ${styles.approveButton}`}
                                onClick={() => handleStatusChange(app.id, 'approved')}
                              >
                                Approve
                              </button>
                              <button 
                                className={`${styles.actionButton} ${styles.rejectButton}`}
                                onClick={() => handleStatusChange(app.id, 'rejected')}
                              >
                                Reject
                              </button>
                            </div>
                          )}
                          {app.status !== 'pending' && (
                            <div className={styles.actionButtons}>
                              <button 
                                className={styles.actionButton}
                                onClick={() => handleStatusChange(app.id, 'pending')}
                              >
                                Reset to Pending
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

// Note for backend developer:
// This dashboard displays various statistics and data that should be retrieved from the database.
// Key API endpoints needed:
// 1. GET /api/admin/dashboard - Returns statistics (counts of applications, reports, evaluations by status)
// 2. GET /api/admin/applications?limit=5 - Returns recent applications
// 3. GET /api/admin/reports?limit=5 - Returns recent reports
// 4. PUT /api/admin/applications/:id/status - Updates application status
// 5. POST /api/admin/evaluations/reminder - Sends reminder email to employers 