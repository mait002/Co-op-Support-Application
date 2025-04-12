import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with server-side admin privileges
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }
    
    // Fetch the application to get the resume URL
    const { data: application, error: applicationError } = await supabase
      .from('applications')
      .select('resume_url')
      .eq('id', id)
      .single();
    
    if (applicationError || !application) {
      console.error('Error fetching application:', applicationError);
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }
    
    if (!application.resume_url) {
      return NextResponse.json(
        { error: 'No resume attached to this application' },
        { status: 404 }
      );
    }
    
    // Extract the path and filename parts
    let resumePath = application.resume_url;
    let bucket = 'resumes';
    
    // Handle case where resume_url is a full URL
    if (resumePath.includes('supabase.co')) {
      // Try to extract the bucket and path
      const match = resumePath.match(/\/([^/]+)\/([^/]+\/?.*)$/);
      if (match) {
        bucket = match[1];
        resumePath = match[2];
      } else {
        // If we can't parse it, just use the filename
        resumePath = resumePath.split('/').pop();
      }
    }
    
    console.log(`Trying to fetch file from bucket: ${bucket}, path: ${resumePath}`);
    
    // First try direct download
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .download(resumePath);
    
    if (error) {
      console.error('Error on first attempt:', error);
      
      // Try alternative buckets
      const buckets = ['resumes', 'student-files', 'student-files/resumes'];
      let fileData = null;
      let downloadError = null;
      
      for (const altBucket of buckets) {
        if (altBucket === bucket) continue; // Skip the one we already tried
        
        // Try just the filename
        const filename = resumePath.split('/').pop();
        const paths = [resumePath, filename, `resumes/${filename}`];
        
        for (const path of paths) {
          console.log(`Trying bucket: ${altBucket}, path: ${path}`);
          const { data: altData, error: altError } = await supabase
            .storage
            .from(altBucket)
            .download(path);
          
          if (!altError && altData) {
            fileData = altData;
            break;
          }
        }
        
        if (fileData) break;
      }
      
      if (!fileData) {
        return NextResponse.json(
          { error: 'Resume not found in storage' },
          { status: 404 }
        );
      }
      
      data = fileData;
    }
    
    // Convert the blob to an array buffer
    const arrayBuffer = await data.arrayBuffer();
    
    // Create a response with the file data
    const response = new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="resume_${id}.pdf"`,
      },
    });
    
    return response;
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve resume' },
      { status: 500 }
    );
  }
} 