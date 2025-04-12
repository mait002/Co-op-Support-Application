'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '../../components/MainLayout';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import { supabase, directTableAccess, enableAdminMode } from '../../../lib/supabase';
import styles from './dashboard.module.css';

export default function StudentDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, userRole } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  
  const [applications, setApplications] = useState([]);
  const [workTermReports, setWorkTermReports] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState('applications');
  const [error, setError] = useState(null);

  // Redirect to login if not authenticated
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
    
    if (!isLoading && !isAuthenticated) {
      showInfo('Please log in to access your dashboard');
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router, showInfo]);

  // Fetch data from backend
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user?.id) {
        console.log('No user data available, skipping fetch');
        return;
      }
      
      setIsLoadingData(true);
      setError(null);
      
      try {
        // Use RPC function to get student applications - more robust than direct table access
        const { data: applicationsData, error: applicationsError } = 
          await supabase.rpc('get_student_applications');
        
        if (applicationsError) {
          throw new Error(`Failed to fetch applications: ${applicationsError.message}`);
        }
        
        console.log('Applications loaded:', applicationsData?.length || 0);
        setApplications(applicationsData || []);
        
        // Use RPC function to get student work term reports
        const { data: reportsData, error: reportsError } = 
          await supabase.rpc('get_student_reports');
        
        if (reportsError) {
          throw new Error(`Failed to fetch reports: ${reportsError.message}`);
        }
        
        console.log('Reports loaded:', reportsData?.length || 0);
        setWorkTermReports(reportsData || []);
        
      } catch (error) {
        console.error('Error fetching student data:', error);
        setError(error.message);
        
        if (error.message.includes('permission denied')) {
          showError('Permission error: Please try signing out and signing back in to refresh your session.');
        } else {
          showError(`Database error: ${error.message}. Please contact an administrator.`);
        }
      } finally {
        setIsLoadingData(false);
      }
    };

    if (isAuthenticated && user) {
      fetchStudentData();
    }
  }, [isAuthenticated, user, userRole, showError]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Handle both ISO date strings and PostgreSQL date format
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return dateString; // Return the original string if parsing fails
    }
  };

  // Get status badge class based on status
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return styles.statusApproved;
      case 'rejected':
        return styles.statusRejected;
      case 'reviewing':
      case 'submitted':
        return styles.statusReviewing;
      case 'assigned':
      case 'pending':
      default:
        return styles.statusPending;
    }
  };
  
  // Update the application mapping for status display
  const getApplicationStatusText = (status) => {
    if (!status) return 'Pending';
    
    // For application status, just capitalize first letter
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // Handle sign out and sign back in
  const handleSignOutSignIn = () => {
    localStorage.removeItem('admin_mode');
    router.push('/auth/login');
  };

  // Retry fetching data
  const handleRetry = () => {
    if (isAuthenticated && user) {
      setError(null);
      setIsLoadingData(true);
      
      // Try enabling admin mode before retrying - gracefully handle if function doesn't exist
      try {
        if (typeof enableAdminMode === 'function') {
          enableAdminMode();
        } else {
          console.warn('enableAdminMode function not available');
          // Fallback: Try to set admin mode directly
          localStorage.setItem('admin_mode', 'true');
        }
      } catch (e) {
        console.error('Error setting admin mode:', e);
      }
      
      // Re-trigger the effect
      const fetchTrigger = setTimeout(() => {
        setIsLoadingData(false); // Ensure loading state is reset if fetch doesn't trigger
        clearTimeout(fetchTrigger);
      }, 500);
    }
  };

  return (
    <MainLayout>
      <div className="container">
        <div className={styles.dashboardHeader}>
          <h1>Student Dashboard</h1>
          <p>Welcome back, {user?.firstName || 'Student'}!</p>
          
          <div className={styles.dashboardActions}>
            {applications.length === 0 && (
              <Link href="/student/application" className="btn btn-primary">
                Apply for Co-op Program
              </Link>
            )}
            
            {applications.some(app => app.status === 'approved') && activeTab === 'reports' && (
              <Link href="/student/report" className="btn btn-primary">
                Submit Work Term Report
              </Link>
            )}
          </div>
        </div>
        
        <div className={styles.tabContainer}>
          <div className={styles.tabs}>
            <button
              className={`${styles.tabButton} ${activeTab === 'applications' ? styles.active : ''}`}
              onClick={() => setActiveTab('applications')}
            >
              Applications
            </button>
            <button
              className={`${styles.tabButton} ${activeTab === 'reports' ? styles.active : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              Work Term Reports
            </button>
          </div>
          
          <div className={styles.tabContent}>
            {isLoadingData ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading your data...</p>
              </div>
            ) : error ? (
              <div className={styles.errorContainer} style={{ 
                padding: '20px', 
                textAlign: 'center',
                backgroundColor: '#f8d7da',
                color: '#721c24',
                borderRadius: '4px',
                marginTop: '20px'
              }}>
                <h3>Error Loading Data</h3>
                <p>{error}</p>
                {error.includes('permission denied') ? (
                  <button 
                    onClick={handleSignOutSignIn}
                    style={{
                      marginTop: '10px',
                      padding: '8px 16px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Sign Out and Sign Back In
                  </button>
                ) : (
                  <button 
                    onClick={handleRetry}
                    style={{
                      marginTop: '10px',
                      padding: '8px 16px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Retry
                  </button>
                )}
              </div>
            ) : activeTab === 'applications' ? (
              <div className={styles.applicationsTab}>
                <h2>Co-op Program Applications</h2>
                
                {applications.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>You haven't submitted any applications yet.</p>
                    <Link href="/student/application" className="btn btn-primary">
                      Apply Now
                    </Link>
                  </div>
                ) : (
                  <div className={styles.applicationsList}>
                    {applications.map((application) => (
                      <div key={application.id} className={styles.applicationCard}>
                        <div className={styles.applicationHeader}>
                          <h3>Co-op Program Application</h3>
                          <span className={`${styles.statusBadge} ${getStatusBadgeClass(application.status)}`}>
                            {getApplicationStatusText(application.status)}
                          </span>
                        </div>
                        
                        <div className={styles.applicationDetails}>
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Program:</span>
                            <span>{application.major || 'Not specified'}</span>
                          </div>
                          
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>GPA:</span>
                            <span>{application.gpa ? application.gpa.toFixed(2) : 'Not specified'}</span>
                          </div>
                          
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Expected Graduation:</span>
                            <span>{formatDate(application.expected_graduation)}</span>
                          </div>
                          
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Submitted:</span>
                            <span>{formatDate(application.submission_date)}</span>
                          </div>
                          
                          {application.review_date && (
                            <div className={styles.detailItem}>
                              <span className={styles.detailLabel}>Reviewed:</span>
                              <span>{formatDate(application.review_date)}</span>
                            </div>
                          )}
                          
                          {application.status === 'rejected' && application.comments && (
                            <div className={styles.comments}>
                              <span className={styles.detailLabel}>Feedback:</span>
                              <p>{application.comments}</p>
                            </div>
                          )}
                        </div>
                        
                        {application.status === 'rejected' && (
                          <div className={styles.applicationActions}>
                            <Link href="/student/application/reapply" className="btn btn-primary">
                              Re-apply
                            </Link>
                          </div>
                        )}
                        
                        {application.resume_url && (
                          <div className={styles.applicationActions}>
                            <a 
                              href={application.resume_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="btn btn-secondary"
                            >
                              View Resume
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === 'reports' ? (
              <div className={styles.reportsTab}>
                <h2>Work Term Reports</h2>
                
                {workTermReports.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>You haven't submitted any work term reports yet.</p>
                    <Link href="/student/report" className="btn btn-primary">
                      Submit Report
                    </Link>
                  </div>
                ) : (
                  <div className={styles.reportsList}>
                    {workTermReports.map((report) => (
                      <div key={report.id} className={styles.reportCard}>
                        <div className={styles.reportHeader}>
                          <h3>{report.work_term} - {report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)} Report</h3>
                        </div>
                        
                        <div className={styles.reportDetails}>
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Submitted:</span>
                            <span>{formatDate(report.submission_date)}</span>
                          </div>
                          
                          {report.review_date && (
                            <div className={styles.detailItem}>
                              <span className={styles.detailLabel}>Reviewed:</span>
                              <span>{formatDate(report.review_date)}</span>
                            </div>
                          )}
                          
                          {report.report_url && (
                            <div className={styles.detailItem}>
                              <span className={styles.detailLabel}>Report:</span>
                              <a 
                                href={report.report_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={styles.reportLink}
                              >
                                View Report
                              </a>
                            </div>
                          )}
                          
                          {report.status === 'rejected' && report.comments && (
                            <div className={styles.comments}>
                              <span className={styles.detailLabel}>Feedback:</span>
                              <p>{report.comments}</p>
                            </div>
                          )}
                        </div>
                        
                        {report.status === 'rejected' && (
                          <div className={styles.reportActions}>
                            <Link href={`/student/report/resubmit/${report.id}`} className="btn btn-primary">
                              Re-submit Report
                            </Link>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </MainLayout>
  );
} 