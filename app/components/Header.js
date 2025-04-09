'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import styles from './Header.module.css';

export default function Header() {
  const router = useRouter();
  const { user, isAuthenticated, userRole, logout } = useAuth();
  const { showSuccess } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    showSuccess('You have been logged out successfully');
    router.push('/');
    setIsMenuOpen(false);
  };

  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerContainer}`}>
        <div className={styles.logo}>
          <Link href="/">
            <h1>COSA</h1>
            <span>Co-op Support Application</span>
          </Link>
        </div>

        <button className={styles.menuToggle} onClick={toggleMenu} aria-label="Toggle menu">
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className={`${styles.nav} ${isMenuOpen ? styles.open : ''}`}>
          <ul className={styles.navList}>
            <li className={styles.navItem}>
              <Link href="/" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Home</Link>
            </li>
            
            {!isAuthenticated ? (
              <>
                <li className={styles.navItem}>
                  <Link href="/auth/login" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Login</Link>
                </li>
                <li className={styles.navItem}>
                  <Link href="/auth/signup" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
                </li>
              </>
            ) : userRole === 'admin' ? (
              <>
                <li className={styles.navItem}>
                  <Link href="/admin/dashboard" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                </li>
                <li className={styles.navItem}>
                  <Link href="/admin/applications" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Applications</Link>
                </li>
                <li className={styles.navItem}>
                  <Link href="/admin/reports" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Reports</Link>
                </li>
                <li className={styles.navItem}>
                  <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
                </li>
              </>
            ) : userRole === 'student' ? (
              <>
                <li className={styles.navItem}>
                  <Link href="/student/dashboard" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                </li>
                <li className={styles.navItem}>
                  <Link href="/student/application" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Application</Link>
                </li>
                <li className={styles.navItem}>
                  <Link href="/student/report" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Submit Report</Link>
                </li>
                <li className={styles.navItem}>
                  <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
                </li>
              </>
            ) : userRole === 'employer' ? (
              <>
                <li className={styles.navItem}>
                  <Link href="/employer/dashboard" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                </li>
                <li className={styles.navItem}>
                  <Link href="/employer/evaluations" className={styles.navLink} onClick={() => setIsMenuOpen(false)}>Evaluations</Link>
                </li>
                <li className={styles.navItem}>
                  <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
                </li>
              </>
            ) : null}
            
            {isAuthenticated && (
              <li className={styles.userInfo}>
                <span>Hello, {user?.firstName || 'User'}</span>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}

// Note for backend developer:
// This component checks for authentication status and user role to show appropriate navigation options.
// You'll need to:
// 1. Implement an authentication system that provides isLoggedIn and userRole states
// 2. Ensure proper redirection rules based on authentication status
// 3. Implement the logout functionality 