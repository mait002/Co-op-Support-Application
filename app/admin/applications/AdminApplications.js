'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MainLayout from '../../components/MainLayout';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import { supabase } from '../../../lib/supabase';
import styles from './applications.module.css';

export default function AdminApplications() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, userRole } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  
  // Get status filter from URL
  const statusParam = searchParams.get('status') || 'all';
  
  // State for applications
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(statusParam);
  
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
  
  // Load applications
  useEffect(() => {
    const fetchApplications = async () => {
      if (!isAuthenticated || userRole !== 'admin') return;
      
      try {
        setIsLoading(true);
        
        // Use the RPC function for more reliable access
        const { data: appData, error: appError } = await supabase
          .rpc('get_all_applications');
          
        if (appError) {
          console.error('Error fetching applications:', appError);
          throw new Error(`Failed to fetch applications: ${appError.message}`);
        }
        
        // Get student profiles for the applications
        const studentIds = [...new Set(appData.map(app => app.student_id))];
        
        // Fetch all relevant student profiles
        const { data: studentData, error: studentError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, student_id, email')
          .in('id', studentIds);
          
        if (studentError) {
          console.error('Error fetching student profiles:', studentError);
        }
        
        // Create a lookup map for student data
        const studentMap = {};
        if (studentData) {
          studentData.forEach(student => {
            studentMap[student.id] = student;
          });
        }
        
        // Process and format applications
        const formattedApplications = appData.map(app => {
          const student = studentMap[app.student_id] || {};
          
          // Format date properly
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
            status: app.status || 'pending',
            created_at: formattedDate,
            major: app.major || 'N/A',
            student: {
              first_name: student.first_name || 'Unknown',
              last_name: student.last_name || 'Student',
              student_id: student.student_id || 'N/A',
              email: student.email || 'N/A'
            }
          };
        });
        
        // Apply any additional filtering based on status
        let filtered = formattedApplications;
        if (statusFilter !== 'all') {
          filtered = formattedApplications.filter(app => app.status === statusFilter);
        }
        
        // Apply any search filtering
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          filtered = filtered.filter(app => 
            `${app.student.first_name} ${app.student.last_name}`.toLowerCase().includes(term) ||
            app.student.student_id.toLowerCase().includes(term) ||
            app.major.toLowerCase().includes(term)
          );
        }
        
        setApplications(formattedApplications);
        setFilteredApplications(filtered);
      } catch (error) {
        console.error('Error fetching applications:', error);
        showError('Failed to load applications');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchApplications();
  }, [isAuthenticated, userRole, statusFilter, searchTerm, showError]);
  
  // Handle search input
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    
    // Update URL without reloading the page
    const url = status === 'all' 
      ? '/admin/applications'
      : `/admin/applications?status=${status}`;
    
    router.push(url);
  };
  
  // Handle application status update
  const handleUpdateStatus = async (applicationId, newStatus) => {
    try {
      // Use Supabase directly instead of the API function
      const { error } = await supabase
        .from('applications')
        .update({
          status: newStatus,
          review_date: new Date().toISOString(),
          reviewed_by: user?.id
        })
        .eq('id', applicationId);
        
      if (error) {
        console.error('Error updating application status:', error);
        throw new Error(`Failed to update application: ${error.message}`);
      }
      
      // Update local state
      const updatedApplications = applications.map(app => {
        if (app.id === applicationId) {
          return { ...app, status: newStatus };
        }
        return app;
      });
      
      setApplications(updatedApplications);
      
      // If filtering is applied, the application might need to be removed from view
      if (statusFilter !== 'all' && statusFilter !== newStatus) {
        setFilteredApplications(prev => prev.filter(app => app.id !== applicationId));
      } else {
        setFilteredApplications(updatedApplications);
      }
      
      showSuccess(`Application ${newStatus} successfully`);
    } catch (error) {
      console.error('Error updating application status:', error);
      showError('Failed to update application status');
    }
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
            <h1>Student Applications</h1>
            <p>Review and manage student applications for the co-op program</p>
          </div>
        </div>
        
        <div className={styles.filterBar}>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Search by name, ID or major..."
              value={searchTerm}
              onChange={handleSearch}
              className={styles.searchInput}
            />
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={styles.searchIcon}>
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
          </div>
          
          <div className={styles.filterOptions}>
            <div className={styles.filterLabel}>Filter by status:</div>
            <div className={styles.filterButtons}>
              <button 
                className={`${styles.filterButton} ${statusFilter === 'all' ? styles.active : ''}`}
                onClick={() => handleStatusFilterChange('all')}
              >
                All
              </button>
              <button 
                className={`${styles.filterButton} ${statusFilter === 'pending' ? styles.active : ''}`}
                onClick={() => handleStatusFilterChange('pending')}
              >
                Pending
              </button>
              <button 
                className={`${styles.filterButton} ${statusFilter === 'approved' ? styles.active : ''}`}
                onClick={() => handleStatusFilterChange('approved')}
              >
                Approved
              </button>
              <button 
                className={`${styles.filterButton} ${statusFilter === 'rejected' ? styles.active : ''}`}
                onClick={() => handleStatusFilterChange('rejected')}
              >
                Rejected
              </button>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zm6.905 9.97a.75.75 0 00-1.06 0l-3 3a.75.75 0 101.06 1.06l1.72-1.72V18a.75.75 0 001.5 0v-4.19l1.72 1.72a.75.75 0 101.06-1.06l-3-3z" clipRule="evenodd" />
                <path d="M14.25 5.25a5.23 5.23 0 00-1.279-3.434 9.768 9.768 0 016.963 6.963A5.23 5.23 0 0016.5 7.5h-1.875a.375.375 0 01-.375-.375V5.25z" />
              </svg>
            </div>
            <h2>No Applications Found</h2>
            <p>
              {searchTerm 
                ? 'No applications match your search criteria.' 
                : statusFilter !== 'all'
                  ? `No ${statusFilter} applications found.`
                  : 'No applications found in the system.'}
            </p>
          </div>
        ) : (
          <div className={styles.applicationsTable}>
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>Major</th>
                  <th>Submission Date</th>
                  <th>Status</th>
                  <th className={styles.actionsColumn}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map(application => (
                  <tr key={application.id}>
                    <td>
                      {application.student.first_name} {application.student.last_name}
                    </td>
                    <td>{application.student.student_id || 'N/A'}</td>
                    <td>{application.major || 'N/A'}</td>
                    <td>{application.created_at}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[application.status]}`}>
                        {application.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <Link href={`/admin/applications/${application.id}`} className={styles.viewButton}>
                          View Details
                        </Link>
                        
                        {application.status === 'pending' && (
                          <div className={styles.statusButtons}>
                            <button
                              onClick={() => handleUpdateStatus(application.id, 'approved')}
                              className={styles.approveButton}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(application.id, 'rejected')}
                              className={styles.rejectButton}
                            >
                              Reject
                            </button>
                          </div>
                        )}
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