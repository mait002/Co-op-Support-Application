import styles from './Footer.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerContainer}`}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h3>COSA</h3>
            <p>Co-op Support Application</p>
            <p>Streamlining the co-op program application and reporting process.</p>
          </div>
          
          <div className={styles.footerSection}>
            <h3>Quick Links</h3>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/auth/login">Login</a></li>
              <li><a href="/auth/signup">Sign Up</a></li>
            </ul>
          </div>
          
          <div className={styles.footerSection}>
            <h3>Contact</h3>
            <p>Email: coop.coordinator@university.edu</p>
            <p>Phone: (123) 456-7890</p>
            <p>Office: Student Services Building, Room 123</p>
          </div>
        </div>
        
        <div className={styles.footerBottom}>
          <p>&copy; {currentYear} COSA - Co-op Support Application. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
} 