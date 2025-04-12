'use client';

import { createContext, useState, useContext, useEffect } from 'react';
import { 
  supabase, 
  signIn, 
  signUp, 
  signOut, 
  getCurrentUser,
  getCurrentSession 
} from '../../lib/supabase';
import { useRouter } from 'next/navigation';

// Create the authentication context
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    let isMounted = true;
    let hasCheckedAuth = false; // Flag to prevent multiple auth checks
    
    const checkAuthStatus = async () => {
      if (!isMounted || hasCheckedAuth) return;
      
      setIsLoading(true);
      try {
        console.log("Checking authentication status...");
        hasCheckedAuth = true; // Set flag to prevent multiple checks
        
        // Get the user directly
        const currentUser = await getCurrentUser();
        
        if (!currentUser) {
          console.log("No authenticated user found");
          if (isMounted) {
            setUser(null);
            setIsLoading(false);
            setIsInitialized(true);
          }
          return;
        }
        
        console.log("User authenticated:", currentUser.email);
        
        // Check if user is an admin based on metadata first
        const isAdminFromMetadata = 
          currentUser.user_metadata?.role === 'admin' || 
          currentUser.app_metadata?.role === 'admin';
        
        if (isAdminFromMetadata) {
          // Set admin mode in localStorage
          localStorage.setItem('admin_mode', 'true');
        }
        
        // Try to fetch the user profile data from the profiles table
        let profileData = null;
        try {
          console.log("Fetching profile data for user:", currentUser.id);
          
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no profile exists
            
          if (!error && data) {
            profileData = data;
            console.log("Profile data retrieved successfully");
          } else if (error && error.code !== 'PGRST116') { // Ignore "no rows returned" error
            console.warn('Could not fetch profile data, using metadata:', error);
          } else {
            console.log("No profile data found, will use auth metadata");
          }
        } catch (profileError) {
          console.error('Error in profile fetch:', profileError);
          // Continue with authentication despite profile fetch error
        }
        
        // Get role from various sources, prioritizing metadata for admin
        const role = isAdminFromMetadata 
          ? 'admin' 
          : (profileData?.role || currentUser.user_metadata?.role || 'student');
        
        console.log("User role determined:", role);
        
        // Combine auth data with profile data
        const userData = {
          id: currentUser.id,
          email: currentUser.email,
          role: role,
          firstName: profileData?.first_name || currentUser.user_metadata?.firstName || '',
          lastName: profileData?.last_name || currentUser.user_metadata?.lastName || '',
          // Add role-specific fields
          ...(profileData?.role === 'student' && { studentId: profileData.student_id }),
          ...(profileData?.role === 'employer' && { 
            companyName: profileData.company_name,
            companyPosition: profileData.company_position
          }),
        };
        
        // If the role is admin, enable admin mode flag
        if (role === 'admin') {
          localStorage.setItem('admin_mode', 'true');
        }
        
        console.log("Setting authenticated user in context");
        if (isMounted) {
          setUser(userData);
          setIsLoading(false);
          setIsInitialized(true);
        }
      } catch (err) {
        console.error('Authentication check failed:', err);
        if (isMounted) {
          // Don't set error for 'Auth session missing' as it's a normal state
          if (err.message !== 'Auth session missing!') {
            setError('Authentication failed. Please log in again.');
          }
          // Clear admin mode if auth check fails
          localStorage.removeItem('admin_mode');
          // Clear user state on authentication error
          setUser(null);
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    // One-time auth check at start
    checkAuthStatus();
    
    // Set up a simpler auth listener with debounced checks to prevent loops
    const handleAuthChange = (event, session) => {
      console.log("Auth state changed:", event, session ? "Has session" : "No session");
      
      if (event === 'SIGNED_OUT') {
        // Handle sign out immediately
        localStorage.removeItem('admin_mode');
        setUser(null);
        setIsInitialized(true);
        setIsLoading(false);
        hasCheckedAuth = false; // Reset flag to allow checking again after sign-out
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // For sign in, only check if we haven't checked yet
        if (!hasCheckedAuth) {
          checkAuthStatus();
        }
      }
    };
    
    const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
      isMounted = false;
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [router]);

  // Login function
  const login = async (email, password, rememberMe = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the signIn function
      const data = await signIn(email, password);
      
      if (!data || !data.user) {
        throw new Error('Authentication failed');
      }
      
      // Return the complete data object so the login page can access everything
      return data;
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please check your credentials and try again.');
      // Clear admin mode if login fails
      localStorage.removeItem('admin_mode');
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
    setIsLoading(true);
    setError(null);
    
    try {
      await signOut();
      setUser(null);
      // Clear admin mode on logout
      localStorage.removeItem('admin_mode');
    } catch (err) {
      console.error('Logout error:', err);
      setError('Logout failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value = {
    user,
    isLoading,
    isInitialized,
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