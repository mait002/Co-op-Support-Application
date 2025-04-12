'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '../../../components/MainLayout';
import { useAuth } from '../../../components/AuthContext';
import { useToast } from '../../../components/ToastContext';
import { supabase } from '../../../../lib/supabase';
import styles from './applicationDetails.module.css';

export default function ApplicationDetails() {
  const router = useRouter();
  const params = useParams();
  const { user, isAuthenticated, userRole } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  
  const [application, setApplication] = useState(null);
  const [student, setStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resumeUrl, setResumeUrl] = useState(null);
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
  
  // Load application data
  useEffect(() => {
    const fetchApplicationData = async () => {
      if (!isAuthenticated || userRole !== 'admin' || !params.id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Get application data
        const { data: appData, error: appError } = await supabase
          .from('applications')
          .select('*')
          .eq('id', params.id)
          .single();
        
        if (appError) {
          console.error('Error fetching application:', appError);
          throw new Error(`Failed to load application: ${appError.message}`);
        }
        
        if (!appData) {
          throw new Error('Application not found');
        }
        
        setApplication(appData);
        
        // Get student data
        if (appData.student_id) {
          const { data: studentData, error: studentError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', appData.student_id)
            .single();
          
          if (studentError) {
            console.error('Error fetching student profile:', studentError);
          } else {
            setStudent(studentData);
          }
        }
        
        // Get resume URL if it exists
        if (appData.resume_url) {
          try {
            console.log('Raw resume URL:', appData.resume_url);
            
            // Extract just the filename from the full URL if needed
            let resumePath = appData.resume_url;
            
            // Handle case where resume_url is a full URL
            if (resumePath.includes('supabase.co')) {
              // Extract the path part after the bucket name
              const match = resumePath.match(/\/([^/]+)\/([^/]+\/?.*)$/);
              if (match && match[2]) {
                resumePath = match[2];
                console.log('Extracted resume path:', resumePath);
              } else {
                // If URL is just the filename
                resumePath = resumePath.split('/').pop();
                console.log('Using filename only:', resumePath);
              }
            }
            
            // Try direct URL first
            try {
              const publicUrl = supabase.storage
                .from('student-files')
                .getPublicUrl(`resumes/${resumePath.split('/').pop()}`);
                
              if (publicUrl?.data?.publicUrl) {
                console.log('Using public URL:', publicUrl.data.publicUrl);
                setResumeUrl(publicUrl.data.publicUrl);
              } else {
                throw new Error('No public URL available');
              }
            } catch (publicUrlError) {
              console.error('Failed to get public URL, trying signed URL:', publicUrlError);
              
              // Try with different bucket possibilities
              const buckets = ['resumes', 'student-files', 'student-files/resumes'];
              
              for (const bucket of buckets) {
                try {
                  console.log(`Trying bucket: ${bucket} with path: ${resumePath}`);
                  const { data: urlData, error: urlError } = await supabase
                    .storage
                    .from(bucket)
                    .createSignedUrl(resumePath, 3600); // 1 hour expiry
                  
                  if (!urlError && urlData?.signedUrl) {
                    console.log('Successfully got signed URL from bucket:', bucket);
                    setResumeUrl(urlData.signedUrl);
                    break;
                  }
                } catch (bucketError) {
                  console.error(`Error with bucket ${bucket}:`, bucketError);
                }
              }
            }
          } catch (storageError) {
            console.error('Storage error:', storageError);
          }
        }
      } catch (err) {
        console.error('Error loading application details:', err);
        setError(err.message);
        showError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchApplicationData();
  }, [isAuthenticated, userRole, params.id, showError]);
  
  // Update application status
  const handleStatusChange = async (newStatus) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('applications')
        .update({
          status: newStatus,
          review_date: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq('id', params.id);
      
      if (error) {
        throw new Error(`Failed to update status: ${error.message}`);
      }
      
      // Update local state
      setApplication(prev => ({ ...prev, status: newStatus }));
      showSuccess(`Application status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating status:', err);
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
      console.error('Error formatting date:', e);
      return dateString;
    }
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved': return styles.statusApproved;
      case 'rejected': return styles.statusRejected;
      default: return styles.statusPending;
    }
  };
  
  return (
    <MainLayout>
      <div className="container">
        <div className={styles.pageHeader}>
          <div>
            <Link href="/admin/applications" className={styles.backLink}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={styles.backIcon}>
                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
              </svg>
              Back to Applications
            </Link>
            <h1>Application Details</h1>
          </div>
        </div>
        
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading application details...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => router.push('/admin/applications')} className={styles.returnButton}>
              Return to Applications
            </button>
          </div>
        ) : application ? (
          <div className={styles.applicationDetails}>
            <div className={styles.statusHeader}>
              <div>
                <h2>
                  {student ? (
                    <>
                      {student.first_name} {student.last_name}'s Application
                    </>
                  ) : (
                    'Application Details'
                  )}
                </h2>
                <p>Submitted on {formatDate(application.submission_date)}</p>
              </div>
              
              <div className={styles.statusBadgeContainer}>
                <span className={`${styles.statusBadge} ${getStatusBadgeClass(application.status)}`}>
                  {application.status}
                </span>
                
                {application.status === 'pending' && (
                  <div className={styles.statusButtons}>
                    <button 
                      onClick={() => handleStatusChange('approved')}
                      className={styles.approveButton}
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleStatusChange('rejected')}
                      className={styles.rejectButton}
                    >
                      Reject
                    </button>
                  </div>
                )}
                
                {application.status !== 'pending' && (
                  <button 
                    onClick={() => handleStatusChange('pending')}
                    className={styles.resetButton}
                  >
                    Reset to Pending
                  </button>
                )}
              </div>
            </div>
            
            <div className={styles.sections}>
              {/* Student Information Section */}
              <div className={styles.section}>
                <h3>Student Information</h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Name</span>
                    <span className={styles.value}>
                      {student ? `${student.first_name} ${student.last_name}` : 'Unknown Student'}
                    </span>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Student ID</span>
                    <span className={styles.value}>
                      {student?.student_id || 'N/A'}
                    </span>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Email</span>
                    <span className={styles.value}>
                      {student?.email || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Academic Information Section */}
              <div className={styles.section}>
                <h3>Academic Information</h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Major/Program</span>
                    <span className={styles.value}>
                      {application.major || 'N/A'}
                    </span>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <span className={styles.label}>GPA</span>
                    <span className={styles.value}>
                      {application.gpa || 'N/A'}
                    </span>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Expected Graduation</span>
                    <span className={styles.value}>
                      {formatDate(application.expected_graduation)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Resume Section */}
              <div className={styles.section}>
                <h3>Resume</h3>
                {resumeUrl ? (
                  <div className={styles.resumeContainer}>
                    <p>Resume is available for viewing or download:</p>
                    <div className={styles.resumeActions}>
                      <a 
                        href={resumeUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles.viewButton}
                      >
                        View Resume
                      </a>
                      <a 
                        href={resumeUrl} 
                        download={`${student?.last_name || 'student'}_resume.pdf`}
                        className={styles.downloadButton}
                      >
                        Download Resume
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className={styles.resumeContainer}>
                    <p className={styles.noResume}>
                      {application.resume_url 
                        ? (
                          <>
                            <span>Resume URL exists but cannot be accessed directly. </span>
                            <button 
                              onClick={async () => {
                                // Create a direct link to the resume bypassing the signed URL
                                const filename = application.resume_url.split('/').pop();
                                const directUrl = `${window.location.origin}/api/resumes/${application.id}`;
                                window.open(directUrl, '_blank');
                              }}
                              className={styles.alternateDownloadButton}
                            >
                              Try Alternate Method
                            </button>
                            <div className={styles.resumePathInfo}>
                              <details>
                                <summary>Resume Path Info (Debug)</summary>
                                <pre className={styles.codeBlock}>
                                  {application.resume_url}
                                </pre>
                              </details>
                            </div>
                          </>
                        ) 
                        : 'No resume uploaded with this application.'}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Review Information Section */}
              <div className={styles.section}>
                <h3>Review Information</h3>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Application Status</span>
                    <span className={styles.value}>
                      <span className={`${styles.statusPill} ${getStatusBadgeClass(application.status)}`}>
                        {application.status}
                      </span>
                    </span>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Review Date</span>
                    <span className={styles.value}>
                      {formatDate(application.review_date) || 'Not yet reviewed'}
                    </span>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <span className={styles.label}>Comments</span>
                    <span className={styles.value}>
                      {application.comments || 'No comments added'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Add Comments Section */}
              <div className={styles.section}>
                <h3>Add Comments</h3>
                <div className={styles.commentsForm}>
                  <textarea 
                    className={styles.commentsInput}
                    placeholder="Add your comments about this application..."
                    value={application.comments || ''}
                    onChange={(e) => setApplication(prev => ({ ...prev, comments: e.target.value }))}
                  />
                  <button 
                    className={styles.saveButton}
                    onClick={async () => {
                      try {
                        const { error } = await supabase
                          .from('applications')
                          .update({ comments: application.comments })
                          .eq('id', application.id);
                          
                        if (error) throw error;
                        showSuccess('Comments saved successfully');
                      } catch (err) {
                        showError('Failed to save comments');
                        console.error(err);
                      }
                    }}
                  >
                    Save Comments
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.notFound}>
            <h2>Application Not Found</h2>
            <p>The application you are looking for does not exist or has been removed.</p>
            <button onClick={() => router.push('/admin/applications')} className={styles.returnButton}>
              Return to Applications
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 