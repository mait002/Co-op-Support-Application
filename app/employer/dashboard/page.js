'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MainLayout from '../../components/MainLayout';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import styles from './dashboard.module.css';

export default function EmployerDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, userRole } = useAuth();
  const { showError, showInfo } = useToast();
  
  // Redirect if not employer
  useEffect(() => {
    if (isAuthenticated && userRole !== 'employer') {
      showInfo("You don't have permission to access the employer dashboard.");
      router.push('/');
    } else if (!isAuthenticated) {
      showInfo("Please log in to access the employer dashboard.");
      router.push('/auth/login');
    }
  }, [isAuthenticated, userRole, router, showInfo]);
  
  // State for dashboard data
  const [dashboardData, setDashboardData] = useState({
    pendingEvaluations: 0,
    completedEvaluations: 0,
    activeStudents: 0,
    totalStudents: 0,
    isLoading: true
  });

  // Mock data for recent evaluations
  const [recentEvaluations, setRecentEvaluations] = useState([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState([]);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [evaluationStatusFilter, setEvaluationStatusFilter] = useState('all');

  // Load dashboard data
  useEffect(() => {
    // In a real application, this would be an API call
    // Note for backend developer: 
    // Implement API endpoint GET /api/employer/dashboard that returns all the necessary dashboard data

    // Simulating API call
    const fetchDashboardData = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate API response
        setDashboardData({
          pendingEvaluations: 5,
          completedEvaluations: 12,
          activeStudents: 8,
          totalStudents: 20,
          isLoading: false
        });

        // Simulate recent evaluations
        const evaluationsData = [
          { id: 1, studentName: 'John Smith', workTerm: 'Winter 2023', submissionDate: '2023-03-25', status: 'pending', type: 'final' },
          { id: 2, studentName: 'Sarah Johnson', workTerm: 'Winter 2023', submissionDate: '2023-03-24', status: 'completed', type: 'interim' },
          { id: 3, studentName: 'Michael Brown', workTerm: 'Winter 2023', submissionDate: '2023-03-23', status: 'pending', type: 'final' },
          { id: 4, studentName: 'Emma Wilson', workTerm: 'Fall 2022', submissionDate: '2023-03-22', status: 'completed', type: 'final' },
          { id: 5, studentName: 'Robert Garcia', workTerm: 'Fall 2022', submissionDate: '2023-03-21', status: 'completed', type: 'interim' },
        ];
        
        setRecentEvaluations(evaluationsData);
        setFilteredEvaluations(evaluationsData);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        showError('Failed to load dashboard data. Please try again later.');
        setDashboardData(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchDashboardData();
  }, [showError]);

  // Filter evaluations based on search query and status filter
  useEffect(() => {
    let filtered = recentEvaluations;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(eval => 
        eval.studentName.toLowerCase().includes(query) ||
        eval.workTerm.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (evaluationStatusFilter !== 'all') {
      filtered = filtered.filter(eval => eval.status === evaluationStatusFilter);
    }
    
    setFilteredEvaluations(filtered);
  }, [searchQuery, evaluationStatusFilter, recentEvaluations]);

  // Status badge component
  const StatusBadge = ({ status }) => {
    const badgeClass = {
      pending: styles.badgePending,
      completed: styles.badgeSuccess
    }[status] || styles.badgePending;

    return <span className={`${styles.badge} ${badgeClass}`}>{status}</span>;
  };

  return (
    <MainLayout>
      <div className={`container ${styles.dashboardContainer}`}>
        <div className={styles.dashboardHeader}>
          <h1>Employer Dashboard</h1>
          <p>Overview of student evaluations and co-op program management</p>
        </div>

        {dashboardData.isLoading ? (
          <div className={styles.loadingState}>Loading dashboard data...</div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className={styles.statsGrid}>
              <div className={styles.statsCard}>
                <div className={styles.statsIcon} data-type="evaluations">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.7 2.805a.75.75 0 0 1 .6 0A60.65 60.65 0 0 1 22.83 8.72a.75.75 0 0 1-.231 1.337 49.948 49.948 0 0 0-9.902 3.912l-.003.002c-.114.06-.227.119-.34.18a.75.75 0 0 1-.707 0A50.88 50.88 0 0 0 7.5 12.173v-.224c0-.131.067-.248.172-.311a54.615 54.615 0 0 1 4.653-2.52.75.75 0 0 0-.65-1.352 56.123 56.123 0 0 0-4.78 2.589 1.858 1.858 0 0 0-.859 1.228 49.803 49.803 0 0 0-4.634-1.527.75.75 0 0 1-.231-1.337A60.653 60.653 0 0 1 11.7 2.805Z" />
                  </svg>
                </div>
                <div className={styles.statsContent}>
                  <div className={styles.statsValue}>{dashboardData.pendingEvaluations}</div>
                  <div className={styles.statsLabel}>Pending Evaluations</div>
                </div>
                <Link href="/employer/evaluations?status=pending" className={styles.statsLink}>
                  View All
                </Link>
              </div>

              <div className={styles.statsCard}>
                <div className={styles.statsIcon} data-type="completed">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className={styles.statsContent}>
                  <div className={styles.statsValue}>{dashboardData.completedEvaluations}</div>
                  <div className={styles.statsLabel}>Completed Evaluations</div>
                </div>
                <Link href="/employer/evaluations?status=completed" className={styles.statsLink}>
                  View All
                </Link>
              </div>

              <div className={styles.statsCard}>
                <div className={styles.statsIcon} data-type="students">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4.5 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0zM14.25 8.625a3.375 3.375 0 1 1 6.75 0 3.375 3.375 0 0 1-6.75 0zM1.5 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 0 1-.233.96 10.088 10.088 0 0 0 5.06-1.01.75.75 0 0 0 .42-.643 4.875 4.875 0 0 0-6.957-4.611 8.586 8.586 0 0 1 1.71 5.157v.003z" />
                  </svg>
                </div>
                <div className={styles.statsContent}>
                  <div className={styles.statsValue}>{dashboardData.activeStudents}</div>
                  <div className={styles.statsLabel}>Active Students</div>
                </div>
                <Link href="/employer/students" className={styles.statsLink}>
                  View All
                </Link>
              </div>

              <div className={styles.statsCard}>
                <div className={styles.statsIcon} data-type="total">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 1 1 7.5 0 3.75 3.75 0 0 1-7.5 0ZM15.75 9.75a3 3 0 1 1 6 0 3 3 0 0 1-6 0ZM2.25 9.75a3 3 0 0 1 3-3h.75v.003h-.75a3 3 0 0 0-3 3ZM3.75 18.75a.75.75 0 0 1-.75-.75V7.5h-.75A3 3 0 0 0 0 10.5v6.75a3 3 0 0 0 3 3h1.5v-3.75a.75.75 0 0 1 .75-.75ZM21.75 9.75a3 3 0 0 0-3-3h-1.5v.003h.75a3 3 0 0 1 3 3v.75a.75.75 0 0 1-.75.75ZM21 18.75a.75.75 0 0 0-.75-.75H3a.75.75 0 0 0 0 1.5h18a.75.75 0 0 0 .75-.75ZM18 3.75h.75a3 3 0 0 1 3 3v.75H21V6.75a3 3 0 0 0-3-3h-1.5a.75.75 0 0 1 0-1.5ZM18 6.75h.75V9h-.75a.75.75 0 0 1 0-1.5ZM18 12.75h.75v1.5h-.75a.75.75 0 0 1 0-1.5ZM18 18.75h.75v1.5h-.75a.75.75 0 0 1 0-1.5Z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className={styles.statsContent}>
                  <div className={styles.statsValue}>{dashboardData.totalStudents}</div>
                  <div className={styles.statsLabel}>Total Students</div>
                </div>
                <Link href="/employer/students" className={styles.statsLink}>
                  View All
                </Link>
              </div>
            </div>
            
            {/* Search and Filter Bar */}
            <div className={styles.searchFilterBar}>
              <div className={styles.searchBox}>
                <input 
                  type="text" 
                  placeholder="Search by student name or work term..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                <button className={styles.searchButton}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                </button>
              </div>
              
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Evaluation Status:</span>
                <select 
                  value={evaluationStatusFilter} 
                  onChange={e => setEvaluationStatusFilter(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Recent Evaluations Table */}
            <div className={styles.tableCard}>
              <div className={styles.tableHeader}>
                <h2>Recent Evaluations</h2>
                <Link href="/employer/evaluations" className={styles.viewAllLink}>
                  View All Evaluations
                </Link>
              </div>

              <div className={styles.tableContainer}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Work Term</th>
                      <th>Submission Date</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvaluations.length === 0 ? (
                      <tr>
                        <td colSpan="6" className={styles.noResults}>
                          No evaluations found matching your criteria
                        </td>
                      </tr>
                    ) : (
                      filteredEvaluations.slice(0, 5).map(evaluation => (
                        <tr key={evaluation.id}>
                          <td>{evaluation.studentName}</td>
                          <td>{evaluation.workTerm}</td>
                          <td>{evaluation.submissionDate}</td>
                          <td>{evaluation.type}</td>
                          <td>
                            <StatusBadge status={evaluation.status} />
                          </td>
                          <td>
                            <div className={styles.actionButtons}>
                              <button className={styles.actionButton} title="View Details">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                              </button>
                              {evaluation.status === 'pending' && (
                                <button className={styles.actionButton} title="Complete Evaluation">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487 1.35 20.01a.75.75 0 0 0 1.06 1.06L19.14 5.63a.75.75 0 0 0-1.278-.143Z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                
                {filteredEvaluations.length > 5 && (
                  <div className={styles.tablePagination}>
                    <span>Showing 5 of {filteredEvaluations.length} evaluations</span>
                    <Link href="/employer/evaluations" className={styles.seeMoreLink}>
                      See More
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
} 