/**
 * Utility functions for authentication and redirects
 */

/**
 * Returns the dashboard path based on user role
 * @param {string} role - The user's role (student, employer, admin)
 * @returns {string} - The dashboard path
 */
export const getDashboardPath = (role) => {
  switch (role) {
    case 'student':
      return '/student/dashboard';
    case 'employer':
      return '/employer/dashboard';
    case 'admin':
      return '/admin/dashboard';
    default:
      return '/';
  }
};

/**
 * Redirects the user to the appropriate dashboard
 * @param {object} user - The user object
 * @returns {boolean} - Whether the redirection was successful
 */
export const redirectToDashboard = (user) => {
  if (!user) return false;
  
  // Figure out the path based on user role
  const role = user.role || 'student';
  const dashboardPath = `/${role}/dashboard`;
  
  // Only redirect if we're not already on the dashboard path
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    if (!currentPath.includes(dashboardPath)) {
      console.log(`Redirecting to ${dashboardPath}`);
      window.location.href = dashboardPath;
      return true;
    }
  }
  
  return false;
};

/**
 * Determines if a user should be redirected from the current path
 * @param {string} currentPath - The current path
 * @param {object} user - The user object
 * @returns {boolean} - Whether the user should be redirected
 */
export const shouldRedirect = (currentPath, user) => {
  // Never redirect without a user or role
  if (!user || !user.role) return false;
  
  // Never redirect from auth pages
  if (currentPath.startsWith('/auth/')) return false;
  
  // Never redirect from root path
  if (currentPath === '/') return false;
  
  // Don't redirect if already on a dashboard page
  if (currentPath.includes('/dashboard')) return false;
  
  // Check user's role against path
  const isDashboardPath = getDashboardPath(user.role);
  
  // If already on correct role path, no need to redirect
  if (currentPath.startsWith(isDashboardPath)) return false;
  
  // Role-specific checks
  if (user.role === 'student' && currentPath.startsWith('/student/')) return false;
  if (user.role === 'employer' && currentPath.startsWith('/employer/')) return false;
  if (user.role === 'admin') {
    // Admins can access all sections
    if (currentPath.startsWith('/admin/') || 
        currentPath.startsWith('/student/') || 
        currentPath.startsWith('/employer/')) {
      return false;
    }
  }
  
  // Default: redirect is needed
  return true;
}; 