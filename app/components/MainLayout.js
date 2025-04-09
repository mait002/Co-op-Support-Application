'use client';

import { useAuth } from './AuthContext';
import Header from './Header';
import Footer from './Footer';
import styles from './MainLayout.module.css';

export default function MainLayout({ children }) {
  const { isAuthenticated, userRole, isLoading } = useAuth();

  return (
    <div className={styles.layout}>
      <Header isLoggedIn={isAuthenticated} userRole={userRole} />
      <main className={styles.main}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading...</p>
          </div>
        ) : (
          children
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