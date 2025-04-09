import { supabase } from './supabase';

/*
 * Student API Functions
 */

// Get a student's applications
export const getStudentApplications = async (studentId) => {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('student_id', studentId);
    
  if (error) throw error;
  return data;
};

// Submit a new application
export const submitApplication = async (applicationData) => {
  const { data, error } = await supabase
    .from('applications')
    .insert(applicationData)
    .select();
    
  if (error) throw error;
  return data[0];
};

// Get a student's work term reports
export const getStudentReports = async (studentId) => {
  const { data, error } = await supabase
    .from('work_term_reports')
    .select('*')
    .eq('student_id', studentId);
    
  if (error) throw error;
  return data;
};

// Submit a work term report
export const submitWorkTermReport = async (reportData) => {
  const { data, error } = await supabase
    .from('work_term_reports')
    .insert(reportData)
    .select();
    
  if (error) throw error;
  return data[0];
};

// Get evaluations for a student
export const getStudentEvaluations = async (studentId) => {
  const { data, error } = await supabase
    .from('evaluations')
    .select('*, employer:profiles!employer_id(first_name, last_name, company_name)')
    .eq('student_id', studentId);
    
  if (error) throw error;
  return data;
};

/*
 * Employer API Functions
 */

// Get students assigned to an employer
export const getAssignedStudents = async (employerId) => {
  const { data, error } = await supabase
    .from('evaluations')
    .select('*, student:profiles!student_id(id, first_name, last_name, student_id, email)')
    .eq('employer_id', employerId);
    
  if (error) throw error;
  return data;
};

// Submit an evaluation
export const submitEvaluation = async (evaluationData) => {
  const { data, error } = await supabase
    .from('evaluations')
    .upsert(evaluationData)
    .select();
    
  if (error) throw error;
  return data[0];
};

// Get evaluations submitted by an employer
export const getEmployerEvaluations = async (employerId) => {
  const { data, error } = await supabase
    .from('evaluations')
    .select('*, student:profiles!student_id(first_name, last_name, student_id)')
    .eq('employer_id', employerId);
    
  if (error) throw error;
  return data;
};

// Request a deadline extension
export const requestDeadlineExtension = async (evaluationId, requestData) => {
  // In a real app, this would update a status field or create a notification
  // For now, we'll just update a comment field
  const { data, error } = await supabase
    .from('evaluations')
    .update({
      status: 'extension_requested',
      comments: requestData.reason
    })
    .eq('id', evaluationId)
    .select();
    
  if (error) throw error;
  return data[0];
};

/*
 * Admin API Functions
 */

// Get all applications with filtering options
export const getApplications = async (filters = {}) => {
  let query = supabase
    .from('applications')
    .select('*, student:profiles!student_id(first_name, last_name, student_id, email)');
    
  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters.search) {
    query = query.or(`student.first_name.ilike.%${filters.search}%,student.last_name.ilike.%${filters.search}%,student.student_id.ilike.%${filters.search}%`);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
};

// Update application status
export const updateApplicationStatus = async (applicationId, status, reviewerId) => {
  const { data, error } = await supabase
    .from('applications')
    .update({
      status,
      reviewed_by: reviewerId,
      review_date: new Date().toISOString()
    })
    .eq('id', applicationId)
    .select();
    
  if (error) throw error;
  return data[0];
};

// Get all work term reports with filtering options
export const getWorkTermReports = async (filters = {}) => {
  let query = supabase
    .from('work_term_reports')
    .select('*, student:profiles!student_id(first_name, last_name, student_id, email)');
    
  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters.type) {
    query = query.eq('report_type', filters.type);
  }
  
  if (filters.search) {
    query = query.or(`student.first_name.ilike.%${filters.search}%,student.last_name.ilike.%${filters.search}%,student.student_id.ilike.%${filters.search}%`);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
};

// Get all evaluations with filtering options
export const getEvaluations = async (filters = {}) => {
  let query = supabase
    .from('evaluations')
    .select('*, student:profiles!student_id(first_name, last_name, student_id), employer:profiles!employer_id(first_name, last_name, company_name)');
    
  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  
  if (filters.workTerm) {
    query = query.eq('work_term', filters.workTerm);
  }
  
  if (filters.search) {
    query = query.or(`student.first_name.ilike.%${filters.search}%,student.last_name.ilike.%${filters.search}%,employer.company_name.ilike.%${filters.search}%`);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
};

// Assign a student to an employer
export const assignStudentToEmployer = async (studentId, employerId, workTerm) => {
  const { data, error } = await supabase
    .rpc('assign_student_to_employer', {
      student_uuid: studentId,
      employer_uuid: employerId,
      work_term_name: workTerm
    });
    
  if (error) throw error;
  return data;
};

// Get dashboard stats for admin
export const getAdminDashboardStats = async () => {
  // Get application counts
  const { data: applicationStats, error: appError } = await supabase
    .from('applications')
    .select('status, count', { count: 'exact' })
    .group('status');
    
  if (appError) throw appError;
  
  // Get report counts
  const { data: reportStats, error: reportError } = await supabase
    .from('work_term_reports')
    .select('status, count', { count: 'exact' })
    .group('status');
    
  if (reportError) throw reportError;
  
  // Get evaluation counts
  const { data: evaluationStats, error: evalError } = await supabase
    .from('evaluations')
    .select('status, count', { count: 'exact' })
    .group('status');
    
  if (evalError) throw evalError;
  
  // Format the stats
  const pendingApplications = applicationStats.find(s => s.status === 'pending')?.count || 0;
  const approvedApplications = applicationStats.find(s => s.status === 'approved')?.count || 0;
  const rejectedApplications = applicationStats.find(s => s.status === 'rejected')?.count || 0;
  
  const pendingReports = reportStats.find(s => s.status === 'pending')?.count || 0;
  const approvedReports = reportStats.find(s => s.status === 'approved')?.count || 0;
  
  const pendingEvaluations = evaluationStats.find(s => s.status === 'pending')?.count || 0;
  const submittedEvaluations = evaluationStats.find(s => s.status === 'submitted')?.count || 0;
  
  return {
    pendingApplications,
    approvedApplications,
    rejectedApplications,
    pendingReports,
    approvedReports,
    pendingEvaluations,
    submittedEvaluations,
  };
};

/*
 * File Upload Functions
 */

// Upload a file to Supabase Storage
export const uploadFile = async (bucket, path, file) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });
    
  if (error) throw error;
  
  // Get the public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
    
  return urlData.publicUrl;
};

// Get a signed URL for downloading a file
export const getFileUrl = async (bucket, path) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60); // 1 hour expiry
    
  if (error) throw error;
  return data.signedUrl;
}; 