'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '../../components/MainLayout';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import { getWorkTermReports } from '../../../lib/api';
import styles from './reports.module.css';

export default function AdminReports() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, userRole } = useAuth();
  const { showError, showInfo } = useToast();
  
  // Get filters from URL
  const typeParam = searchParams.get('type') || 'all';
  
  // State for reports
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState(typeParam);
  
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
  
  // Load reports
  useEffect(() => {
    const fetchReports = async () => {
      if (!isAuthenticated || userRole !== 'admin') return;
      
      try {
        setIsLoading(true);
        
        // Apply filters for the API call
        const filters = {};
        
        if (typeFilter !== 'all') {
          filters.type = typeFilter;
        }
        
        const data = await getWorkTermReports(filters);
        
        setReports(data);
        
        // Initial filtering based on searchTerm if it exists
        if (searchTerm) {
          applySearchFilter(data, searchTerm);
        } else {
          setFilteredReports(data);
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
        showError('Failed to load work term reports');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReports();
  }, [isAuthenticated, userRole, typeFilter, showError]);
  
  // Apply search filter function
  const applySearchFilter = (data, term) => {
    if (!term) {
      return data;
    }
    
    const searchLower = term.toLowerCase();
    return data.filter(report => {
      if (!report.student) return false;
      
      const studentName = `${report.student.first_name} ${report.student.last_name}`.toLowerCase();
      const studentId = (report.student.student_id || '').toLowerCase();
      
      return studentName.includes(searchLower) || studentId.includes(searchLower);
    });
  };
  
  // Handle search input
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Apply client-side filtering
    const filtered = applySearchFilter(reports, value);
    setFilteredReports(filtered);
  };
  
  // Handle type filter change
  const handleTypeFilterChange = (type) => {
    setTypeFilter(type);
    updateUrlParams({ type });
  };
  
  // Update URL params without navigation
  const updateUrlParams = (params) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === 'all') {
        newSearchParams.delete(key);
      } else {
        newSearchParams.set(key, value);
      }
    });
    
    const newUrl = newSearchParams.toString()
      ? `/admin/reports?${newSearchParams.toString()}`
      : '/admin/reports';
    
    router.push(newUrl);
  };
  
  // Format work term name
  const formatWorkTerm = (workTerm) => {
    if (!workTerm) return 'N/A';
    
    return workTerm.charAt(0).toUpperCase() + workTerm.slice(1);
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
            <h1>Work Term Reports</h1>
            <p>Review all submitted work term reports and their respective evaluation status</p>
          </div>
        </div>
        
        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search by student name or ID..."
              value={searchTerm}
              onChange={handleSearch}
              className={styles.searchInput}
            />
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={styles.searchIcon}>
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
          </div>
          
          <div className={styles.filterGroup}>
            <div className={styles.filterLabel}>Type:</div>
            <div className={styles.filterButtons}>
              <button 
                className={`${styles.filterButton} ${typeFilter === 'all' ? styles.active : ''}`}
                onClick={() => handleTypeFilterChange('all')}
              >
                All
              </button>
              <button 
                className={`${styles.filterButton} ${typeFilter === 'interim' ? styles.active : ''}`}
                onClick={() => handleTypeFilterChange('interim')}
              >
                Interim
              </button>
              <button 
                className={`${styles.filterButton} ${typeFilter === 'final' ? styles.active : ''}`}
                onClick={() => handleTypeFilterChange('final')}
              >
                Final
              </button>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading work term reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z" />
                <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
              </svg>
            </div>
            <h2>No Reports Found</h2>
            <p>
              {searchTerm 
                ? 'No reports match your search criteria.' 
                : typeFilter !== 'all'
                  ? `No ${typeFilter} reports found.`
                  : 'No work term reports have been submitted yet.'}
            </p>
          </div>
        ) : (
          <div className={styles.reportsTable}>
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>Work Term</th>
                  <th>Report Type</th>
                  <th>Submission Date</th>
                  <th>Evaluation Status</th>
                  <th className={styles.actionsColumn}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map(report => (
                  <tr key={report.id}>
                    <td>
                      {report.student.first_name} {report.student.last_name}
                    </td>
                    <td>{report.student.student_id || 'N/A'}</td>
                    <td>{formatWorkTerm(report.work_term)}</td>
                    <td>
                      <span className={styles[report.report_type]}>
                        {report.report_type === 'interim' ? 'Interim' : 'Final'}
                      </span>
                    </td>
                    <td>{formatDate(report.submission_date || report.created_at)}</td>
                    <td>
                      <span className={`${styles.evaluationStatusBadge} ${styles[report.evaluation_status]}`}>
                        {report.evaluation_status || 'pending'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <a 
                          href={report.report_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={styles.viewButton}
                        >
                          View Report
                        </a>
                      </div>
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