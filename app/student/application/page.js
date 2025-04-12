'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '../../components/MainLayout';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import styles from './application.module.css';
import { supabase } from '../../../lib/supabase';
import { uploadResume, checkRequiredBuckets } from '../../../lib/api/upload';

export default function StudentApplication() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const formRef = useRef(null);
  
  // Pre-populate form with user data if available
  const initialFormData = {
    fullName: user ? `${user.firstName} ${user.lastName}` : '',
    studentId: '',
    email: user ? user.email : '',
    phoneNumber: '',
    program: '',
    yearOfStudy: '',
    gpa: '',
    expectedGraduation: '',
    hasResume: false,
    resumeFile: null,
    coursesTaken: '',
    relevantExperience: '',
    reasonForApplying: '',
    termsAgreement: false,
  };
  
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Redirect to login if not authenticated and check buckets
  useEffect(() => {
    if (!isAuthenticated) {
      showInfo('Please log in to submit an application');
      router.push('/auth/login');
      return;
    }
    
    // Check if required buckets exist
    const checkBuckets = async () => {
      const bucketsExist = await checkRequiredBuckets();
      if (!bucketsExist) {
        showInfo('System is being set up. Some features may be limited.');
      }
    };
    
    checkBuckets();
  }, [isAuthenticated, router, showInfo]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      if (files[0]) {
        // Check file size (max 5MB)
        if (files[0].size > 5 * 1024 * 1024) {
          setErrors({ ...errors, resumeFile: 'File size must be less than 5MB' });
          return;
        }
        
        // Check file type (PDF only)
        if (files[0].type !== 'application/pdf') {
          setErrors({ ...errors, resumeFile: 'Only PDF files are allowed' });
          return;
        }
      }
      
      setFormData({ 
        ...formData, 
        [name]: files[0],
        hasResume: !!files[0]
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

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      // Personal Information validation
      if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!formData.studentId.trim()) newErrors.studentId = 'Student ID is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
      
      // Phone number validation (optional)
      if (formData.phoneNumber && !/^[\d\s\-\(\)]+$/.test(formData.phoneNumber)) {
        newErrors.phoneNumber = 'Please enter a valid phone number';
      }
    } else if (step === 2) {
      // Academic Information validation
      if (!formData.program.trim()) newErrors.program = 'Program is required';
      if (!formData.yearOfStudy.trim()) newErrors.yearOfStudy = 'Year of study is required';
      if (!formData.gpa.trim()) newErrors.gpa = 'GPA is required';
      else if (isNaN(formData.gpa) || Number(formData.gpa) < 0 || Number(formData.gpa) > 4.0) {
        newErrors.gpa = 'Please enter a valid GPA between 0 and 4.0';
      }
      
      if (!formData.expectedGraduation.trim()) newErrors.expectedGraduation = 'Expected graduation date is required';
      if (!formData.coursesTaken.trim()) newErrors.coursesTaken = 'Please list at least some courses you have taken';
    } else if (step === 3) {
      // Experience & Motivation validation
      if (!formData.reasonForApplying.trim()) {
        newErrors.reasonForApplying = 'Please provide a reason for applying';
      } else if (formData.reasonForApplying.trim().length < 100) {
        newErrors.reasonForApplying = 'Please provide a more detailed explanation (at least 100 characters)';
      }
    } else if (step === 4) {
      // Resume and Terms validation
      if (!formData.hasResume) newErrors.resumeFile = 'Please upload your resume';
      if (!formData.termsAgreement) newErrors.termsAgreement = 'You must agree to the terms and conditions';
    }
    
    return newErrors;
  };
  
  const handleNextStep = () => {
    const errors = validateStep(currentStep);
    
    if (Object.keys(errors).length === 0) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    } else {
      setErrors(errors);
    }
  };
  
  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  const validate = () => {
    let allErrors = {};
    
    // Validate all steps
    for (let i = 1; i <= 4; i++) {
      const stepErrors = validateStep(i);
      allErrors = { ...allErrors, ...stepErrors };
    }
    
    return allErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      
      // Find the first step with errors and go to it
      for (let i = 1; i <= 4; i++) {
        const stepErrors = validateStep(i);
        if (Object.keys(stepErrors).length > 0) {
          setCurrentStep(i);
          break;
        }
      }
      
      window.scrollTo(0, 0);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Starting application submission...');
      
      // First upload the resume if provided
      let resumeUrl = 'https://example.com/placeholder-resume.pdf'; // Default placeholder
      
      if (formData.resumeFile) {
        try {
          console.log('Uploading resume...');
          resumeUrl = await uploadResume(formData.resumeFile, user.id);
          console.log('Resume uploaded successfully:', resumeUrl);
        } catch (uploadError) {
          console.error('Resume upload error:', uploadError);
          throw new Error(`Failed to upload resume: ${uploadError.message}`);
        }
      }
      
      // Now insert the application with the real or placeholder resume URL
      const { error: insertError } = await supabase
        .from('applications')
        .insert({
          student_id: user.id,
          status: 'pending',
          submission_date: new Date().toISOString(),
          resume_url: resumeUrl,
          major: formData.program,
          gpa: parseFloat(formData.gpa),
          expected_graduation: formData.expectedGraduation + '-01',
          comments: formData.relevantExperience,
        });
      
      if (insertError) {
        console.error('Database insert error:', insertError);
        throw new Error(`Failed to insert application record: ${insertError.message}`);
      }
      
      console.log('Application record inserted successfully');
      
      // Show success toast
      showSuccess('Your application has been submitted successfully!');
      
      // Set submitted state to show success message
      setIsSubmitted(true);
      
      // Scroll to top to show the success message
      window.scrollTo(0, 0);
      
    } catch (error) {
      console.error('Application submission error:', error);
      showError('There was a problem submitting your application. Please try again.');
      setErrors({ form: `Submission error: ${error.message}` });
      window.scrollTo(0, 0);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render different steps based on currentStep
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className={styles.formSection}>
            <h2>Personal Information</h2>
            
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="fullName" className="form-label">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  className={`form-control ${errors.fullName ? styles.inputError : ''}`}
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.fullName && <div className={styles.errorText}>{errors.fullName}</div>}
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="studentId" className="form-label">Student ID</label>
                <input
                  type="text"
                  id="studentId"
                  name="studentId"
                  className={`form-control ${errors.studentId ? styles.inputError : ''}`}
                  value={formData.studentId}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.studentId && <div className={styles.errorText}>{errors.studentId}</div>}
              </div>
            </div>
            
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className="form-label">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`form-control ${errors.email ? styles.inputError : ''}`}
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.email && <div className={styles.errorText}>{errors.email}</div>}
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  className={`form-control ${errors.phoneNumber ? styles.inputError : ''}`}
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="e.g. (123) 456-7890"
                  disabled={isSubmitting}
                />
                {errors.phoneNumber && <div className={styles.errorText}>{errors.phoneNumber}</div>}
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className={styles.formSection}>
            <h2>Academic Information</h2>
            
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="program" className="form-label">Program of Study</label>
                <input
                  type="text"
                  id="program"
                  name="program"
                  className={`form-control ${errors.program ? styles.inputError : ''}`}
                  value={formData.program}
                  onChange={handleChange}
                  placeholder="e.g. Computer Science"
                  disabled={isSubmitting}
                />
                {errors.program && <div className={styles.errorText}>{errors.program}</div>}
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="yearOfStudy" className="form-label">Year of Study</label>
                <select
                  id="yearOfStudy"
                  name="yearOfStudy"
                  className={`form-control ${errors.yearOfStudy ? styles.inputError : ''}`}
                  value={formData.yearOfStudy}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                  <option value="5+">5+ Year</option>
                </select>
                {errors.yearOfStudy && <div className={styles.errorText}>{errors.yearOfStudy}</div>}
              </div>
            </div>
            
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="gpa" className="form-label">Current GPA (out of 4.0)</label>
                <input
                  type="text"
                  id="gpa"
                  name="gpa"
                  className={`form-control ${errors.gpa ? styles.inputError : ''}`}
                  value={formData.gpa}
                  onChange={handleChange}
                  placeholder="e.g. 3.5"
                  disabled={isSubmitting}
                />
                {errors.gpa && <div className={styles.errorText}>{errors.gpa}</div>}
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="expectedGraduation" className="form-label">Expected Graduation Date</label>
                <input
                  type="month"
                  id="expectedGraduation"
                  name="expectedGraduation"
                  className={`form-control ${errors.expectedGraduation ? styles.inputError : ''}`}
                  value={formData.expectedGraduation}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                {errors.expectedGraduation && <div className={styles.errorText}>{errors.expectedGraduation}</div>}
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="coursesTaken" className="form-label">Relevant Courses Taken</label>
              <textarea
                id="coursesTaken"
                name="coursesTaken"
                rows="3"
                className={`form-control ${errors.coursesTaken ? styles.inputError : ''}`}
                value={formData.coursesTaken}
                onChange={handleChange}
                placeholder="List relevant courses you've completed"
                disabled={isSubmitting}
              ></textarea>
              {errors.coursesTaken && <div className={styles.errorText}>{errors.coursesTaken}</div>}
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className={styles.formSection}>
            <h2>Experience & Motivation</h2>
            
            <div className={styles.formGroup}>
              <label htmlFor="relevantExperience" className="form-label">Relevant Experience (optional)</label>
              <textarea
                id="relevantExperience"
                name="relevantExperience"
                rows="4"
                className="form-control"
                value={formData.relevantExperience}
                onChange={handleChange}
                placeholder="Describe any relevant work or project experience"
                disabled={isSubmitting}
              ></textarea>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="reasonForApplying" className="form-label">Why are you applying for the co-op program?</label>
              <textarea
                id="reasonForApplying"
                name="reasonForApplying"
                rows="6"
                className={`form-control ${errors.reasonForApplying ? styles.inputError : ''}`}
                value={formData.reasonForApplying}
                onChange={handleChange}
                placeholder="Explain your motivation for applying to the co-op program"
                disabled={isSubmitting}
              ></textarea>
              <div className={styles.charCount}>
                {formData.reasonForApplying.length} characters (minimum 100)
              </div>
              {errors.reasonForApplying && <div className={styles.errorText}>{errors.reasonForApplying}</div>}
            </div>
          </div>
        );
      
      case 4:
        return (
          <>
            <div className={styles.formSection}>
              <h2>Resume Upload</h2>
              
              <div className={styles.formGroup}>
                <label htmlFor="resumeFile" className="form-label">Upload Resume (PDF format)</label>
                <div className={styles.fileUpload}>
                  <input
                    type="file"
                    id="resumeFile"
                    name="resumeFile"
                    accept=".pdf"
                    className={errors.resumeFile ? styles.inputError : ''}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  <div className={styles.fileInputInfo}>
                    {formData.resumeFile ? (
                      <span className={styles.fileName}>{formData.resumeFile.name}</span>
                    ) : (
                      <span>No file chosen. Please upload a PDF file (max 5MB).</span>
                    )}
                  </div>
                </div>
                {errors.resumeFile && <div className={styles.errorText}>{errors.resumeFile}</div>}
              </div>
            </div>
            
            <div className={styles.termsContainer}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="termsAgreement"
                  checked={formData.termsAgreement}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
                <span>
                  I confirm that all information provided is accurate and complete. I understand that providing false information may result in the rejection of my application or dismissal from the program.
                </span>
              </label>
              {errors.termsAgreement && <div className={styles.errorText}>{errors.termsAgreement}</div>}
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className={`container ${styles.applicationContainer}`}>
        {isSubmitted ? (
          <div className={styles.successCard}>
            <div className={styles.successIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
              </svg>
            </div>
            <h1>Application Submitted Successfully!</h1>
            <p>Your co-op program application has been received and is being reviewed.</p>
            <p>You will receive an email notification once your application has been processed. You can also check your application status in your dashboard.</p>
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
          <div className={styles.applicationCard}>
            <div className={styles.applicationHeader}>
              <h1>Co-op Program Application</h1>
              <p>Please complete all fields to apply for the co-op program.</p>
              
              <div className={styles.formProgress}>
                <div 
                  className={`${styles.progressBar} ${styles.step1}`} 
                  style={{ width: `${Math.min((currentStep / 4) * 100, 100)}%` }}
                ></div>
                <div className={styles.stepIndicators}>
                  <div 
                    className={`${styles.stepDot} ${currentStep >= 1 ? styles.active : ''} ${currentStep > 1 ? styles.completed : ''}`}
                    onClick={() => currentStep > 1 && setCurrentStep(1)}
                  >
                    <span>1</span>
                    <div className={styles.stepLabel}>Personal</div>
                  </div>
                  <div 
                    className={`${styles.stepDot} ${currentStep >= 2 ? styles.active : ''} ${currentStep > 2 ? styles.completed : ''}`}
                    onClick={() => currentStep > 2 && setCurrentStep(2)}
                  >
                    <span>2</span>
                    <div className={styles.stepLabel}>Academic</div>
                  </div>
                  <div 
                    className={`${styles.stepDot} ${currentStep >= 3 ? styles.active : ''} ${currentStep > 3 ? styles.completed : ''}`}
                    onClick={() => currentStep > 3 && setCurrentStep(3)}
                  >
                    <span>3</span>
                    <div className={styles.stepLabel}>Experience</div>
                  </div>
                  <div 
                    className={`${styles.stepDot} ${currentStep >= 4 ? styles.active : ''}`}
                    onClick={() => currentStep > 4 && setCurrentStep(4)}
                  >
                    <span>4</span>
                    <div className={styles.stepLabel}>Submit</div>
                  </div>
                </div>
              </div>
            </div>
            
            {errors.form && <div className={styles.errorMessage}>{errors.form}</div>}
            
            <form onSubmit={handleSubmit} className={styles.applicationForm} ref={formRef}>
              {renderStepContent()}
              
              <div className={styles.formActions}>
                {currentStep > 1 && (
                  <button 
                    type="button"
                    className="btn btn-outline"
                    onClick={handlePrevStep}
                    disabled={isSubmitting}
                  >
                    Previous
                  </button>
                )}
                
                {currentStep < 4 ? (
                  <button 
                    type="button"
                    className="btn btn-primary" 
                    onClick={handleNextStep}
                    disabled={isSubmitting}
                  >
                    Next
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting Application...' : 'Submit Application'}
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </MainLayout>
  );
} 