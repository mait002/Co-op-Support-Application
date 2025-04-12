'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthContext';

export default function SimpleAdminDashboard() {
  const { isAuthenticated, userRole } = useAuth();
  const [status, setStatus] = useState('Loading...');

  useEffect(() => {
    console.log("SimpleAdminDashboard - Auth:", { isAuthenticated, userRole });
    
    if (isAuthenticated && userRole === 'admin') {
      setStatus('Welcome Admin!');
    } else if (isAuthenticated) {
      setStatus('You are logged in but not an admin');
    } else {
      setStatus('Please log in to access admin features');
    }
  }, [isAuthenticated, userRole]);

  return (
    <div style={{padding: '20px', maxWidth: '800px', margin: '0 auto'}}>
      <h1>Simple Admin Dashboard</h1>
      <p>Status: {status}</p>
      
      <div style={{marginTop: '30px', display: 'flex', gap: '10px', flexDirection: 'column'}}>
        <h2>Navigation:</h2>
        <a href="/" style={{color: 'blue'}}>Home</a>
        <a href="/admin/applications" style={{color: 'blue'}}>Admin Applications</a>
        <a href="/admin/reports" style={{color: 'blue'}}>Admin Reports</a>
        <a href="/admin/evaluations" style={{color: 'blue'}}>Admin Evaluations</a>
      </div>
    </div>
  );
} 