'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '../../components/MainLayout';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import { getAllEmployerEvaluationForms } from '../../../lib/api';
import styles from './evaluations.module.css';

export default function AdminEvaluations() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, userRole } = useAuth();
  const { showError, showInfo } = useToast();
  
  // State for evaluations
  const [evaluationForms, setEvaluationForms] = useState([]);
  const [filteredForms, setFilteredForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [workTermFilter, setWorkTermFilter] = useState('all');
  
  // Available work terms (will be populated from the data)
  const [availableWorkTerms, setAvailableWorkTerms] = useState([]);
  
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
  
  // Load evaluations
  useEffect(() => {
    const fetchEvaluationForms = async () => {
      if (!isAuthenticated || userRole !== 'admin') return;
      
      try {
        setIsLoading(true);
        
        const data = await getAllEmployerEvaluationForms();
        
        setEvaluationForms(data);
        
        // Apply initial filtering
        applyFilters(data, searchTerm, workTermFilter);
        
        // Extract unique work terms
        const uniqueWorkTerms = [...new Set(data.map(form => form.work_term))].filter(Boolean);
        setAvailableWorkTerms(uniqueWorkTerms);
      } catch (error) {
        console.error('Error fetching evaluation forms:', error);
        showError('Failed to load employer evaluation forms');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvaluationForms();
  }, [isAuthenticated, userRole, showError]);
  
  // Apply filters function
  const applyFilters = (forms, search, workTerm) => {
    let filtered = forms;
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(form => {
        const studentName = form.student_name.toLowerCase();
        const employerName = `${form.employer?.first_name || ''} ${form.employer?.last_name || ''}`.toLowerCase();
        const companyName = (form.employer?.company_name || '').toLowerCase();
        
        return studentName.includes(searchLower) || 
               employerName.includes(searchLower) || 
               companyName.includes(searchLower);
      });
    }
    
    // Apply work term filter
    if (workTerm !== 'all') {
      filtered = filtered.filter(form => form.work_term === workTerm);
    }
    
    setFilteredForms(filtered);
  };
  
  // Handle search input
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    applyFilters(evaluationForms, value, workTermFilter);
  };
  
  // Handle work term filter change
  const handleWorkTermFilterChange = (workTerm) => {
    setWorkTermFilter(workTerm);
    applyFilters(evaluationForms, searchTerm, workTerm);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Calculate average rating
  const calculateAverageRating = (form) => {
    const ratings = [form.knowledge, form.skills, form.behaviour, form.attitude];
    const sum = ratings.reduce((acc, val) => acc + val, 0);
    return (sum / ratings.length).toFixed(1);
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
            <h1>Employer Evaluations</h1>
            <p>Review all employer evaluation forms submitted in the system</p>
          </div>
        </div>
        
        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search by student, employer, or company name..."
              value={searchTerm}
              onChange={handleSearch}
              className={styles.searchInput}
            />
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={styles.searchIcon}>
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
          </div>
          
          {availableWorkTerms.length > 0 && (
            <div className={styles.filterGroup}>
              <div className={styles.filterLabel}>Work Term:</div>
              <div className={styles.filterButtons}>
                <button 
                  className={`${styles.filterButton} ${workTermFilter === 'all' ? styles.active : ''}`}
                  onClick={() => handleWorkTermFilterChange('all')}
                >
                  All
                </button>
                {availableWorkTerms.map(workTerm => (
                  <button 
                    key={workTerm}
                    className={`${styles.filterButton} ${workTermFilter === workTerm ? styles.active : ''}`}
                    onClick={() => handleWorkTermFilterChange(workTerm)}
                  >
                    {workTerm}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading employer evaluations...</p>
          </div>
        ) : filteredForms.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.625 16.5a1.875 1.875 0 100-3.75 1.875 1.875 0 000 3.75z" />
                <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zm6 16.5c.66 0 1.277-.19 1.797-.518l1.048 1.048a.75.75 0 001.06-1.06l-1.047-1.048A3.375 3.375 0 1011.625 18z" clipRule="evenodd" />
                <path d="M14.25 5.25a5.23 5.23 0 00-1.279-3.434 9.768 9.768 0 016.963 6.963A5.23 5.23 0 0016.5 7.5h-1.875a.375.375 0 01-.375-.375V5.25z" />
              </svg>
            </div>
            <h2>No Evaluation Forms Found</h2>
            <p>
              {searchTerm 
                ? 'No evaluation forms match your search criteria.' 
                : workTermFilter !== 'all'
                  ? `No evaluation forms found for the "${workTermFilter}" work term.`
                  : 'No employer evaluation forms have been submitted yet.'}
            </p>
          </div>
        ) : (
          <div className={styles.evaluationsTable}>
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Employer</th>
                  <th>Company</th>
                  <th>Work Term</th>
                  <th>Avg. Rating</th>
                  <th>Submission Date</th>
                  <th className={styles.actionsColumn}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredForms.map(form => (
                  <tr key={form.id}>
                    <td>
                      <div className={styles.studentName}>{form.student_name}</div>
                      <div className={styles.studentEmail}>{form.student_email}</div>
                    </td>
                    <td>
                      {form.employer ? (
                        <div>{form.employer.first_name} {form.employer.last_name}</div>
                      ) : (
                        <div className={styles.missingInfo}>Unknown</div>
                      )}
                    </td>
                    <td>
                      {form.employer?.company_name ? (
                        <div>{form.employer.company_name}</div>
                      ) : (
                        <div className={styles.missingInfo}>Not specified</div>
                      )}
                      {form.employer?.company_position && (
                        <div className={styles.companyPosition}>{form.employer.company_position}</div>
                      )}
                    </td>
                    <td>{form.work_term}</td>
                    <td>
                      <div className={styles.averageRating}>
                        {calculateAverageRating(form)}
                        <span className={styles.outOf}>/5</span>
                      </div>
                      <div className={styles.ratingBreakdown}>
                        K: {form.knowledge} | S: {form.skills} | B: {form.behaviour} | A: {form.attitude}
                      </div>
                    </td>
                    <td>{formatDate(form.submission_date)}</td>
                    <td>
                      <button 
                        className={styles.viewDetailsButton}
                        onClick={() => router.push(`/admin/evaluations/details/${form.id}`)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 