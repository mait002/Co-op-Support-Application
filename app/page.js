import Link from 'next/link';
import MainLayout from './components/MainLayout';
import styles from './page.module.css';

export default function Home() {
  return (
    <MainLayout>
      <div className={styles.homePage}>
        <section className={styles.hero}>
          <div className="container">
            <div className={styles.heroContent}>
              <h1>Co-op Support Application</h1>
              <p>Streamlining the co-op program application and reporting process</p>
              <div className={styles.heroCta}>
                <Link href="/auth/signup" className="btn btn-primary">Sign Up</Link>
                <Link href="/auth/login" className="btn btn-outline">Login</Link>
              </div>
            </div>
          </div>
        </section>

        <section className={`${styles.features} container`}>
          <h2 className={styles.sectionTitle}>How COSA Works</h2>
          
          <div className={styles.featureGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
                </svg>
              </div>
              <h3>Apply for Co-op</h3>
              <p>Submit your application with the required information. Your application will be reviewed for provisional acceptance.</p>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h3>Get Accepted</h3>
              <p>After reviewing your application, the co-op coordinator will determine if you meet the requirements for provisional acceptance.</p>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <h3>Submit Reports</h3>
              <p>After completing your work term, submit your reports and have your employer provide an evaluation of your performance.</p>
            </div>
          </div>
        </section>

        <section className={styles.infoSection}>
          <div className="container">
            <div className={styles.infoGrid}>
              <div className={styles.infoContent}>
                <h2>For Students</h2>
                <p>COSA makes it simple to apply for the co-op program and manage your work term reporting. Simply create an account, submit your application, and track your status.</p>
                <ul>
                  <li>Easy application process</li>
                  <li>Track application status</li>
                  <li>Submit work term reports</li>
                  <li>Receive feedback from employers</li>
                </ul>
                <Link href="/auth/signup?role=student" className="btn btn-primary">Student Sign Up</Link>
              </div>
              
              <div className={styles.infoContent}>
                <h2>For Employers</h2>
                <p>As an employer, you can easily submit evaluations for students who completed work terms at your company, helping them fulfill their co-op requirements.</p>
                <ul>
                  <li>Submit student evaluations</li>
                  <li>Choose between PDF upload or online form</li>
                  <li>Provide valuable feedback to students</li>
                  <li>Support the co-op program</li>
                </ul>
                <Link href="/auth/signup?role=employer" className="btn btn-primary">Employer Sign Up</Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
