'use client';

import { createContext, useState, useContext, useCallback } from 'react';
import styles from './ToastContext.module.css';

// Create the toast context
const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  // Add a new toast
  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now();
    
    setToasts(prevToasts => [
      ...prevToasts,
      { id, message, type, duration }
    ]);
    
    // Auto-remove toast after duration
    setTimeout(() => {
      removeToast(id);
    }, duration);
    
    return id;
  }, []);

  // Remove a toast by ID
  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  // Helper functions for different toast types
  const showSuccess = useCallback((message, duration) => 
    addToast(message, 'success', duration), [addToast]);
    
  const showError = useCallback((message, duration) => 
    addToast(message, 'error', duration), [addToast]);
    
  const showInfo = useCallback((message, duration) => 
    addToast(message, 'info', duration), [addToast]);
    
  const showWarning = useCallback((message, duration) => 
    addToast(message, 'warning', duration), [addToast]);

  // Toast container component
  const ToastContainer = () => {
    if (toasts.length === 0) return null;
    
    return (
      <div className={styles.toastContainer}>
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`${styles.toast} ${styles[toast.type]}`}
          >
            <div className={styles.toastContent}>
              <span className={styles.toastMessage}>{toast.message}</span>
              <button 
                className={styles.toastClose} 
                onClick={() => removeToast(toast.id)}
              >
                ×
              </button>
            </div>
            <div 
              className={styles.toastProgress} 
              style={{ 
                animationDuration: `${toast.duration}ms` 
              }}
            />
          </div>
        ))}
      </div>
    );
  };

  // Context value
  const value = {
    addToast,
    removeToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// Custom hook to use the toast context
export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
} 