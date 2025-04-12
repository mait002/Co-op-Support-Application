'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '../../../../components/MainLayout';
import { useAuth } from '../../../../components/AuthContext';
import { useToast } from '../../../../components/ToastContext';
import { assignStudentToEmployer } from '../../../../../lib/api';
import styles from './assign.module.css';

export default function AssignEvaluator({ params }) {
  const router = useRouter();
  const { isAuthenticated, userRole } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const { reportId } = params;
  
  // State for report and employers
  const [report, setReport] = useState(null);
  const [employers, setEmployers] = useState([]);
  const [selectedEmployerId, setSelectedEmployerId] = useState('');
  const [workTerm, setWorkTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
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
  
  // Load report and employers
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated || userRole !== 'admin') return;
      
      try {
        setIsLoading(true);
        
        // Fetch report details - In a real app, this would be an API call
        // For demo purposes, we'll use mock data
        // TODO: Replace with actual API call to get report details
        const reportData = {
          id: reportId,
          student: {
            id: 'student-123',
            first_name: 'John',
            last_name: 'Smith',
            student_id: 'ST12345',
            email: 'john.smith@example.com'
          },
          work_term: 'winter 2023',
          report_type: 'final',
          status: 'pending',
          created_at: new Date().toISOString(),
          report_url: 'https://example.com/reports/1234'
        };
        
        setReport(reportData);
        setWorkTerm(reportData.work_term);
        
        // Fetch available employers - In a real app, this would be an API call
        // TODO: Replace with actual API call to get employers
        const employersData = [
          { id: 'emp-1', first_name: 'Robert', last_name: 'Johnson', company_name: 'Tech Solutions Inc.' },
          { id: 'emp-2', first_name: 'Sarah', last_name: 'Williams', company_name: 'Digital Innovations' },
          { id: 'emp-3', first_name: 'Michael', last_name: 'Brown', company_name: 'Global Systems' },
          { id: 'emp-4', first_name: 'Jennifer', last_name: 'Davis', company_name: 'Future Technologies' },
          { id: 'emp-5', first_name: 'David', last_name: 'Miller', company_name: 'Smart Applications' },
          { id: 'emp-6', first_name: 'Lisa', last_name: 'Wilson', company_name: 'Creative Software' },
          { id: 'emp-7', first_name: 'James', last_name: 'Moore', company_name: 'Innovative Solutions' },
        ];
        
        setEmployers(employersData);
      } catch (error) {
        console.error('Error fetching data:', error);
        showError('Failed to load report or employer data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [isAuthenticated, userRole, reportId, showError]);
  
  // Filter employers based on search term
  const filteredEmployers = employers.filter(employer => {
    if (!searchTerm) return true;
    
    const fullName = `${employer.first_name} ${employer.last_name}`.toLowerCase();
    const companyName = employer.company_name.toLowerCase();
    const term = searchTerm.toLowerCase();
    
    return fullName.includes(term) || companyName.includes(term);
  });
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedEmployerId) {
      showError('Please select an employer');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Call API to assign student to employer
      await assignStudentToEmployer(report.student.id, selectedEmployerId, workTerm);
      
      showSuccess('Student assigned to employer successfully');
      
      // Redirect back to reports page
      router.push('/admin/reports');
    } catch (error) {
      console.error('Error assigning student to employer:', error);
      showError('Failed to assign student to employer');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <MainLayout>
      <div className="container">
        <div className={styles.pageHeader}>
          <div>
            <Link href="/admin/reports" className={styles.backLink}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={styles.backIcon}>
                <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
              </svg>
              Back to Reports
            </Link>
            <h1>Assign Evaluator</h1>
            <p>Assign an employer to evaluate a student&apos;s work term report</p>
          </div>
        </div>
        
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading report data...</p>
          </div>
        ) : report ? (
          <div className={styles.assignContainer}>
            <div className={styles.reportInfo}>
              <h2>Work Term Report Details</h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoGroup}>
                  <label>Student:</label>
                  <div>{report.student.first_name} {report.student.last_name}</div>
                </div>
                <div className={styles.infoGroup}>
                  <label>Student ID:</label>
                  <div>{report.student.student_id}</div>
                </div>
                <div className={styles.infoGroup}>
                  <label>Email:</label>
                  <div>{report.student.email}</div>
                </div>
                <div className={styles.infoGroup}>
                  <label>Work Term:</label>
                  <div>{report.work_term.charAt(0).toUpperCase() + report.work_term.slice(1)}</div>
                </div>
                <div className={styles.infoGroup}>
                  <label>Report Type:</label>
                  <div className={styles[report.report_type]}>
                    {report.report_type === 'interim' ? 'Interim' : 'Final'}
                  </div>
                </div>
                <div className={styles.infoGroup}>
                  <label>Status:</label>
                  <div className={`${styles.statusBadge} ${styles[report.status]}`}>
                    {report.status}
                  </div>
                </div>
                <div className={styles.infoGroup}>
                  <label>Submission Date:</label>
                  <div>{new Date(report.created_at).toLocaleDateString()}</div>
                </div>
                <div className={styles.infoGroup}>
                  <label>View Report:</label>
                  <a href={report.report_url} target="_blank" rel="noopener noreferrer" className={styles.viewReportLink}>
                    View PDF
                  </a>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.assignForm}>
              <h2>Assign Employer</h2>
              
              <div className={styles.formGroup}>
                <label htmlFor="workTerm">Work Term:</label>
                <input
                  type="text"
                  id="workTerm"
                  value={workTerm}
                  onChange={(e) => setWorkTerm(e.target.value)}
                  required
                  className={styles.textInput}
                />
                <p className={styles.fieldHint}>
                  The work term this evaluation is for. Use format like &quot;winter 2023&quot;
                </p>
              </div>
              
              <div className={styles.formGroup}>
                <label>Select Employer:</label>
                <div className={styles.searchBox}>
                  <input
                    type="text"
                    placeholder="Search by name or company..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={styles.searchIcon}>
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                  </svg>
                </div>
                
                <div className={styles.employerList}>
                  {filteredEmployers.length === 0 ? (
                    <div className={styles.noResults}>
                      No employers found matching your search criteria
                    </div>
                  ) : (
                    filteredEmployers.map(employer => (
                      <div
                        key={employer.id}
                        className={`${styles.employerCard} ${selectedEmployerId === employer.id ? styles.selected : ''}`}
                        onClick={() => setSelectedEmployerId(employer.id)}
                      >
                        <div className={styles.employerRadio}>
                          <input
                            type="radio"
                            id={`employer-${employer.id}`}
                            name="employer"
                            value={employer.id}
                            checked={selectedEmployerId === employer.id}
                            onChange={() => setSelectedEmployerId(employer.id)}
                          />
                        </div>
                        <div className={styles.employerInfo}>
                          <div className={styles.employerName}>
                            {employer.first_name} {employer.last_name}
                          </div>
                          <div className={styles.companyName}>
                            {employer.company_name}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className={styles.formActions}>
                <Link href="/admin/reports" className={styles.cancelButton}>
                  Cancel
                </Link>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isSubmitting || !selectedEmployerId}
                >
                  {isSubmitting ? 'Assigning...' : 'Assign Employer'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className={styles.errorState}>
            <div className={styles.errorIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
            </div>
            <h2>Report Not Found</h2>
            <p>The report you are looking for could not be found or does not exist.</p>
            <Link href="/admin/reports" className={styles.returnButton}>
              Return to Reports
            </Link>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 