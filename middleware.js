import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  
  // Create a Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          res.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          res.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  
  // URLs that are always accessible
  const publicUrls = [
    '/',
    '/auth/login',
    '/auth/signup',
    '/auth/forgot-password',
  ];
  
  // Current path
  const path = req.nextUrl.pathname;
  
  // If path is in publicUrls, allow access
  if (publicUrls.includes(path)) {
    return res;
  }
  
  // If not authenticated and trying to access protected route, redirect to login
  if (!session && !publicUrls.includes(path)) {
    const url = new URL('/auth/login', req.url);
    url.searchParams.set('redirectTo', path);
    return NextResponse.redirect(url);
  }
  
  // If authenticated, check role-based access
  if (session) {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get user role from metadata
    const role = user?.user_metadata?.role || 'student';
    
    // Check student routes
    if (path.startsWith('/student') && role !== 'student' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    
    // Check employer routes
    if (path.startsWith('/employer') && role !== 'employer' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    
    // Check admin routes
    if (path.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return res;
}

// Configure which routes this middleware will run on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
}; 