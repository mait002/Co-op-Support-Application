'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '../../../components/MainLayout';
import { useAuth } from '../../../components/AuthContext';
import { useToast } from '../../../components/ToastContext';
import { supabase } from '../../../../lib/supabase';
import { uploadWorkTermReport, checkRequiredBuckets } from '../../../../lib/api/upload';
import styles from '../report.module.css'; // Use the local CSS file

export default function ResubmitWorkTermReport({ params }) {
  const reportId = params.id;
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const formRef = useRef(null);
  
  const [formData, setFormData] = useState({
    workTerm: '',
    reportType: 'interim',
    reportFile: null,
    comments: '',
    termsAgreed: false,
  });
  
  const [originalReport, setOriginalReport] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [bucketsVerified, setBucketsVerified] = useState(false);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      showInfo('Please log in to resubmit a work term report');
      router.push('/auth/login');
      return;
    }

    // Check if required buckets exist
    const verifyBuckets = async () => {
      const bucketsExist = await checkRequiredBuckets();
      setBucketsVerified(bucketsExist);
      
      if (!bucketsExist) {
        showInfo('The storage system is not properly configured. Please contact an administrator.');
      }
    };
    
    verifyBuckets();
  }, [isAuthenticated, isLoading, router, showInfo]);
  
  // Fetch original report data
  useEffect(() => {
    const fetchReportData = async () => {
      if (!user || !reportId) return;
      
      try {
        const { data, error } = await supabase
          .from('work_term_reports')
          .select('*')
          .eq('id', reportId)
          .eq('student_id', user.id)
          .single();
        
        if (error) throw error;
        
        if (!data) {
          showError('Report not found or you do not have permission to access it');
          router.push('/student/dashboard');
          return;
        }
        
        // Check if report is eligible for resubmission
        if (data.status !== 'rejected') {
          showInfo('This report is not eligible for resubmission');
          router.push('/student/dashboard');
          return;
        }
        
        setOriginalReport(data);
        
        // Pre-populate form with existing data
        setFormData({
          workTerm: data.work_term || '',
          reportType: data.report_type || 'interim',
          reportFile: null, // File must be selected again
          comments: data.comments || '',
          termsAgreed: false, // Must re-agree to terms
        });
        
        setIsLoaded(true);
      } catch (error) {
        console.error('Error fetching report data:', error);
        showError('Error loading report data. Please try again.');
        router.push('/student/dashboard');
      }
    };
    
    if (user && reportId) {
      fetchReportData();
    }
  }, [reportId, router, showError, showInfo, user]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      if (files[0]) {
        // Check file size (max 10MB)
        if (files[0].size > 10 * 1024 * 1024) {
          setErrors({ ...errors, reportFile: 'File size must be less than 10MB' });
          return;
        }
        
        // Check file type (PDF only)
        if (files[0].type !== 'application/pdf') {
          setErrors({ ...errors, reportFile: 'Only PDF files are allowed' });
          return;
        }
      }
      
      setFormData({ 
        ...formData, 
        [name]: files[0]
      });
    } else if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Clear errors when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  // Validate form
  const validate = () => {
    const newErrors = {};
    
    if (!formData.workTerm.trim()) {
      newErrors.workTerm = 'Work term is required';
    }
    
    if (!formData.reportType) {
      newErrors.reportType = 'Report type is required';
    }
    
    if (!formData.reportFile) {
      newErrors.reportFile = 'Please upload your updated work term report (PDF)';
    }
    
    if (!formData.termsAgreed) {
      newErrors.termsAgreed = 'You must agree to the terms';
    }
    
    return newErrors;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      window.scrollTo(0, 0);
      return;
    }
    
    if (!bucketsVerified) {
      showError('The storage system is not properly configured. Please contact an administrator.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Starting work term report resubmission...');
      
      // Upload updated report file to Supabase Storage
      let reportUrl;
      try {
        console.log('Uploading updated report file...');
        reportUrl = await uploadWorkTermReport(formData.reportFile, user.id);
        console.log('Report file uploaded successfully:', reportUrl);
      } catch (uploadError) {
        console.error('Report upload error:', uploadError);
        throw new Error(`Failed to upload report: ${uploadError.message}`);
      }
      
      // Update the existing record in the work_term_reports table
      const { data: reportData, error: updateError } = await supabase
        .from('work_term_reports')
        .update({
          work_term: formData.workTerm,
          report_type: formData.reportType,
          status: 'pending', // Reset to pending for review
          report_url: reportUrl,
          comments: formData.comments || null,
          submission_date: new Date().toISOString(), // Update submission date
          review_date: null, // Clear previous review date
        })
        .eq('id', reportId)
        .eq('student_id', user.id) // Security check
        .select();
      
      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error(`Failed to update report record: ${updateError.message}`);
      }
      
      console.log('Report record updated successfully:', reportData);
      
      // Show success message
      showSuccess('Your work term report has been resubmitted successfully!');
      
      // Set submitted state to show success message
      setIsSubmitted(true);
      
      // Scroll to top to show the success message
      window.scrollTo(0, 0);
      
    } catch (error) {
      console.error('Report resubmission error:', error);
      showError('There was a problem resubmitting your report. Please try again.');
      setErrors({ form: `Submission error: ${error.message}` });
      window.scrollTo(0, 0);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Show loading state while fetching original report
  if (!isLoaded && !isSubmitted) {
    return (
      <MainLayout>
        <div className="container">
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading report data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="container">
        {isSubmitted ? (
          <div className={styles.successCard}>
            <div className={styles.successIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
              </svg>
            </div>
            <h1>Report Resubmitted Successfully!</h1>
            <p>Your updated work term report has been received and is being reviewed.</p>
            <p>You will receive a notification once your report has been processed. You can also check your report status in your dashboard.</p>
            <div className={styles.successActions}>
              <button 
                className="btn btn-primary" 
                onClick={() => router.push('/student/dashboard')}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.reportCard}>
            <div className={styles.reportHeader}>
              <h1>Resubmit Work Term Report</h1>
              <p>Your previous submission was rejected. Please make necessary changes and resubmit.</p>
              
              {originalReport && originalReport.comments && (
                <div className={styles.reviewFeedback}>
                  <h3>Feedback from Review:</h3>
                  <p>{originalReport.comments}</p>
                </div>
              )}
            </div>
            
            {errors.form && <div className={styles.errorMessage}>{errors.form}</div>}
            
            <form onSubmit={handleSubmit} className={styles.reportForm} ref={formRef}>
              <div className={styles.formSection}>
                <div className={styles.formGroup}>
                  <label htmlFor="workTerm" className="form-label">Work Term</label>
                  <input
                    type="text"
                    id="workTerm"
                    name="workTerm"
                    className={`form-control ${errors.workTerm ? styles.inputError : ''}`}
                    value={formData.workTerm}
                    onChange={handleChange}
                    placeholder="e.g. Summer 2023"
                    disabled={isSubmitting}
                  />
                  {errors.workTerm && <div className={styles.errorText}>{errors.workTerm}</div>}
                </div>
                
                <div className={styles.formGroup}>
                  <label className="form-label">Report Type</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="reportType"
                        value="interim"
                        checked={formData.reportType === 'interim'}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                      <span>Interim Report</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="reportType"
                        value="final"
                        checked={formData.reportType === 'final'}
                        onChange={handleChange}
                        disabled={isSubmitting}
                      />
                      <span>Final Report</span>
                    </label>
                  </div>
                  {errors.reportType && <div className={styles.errorText}>{errors.reportType}</div>}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="reportFile" className="form-label">Upload Updated Report (PDF format)</label>
                  <div className={styles.fileUpload}>
                    <input
                      type="file"
                      id="reportFile"
                      name="reportFile"
                      accept=".pdf"
                      className={errors.reportFile ? styles.inputError : ''}
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                    <div className={styles.fileInputInfo}>
                      {formData.reportFile ? (
                        <span className={styles.fileName}>{formData.reportFile.name}</span>
                      ) : (
                        <span>No file chosen. Please upload a PDF file (max 10MB).</span>
                      )}
                    </div>
                  </div>
                  {errors.reportFile && <div className={styles.errorText}>{errors.reportFile}</div>}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="comments" className="form-label">Comments (Optional)</label>
                  <textarea
                    id="comments"
                    name="comments"
                    rows="3"
                    className="form-control"
                    value={formData.comments}
                    onChange={handleChange}
                    placeholder="Explain what changes you made to address the feedback"
                    disabled={isSubmitting}
                  ></textarea>
                </div>
              </div>
              
              <div className={styles.termsContainer}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="termsAgreed"
                    checked={formData.termsAgreed}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  <span>
                    I confirm that this is my own work and I have followed all guidelines for the work term report. I understand that submitting plagiarized work may result in disciplinary action.
                  </span>
                </label>
                {errors.termsAgreed && <div className={styles.errorText}>{errors.termsAgreed}</div>}
              </div>
              
              <div className={styles.formActions}>
                <button 
                  type="button"
                  className="btn btn-outline"
                  onClick={() => router.push('/student/dashboard')}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Resubmitting Report...' : 'Resubmit Report'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 