'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import MainLayout from '../../components/MainLayout';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import styles from './signup.module.css';

export default function Signup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') || 'student';
  
  const { register, isLoading, isAuthenticated } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: initialRole,
    studentId: '',
    companyName: '',
    companyPosition: '',
    termsAgreed: false
  });
  
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: 'Too weak'
  });
  const [touched, setTouched] = useState({});

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      showInfo('You are already logged in');
      router.push('/');
    }
  }, [isAuthenticated, router, showInfo]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFormData({ ...formData, [name]: fieldValue });
    
    // Clear errors when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    
    // Calculate password strength if password field changes
    if (name === 'password') {
      calculatePasswordStrength(value);
    }
  };
  
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({ ...touched, [name]: true });
    
    // Validate this field on blur
    const fieldErrors = validateField(name, formData[name]);
    if (fieldErrors) {
      setErrors({ ...errors, ...fieldErrors });
    }
  };
  
  const validateField = (name, value) => {
    const fieldErrors = {};
    
    switch (name) {
      case 'firstName':
        if (!value.trim()) fieldErrors.firstName = 'First name is required';
        break;
      case 'lastName':
        if (!value.trim()) fieldErrors.lastName = 'Last name is required';
        break;
      case 'email':
        if (!value.trim()) fieldErrors.email = 'Email is required';
        else if (!/^\S+@\S+\.\S+$/.test(value)) fieldErrors.email = 'Email is invalid';
        break;
      case 'password':
        if (!value) fieldErrors.password = 'Password is required';
        else if (value.length < 8) fieldErrors.password = 'Password must be at least 8 characters';
        break;
      case 'confirmPassword':
        if (!value) fieldErrors.confirmPassword = 'Please confirm your password';
        else if (value !== formData.password) fieldErrors.confirmPassword = 'Passwords do not match';
        break;
      case 'studentId':
        if (formData.role === 'student' && !value.trim()) {
          fieldErrors.studentId = 'Student ID is required';
        }
        break;
      case 'companyName':
        if (formData.role === 'employer' && !value.trim()) {
          fieldErrors.companyName = 'Company name is required';
        }
        break;
      case 'companyPosition':
        if (formData.role === 'employer' && !value.trim()) {
          fieldErrors.companyPosition = 'Position is required';
        }
        break;
      case 'termsAgreed':
        if (!value) fieldErrors.termsAgreed = 'You must agree to the terms and conditions';
        break;
      default:
        break;
    }
    
    return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
  };

  const calculatePasswordStrength = (password) => {
    // Initialize score
    let score = 0;
    let message = 'Too weak';
    
    // Skip calculation if password is empty
    if (!password) {
      setPasswordStrength({ score, message });
      return;
    }
    
    // Add points for length
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Add points for complexity
    if (/[A-Z]/.test(password)) score += 1; // Has uppercase
    if (/[a-z]/.test(password)) score += 1; // Has lowercase
    if (/[0-9]/.test(password)) score += 1; // Has number
    if (/[^A-Za-z0-9]/.test(password)) score += 1; // Has special char
    
    // Set message based on score
    if (score <= 2) message = 'Weak';
    else if (score <= 4) message = 'Medium';
    else if (score <= 6) message = 'Strong';
    else message = 'Very strong';
    
    // Normalize score to 0-100 range
    const normalizedScore = Math.min(Math.floor((score / 6) * 100), 100);
    
    setPasswordStrength({ score: normalizedScore, message });
  };

  const validate = () => {
    const newErrors = {};
    
    // Validate required fields
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    // Role-specific validations
    if (formData.role === 'student' && !formData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required';
    }
    
    if (formData.role === 'employer') {
      if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
      if (!formData.companyPosition.trim()) newErrors.companyPosition = 'Position is required';
    }
    
    if (!formData.termsAgreed) {
      newErrors.termsAgreed = 'You must agree to the terms and conditions';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      
      // Set all fields as touched
      const newTouched = {};
      Object.keys(formData).forEach(key => {
        newTouched[key] = true;
      });
      setTouched(newTouched);
      
      // Scroll to first error
      const firstErrorField = document.querySelector(`.${styles.inputError}`);
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorField.focus();
      }
      
      return;
    }
    
    try {
      const user = await register(formData);
      
      showSuccess(`Account created successfully! Welcome, ${user.firstName}!`);
      
      // Redirect based on role
      if (user.role === 'student') {
        router.push('/student/dashboard');
      } else if (user.role === 'employer') {
        router.push('/employer/dashboard');
      } else {
        router.push('/');
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      showError('Registration failed. Please try again.');
      setErrors({ form: 'Registration failed. Please try again.' });
      
      // Scroll to top to show the error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Get color for password strength meter
  const getPasswordStrengthColor = () => {
    const { score } = passwordStrength;
    if (score < 30) return '#ef4444'; // Red for weak
    if (score < 60) return '#f59e0b'; // Yellow/Orange for medium
    return '#22c55e'; // Green for strong
  };

  return (
    <MainLayout>
      <div className={`container ${styles.signupContainer}`}>
        <div className={styles.signupCard}>
          <div className={styles.signupHeader}>
            <h1>Create Your Account</h1>
            <p>Join the COSA platform to manage your co-op program applications and reports.</p>
          </div>
          
          {errors.form && <div className={styles.errorMessage}>{errors.form}</div>}
          
          <form onSubmit={handleSubmit} className={styles.signupForm}>
            <div className={styles.formSection}>
              <h2>Personal Information</h2>
              
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="firstName" className="form-label">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    className={`form-control ${errors.firstName && touched.firstName ? styles.inputError : ''}`}
                    value={formData.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isLoading}
                    placeholder="Enter your first name"
                    autoFocus
                  />
                  {errors.firstName && touched.firstName && (
                    <div className={styles.errorText}>{errors.firstName}</div>
                  )}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="lastName" className="form-label">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    className={`form-control ${errors.lastName && touched.lastName ? styles.inputError : ''}`}
                    value={formData.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isLoading}
                    placeholder="Enter your last name"
                  />
                  {errors.lastName && touched.lastName && (
                    <div className={styles.errorText}>{errors.lastName}</div>
                  )}
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="email" className="form-label">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`form-control ${errors.email && touched.email ? styles.inputError : ''}`}
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isLoading}
                  placeholder="Enter your email address"
                />
                {errors.email && touched.email && (
                  <div className={styles.errorText}>{errors.email}</div>
                )}
              </div>
            </div>
            
            <div className={styles.formSection}>
              <h2>Security</h2>
              
              <div className={styles.formGroup}>
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className={`form-control ${errors.password && touched.password ? styles.inputError : ''}`}
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isLoading}
                  placeholder="Create a strong password"
                />
                {formData.password && (
                  <div className={styles.passwordStrength}>
                    <div 
                      className={styles.passwordStrengthMeter} 
                      style={{ 
                        width: `${passwordStrength.score}%`,
                        backgroundColor: getPasswordStrengthColor()
                      }}
                    ></div>
                    <span className={styles.passwordStrengthText}>
                      {passwordStrength.message}
                    </span>
                  </div>
                )}
                <div className={styles.passwordHint}>
                  Use at least 8 characters with uppercase, lowercase, numbers and special characters
                </div>
                {errors.password && touched.password && (
                  <div className={styles.errorText}>{errors.password}</div>
                )}
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`form-control ${errors.confirmPassword && touched.confirmPassword ? styles.inputError : ''}`}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={isLoading}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && touched.confirmPassword && (
                  <div className={styles.errorText}>{errors.confirmPassword}</div>
                )}
              </div>
            </div>
            
            <div className={styles.formSection}>
              <h2>Role Information</h2>
              
              <div className={styles.formGroup}>
                <label htmlFor="role" className="form-label">I am a:</label>
                <select
                  id="role"
                  name="role"
                  className="form-control"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={isLoading}
                >
                  <option value="student">Student</option>
                  <option value="employer">Employer</option>
                </select>
              </div>
              
              {formData.role === 'student' && (
                <div className={styles.formGroup}>
                  <label htmlFor="studentId" className="form-label">Student ID</label>
                  <input
                    type="text"
                    id="studentId"
                    name="studentId"
                    className={`form-control ${errors.studentId && touched.studentId ? styles.inputError : ''}`}
                    value={formData.studentId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={isLoading}
                    placeholder="Enter your student ID"
                  />
                  {errors.studentId && touched.studentId && (
                    <div className={styles.errorText}>{errors.studentId}</div>
                  )}
                </div>
              )}
              
              {formData.role === 'employer' && (
                <>
                  <div className={styles.formGroup}>
                    <label htmlFor="companyName" className="form-label">Company Name</label>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      className={`form-control ${errors.companyName && touched.companyName ? styles.inputError : ''}`}
                      value={formData.companyName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isLoading}
                      placeholder="Enter your company name"
                    />
                    {errors.companyName && touched.companyName && (
                      <div className={styles.errorText}>{errors.companyName}</div>
                    )}
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="companyPosition" className="form-label">Your Position</label>
                    <input
                      type="text"
                      id="companyPosition"
                      name="companyPosition"
                      className={`form-control ${errors.companyPosition && touched.companyPosition ? styles.inputError : ''}`}
                      value={formData.companyPosition}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={isLoading}
                      placeholder="Enter your position at the company"
                    />
                    {errors.companyPosition && touched.companyPosition && (
                      <div className={styles.errorText}>{errors.companyPosition}</div>
                    )}
                  </div>
                </>
              )}
            </div>
            
            <div className={styles.termsContainer}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="termsAgreed"
                  checked={formData.termsAgreed}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <span>
                  I agree to the <Link href="/terms" className={styles.termsLink}>Terms of Service</Link> and <Link href="/privacy" className={styles.termsLink}>Privacy Policy</Link>
                </span>
              </label>
              {errors.termsAgreed && (
                <div className={styles.errorText}>{errors.termsAgreed}</div>
              )}
            </div>
            
            <div className={styles.formActions}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className={styles.buttonLoading}>
                    <span className={styles.loadingSpinner}></span>
                    Creating Account...
                  </div>
                ) : 'Create Account'}
              </button>
            </div>
            
            <div className={styles.formFooter}>
              Already have an account? <Link href="/auth/login">Log in</Link>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
} 