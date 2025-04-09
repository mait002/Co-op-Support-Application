'use client';

import { AuthProvider } from './components/AuthContext';
import { ToastProvider } from './components/ToastContext';

export function Providers({ children }) {
  return (
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  );
} 