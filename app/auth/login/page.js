'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import MainLayout from '../../components/MainLayout';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import styles from './login.module.css';

export default function Login() {
  const router = useRouter();
  const { login, isLoading, isAuthenticated } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    // Check if dark mode is enabled in the system
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeQuery.matches);

    // Listen for changes
    const handler = (e) => setIsDarkMode(e.matches);
    darkModeQuery.addEventListener('change', handler);
    return () => darkModeQuery.removeEventListener('change', handler);
  }, []);

  // Input text color style based on dark mode
  const inputTextStyle = {
    color: isDarkMode ? '#ffffff' : '#000000',
    fontWeight: 'bold'
  };

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
      case 'email':
        if (!value.trim()) fieldErrors.email = 'Email is required';
        else if (!/^\S+@\S+\.\S+$/.test(value)) fieldErrors.email = 'Email is invalid';
        break;
      case 'password':
        if (!value) fieldErrors.password = 'Password is required';
        break;
      default:
        break;
    }
    
    return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    if (!formData.password) newErrors.password = 'Password is required';
    
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
      
      // Focus first input with error
      const firstErrorField = document.querySelector(`.${styles.inputError}`);
      if (firstErrorField) {
        firstErrorField.focus();
      }
      
      return;
    }
    
    try {
      const user = await login(formData.email, formData.password, formData.rememberMe);
      
      showSuccess(`Welcome back, ${user.firstName}!`);
      
      // Redirect based on role
      if (user.role === 'student') {
        router.push('/student/dashboard');
      } else if (user.role === 'employer') {
        router.push('/employer/dashboard');
      } else if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      
      // Show appropriate error message based on error type
      const errorMessage = error.message || 'Invalid email or password. Please try again.';
      showError(errorMessage);
      setErrors({ form: errorMessage });
      
      // Clear password field for security
      setFormData(prev => ({ ...prev, password: '' }));
      
      // Focus email field to try again
      document.getElementById('email')?.focus();
    }
  };

  return (
    <MainLayout>
      <div className={`container ${styles.loginContainer}`}>
        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <h1>Welcome Back</h1>
            <p>Log in to access your COSA account</p>
          </div>
          
          {errors.form && <div className={styles.errorMessage}>{errors.form}</div>}
          
          <form onSubmit={handleSubmit} className={styles.loginForm}>
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
                placeholder="Enter your email"
                disabled={isLoading}
                autoFocus
                style={inputTextStyle}
              />
              {errors.email && touched.email && <div className={styles.errorText}>{errors.email}</div>}
            </div>
            
            <div className={styles.formGroup}>
              <div className={styles.passwordHeader}>
                <label htmlFor="password" className="form-label">Password</label>
                <Link href="/auth/forgot-password" className={styles.forgotPasswordLink}>
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                id="password"
                name="password"
                className={`form-control ${errors.password && touched.password ? styles.inputError : ''}`}
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter your password"
                disabled={isLoading}
                style={inputTextStyle}
              />
              {errors.password && touched.password && <div className={styles.errorText}>{errors.password}</div>}
            </div>
            
            <div className={styles.rememberMeContainer}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <span>Remember me for 30 days</span>
              </label>
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
                    Logging in...
                  </div>
                ) : 'Log In'}
              </button>
            </div>
            
            <div className={styles.formFooter}>
              Don't have an account? <Link href="/auth/signup">Sign up</Link>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
} 