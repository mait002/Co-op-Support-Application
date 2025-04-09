'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MainLayout from '../../components/MainLayout';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import styles from './dashboard.module.css';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, userRole } = useAuth();
  const { showError, showInfo } = useToast();
  
  // Redirect if not admin
  useEffect(() => {
    if (isAuthenticated && userRole !== 'admin') {
      showInfo("You don't have permission to access the admin dashboard.");
      router.push('/');
    } else if (!isAuthenticated) {
      showInfo("Please log in to access the admin dashboard.");
      router.push('/auth/login');
    }
  }, [isAuthenticated, userRole, router, showInfo]);
  
  // State for dashboard data
  const [dashboardData, setDashboardData] = useState({
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    pendingReports: 0,
    submittedReports: 0,
    pendingEvaluations: 0,
    submittedEvaluations: 0,
    isLoading: true
  });

  // Mock data for recent applications
  const [recentApplications, setRecentApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);

  // Mock data for recent reports
  const [recentReports, setRecentReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [applicationStatusFilter, setApplicationStatusFilter] = useState('all');
  const [reportTypeFilter, setReportTypeFilter] = useState('all');

  // Load dashboard data
  useEffect(() => {
    // In a real application, this would be an API call
    // Note for backend developer: 
    // Implement API endpoint GET /api/admin/dashboard that returns all the necessary dashboard data

    // Simulating API call
    const fetchDashboardData = async () => {
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate API response
        setDashboardData({
          pendingApplications: 12,
          approvedApplications: 45,
          rejectedApplications: 8,
          pendingReports: 15,
          submittedReports: 30,
          pendingEvaluations: 10,
          submittedEvaluations: 35,
          isLoading: false
        });

        // Simulate recent applications
        const applicationsData = [
          { id: 1, studentName: 'John Smith', studentId: 'ST12345', date: '2023-03-25', status: 'pending', major: 'Computer Science' },
          { id: 2, studentName: 'Sarah Johnson', studentId: 'ST12346', date: '2023-03-24', status: 'approved', major: 'Electrical Engineering' },
          { id: 3, studentName: 'Michael Brown', studentId: 'ST12347', date: '2023-03-23', status: 'rejected', major: 'Business Administration' },
          { id: 4, studentName: 'Emma Wilson', studentId: 'ST12348', date: '2023-03-22', status: 'pending', major: 'Psychology' },
          { id: 5, studentName: 'Robert Garcia', studentId: 'ST12349', date: '2023-03-21', status: 'approved', major: 'Mechanical Engineering' },
          { id: 6, studentName: 'Jessica Lee', studentId: 'ST12350', date: '2023-03-20', status: 'pending', major: 'Biology' },
          { id: 7, studentName: 'David Wang', studentId: 'ST12351', date: '2023-03-19', status: 'approved', major: 'Chemistry' },
        ];
        
        setRecentApplications(applicationsData);
        setFilteredApplications(applicationsData);

        // Simulate recent reports
        const reportsData = [
          { id: 1, studentName: 'John Smith', workTerm: 'Winter 2023', submissionDate: '2023-03-20', hasEvaluation: true, type: 'final' },
          { id: 2, studentName: 'Sarah Johnson', workTerm: 'Winter 2023', submissionDate: '2023-03-19', hasEvaluation: false, type: 'interim' },
          { id: 3, studentName: 'Robert Garcia', workTerm: 'Fall 2022', submissionDate: '2023-03-18', hasEvaluation: true, type: 'final' },
          { id: 4, studentName: 'Emma Wilson', workTerm: 'Fall 2022', submissionDate: '2023-03-17', hasEvaluation: false, type: 'interim' },
          { id: 5, studentName: 'David Lee', workTerm: 'Summer 2022', submissionDate: '2023-03-16', hasEvaluation: true, type: 'final' },
          { id: 6, studentName: 'Jessica Martinez', workTerm: 'Winter 2022', submissionDate: '2023-03-15', hasEvaluation: true, type: 'final' },
          { id: 7, studentName: 'Michael Rodriguez', workTerm: 'Fall 2021', submissionDate: '2023-03-14', hasEvaluation: false, type: 'interim' },
        ];
        
        setRecentReports(reportsData);
        setFilteredReports(reportsData);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        showError('Failed to load dashboard data. Please try again later.');
        setDashboardData(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchDashboardData();
  }, [showError]);
  
  // Filter applications based on search query and status filter
  useEffect(() => {
    let filtered = recentApplications;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.studentName.toLowerCase().includes(query) || 
        app.studentId.toLowerCase().includes(query) ||
        app.major.toLowerCase().includes(query)
      );
    }
    
    // Filter by status
    if (applicationStatusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === applicationStatusFilter);
    }
    
    setFilteredApplications(filtered);
  }, [searchQuery, applicationStatusFilter, recentApplications]);
  
  // Filter reports based on search query and type filter
  useEffect(() => {
    let filtered = recentReports;
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(report => 
        report.studentName.toLowerCase().includes(query) || 
        report.workTerm.toLowerCase().includes(query)
      );
    }
    
    // Filter by report type
    if (reportTypeFilter !== 'all') {
      filtered = filtered.filter(report => report.type === reportTypeFilter);
    }
    
    setFilteredReports(filtered);
  }, [searchQuery, reportTypeFilter, recentReports]);

  // Handle status change
  const handleStatusChange = (applicationId, newStatus) => {
    // In a real app, this would make an API call
    // For demo, we'll update the local state
    const updatedApplications = recentApplications.map(app => {
      if (app.id === applicationId) {
        return { ...app, status: newStatus };
      }
      return app;
    });
    
    setRecentApplications(updatedApplications);
    
    // Update dashboard stats
    const newStats = { ...dashboardData };
    if (newStatus === 'approved') {
      newStats.pendingApplications--;
      newStats.approvedApplications++;
    } else if (newStatus === 'rejected') {
      newStats.pendingApplications--;
      newStats.rejectedApplications++;
    }
    
    setDashboardData(newStats);
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
      <div className={`container ${styles.dashboardContainer}`}>
        <div className={styles.dashboardHeader}>
          <h1>Admin Dashboard</h1>
          <p>Overview of co-op program applications, reports, and evaluations</p>
        </div>

        {dashboardData.isLoading ? (
          <div className={styles.loadingState}>Loading dashboard data...</div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className={styles.statsGrid}>
              <div className={styles.statsCard}>
                <div className={styles.statsIcon} data-type="applications">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625Z" />
                    <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
                  </svg>
                </div>
                <div className={styles.statsContent}>
                  <div className={styles.statsValue}>{dashboardData.pendingApplications}</div>
                  <div className={styles.statsLabel}>Pending Applications</div>
                </div>
                <Link href="/admin/applications?status=pending" className={styles.statsLink}>
                  View All
                </Link>
              </div>

              <div className={styles.statsCard}>
                <div className={styles.statsIcon} data-type="approved">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className={styles.statsContent}>
                  <div className={styles.statsValue}>{dashboardData.approvedApplications}</div>
                  <div className={styles.statsLabel}>Approved Applications</div>
                </div>
                <Link href="/admin/applications?status=approved" className={styles.statsLink}>
                  View All
                </Link>
              </div>

              <div className={styles.statsCard}>
                <div className={styles.statsIcon} data-type="reports">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 0 1 3.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 0 1 3.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 0 1-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875Zm6.905 9.97a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 1 0 1.06 1.06l1.72-1.72V18a.75.75 0 0 0 1.5 0v-4.19l1.72 1.72a.75.75 0 1 0 1.06-1.06l-3-3Z" clipRule="evenodd" />
                    <path d="M14.25 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 16.5 7.5h-1.875a.375.375 0 0 1-.375-.375V5.25Z" />
                  </svg>
                </div>
                <div className={styles.statsContent}>
                  <div className={styles.statsValue}>{dashboardData.pendingReports}</div>
                  <div className={styles.statsLabel}>Pending Reports</div>
                </div>
                <Link href="/admin/reports?status=pending" className={styles.statsLink}>
                  View All
                </Link>
              </div>

              <div className={styles.statsCard}>
                <div className={styles.statsIcon} data-type="evaluations">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.7 2.805a.75.75 0 0 1 .6 0A60.65 60.65 0 0 1 22.83 8.72a.75.75 0 0 1-.231 1.337 49.948 49.948 0 0 0-9.902 3.912l-.003.002c-.114.06-.227.119-.34.18a.75.75 0 0 1-.707 0A50.88 50.88 0 0 0 7.5 12.173v-.224c0-.131.067-.248.172-.311a54.615 54.615 0 0 1 4.653-2.52.75.75 0 0 0-.65-1.352 56.123 56.123 0 0 0-4.78 2.589 1.858 1.858 0 0 0-.859 1.228 49.803 49.803 0 0 0-4.634-1.527.75.75 0 0 1-.231-1.337A60.653 60.653 0 0 1 11.7 2.805Z" />
                    <path d="M13.06 15.473a48.45 48.45 0 0 1 7.666-3.282c.134 1.414.22 2.843.255 4.284a.75.75 0 0 1-.46.71 47.87 47.87 0 0 0-8.105 4.342.75.75 0 0 1-.832 0 47.87 47.87 0 0 0-8.104-4.342.75.75 0 0 1-.461-.71c.035-1.442.121-2.87.255-4.286.921.304 1.83.634 2.726.99v1.27a1.5 1.5 0 0 0-.14 2.508c-.09.38-.222.753-.397 1.11.452.213.901.434 1.346.66a6.727 6.727 0 0 0 .551-1.607 1.5 1.5 0 0 0 .14-2.67v-.645a48.549 48.549 0 0 1 3.44 1.667 2.25 2.25 0 0 0 2.12 0Z" />
                  </svg>
                </div>
                <div className={styles.statsContent}>
                  <div className={styles.statsValue}>{dashboardData.pendingEvaluations}</div>
                  <div className={styles.statsLabel}>Pending Evaluations</div>
                </div>
                <Link href="/admin/evaluations?status=pending" className={styles.statsLink}>
                  View All
                </Link>
              </div>
            </div>
            
            {/* Search and Filter Bar */}
            <div className={styles.searchFilterBar}>
              <div className={styles.searchBox}>
                <input 
                  type="text" 
                  placeholder="Search by name, ID, or program..." 
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
                <span className={styles.filterLabel}>Application Status:</span>
                <select 
                  value={applicationStatusFilter} 
                  onChange={e => setApplicationStatusFilter(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Report Type:</span>
                <select 
                  value={reportTypeFilter} 
                  onChange={e => setReportTypeFilter(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Types</option>
                  <option value="interim">Interim</option>
                  <option value="final">Final</option>
                </select>
              </div>
            </div>

            {/* Recent Applications Table */}
            <div className={styles.tableCard}>
              <div className={styles.tableHeader}>
                <h2>Recent Applications</h2>
                <Link href="/admin/applications" className={styles.viewAllLink}>
                  View All Applications
                </Link>
              </div>

              <div className={styles.tableContainer}>
                {filteredApplications.length === 0 ? (
                  <div className={styles.noResults}>No applications found matching your search criteria.</div>
                ) : (
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
                      {filteredApplications.slice(0, 5).map(app => (
                        <tr key={app.id}>
                          <td>{app.studentName}</td>
                          <td>{app.studentId}</td>
                          <td>{app.major}</td>
                          <td>{app.date}</td>
                          <td><StatusBadge status={app.status} /></td>
                          <td>
                            <div className={styles.actionButtons}>
                              <button className={styles.actionButton} title="View Details">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                              </button>
                              {app.status === 'pending' && (
                                <>
                                  <button 
                                    className={`${styles.actionButton} ${styles.approveButton}`} 
                                    title="Approve"
                                    onClick={() => handleStatusChange(app.id, 'approved')}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                    </svg>
                                  </button>
                                  <button 
                                    className={`${styles.actionButton} ${styles.rejectButton}`} 
                                    title="Reject"
                                    onClick={() => handleStatusChange(app.id, 'rejected')}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                
                {filteredApplications.length > 5 && (
                  <div className={styles.tablePagination}>
                    <span>Showing 5 of {filteredApplications.length} applications</span>
                    <Link href="/admin/applications" className={styles.seeMoreLink}>
                      See More
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Reports Table */}
            <div className={styles.tableCard}>
              <div className={styles.tableHeader}>
                <h2>Recent Reports</h2>
                <Link href="/admin/reports" className={styles.viewAllLink}>
                  View All Reports
                </Link>
              </div>

              <div className={styles.tableContainer}>
                {filteredReports.length === 0 ? (
                  <div className={styles.noResults}>No reports found matching your search criteria.</div>
                ) : (
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Work Term</th>
                        <th>Report Type</th>
                        <th>Submission Date</th>
                        <th>Employer Evaluation</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReports.slice(0, 5).map(report => (
                        <tr key={report.id}>
                          <td>{report.studentName}</td>
                          <td>{report.workTerm}</td>
                          <td>
                            <span className={`${styles.badge} ${report.type === 'final' ? styles.badgePrimary : styles.badgeSecondary}`}>
                              {report.type}
                            </span>
                          </td>
                          <td>{report.submissionDate}</td>
                          <td>
                            {report.hasEvaluation ? (
                              <span className={`${styles.badge} ${styles.badgeSuccess}`}>Received</span>
                            ) : (
                              <span className={`${styles.badge} ${styles.badgePending}`}>Pending</span>
                            )}
                          </td>
                          <td>
                            <div className={styles.actionButtons}>
                              <button className={styles.actionButton} title="View Report">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                </svg>
                              </button>
                              {!report.hasEvaluation && (
                                <button className={styles.actionButton} title="Request Evaluation">
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                
                {filteredReports.length > 5 && (
                  <div className={styles.tablePagination}>
                    <span>Showing 5 of {filteredReports.length} reports</span>
                    <Link href="/admin/reports" className={styles.seeMoreLink}>
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

// Note for backend developer:
// This dashboard displays various statistics and data that should be retrieved from the database.
// Key API endpoints needed:
// 1. GET /api/admin/dashboard - Returns statistics (counts of applications, reports, evaluations by status)
// 2. GET /api/admin/applications?limit=5 - Returns recent applications
// 3. GET /api/admin/reports?limit=5 - Returns recent reports
// 4. PUT /api/admin/applications/:id/status - Updates application status
// 5. POST /api/admin/evaluations/reminder - Sends reminder email to employers 