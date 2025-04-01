'use client';

import { createContext, useState, useContext, useEffect } from 'react';

// Create the authentication context
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would be an API call to verify the JWT token
        // For demo purposes, we'll check localStorage
        const storedUser = localStorage.getItem('cosa_user');
        const storedSession = sessionStorage.getItem('cosa_user');
        const userData = storedUser || storedSession;
        
        if (userData) {
          try {
            const parsedUserData = JSON.parse(userData);
            setUser(parsedUserData);
          } catch (parseErr) {
            console.error('Failed to parse user data:', parseErr);
            clearAuthData();
          }
        }
      } catch (err) {
        console.error('Authentication check failed:', err);
        clearAuthData();
        setError('Authentication failed. Please log in again.');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);
  
  // Helper to clear all auth data
  const clearAuthData = () => {
    localStorage.removeItem('cosa_user');
    sessionStorage.removeItem('cosa_user');
  };

  // Login function
  const login = async (email, password, rememberMe = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll simulate a login
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, we'll use the email to determine the role
      let role = 'student';
      
      if (email.includes('admin')) {
        role = 'admin';
      } else if (email.includes('employer')) {
        role = 'employer';
      }
      
      // Generate a random ID for the demo user
      const userId = Math.random().toString(36).substring(2, 15);
      
      const userData = {
        id: userId,
        firstName: 'Demo',
        lastName: 'User',
        email: email,
        role: role,
        loginTime: new Date().toISOString()
      };
      
      // Store user info based on remember me preference
      const userDataString = JSON.stringify(userData);
      
      if (rememberMe) {
        // In localStorage for persistent login
        localStorage.setItem('cosa_user', userDataString);
      } else {
        // In sessionStorage for session-only login
        sessionStorage.setItem('cosa_user', userDataString);
      }
      
      // Update state
      setUser(userData);
      return userData;
    } catch (err) {
      setError('Login failed. Please check your credentials and try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll simulate registration
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a random ID for the demo user
      const userId = Math.random().toString(36).substring(2, 15);
      
      const newUser = {
        id: userId,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role,
        registrationTime: new Date().toISOString()
      };
      
      // For demo purposes, add role-specific data
      if (userData.role === 'student') {
        newUser.studentId = userData.studentId;
      } else if (userData.role === 'employer') {
        newUser.companyName = userData.companyName;
        newUser.companyPosition = userData.companyPosition;
      }
      
      // Store user info in sessionStorage (users need to explicitly select "remember me" during login)
      sessionStorage.setItem('cosa_user', JSON.stringify(newUser));
      
      // Update state
      setUser(newUser);
      return newUser;
    } catch (err) {
      console.error('Registration error:', err);
      setError('Registration failed. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    clearAuthData();
    setUser(null);
  };

  // Context value
  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    userRole: user?.role || null,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 