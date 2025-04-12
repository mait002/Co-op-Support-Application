'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import { submitEmployerEvaluationForm, getEmployerSubmittedForms } from '../../../lib/api';
import styles from './evaluations.module.css';

export default function EmployerEvaluations() {
  const { user, isAuthenticated, userRole } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [submittedForms, setSubmittedForms] = useState([]);
  const [formData, setFormData] = useState({
    studentName: '',
    studentEmail: '',
    workTerm: '',
    knowledge: 3,
    skills: 3,
    behaviour: 3,
    attitude: 3,
    comments: ''
  });

  // Fetch previously submitted evaluation forms
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchSubmittedForms();
    }
  }, [isAuthenticated, user]);

  const fetchSubmittedForms = async () => {
    try {
      setIsLoading(true);
      const forms = await getEmployerSubmittedForms(user.id);
      setSubmittedForms(forms || []);
    } catch (error) {
      console.error('Error fetching submitted forms:', error);
      showError('Failed to load your submitted evaluations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleRatingChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: parseInt(value, 10)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      const result = await submitEmployerEvaluationForm({
        employerId: user.id,
        studentName: formData.studentName,
        studentEmail: formData.studentEmail,
        workTerm: formData.workTerm,
        knowledge: formData.knowledge,
        skills: formData.skills,
        behaviour: formData.behaviour,
        attitude: formData.attitude,
        comments: formData.comments
      });
      
      if (result.success) {
        showSuccess('Evaluation form submitted successfully!');
        // Reset form after successful submission
        setFormData({
          studentName: '',
          studentEmail: '',
          workTerm: '',
          knowledge: 3,
          skills: 3,
          behaviour: 3,
          attitude: 3,
          comments: ''
        });
        // Fetch the updated list
        fetchSubmittedForms();
      }
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      showError(error.message || 'Failed to submit evaluation form');
    } finally {
      setIsLoading(false);
    }
  };

  // Rating component for consistency
  const RatingSelector = ({ name, value, label, onChange }) => {
    return (
      <div className={styles.ratingGroup}>
        <label htmlFor={name}>{label}</label>
        <div className={styles.ratingControls}>
          {[1, 2, 3, 4, 5].map((num) => (
            <button 
              key={num} 
              type="button"
              className={`${styles.ratingButton} ${value === num ? styles.selected : ''}`}
              onClick={() => onChange(name, num)}
            >
              {num}
            </button>
          ))}
        </div>
        <div className={styles.ratingLabels}>
          <span>Poor</span>
          <span>Excellent</span>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        <div className={styles.formSection}>
          <div className={styles.formCard}>
            <h2>Evaluation Form</h2>
            
            <form onSubmit={handleSubmit} className={styles.evaluationForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="studentName">Student Name</label>
                  <input
                    type="text"
                    id="studentName"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter student's full name"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="studentEmail">Student Email</label>
                  <input
                    type="email"
                    id="studentEmail"
                    name="studentEmail"
                    value={formData.studentEmail}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter student's email address"
                  />
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="workTerm">Work Term</label>
                  <select
                    id="workTerm"
                    name="workTerm"
                    value={formData.workTerm}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="" disabled>Select a work term</option>
                    <option value="Summer 2023">Summer 2023</option>
                    <option value="Fall 2023">Fall 2023</option>
                    <option value="Winter 2024">Winter 2024</option>
                    <option value="Spring 2024">Spring 2024</option>
                    <option value="Summer 2024">Summer 2024</option>
                  </select>
                </div>
              </div>
              
              <div className={styles.ratingsSection}>
                <h3>Performance Ratings</h3>
                <p className={styles.ratingInstructions}>Rate the student on a scale of 1-5 for each category</p>
                
                <div className={styles.ratingsGrid}>
                  <RatingSelector 
                    name="knowledge" 
                    value={formData.knowledge} 
                    label="Knowledge" 
                    onChange={handleRatingChange} 
                  />
                  
                  <RatingSelector 
                    name="skills" 
                    value={formData.skills} 
                    label="Skills" 
                    onChange={handleRatingChange} 
                  />
                  
                  <RatingSelector 
                    name="behaviour" 
                    value={formData.behaviour} 
                    label="Behaviour" 
                    onChange={handleRatingChange} 
                  />
                  
                  <RatingSelector 
                    name="attitude" 
                    value={formData.attitude} 
                    label="Attitude" 
                    onChange={handleRatingChange} 
                  />
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="comments">Additional Comments</label>
                <textarea
                  id="comments"
                  name="comments"
                  value={formData.comments}
                  onChange={handleInputChange}
                  placeholder="Provide feedback on the student's performance, areas of strength, and opportunities for improvement"
                  rows={5}
                />
              </div>
              
              <div className={styles.formActions}>
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={isLoading}
                >
                  {isLoading ? 'Submitting...' : 'Submit Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div className={styles.submissionsSection}>
          <div className={styles.submissionsCard}>
            <h2>Submitted Evaluations</h2>
            
            {isLoading && submittedForms.length === 0 ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <p>Loading your submissions...</p>
              </div>
            ) : submittedForms.length === 0 ? (
              <div className={styles.emptyState}>
                <p>You haven't submitted any evaluations yet.</p>
              </div>
            ) : (
              <div className={styles.submissionsList}>
                {submittedForms.map((form) => (
                  <div key={form.id} className={styles.submissionItem}>
                    <div className={styles.submissionHeader}>
                      <h3>{form.student_name}</h3>
                      <span className={styles.workTerm}>{form.work_term}</span>
                    </div>
                    
                    <div className={styles.submissionDetails}>
                      <div className={styles.ratingsSummary}>
                        <div className={styles.ratingPill}>
                          <span>Knowledge:</span> {form.knowledge}
                        </div>
                        <div className={styles.ratingPill}>
                          <span>Skills:</span> {form.skills}
                        </div>
                        <div className={styles.ratingPill}>
                          <span>Behaviour:</span> {form.behaviour}
                        </div>
                        <div className={styles.ratingPill}>
                          <span>Attitude:</span> {form.attitude}
                        </div>
                      </div>
                      
                      {form.comments && (
                        <div className={styles.submissionComments}>
                          <p>{form.comments}</p>
                        </div>
                      )}
                      
                      <div className={styles.submissionMeta}>
                        Submitted on {new Date(form.submission_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 