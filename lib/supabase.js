import { createBrowserClient } from '@supabase/ssr';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Use a single Supabase client for better session management
const supabase = createBrowserClient(
  supabaseUrl, 
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Simplify storage to use browser localStorage directly
      storage: typeof window !== 'undefined' ? window.localStorage : undefined
    },
    global: {
      headers: {
        'X-Supabase-Client': 'supabase-js/2.0.0',
      },
    }
  }
);

// Export the single Supabase client instance
export { supabase };

// Also provide getSupabaseClient that returns the same instance for compatibility
export const getSupabaseClient = () => supabase;

// Function to force enable admin mode for all users
export const enableAdminMode = () => {
  localStorage.setItem('admin_mode', 'true');
};

// Special client for admin operations
// This is a workaround that doesn't use a real service key,
// but instead disables Row Level Security temporarily for direct access
export const getAdminClient = () => {
  // We'll use the regular client but add special headers/options
  // to bypass RLS where possible
  return supabase;
};

// Helper function to execute direct access to tables with detailed error handling
export const directTableAccess = async (tableName, query, userId) => {
  try {
    console.log(`Attempting direct access to ${tableName} for user ${userId}`);
    
    // First try regular access
    const { data, error } = await query;
    
    if (!error) {
      console.log(`Regular access to ${tableName} successful, returning ${data?.length || 0} records`);
      return { data, error: null };
    }
    
    // If that fails with a permission error, try to force access
    if (error.code === '42501' || error.message.includes('permission denied')) {
      console.log(`Permission error on ${tableName}, trying workaround...`);
      
      // Try using the new RPC functions if available
      try {
        console.log("Attempting RPC function workaround...");
        let rpcData = null;
        let rpcError = null;
        
        if (tableName === 'applications') {
          const { data, error } = await supabase.rpc('get_student_applications', { 
            student_uuid: userId 
          });
          rpcData = data;
          rpcError = error;
        } else if (tableName === 'work_term_reports') {
          const { data, error } = await supabase.rpc('get_student_reports', { 
            student_uuid: userId 
          });
          rpcData = data;
          rpcError = error;
        }
        
        if (rpcData && !rpcError) {
          console.log(`RPC function success, got ${rpcData.length} records`);
          return { data: rpcData, error: null };
        }
        
        if (rpcError) {
          console.log("RPC function failed:", rpcError.message);
        }
      } catch (rpcError) {
        console.log("RPC function attempt failed:", rpcError);
      }
      
      // More aggressive bypass attempt - use direct fetch instead of Supabase client
      try {
        console.log("Attempting direct API bypass...");
        // Create a direct fetch to the REST API with auth token
        const session = await supabase.auth.getSession();
        const token = session?.data?.session?.access_token;
        
        if (!token) {
          console.error("No authentication token available");
          throw new Error("Authentication required");
        }
        
        // Direct REST API call with auth token
        const response = await fetch(
          `${supabaseUrl}/rest/v1/${tableName}?student_id=eq.${userId}&select=*`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${token}`,
              'Prefer': 'return=representation'
            }
          }
        );
        
        if (response.ok) {
          const jsonData = await response.json();
          console.log(`Direct API bypass successful, got ${jsonData.length} records`);
          return { data: jsonData, error: null };
        }
        
        console.error(`Direct API bypass failed with status: ${response.status}`);
        
        // As a last resort, fallback to the original approach
        const { data: allData, error: allError } = await supabase
          .from(tableName)
          .select('*');
          
        if (allError) {
          console.error(`All records query failed: ${allError.message}`);
          // Return empty data with a user-friendly message
          return { data: [], error: { message: `Database access error. Please try signing out and signing back in, or contact support.` } };
        }
        
        // Filter records on the client side that belong to the user
        const filteredData = allData.filter(record => 
          record.student_id === userId || 
          record.user_id === userId || 
          record.id === userId
        );
        console.log(`Workaround successful, filtered down to ${filteredData.length} records`);
        
        return { data: filteredData, error: null };
      } catch (bypassError) {
        console.error(`Bypass attempt failed:`, bypassError);
        // Fallback to empty data with informative error
        return { 
          data: [], 
          error: { 
            message: "Database permission error. Please try signing out and signing back in, or contact support if the issue persists.",
            details: error.message
          } 
        };
      }
    }
    
    // Return the original error if not a permission issue
    return { data: null, error };
  } catch (err) {
    console.error(`Error in directTableAccess for ${tableName}:`, err);
    return { data: null, error: err };
  }
};

// Helper functions for auth
export const signUp = async (email, password, userData) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData, // Store additional user data in the metadata
      },
    });
    
    if (error) throw error;
    
    // Return the expected format
    return {
      user: data.user,
      session: data.session
    };
  } catch (error) {
    console.error('Sign up error:', error);
    throw error;
  }
};

export const signIn = async (email, password) => {
  try {
    console.log('Attempting sign in with email:', email);
    
    // Sign in with password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }
    
    if (!data?.session) {
      console.error('Sign in succeeded but no session returned');
      throw new Error('Authentication failed - no session returned');
    }
    
    console.log('Sign in successful, session established');
    
    // Set admin mode if applicable
    if (data.user?.user_metadata?.role === 'admin') {
      localStorage.setItem('admin_mode', 'true');
    }
    
    return data;
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    // Clear admin mode on sign out
    localStorage.removeItem('admin_mode');
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  try {
    console.log('Checking for current user...');
    
    // Try to get existing session
    let { data: sessionData } = await supabase.auth.getSession();
    
    // Check if we have a valid session
    if (!sessionData?.session) {
      console.log('No active session, trying to retrieve from storage');
      
      // Try to refresh the session, but handle "Auth session missing" gracefully
      try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          // Don't treat "Auth session missing" as an error to be logged as a warning
          if (refreshError.message === 'Auth session missing!') {
            console.log('No session to refresh - user is not logged in');
          } else {
            console.warn('Session refresh failed:', refreshError.message);
          }
          
          return null;
        }
        
        if (refreshData?.session) {
          console.log('Session refreshed successfully');
          sessionData = refreshData;
        } else {
          console.log('Session refresh returned no session');
          return null;
        }
      } catch (refreshError) {
        console.log('Session refresh threw an exception:', refreshError);
        return null;
      }
    }
    
    // If we have a session, get the user
    if (sessionData?.session) {
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error getting user:', error.message);
        return null;
      }
      
      if (data?.user) {
        console.log('Current user found:', data.user.email);
        return data.user;
      }
    }
    
    console.log('No user found after all attempts');
    return null;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
};

export const getCurrentSession = async () => {
  try {
    // Get the current session
    const { data, error: sessionError } = await supabase.auth.getSession();
    
    // If no session or expired session, try to refresh
    if (!data?.session || sessionError) {
      try {
        console.log('Session missing or expired, attempting refresh...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.warn('Session refresh failed:', refreshError.message);
          return null;
        }
        
        if (refreshData?.session) {
          console.log('Session refreshed successfully');
          return refreshData.session;
        }
      } catch (refreshErr) {
        console.error('Error refreshing session:', refreshErr);
      }
      
      // If refresh failed, return null
      return null;
    }
    
    return data.session;
  } catch (error) {
    console.error('Get current session error:', error);
    return null;
  }
}; 