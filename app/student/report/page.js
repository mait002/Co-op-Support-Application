'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '../../components/MainLayout';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import { supabase } from '../../../lib/supabase';
import { uploadWorkTermReport, checkRequiredBuckets } from '../../../lib/api/upload';
import styles from './report.module.css';

export default function SubmitWorkTermReport() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const formRef = useRef(null);
  
  const [formData, setFormData] = useState({
    workTerm: '',
    reportType: 'interim', // default to interim
    reportFile: null,
    comments: '',
    termsAgreed: false,
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [bucketsVerified, setBucketsVerified] = useState(false);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      showInfo('Please log in to submit a work term report');
      router.push('/auth/login');
      return;
    }

    // Verify student has an approved application
    const verifyStudentApproval = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('applications')
          .select('status')
          .eq('student_id', user.id)
          .eq('status', 'approved')
          .limit(1);
          
        if (error) throw error;
        
        if (!data || data.length === 0) {
          showInfo('You need an approved application before submitting a work term report');
          router.push('/student/dashboard');
        }
      } catch (err) {
        console.error('Error checking application status:', err);
      }
    };

    // Check if required buckets exist
    const verifyBuckets = async () => {
      const bucketsExist = await checkRequiredBuckets();
      setBucketsVerified(bucketsExist);
      
      if (!bucketsExist) {
        showInfo('The storage system is not properly configured. Please contact an administrator.');
      }
    };
    
    verifyStudentApproval();
    verifyBuckets();
  }, [isAuthenticated, isLoading, router, showInfo, user]);
  
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
      newErrors.reportFile = 'Please upload your work term report (PDF)';
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
      console.log('Starting work term report submission...');
      
      // Upload report file to Supabase Storage
      let reportUrl;
      try {
        console.log('Uploading report file...');
        reportUrl = await uploadWorkTermReport(formData.reportFile, user.id);
        console.log('Report file uploaded successfully:', reportUrl);
      } catch (uploadError) {
        console.error('Report upload error:', uploadError);
        throw new Error(`Failed to upload report: ${uploadError.message}`);
      }
      
      // Insert record in the work_term_reports table
      const { data: reportData, error: insertError } = await supabase
        .from('work_term_reports')
        .insert([
          {
            student_id: user.id,
            work_term: formData.workTerm,
            report_type: formData.reportType,
            status: 'pending',
            report_url: reportUrl,
            comments: formData.comments || null,
            submission_date: new Date().toISOString(),
          }
        ])
        .select();
      
      if (insertError) {
        console.error('Database insert error:', insertError);
        throw new Error(`Failed to insert report record: ${insertError.message}`);
      }
      
      console.log('Report record inserted successfully:', reportData);
      
      // Show success message
      showSuccess('Your work term report has been submitted successfully!');
      
      // Set submitted state to show success message
      setIsSubmitted(true);
      
      // Scroll to top to show the success message
      window.scrollTo(0, 0);
      
    } catch (error) {
      console.error('Report submission error:', error);
      showError('There was a problem submitting your report. Please try again.');
      setErrors({ form: `Submission error: ${error.message}` });
      window.scrollTo(0, 0);
    } finally {
      setIsSubmitting(false);
    }
  };
  
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
            <h1>Report Submitted Successfully!</h1>
            <p>Your work term report has been received and is being reviewed.</p>
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
              <h1>Submit Work Term Report</h1>
              <p>Complete the form below to submit your work term report.</p>
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
                  <label htmlFor="reportFile" className="form-label">Upload Report (PDF format)</label>
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
                    placeholder="Add any additional comments about your report"
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
                  {isSubmitting ? 'Submitting Report...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 