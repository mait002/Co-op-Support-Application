'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MainLayout from '../../../../components/MainLayout';
import { useAuth } from '../../../../components/AuthContext';
import { useToast } from '../../../../components/ToastContext';
import { supabase } from '../../../../../lib/supabase';
import { submitEvaluation } from '../../../../../lib/api';
import styles from './evaluationForm.module.css';

export default function SubmitEvaluation({ params }) {
  const evaluationId = params.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';
  
  const { user, isAuthenticated, isLoading } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  
  const [evaluation, setEvaluation] = useState(null);
  const [formData, setFormData] = useState({
    performance_rating: '',
    technical_skills: '',
    communication: '',
    teamwork: '',
    initiative: '',
    areas_of_improvement: '',
    strengths: '',
    additional_comments: '',
    upload_option: 'form', // 'form' or 'pdf'
    evaluation_pdf: null,
  });
  
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const [errors, setErrors] = useState({});

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      showInfo('Please log in to submit evaluations');
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router, showInfo]);

  // Fetch evaluation details
  useEffect(() => {
    const fetchEvaluationDetails = async () => {
      if (!user?.id || !evaluationId) return;
      
      try {
        setIsLoadingData(true);
        
        // Fetch the evaluation
        const { data: evaluationData, error: evaluationError } = await supabase
          .from('evaluations')
          .select('*, student:profiles!student_id(id, first_name, last_name, student_id, email)')
          .eq('id', evaluationId)
          .eq('employer_id', user.id)
          .single();
          
        if (evaluationError) throw evaluationError;
        
        if (!evaluationData) {
          showError('Evaluation not found or you do not have permission to access it');
          router.push('/employer/evaluations');
          return;
        }
        
        setEvaluation(evaluationData);
        setStudentInfo(evaluationData.student);
        
        // If the evaluation already has data and we're in view mode (not edit mode)
        if (evaluationData.evaluation_data && !isEditMode) {
          setFormData({
            ...formData,
            ...evaluationData.evaluation_data,
            upload_option: evaluationData.evaluation_url ? 'pdf' : 'form',
          });
          
          if (evaluationData.status !== 'pending') {
            setIsSubmitted(true);
          }
        }
        
      } catch (error) {
        console.error('Error fetching evaluation details:', error);
        showError('Failed to load evaluation details');
      } finally {
        setIsLoadingData(false);
      }
    };
    
    if (user) {
      fetchEvaluationDetails();
    }
  }, [user, evaluationId, router, showError, isEditMode]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, files, checked } = e.target;
    
    if (type === 'file') {
      if (files[0]) {
        // Validate file is PDF and under 10MB
        if (files[0].type !== 'application/pdf') {
          setErrors({ ...errors, evaluation_pdf: 'Only PDF files are allowed' });
          return;
        }
        
        if (files[0].size > 10 * 1024 * 1024) {
          setErrors({ ...errors, evaluation_pdf: 'File size must be less than 10MB' });
          return;
        }
        
        setFormData({
          ...formData,
          evaluation_pdf: files[0],
        });
        
        // Clear error if it exists
        if (errors.evaluation_pdf) {
          setErrors({ ...errors, evaluation_pdf: '' });
        }
      }
    } else if (type === 'radio') {
      setFormData({
        ...formData,
        [name]: value,
      });
    } else if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
      
      // Clear error if it exists
      if (errors[name]) {
        setErrors({ ...errors, [name]: '' });
      }
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (formData.upload_option === 'form') {
      // Validate form fields
      if (!formData.performance_rating) {
        newErrors.performance_rating = 'Please select a performance rating';
      }
      
      if (!formData.technical_skills?.trim()) {
        newErrors.technical_skills = 'Please provide feedback on technical skills';
      }
      
      if (!formData.strengths?.trim()) {
        newErrors.strengths = 'Please provide feedback on strengths';
      }
      
      if (!formData.areas_of_improvement?.trim()) {
        newErrors.areas_of_improvement = 'Please provide feedback on areas of improvement';
      }
    } else {
      // Validate PDF upload
      if (!formData.evaluation_pdf) {
        newErrors.evaluation_pdf = 'Please upload an evaluation PDF';
      }
    }
    
    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      window.scrollTo(0, 0);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let evaluationUrl = evaluation?.evaluation_url || null;
      
      // If using PDF upload, upload the file
      if (formData.upload_option === 'pdf' && formData.evaluation_pdf) {
        // Upload PDF to Supabase
        const timestamp = new Date().getTime();
        const fileExt = formData.evaluation_pdf.name.split('.').pop();
        const filePath = `evaluations/${user.id}_${timestamp}_${evaluationId}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('student-files')
          .upload(filePath, formData.evaluation_pdf, { upsert: true });
          
        if (uploadError) {
          throw new Error(`Failed to upload evaluation PDF: ${uploadError.message}`);
        }
        
        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('student-files')
          .getPublicUrl(filePath);
          
        evaluationUrl = publicUrl;
      }
      
      // Prepare evaluation data
      const evaluationDataToSubmit = {
        id: evaluationId,
        employer_id: user.id,
        student_id: studentInfo.id,
        status: 'submitted',
        submission_date: new Date().toISOString(),
        evaluation_url: evaluationUrl,
        evaluation_data: formData.upload_option === 'form' ? {
          performance_rating: formData.performance_rating,
          technical_skills: formData.technical_skills,
          communication: formData.communication,
          teamwork: formData.teamwork,
          initiative: formData.initiative,
          areas_of_improvement: formData.areas_of_improvement,
          strengths: formData.strengths,
          additional_comments: formData.additional_comments,
        } : null,
      };
      
      // Submit evaluation
      await submitEvaluation(evaluationDataToSubmit);
      
      showSuccess('Evaluation submitted successfully!');
      setIsSubmitted(true);
      
      // Scroll to top to show success message
      window.scrollTo(0, 0);
      
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      showError('Failed to submit evaluation: ' + error.message);
      setErrors({ form: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle back button
  const handleBack = () => {
    router.push('/employer/evaluations');
  };

  return (
    <MainLayout>
      <div className="container">
        <div className={styles.pageHeader}>
          <button onClick={handleBack} className={styles.backButton}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Evaluations
          </button>
          <h1>{isSubmitted && !isEditMode ? 'View Evaluation' : 'Submit Evaluation'}</h1>
        </div>
        
        {isLoadingData ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading evaluation details...</p>
          </div>
        ) : isSubmitted && !isEditMode ? (
          // Show the submitted evaluation
          <div className={styles.submittedEvaluationContainer}>
            <div className={styles.evaluationHeader}>
              <div className={styles.statusBadge}>{evaluation.status}</div>
              <h2>Evaluation for {studentInfo.first_name} {studentInfo.last_name}</h2>
              <p>Student ID: {studentInfo.student_id || 'N/A'}</p>
              <p>Work Term: {evaluation.work_term}</p>
              <p>Submitted: {new Date(evaluation.submission_date).toLocaleDateString()}</p>
            </div>
            
            {evaluation.evaluation_url ? (
              <div className={styles.pdfViewer}>
                <h3>Evaluation PDF</h3>
                <div className={styles.pdfContainer}>
                  <a href={evaluation.evaluation_url} target="_blank" rel="noopener noreferrer" className={styles.pdfLink}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z" />
                      <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
                    </svg>
                    View Evaluation PDF
                  </a>
                </div>
              </div>
            ) : evaluation.evaluation_data ? (
              <div className={styles.evaluationFormData}>
                <h3>Evaluation Details</h3>
                
                <div className={styles.formSection}>
                  <div className={styles.formGroup}>
                    <label>Overall Performance Rating</label>
                    <div className={styles.ratingValue}>
                      {evaluation.evaluation_data.performance_rating} / 5
                    </div>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Technical Skills</label>
                    <div className={styles.textValue}>
                      {evaluation.evaluation_data.technical_skills}
                    </div>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Communication</label>
                    <div className={styles.textValue}>
                      {evaluation.evaluation_data.communication}
                    </div>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Teamwork</label>
                    <div className={styles.textValue}>
                      {evaluation.evaluation_data.teamwork}
                    </div>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Initiative</label>
                    <div className={styles.textValue}>
                      {evaluation.evaluation_data.initiative}
                    </div>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Strengths</label>
                    <div className={styles.textValue}>
                      {evaluation.evaluation_data.strengths}
                    </div>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Areas for Improvement</label>
                    <div className={styles.textValue}>
                      {evaluation.evaluation_data.areas_of_improvement}
                    </div>
                  </div>
                  
                  {evaluation.evaluation_data.additional_comments && (
                    <div className={styles.formGroup}>
                      <label>Additional Comments</label>
                      <div className={styles.textValue}>
                        {evaluation.evaluation_data.additional_comments}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.noEvaluationData}>
                <p>No evaluation data found.</p>
              </div>
            )}
            
            {evaluation.status === 'rejected' && (
              <div className={styles.actionButtons}>
                <button 
                  onClick={() => router.push(`/employer/evaluations/submit/${evaluationId}?edit=true`)}
                  className={styles.editButton}
                >
                  Edit Evaluation
                </button>
              </div>
            )}
          </div>
        ) : (
          // Show the evaluation form
          <div className={styles.evaluationFormContainer}>
            {errors.form && (
              <div className={styles.formError}>
                {errors.form}
              </div>
            )}
            
            <div className={styles.studentInfo}>
              <h2>Student Information</h2>
              <p><strong>Name:</strong> {studentInfo.first_name} {studentInfo.last_name}</p>
              <p><strong>Student ID:</strong> {studentInfo.student_id || 'N/A'}</p>
              <p><strong>Email:</strong> {studentInfo.email}</p>
              <p><strong>Work Term:</strong> {evaluation.work_term}</p>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.evaluationForm}>
              <div className={styles.uploadOptions}>
                <h3>Choose Evaluation Method</h3>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input 
                      type="radio" 
                      name="upload_option" 
                      value="form" 
                      checked={formData.upload_option === 'form'} 
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                    Fill out evaluation form
                  </label>
                  <label className={styles.radioLabel}>
                    <input 
                      type="radio" 
                      name="upload_option" 
                      value="pdf" 
                      checked={formData.upload_option === 'pdf'} 
                      onChange={handleChange}
                      disabled={isSubmitting}
                    />
                    Upload PDF evaluation
                  </label>
                </div>
              </div>
              
              {formData.upload_option === 'form' ? (
                <div className={styles.formFields}>
                  <h3>Evaluation Form</h3>
                  
                  <div className={styles.formSection}>
                    <div className={styles.formGroup}>
                      <label htmlFor="performance_rating">Overall Performance Rating <span className={styles.required}>*</span></label>
                      <div className={styles.ratingContainer}>
                        {[1, 2, 3, 4, 5].map(rating => (
                          <label key={rating} className={styles.ratingLabel}>
                            <input
                              type="radio"
                              name="performance_rating"
                              value={rating}
                              checked={parseInt(formData.performance_rating) === rating}
                              onChange={handleChange}
                              disabled={isSubmitting}
                            />
                            <span className={styles.ratingValue}>{rating}</span>
                          </label>
                        ))}
                      </div>
                      {errors.performance_rating && (
                        <div className={styles.errorText}>{errors.performance_rating}</div>
                      )}
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label htmlFor="technical_skills">Technical Skills <span className={styles.required}>*</span></label>
                      <textarea
                        id="technical_skills"
                        name="technical_skills"
                        value={formData.technical_skills || ''}
                        onChange={handleChange}
                        placeholder="Provide feedback on technical skills and competencies demonstrated by the student..."
                        rows={4}
                        disabled={isSubmitting}
                        className={errors.technical_skills ? styles.inputError : ''}
                      ></textarea>
                      {errors.technical_skills && (
                        <div className={styles.errorText}>{errors.technical_skills}</div>
                      )}
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label htmlFor="communication">Communication</label>
                      <textarea
                        id="communication"
                        name="communication"
                        value={formData.communication || ''}
                        onChange={handleChange}
                        placeholder="Provide feedback on communication skills..."
                        rows={4}
                        disabled={isSubmitting}
                      ></textarea>
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label htmlFor="teamwork">Teamwork</label>
                      <textarea
                        id="teamwork"
                        name="teamwork"
                        value={formData.teamwork || ''}
                        onChange={handleChange}
                        placeholder="Provide feedback on teamwork abilities..."
                        rows={4}
                        disabled={isSubmitting}
                      ></textarea>
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label htmlFor="initiative">Initiative & Problem Solving</label>
                      <textarea
                        id="initiative"
                        name="initiative"
                        value={formData.initiative || ''}
                        onChange={handleChange}
                        placeholder="Provide feedback on initiative and problem-solving abilities..."
                        rows={4}
                        disabled={isSubmitting}
                      ></textarea>
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label htmlFor="strengths">Key Strengths <span className={styles.required}>*</span></label>
                      <textarea
                        id="strengths"
                        name="strengths"
                        value={formData.strengths || ''}
                        onChange={handleChange}
                        placeholder="Highlight key strengths demonstrated by the student..."
                        rows={4}
                        disabled={isSubmitting}
                        className={errors.strengths ? styles.inputError : ''}
                      ></textarea>
                      {errors.strengths && (
                        <div className={styles.errorText}>{errors.strengths}</div>
                      )}
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label htmlFor="areas_of_improvement">Areas for Improvement <span className={styles.required}>*</span></label>
                      <textarea
                        id="areas_of_improvement"
                        name="areas_of_improvement"
                        value={formData.areas_of_improvement || ''}
                        onChange={handleChange}
                        placeholder="Suggest areas where the student could improve..."
                        rows={4}
                        disabled={isSubmitting}
                        className={errors.areas_of_improvement ? styles.inputError : ''}
                      ></textarea>
                      {errors.areas_of_improvement && (
                        <div className={styles.errorText}>{errors.areas_of_improvement}</div>
                      )}
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label htmlFor="additional_comments">Additional Comments</label>
                      <textarea
                        id="additional_comments"
                        name="additional_comments"
                        value={formData.additional_comments || ''}
                        onChange={handleChange}
                        placeholder="Any additional feedback or comments..."
                        rows={4}
                        disabled={isSubmitting}
                      ></textarea>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.pdfUpload}>
                  <h3>Upload Evaluation PDF</h3>
                  <div className={styles.fileUploadContainer}>
                    <input
                      type="file"
                      id="evaluation_pdf"
                      name="evaluation_pdf"
                      accept=".pdf"
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className={errors.evaluation_pdf ? styles.inputError : ''}
                    />
                    <div className={styles.fileInputInfo}>
                      {formData.evaluation_pdf ? (
                        <div className={styles.selectedFile}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zm6.905 9.97a.75.75 0 00-1.06 0l-3 3a.75.75 0 101.06 1.06l1.72-1.72V18a.75.75 0 001.5 0v-4.19l1.72 1.72a.75.75 0 101.06-1.06l-3-3z" clipRule="evenodd" />
                            <path d="M14.25 5.25a5.23 5.23 0 00-1.279-3.434 9.768 9.768 0 016.963 6.963A5.23 5.23 0 0016.5 7.5h-1.875a.375.375 0 01-.375-.375V5.25z" />
                          </svg>
                          <span>{formData.evaluation_pdf.name}</span>
                        </div>
                      ) : (
                        <div className={styles.dropInstructions}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fillRule="evenodd" d="M10.5 3.75a6 6 0 00-5.98 6.496A5.25 5.25 0 006.75 20.25H18a4.5 4.5 0 002.206-8.423 3.75 3.75 0 00-4.133-4.303A6.001 6.001 0 0010.5 3.75zm2.03 5.47a.75.75 0 00-1.06 0l-3 3a.75.75 0 101.06 1.06l1.72-1.72v4.94a.75.75 0 001.5 0v-4.94l1.72 1.72a.75.75 0 101.06-1.06l-3-3z" clipRule="evenodd" />
                          </svg>
                          <span>Click to select or drop a PDF file</span>
                          <small>(PDF format only, max 10MB)</small>
                        </div>
                      )}
                    </div>
                    {errors.evaluation_pdf && (
                      <div className={styles.errorText}>{errors.evaluation_pdf}</div>
                    )}
                  </div>
                </div>
              )}
              
              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={handleBack}
                  className={styles.cancelButton}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 