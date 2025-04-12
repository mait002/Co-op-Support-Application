'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import Header from './Header';
import Footer from './Footer';
import { shouldRedirect, redirectToDashboard, getDashboardPath } from '../../lib/auth-helpers';
import styles from './MainLayout.module.css';

export default function MainLayout({ children }) {
  const { isAuthenticated, user, userRole, isLoading, isInitialized } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  // Redirect logic based on authentication status and path
  useEffect(() => {
    // Don't redirect until auth is fully initialized and loading is complete
    if (isLoading || !isInitialized) return;
    
    // Never redirect on auth pages
    if (pathname.startsWith('/auth/')) {
      // If user is authenticated and on login page, redirect to homepage
      if (isAuthenticated && pathname === '/auth/login') {
        console.log('Authenticated user on login page, redirecting to homepage');
        router.replace('/');
        return;
      }
      return;
    }
    
    // Only log when necessary to avoid console spam
    if (!window.layoutRenderCount) window.layoutRenderCount = 0;
    window.layoutRenderCount++;
    
    if (window.layoutRenderCount % 10 === 1) {
      console.log(`[MainLayout] Auth state: authenticated=${isAuthenticated}, role=${userRole}, path=${pathname}`);
    }
    
    // Only redirect for content pages with clear permissions issue
    if (isAuthenticated && user && user.role) {
      // Only redirect if trying to access a role-specific area without permission
      if (pathname.startsWith('/student/') && user.role !== 'student' && user.role !== 'admin') {
        router.replace(getDashboardPath(user.role));
      } else if (pathname.startsWith('/employer/') && user.role !== 'employer' && user.role !== 'admin') {
        router.replace(getDashboardPath(user.role));
      } else if (pathname.startsWith('/admin/') && user.role !== 'admin') {
        router.replace(getDashboardPath(user.role));
      }
    }
  }, [isAuthenticated, user, pathname, router, isLoading, isInitialized]);
  
  // Minimal debug logging 
  useEffect(() => {
    if (isInitialized && !isLoading) {
      console.log(`MainLayout ready: ${pathname} | Auth: ${isAuthenticated ? 'Yes' : 'No'} | Role: ${userRole || 'None'}`);
    }
  }, [isInitialized, isLoading, pathname, isAuthenticated, userRole]);

  return (
    <div className={styles.layout}>
      <Header isLoggedIn={isAuthenticated} userRole={userRole} />
      <main className={styles.main}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading authentication...</p>
          </div>
        ) : (
          <>
            {/* Debug info */}
            <div style={{padding: '10px', fontSize: '12px', background: '#f0f0f0', display: 'none'}}>
              Auth: {isAuthenticated ? 'Yes' : 'No'} | 
              Role: {userRole || 'None'} | 
              Loading: {isLoading ? 'Yes' : 'No'}
            </div>
            {children}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

// Note for backend developer:
// Replace the useState and useEffect logic with proper authentication.
// You'll need to:
// 1. Implement an API endpoint for session verification
// 2. Handle token storage securely (not just in localStorage)
// 3. Create proper auth context provider to share auth state across components 