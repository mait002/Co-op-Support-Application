'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '../../../../components/MainLayout';
import { useAuth } from '../../../../components/AuthContext';
import { useToast } from '../../../../components/ToastContext';
import { supabase } from '../../../../../lib/supabase';
import styles from './details.module.css';

export default function EvaluationDetailsPage({ params }) {
  const router = useRouter();
  const { isAuthenticated, userRole } = useAuth();
  const { showError, showInfo } = useToast();
  
  const [evaluationForm, setEvaluationForm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const evaluationId = params.id;
  
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
  
  // Fetch evaluation form details
  useEffect(() => {
    const fetchEvaluationDetails = async () => {
      if (!isAuthenticated || userRole !== 'admin' || !evaluationId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch the evaluation form with employer details
        const { data, error } = await supabase
          .from('employer_evaluation_forms')
          .select(`
            *,
            employer:profiles!employer_id (
              id,
              first_name,
              last_name,
              email,
              company_name,
              company_position
            )
          `)
          .eq('id', evaluationId)
          .single();
          
        if (error) {
          throw new Error(error.message);
        }
        
        if (!data) {
          throw new Error('Evaluation form not found');
        }
        
        setEvaluationForm(data);
      } catch (error) {
        console.error('Error fetching evaluation details:', error);
        setError(error.message);
        showError(`Failed to load evaluation details: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvaluationDetails();
  }, [evaluationId, isAuthenticated, userRole, showError]);
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <MainLayout>
      <div className="container">
        <div className={styles.pageHeader}>
          <Link href="/admin/evaluations" className={styles.backLink}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={styles.backIcon}>
              <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
            </svg>
            Back to Evaluations
          </Link>
          <h1>Evaluation Form Details</h1>
        </div>
        
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading evaluation details...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => router.back()} className={styles.backButton}>
              Go Back
            </button>
          </div>
        ) : evaluationForm ? (
          <div className={styles.detailsContainer}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Student Information</h2>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Name</div>
                  <div className={styles.detailValue}>{evaluationForm.student_name}</div>
                </div>
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Email</div>
                  <div className={styles.detailValue}>{evaluationForm.student_email}</div>
                </div>
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Work Term</div>
                  <div className={styles.detailValue}>{evaluationForm.work_term}</div>
                </div>
              </div>
            </div>
            
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Employer Information</h2>
              </div>
              <div className={styles.cardContent}>
                {evaluationForm.employer ? (
                  <>
                    <div className={styles.detailRow}>
                      <div className={styles.detailLabel}>Name</div>
                      <div className={styles.detailValue}>
                        {evaluationForm.employer.first_name} {evaluationForm.employer.last_name}
                      </div>
                    </div>
                    {evaluationForm.employer.email && (
                      <div className={styles.detailRow}>
                        <div className={styles.detailLabel}>Email</div>
                        <div className={styles.detailValue}>{evaluationForm.employer.email}</div>
                      </div>
                    )}
                    {evaluationForm.employer.company_name && (
                      <div className={styles.detailRow}>
                        <div className={styles.detailLabel}>Company</div>
                        <div className={styles.detailValue}>{evaluationForm.employer.company_name}</div>
                      </div>
                    )}
                    {evaluationForm.employer.company_position && (
                      <div className={styles.detailRow}>
                        <div className={styles.detailLabel}>Position</div>
                        <div className={styles.detailValue}>{evaluationForm.employer.company_position}</div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className={styles.missingInfo}>Employer information not available</p>
                )}
              </div>
            </div>
            
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Performance Ratings</h2>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.ratingsGrid}>
                  <div className={styles.ratingCard}>
                    <div className={styles.ratingTitle}>Knowledge</div>
                    <div className={styles.ratingValue}>{evaluationForm.knowledge}</div>
                    <div className={styles.ratingDescription}>Technical and subject matter knowledge</div>
                  </div>
                  <div className={styles.ratingCard}>
                    <div className={styles.ratingTitle}>Skills</div>
                    <div className={styles.ratingValue}>{evaluationForm.skills}</div>
                    <div className={styles.ratingDescription}>Applied skills and problem-solving</div>
                  </div>
                  <div className={styles.ratingCard}>
                    <div className={styles.ratingTitle}>Behaviour</div>
                    <div className={styles.ratingValue}>{evaluationForm.behaviour}</div>
                    <div className={styles.ratingDescription}>Workplace conduct and teamwork</div>
                  </div>
                  <div className={styles.ratingCard}>
                    <div className={styles.ratingTitle}>Attitude</div>
                    <div className={styles.ratingValue}>{evaluationForm.attitude}</div>
                    <div className={styles.ratingDescription}>Enthusiasm and willingness to learn</div>
                  </div>
                </div>
                
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Average Rating</div>
                  <div className={styles.averageRating}>
                    {((evaluationForm.knowledge + evaluationForm.skills + evaluationForm.behaviour + evaluationForm.attitude) / 4).toFixed(1)}
                    <span className={styles.outOf}>/5</span>
                  </div>
                </div>
              </div>
            </div>
            
            {evaluationForm.comments && (
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2>Additional Comments</h2>
                </div>
                <div className={styles.cardContent}>
                  <div className={styles.comments}>
                    {evaluationForm.comments}
                  </div>
                </div>
              </div>
            )}
            
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2>Submission Information</h2>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Submission Date</div>
                  <div className={styles.detailValue}>{formatDate(evaluationForm.submission_date)}</div>
                </div>
                <div className={styles.detailRow}>
                  <div className={styles.detailLabel}>Form ID</div>
                  <div className={styles.detailValue}>
                    <code>{evaluationForm.id}</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <h2>Evaluation Not Found</h2>
            <p>The requested evaluation could not be found.</p>
            <button onClick={() => router.back()} className={styles.backButton}>
              Go Back
            </button>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 