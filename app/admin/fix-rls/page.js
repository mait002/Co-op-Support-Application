'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '../../components/MainLayout';
import { useAuth } from '../../components/AuthContext';
import { useToast } from '../../components/ToastContext';
import { supabase } from '../../../lib/supabase';

export default function FixRLSPage() {
  const router = useRouter();
  const { user, isAuthenticated, userRole } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [isFixing, setIsFixing] = useState(false);
  const [logs, setLogs] = useState([]);
  
  // Only admin should access this page
  if (!isAuthenticated || userRole !== 'admin') {
    return (
      <MainLayout>
        <div className="container p-4">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="mb-4">You don't have permission to access this page.</p>
          <button 
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Return to Home
          </button>
        </div>
      </MainLayout>
    );
  }
  
  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { message, type, timestamp: new Date().toISOString() }]);
  };
  
  const applyFix = async () => {
    setIsFixing(true);
    addLog('Starting RLS policy fix...');
    
    try {
      // Step 1: Temporarily disable RLS
      addLog('Disabling Row Level Security on tables...');
      
      const disableRLS1 = await supabase.rpc('admin_disable_rls', { 
        table_name: 'profiles' 
      });
      
      if (disableRLS1.error) {
        addLog(`Error disabling RLS on profiles: ${disableRLS1.error.message}`, 'error');
        throw disableRLS1.error;
      }
      
      const disableRLS2 = await supabase.rpc('admin_disable_rls', { 
        table_name: 'applications' 
      });
      
      if (disableRLS2.error) {
        addLog(`Error disabling RLS on applications: ${disableRLS2.error.message}`, 'error');
        throw disableRLS2.error;
      }
      
      // Step 2: Drop all existing policies
      addLog('Dropping existing policies...');
      
      const dropPolicies = await supabase.rpc('admin_drop_all_policies', {
        tables: ['profiles', 'applications']
      });
      
      if (dropPolicies.error) {
        addLog(`Error dropping policies: ${dropPolicies.error.message}`, 'error');
        throw dropPolicies.error;
      }
      
      // Step 3: Create simplified policies
      addLog('Creating simplified policies...');
      
      // Profiles policies
      const createPolicies = await supabase.rpc('admin_create_simple_rls_policies');
      
      if (createPolicies.error) {
        addLog(`Error creating simplified policies: ${createPolicies.error.message}`, 'error');
        throw createPolicies.error;
      }
      
      // Step 4: Re-enable RLS
      addLog('Re-enabling Row Level Security...');
      
      const enableRLS1 = await supabase.rpc('admin_enable_rls', { 
        table_name: 'profiles' 
      });
      
      if (enableRLS1.error) {
        addLog(`Error enabling RLS on profiles: ${enableRLS1.error.message}`, 'error');
        throw enableRLS1.error;
      }
      
      const enableRLS2 = await supabase.rpc('admin_enable_rls', { 
        table_name: 'applications' 
      });
      
      if (enableRLS2.error) {
        addLog(`Error enabling RLS on applications: ${enableRLS2.error.message}`, 'error');
        throw enableRLS2.error;
      }
      
      addLog('RLS policy fix completed successfully!', 'success');
      showSuccess('RLS policies have been successfully fixed!');
      
    } catch (error) {
      console.error('Error fixing RLS policies:', error);
      addLog(`Error: ${error.message}`, 'error');
      showError('Failed to fix RLS policies. Please run the SQL script manually.');
    } finally {
      setIsFixing(false);
    }
  };
  
  return (
    <MainLayout>
      <div className="container p-4">
        <h1 className="text-2xl font-bold mb-4">Fix RLS Policies</h1>
        <p className="mb-6">
          This utility will fix the infinite recursion in Row Level Security policies for the profiles and applications tables.
        </p>
        
        <div className="flex flex-col gap-4 mb-8">
          <p className="text-sm text-gray-700">
            <strong>Note:</strong> This requires Supabase functions to be created first. If this doesn't work, please run the SQL script directly in the Supabase SQL Editor.
          </p>
          
          <button
            onClick={applyFix}
            disabled={isFixing}
            className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50 max-w-xs"
          >
            {isFixing ? 'Fixing...' : 'Apply RLS Fix'}
          </button>
        </div>
        
        <div className="border rounded p-4 bg-gray-50">
          <h2 className="font-bold mb-2">Logs:</h2>
          <div className="bg-black text-white p-4 rounded font-mono text-sm h-80 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Click "Apply RLS Fix" to start.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`mb-1 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-green-400' : 'text-gray-300'}`}>
                  <span className="opacity-70">[{new Date(log.timestamp).toLocaleTimeString()}]</span> {log.message}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="mt-8 p-4 border rounded bg-blue-50">
          <h2 className="font-bold mb-2">Manual Fix Instructions:</h2>
          <p className="mb-2">If the automatic fix doesn't work, please follow these steps:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Go to the Supabase dashboard</li>
            <li>Open the SQL Editor</li>
            <li>Copy and paste the contents of scripts/fix-profiles-rls-immediate.sql</li>
            <li>Run the script</li>
          </ol>
        </div>
      </div>
    </MainLayout>
  );
} 