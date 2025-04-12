'use client';

import MainLayout from './components/MainLayout';
import { useAuth } from './components/AuthContext';
import { useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function HomePage() {
  const { isAuthenticated, userRole, isLoading } = useAuth();
  
  useEffect(() => {
    // Disable all redirects on homepage
    if (typeof window !== 'undefined') {
      console.log('Home page loaded, clearing all redirect flags');
      
      // Clear all session storage items related to redirects
      sessionStorage.removeItem('loginRedirect');
      sessionStorage.removeItem('manualRedirect');
      sessionStorage.removeItem('redirectAttempts');
      sessionStorage.removeItem('loopDetected');
      sessionStorage.removeItem('userRole');
      
      // Clear all localStorage items related to redirects
      localStorage.removeItem('redirectCount');
      localStorage.removeItem('redirectsTimestamp');
    }
  }, []);
  
  return (
    <MainLayout>
      <div className={styles.container}>
        <div className={styles.heroSection}>
          <h1>Welcome to COSA</h1>
          <p className={styles.subtitle}>Streamline Your Co-op Experience</p>
          
          {/* Authentication status display - can be removed in production */}
          <div className={styles.authStatus}>
            {isLoading ? 'Loading...' : isAuthenticated ? `Logged in as ${userRole}` : 'Not logged in'}
          </div>
        </div>
        
        <div className={styles.features}>
          <div className={styles.featureCard}>
            <h2>For Students</h2>
            <p>Submit applications, track your progress, and manage your co-op experience all in one place. Get real-time updates on your application status.</p>
            {isAuthenticated && userRole === 'student' ? (
              <Link href="/student/dashboard" className={styles.featureButton}>
                Go to Dashboard
              </Link>
            ) : !isAuthenticated && (
              <Link href="/auth/login" className={styles.featureButton}>
                Sign In
              </Link>
            )}
          </div>
          
          <div className={styles.featureCard}>
            <h2>For Employers</h2>
            <p>Post opportunities, review applications, and connect with talented students. Streamline the hiring process and manage your co-op students.</p>
            {isAuthenticated && userRole === 'employer' ? (
              <Link href="/employer/dashboard" className={styles.featureButton}>
                Go to Dashboard
              </Link>
            ) : !isAuthenticated && (
              <Link href="/auth/login" className={styles.featureButton}>
                Sign In
              </Link>
            )}
          </div>
          
          <div className={styles.featureCard}>
            <h2>For Administrators</h2>
            <p>Manage the co-op program with powerful tools for overseeing applications, generating reports, and ensuring program success.</p>
            {isAuthenticated && userRole === 'admin' ? (
              <Link href="/admin/dashboard" className={styles.featureButton}>
                Go to Dashboard
              </Link>
            ) : !isAuthenticated && (
              <Link href="/auth/login" className={styles.featureButton}>
                Sign In
              </Link>
            )}
          </div>
        </div>
        
        <div className={styles.infoSection}>
          <h2>About COSA</h2>
          <p>
            The Co-op Support Application (COSA) helps universities manage their cooperative 
            education programs efficiently. Our platform connects students, employers, and 
            administrators in a seamless ecosystem that simplifies the co-op process from 
            application to completion.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
