import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  
  // Get the current URL path
  const path = req.nextUrl.pathname;
  const url = req.nextUrl;
  
  // Check for noredirect parameter - bypass all middleware checks when present
  if (url.searchParams.has('noredirect')) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Middleware: Bypassing checks due to noredirect parameter for ${path}`);
      res.headers.set('X-Debug-Bypass', 'noredirect-parameter');
    }
    return res;
  }
  
  // Add diagnostic headers for role-based access
  if (process.env.NODE_ENV !== 'production') {
    res.headers.set('X-Debug-Path', path);
  }
  
  // URLs that are always accessible
  const publicUrls = [
    '/',
    '/auth/login',
    '/auth/signup',
    '/auth/forgot-password',
    '/api/auth/callback',
  ];
  
  // Allow access to public paths
  if (publicUrls.some(url => path === url || path.startsWith(`${url}/`))) {
    if (process.env.NODE_ENV !== 'production') {
      res.headers.set('X-Debug-Access', 'public-path');
    }
    return res;
  }

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
  
  // If not authenticated and trying to access protected route, redirect to login
  if (!session) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Middleware: No session found, redirecting to login from ${path}`);
    }
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }
  
  // Get user role for role-based access control
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role || 'student';
  
  if (process.env.NODE_ENV !== 'production') {
    res.headers.set('X-Debug-User-Role', role);
  }
  
  // Debug user and role when accessing protected routes
  console.log(`Middleware: User ${user?.email} with role ${role} accessing ${path}`);
  
  // Check student routes
  if (path.startsWith('/student') && role !== 'student' && role !== 'admin') {
    console.log(`Access denied: User with role ${role} attempted to access student route ${path}`);
    return NextResponse.redirect(new URL('/', req.url));
  }
  
  // Check employer routes
  if (path.startsWith('/employer') && role !== 'employer' && role !== 'admin') {
    console.log(`Access denied: User with role ${role} attempted to access employer route ${path}`);
    return NextResponse.redirect(new URL('/', req.url));
  }
  
  // Check admin routes
  if (path.startsWith('/admin') && role !== 'admin') {
    console.log(`Access denied: User with role ${role} attempted to access admin route ${path}`);
    return NextResponse.redirect(new URL('/', req.url));
  }

  return res;
}

// Configure which routes this middleware will run on
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
}; 