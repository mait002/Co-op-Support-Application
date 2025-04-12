'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '../../components/MainLayout';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import { getStudentEvaluations } from '../../../lib/api';
import styles from './evaluations.module.css';

export default function StudentEvaluations() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  
  const [evaluations, setEvaluations] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState(null);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      showInfo('Please log in to access your evaluations');
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router, showInfo]);
  
  // Fetch evaluations when the student evaluations page loads
  useEffect(() => {
    const fetchEvaluations = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoadingData(true);
        setError(null);
        
        const data = await getStudentEvaluations(user.id);
        setEvaluations(data);
        
      } catch (err) {
        console.error('Error fetching evaluations:', err);
        setError(err.message);
        showError('Failed to load evaluations. Please try again later.');
      } finally {
        setIsLoadingData(false);
      }
    };
    
    if (user) {
      fetchEvaluations();
    }
  }, [user, showError]);
  
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
          <Link href="/student/dashboard" className={styles.backLink}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={styles.backIcon}>
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </Link>
          <h1>Work Term Evaluations</h1>
          <p>View evaluations submitted by your employers</p>
        </div>
        
        {isLoadingData ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading evaluations...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => router.push('/student/dashboard')} className={styles.returnButton}>
              Return to Dashboard
            </button>
          </div>
        ) : evaluations.length === 0 ? (
          <div className={styles.emptyState}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.emptyIcon}>
              <path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 3A1.5 1.5 0 0012 4.5h4.5A1.5 1.5 0 0015 3h-1.5z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V9.375zM6 12a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V12zm2.25 0a.75.75 0 01.75-.75h3.75a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75zM6 15a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V15zm2.25 0a.75.75 0 01.75-.75h3.75a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75zM6 18a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V18zm2.25 0a.75.75 0 01.75-.75h3.75a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75z" clipRule="evenodd" />
            </svg>
            <h2>No Evaluations Found</h2>
            <p>You don't have any work term evaluations yet.</p>
          </div>
        ) : (
          <div className={styles.evaluationsContainer}>
            {evaluations.map(evaluation => (
              <div key={evaluation.id} className={styles.evaluationCard}>
                <div className={styles.evaluationHeader}>
                  <h2>{evaluation.work_term} Evaluation</h2>
                  <span className={`${styles.statusBadge} ${styles[evaluation.status]}`}>
                    {evaluation.status}
                  </span>
                </div>
                
                <div className={styles.employerInfo}>
                  <h3>Employer</h3>
                  <div className={styles.infoRow}>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Supervisor:</span>
                      <span>{evaluation.employer.first_name} {evaluation.employer.last_name}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Company:</span>
                      <span>{evaluation.employer.company_name || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                {/* Only show evaluation details if status is approved */}
                {evaluation.status === 'approved' && (
                  <div className={styles.evaluationDetails}>
                    <h3>Evaluation Details</h3>
                    
                    {evaluation.evaluation_url ? (
                      <div className={styles.pdfContainer}>
                        <a 
                          href={evaluation.evaluation_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={styles.pdfLink}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.pdfIcon}>
                            <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z" />
                            <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
                          </svg>
                          View Evaluation PDF
                        </a>
                      </div>
                    ) : evaluation.evaluation_data ? (
                      <div className={styles.evaluationData}>
                        <div className={styles.dataRow}>
                          <div className={styles.dataItem}>
                            <span className={styles.label}>Performance Rating:</span>
                            <span className={styles.rating}>{evaluation.evaluation_data.performance_rating} / 5</span>
                          </div>
                        </div>
                        
                        <div className={styles.dataRow}>
                          <div className={styles.dataItem}>
                            <span className={styles.label}>Technical Skills:</span>
                            <p className={styles.textContent}>{evaluation.evaluation_data.technical_skills}</p>
                          </div>
                        </div>
                        
                        <div className={styles.dataRow}>
                          <div className={styles.dataItem}>
                            <span className={styles.label}>Communication:</span>
                            <p className={styles.textContent}>{evaluation.evaluation_data.communication}</p>
                          </div>
                        </div>
                        
                        <div className={styles.dataRow}>
                          <div className={styles.dataItem}>
                            <span className={styles.label}>Teamwork:</span>
                            <p className={styles.textContent}>{evaluation.evaluation_data.teamwork}</p>
                          </div>
                        </div>
                        
                        <div className={styles.dataRow}>
                          <div className={styles.dataItem}>
                            <span className={styles.label}>Initiative:</span>
                            <p className={styles.textContent}>{evaluation.evaluation_data.initiative}</p>
                          </div>
                        </div>
                        
                        <div className={styles.dataRow}>
                          <div className={styles.dataItem}>
                            <span className={styles.label}>Strengths:</span>
                            <p className={styles.textContent}>{evaluation.evaluation_data.strengths}</p>
                          </div>
                        </div>
                        
                        <div className={styles.dataRow}>
                          <div className={styles.dataItem}>
                            <span className={styles.label}>Areas for Improvement:</span>
                            <p className={styles.textContent}>{evaluation.evaluation_data.areas_of_improvement}</p>
                          </div>
                        </div>
                        
                        {evaluation.evaluation_data.additional_comments && (
                          <div className={styles.dataRow}>
                            <div className={styles.dataItem}>
                              <span className={styles.label}>Additional Comments:</span>
                              <p className={styles.textContent}>{evaluation.evaluation_data.additional_comments}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={styles.noData}>
                        <p>No evaluation details available.</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Show status information for non-approved evaluations */}
                {evaluation.status !== 'approved' && (
                  <div className={styles.statusInfo}>
                    {evaluation.status === 'pending' && (
                      <p>The employer has not submitted an evaluation yet.</p>
                    )}
                    
                    {evaluation.status === 'submitted' && (
                      <p>The evaluation has been submitted and is waiting for admin approval.</p>
                    )}
                    
                    {evaluation.status === 'rejected' && (
                      <p>The evaluation was rejected. The employer may submit a revised evaluation.</p>
                    )}
                  </div>
                )}
                
                <div className={styles.dates}>
                  <div className={styles.dateItem}>
                    <span className={styles.label}>Assignment Date:</span>
                    <span>{formatDate(evaluation.submission_date)}</span>
                  </div>
                  
                  {evaluation.review_date && (
                    <div className={styles.dateItem}>
                      <span className={styles.label}>Review Date:</span>
                      <span>{formatDate(evaluation.review_date)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
} 