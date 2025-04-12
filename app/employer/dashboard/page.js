'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import { getAssignedStudents, getEmployerStudentReports, applyReportsAccessFix, updateEvaluationStatus } from '../../../lib/api';
import { supabase, getAdminClient } from '../../../lib/supabase';
import styles from './dashboard.module.css';

export default function EmployerDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [studentReports, setStudentReports] = useState({});
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isApplyingFix, setIsApplyingFix] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);

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

  // Function to fetch assigned students
  const fetchAssignedStudents = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoadingData(true);
      setLoadingError(null);
      
      // Get assigned students
      const data = await getAssignedStudents(user.id);
      
      // Validate the data before setting state
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format received');
      }
      
      // Filter out any assignments with missing student data
      const validAssignments = data.filter(assignment => 
        assignment && assignment.student && assignment.student.first_name
      );
      
      setAssignedStudents(validAssignments);
      
      // Get student IDs to fetch their reports and log them for debugging
      const studentIds = validAssignments.map(assignment => assignment.student_id);
      
      // Debug info to trace the issue
      const debug = {
        assignmentCount: validAssignments.length,
        studentIdsTrimmed: studentIds.map(id => typeof id === 'string' ? id.trim() : id),
        studentIds: studentIds
      };
      
      // Fetch reports for all assigned students
      if (studentIds.length > 0) {
        try {
          // Use the dedicated API function to fetch reports
          const reportsData = await getEmployerStudentReports(user.id, studentIds);
          
          if (reportsData && Array.isArray(reportsData)) {
            // Organize reports by student ID
            const reportsByStudent = {};
            reportsData.forEach(report => {
              if (!reportsByStudent[report.student_id]) {
                reportsByStudent[report.student_id] = [];
              }
              reportsByStudent[report.student_id].push(report);
            });
            
            setStudentReports(reportsByStudent);
          } else {
            console.error('Invalid reports data format:', reportsData);
          }
        } catch (error) {
          console.error('Exception while fetching reports:', error);
          showError("There was an issue fetching student reports. Some student data may be incomplete.");
        }
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoadingError(error.message);
      showError('Failed to load data: ' + error.message);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Fetch assigned students when the dashboard loads
  useEffect(() => {
    if (user) {
      fetchAssignedStudents();
    }
  }, [user]);

  // Filter students based on search term
  const filteredStudents = assignedStudents.filter(assignment => {
    // Skip items where student is null or undefined
    if (!assignment || !assignment.student) return false;
    
    const studentName = `${assignment.student.first_name} ${assignment.student.last_name}`.toLowerCase();
    const studentId = assignment.student.student_id?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    const workTerm = (assignment.work_term || '').toLowerCase();
    
    return studentName.includes(searchLower) || 
           studentId.includes(searchLower) || 
           workTerm.includes(searchLower);
  });

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

  // Apply database fix for employer reports access
  const handleApplyReportsFix = async () => {
    try {
      setIsApplyingFix(true);
      const result = await applyReportsAccessFix();
      if (result.success) {
        showSuccess(result.message);
        // Refetch the data
        await fetchAssignedStudents();
      } else {
        showError(result.error || 'Failed to apply fix');
      }
    } catch (error) {
      console.error('Error applying reports fix:', error);
      showError('Failed to apply fix: ' + error.message);
    } finally {
      setIsApplyingFix(false);
    }
  };

  // Function to handle status update for an evaluation
  const handleStatusUpdate = async (assignmentId, newStatus) => {
    try {
      setUpdatingStatus(assignmentId);
      const result = await updateEvaluationStatus(assignmentId, newStatus);
      
      if (result.success) {
        showSuccess(`Status updated to ${newStatus}`);
        // Update local state
        setAssignedStudents(prev => 
          prev.map(assignment => 
            assignment.id === assignmentId 
              ? { ...assignment, status: newStatus } 
              : assignment
          )
        );
      } else {
        showError(result.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Failed to update status: ' + error.message);
    } finally {
      setUpdatingStatus(null);
    }
  };

  return (
    <div className="container">
      <div className={styles.dashboardHeader}>
        <h1 style={{ color: '#3182ce' }}>Supervisor Dashboard</h1>
        <p style={{ color: '#3182ce' }}>View assigned students and their work term reports</p>
      </div>
      
      {isLoadingData ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p style={{ color: '#000000' }}>Loading assigned students...</p>
        </div>
      ) : loadingError ? (
        <div className={styles.errorContainer}>
          <h2>Error</h2>
          <p>{loadingError}</p>
          <button onClick={fetchAssignedStudents} className={styles.retryButton}>
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search students by name, ID, or work term..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ color: '#000000', backgroundColor: '#ffffff' }}
            />
          </div>
          
          {/* Submit Evaluation Button outside the table */}
          <div className={styles.evaluationActionContainer}>
            <Link 
              href="/employer/evaluations" 
              className={styles.submitEvaluationBtn}
            >
              Submit an Evaluation
            </Link>
          </div>
          
          {filteredStudents.length === 0 ? (
            <div className={styles.emptyState} style={{ backgroundColor: '#ffffff' }}>
              <div className={styles.emptyStateIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 style={{ color: '#000000' }}>No Students Found</h2>
              <p style={{ color: '#000000' }}>
                {searchTerm ? 
                  'No students match your search criteria.' : 
                  'You do not have any assigned students yet. Please check back later or contact the admin if you believe this is an error.'}
              </p>
              {!searchTerm && (
                <button 
                  onClick={fetchAssignedStudents}
                  className={styles.refreshButton}
                >
                  Check for Assignments
                </button>
              )}
            </div>
          ) : (
            <div className={styles.reportsTableContainer} style={{ backgroundColor: '#ffffff' }}>
              <table className={styles.reportsTable}>
                <thead>
                  <tr>
                    <th style={{ color: '#000000', backgroundColor: '#f0f4f8' }}>Student Name</th>
                    <th style={{ color: '#000000', backgroundColor: '#f0f4f8' }}>Student ID</th>
                    <th style={{ color: '#000000', backgroundColor: '#f0f4f8' }}>Work Term</th>
                    <th style={{ color: '#000000', backgroundColor: '#f0f4f8' }}>Reports</th>
                    <th style={{ color: '#000000', backgroundColor: '#f0f4f8' }}>Evaluation Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(assignment => {
                    // Skip rendering if student data is missing
                    if (!assignment || !assignment.student) return null;
                    
                    const studentReportsList = studentReports[assignment.student_id] || [];
                    
                    const matchingReports = studentReportsList;
                    
                    return (
                      <tr key={assignment.id} style={{ backgroundColor: '#ffffff' }}>
                        <td style={{ color: '#000000' }}>{assignment.student.first_name} {assignment.student.last_name}</td>
                        <td style={{ color: '#000000' }}>{assignment.student.student_id || 'N/A'}</td>
                        <td style={{ color: '#000000' }}>{assignment.work_term}</td>
                        <td style={{ color: '#000000' }}>
                          {matchingReports.length === 0 ? (
                            <span className={styles.noReportsBadge} style={{ backgroundColor: '#edf2f7', color: '#4a5568' }}>No Reports</span>
                          ) : (
                            <div className={styles.reportBadges}>
                              {matchingReports.map(report => (
                                <div key={report.id} className={styles.reportBadgeContainer}>
                                  <span className={`${styles.reportBadge} ${styles[report.status]}`} style={{ backgroundColor: report.status === 'approved' ? '#f0fff4' : (report.status === 'pending' ? '#faf5ff' : (report.status === 'rejected' ? '#fff5f5' : '#fffaf0')), color: report.status === 'approved' ? '#2f855a' : (report.status === 'pending' ? '#6b46c1' : (report.status === 'rejected' ? '#c53030' : '#c05621')) }}>
                                    {report.report_type || 'Unknown'} Report ({report.work_term || 'Unknown'}): {report.status || 'pending'}
                                  </span>
                                  {report.report_url && (
                                    <a 
                                      href={report.report_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className={styles.viewReportLink}
                                      style={{ color: '#3182ce' }}
                                    >
                                      View
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td style={{ color: '#000000' }}>
                          <div className={styles.statusWrapper}>
                            <span className={`${styles.statusBadge} ${styles[assignment.status]}`}>
                              {assignment.status}
                            </span>
                            <select 
                              className={styles.statusSelect}
                              value={assignment.status}
                              onChange={(e) => handleStatusUpdate(assignment.id, e.target.value)}
                              disabled={updatingStatus === assignment.id}
                            >
                              <option value="pending">Pending</option>
                              <option value="evaluated">Evaluated</option>
                              <option value="submitted">Submitted</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
} 