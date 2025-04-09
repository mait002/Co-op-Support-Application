'use client';

import { createContext, useState, useContext, useEffect } from 'react';
import { 
  supabase, 
  signIn, 
  signUp, 
  signOut, 
  getCurrentUser 
} from '../../lib/supabase';

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
        const currentUser = await getCurrentUser();
        
        if (currentUser) {
          // Fetch the user profile data from the profiles table
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
            
          if (profileError) {
            console.error('Error fetching profile:', profileError);
          }
          
          // Combine auth data with profile data
          const userData = {
            id: currentUser.id,
            email: currentUser.email,
            role: profileData?.role || currentUser.user_metadata.role,
            firstName: profileData?.first_name || currentUser.user_metadata.firstName,
            lastName: profileData?.last_name || currentUser.user_metadata.lastName,
            // Add role-specific fields
            ...(profileData?.role === 'student' && { studentId: profileData.student_id }),
            ...(profileData?.role === 'employer' && { 
              companyName: profileData.company_name,
              companyPosition: profileData.company_position
            }),
          };
          
          setUser(userData);
        }
      } catch (err) {
        console.error('Authentication check failed:', err);
        setError('Authentication failed. Please log in again.');
      } finally {
        setIsLoading(false);
      }
    };

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          checkAuthStatus();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    checkAuthStatus();

    // Clean up subscription on unmount
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Login function
  const login = async (email, password, rememberMe = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { user: authUser, session } = await signIn(email, password);
      
      if (!authUser) throw new Error('Authentication failed');
      
      // Fetch the user profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
        
      if (profileError && profileError.code !== 'PGRST116') {
        // If error is not "no rows returned", then it's a real error
        console.error('Error fetching profile:', profileError);
      }
      
      // Combine auth data with profile data
      const userData = {
        id: authUser.id,
        email: authUser.email,
        role: profileData?.role || authUser.user_metadata.role,
        firstName: profileData?.first_name || authUser.user_metadata.firstName,
        lastName: profileData?.last_name || authUser.user_metadata.lastName,
        // Add role-specific fields
        ...(profileData?.role === 'student' && { studentId: profileData.student_id }),
        ...(profileData?.role === 'employer' && { 
          companyName: profileData.company_name,
          companyPosition: profileData.company_position
        }),
      };
      
      setUser(userData);
      return userData;
    } catch (err) {
      console.error('Login error:', err);
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
      // Extract fields needed for auth
      const { email, password, firstName, lastName, role, ...otherData } = userData;
      
      // Sign up with Supabase Auth
      const response = await signUp(email, password, {
        firstName,
        lastName,
        role,
        ...(role === 'student' && { studentId: otherData.studentId }),
        ...(role === 'employer' && { 
          companyName: otherData.companyName,
          companyPosition: otherData.companyPosition
        }),
      });
      
      console.log('Signup response:', response); // Debug: log the response
      
      // Check if we have a valid user from signup
      if (!response || !response.user) {
        // If user doesn't exist, it might mean confirmation email was sent
        if (response && response.session === null) {
          // Show a confirmation message that email verification is required
          setError('Please check your email to confirm your account before logging in.');
          return {
            id: 'pending',
            email,
            firstName,
            lastName,
            role,
            pendingConfirmation: true
          };
        } else {
          throw new Error('Registration failed - no user returned');
        }
      }
      
      // Create full user object for state
      const newUser = {
        id: response.user.id,
        email: email,
        firstName: firstName,
        lastName: lastName,
        role: role,
        // Add role-specific fields to the state
        ...(role === 'student' && { studentId: otherData.studentId }),
        ...(role === 'employer' && { 
          companyName: otherData.companyName,
          companyPosition: otherData.companyPosition
        }),
      };
      
      setUser(newUser);
      
      // Note: The profile will be created by the database trigger
      // (handle_new_user function) we set up in schema.sql
      
      return newUser;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError('Logout failed. Please try again.');
    }
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