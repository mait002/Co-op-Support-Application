import { Inter, Roboto_Mono } from "next/font/google";
import { Providers } from "./Providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata = {
  title: "COSA - Co-op Support Application",
  description: "Platform for co-op program applications, reporting, and evaluations",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Co-op Support Application for students and employers" />
        <title>COSA - Co-op Support Application</title>
        
        {/* Script to break out of potential redirect loops */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              // Break out of potential redirect loops by clearing storage
              // if the page reloads too frequently
              try {
                // Track page loads
                const now = Date.now();
                const lastLoad = parseInt(sessionStorage.getItem('lastPageLoad') || '0');
                const loadCount = parseInt(sessionStorage.getItem('pageLoadCount') || '0');
                
                // If page loaded less than 2 seconds ago, increment counter
                if (now - lastLoad < 2000) {
                  sessionStorage.setItem('pageLoadCount', (loadCount + 1).toString());
                } else {
                  // Reset counter if more than 2 seconds between loads
                  sessionStorage.setItem('pageLoadCount', '1');
                }
                
                // Store current load time
                sessionStorage.setItem('lastPageLoad', now.toString());
                
                // If too many rapid reloads, clear storage to break loop
                if (loadCount > 3) {
                  console.warn('Possible redirect loop detected, clearing storage');
                  
                  // ENHANCED LOOP PREVENTION: Clear more storage
                  sessionStorage.clear();
                  
                  // Clear auth-related localStorage items
                  const domain = window.location.host.replace('www.', '');
                  localStorage.removeItem(\`sb-\${domain}-auth-token\`);
                  
                  // Clear all redirect tokens and other possible loop causes
                  localStorage.removeItem('redirectCount');
                  localStorage.removeItem('redirectsTimestamp');
                  localStorage.removeItem('admin_mode');
                  
                  // Clear auth cookies by expiring them
                  document.cookie.split(";").forEach(function(c) {
                    if (c.includes('sb-') || c.includes('supabase') || c.includes('auth')) {
                      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                    }
                  });
                  
                  // Force redirect to homepage with noredirect parameter
                  const homeUrl = '/?loop_detected=true&noredirect=true';
                  
                  // Only redirect if we're not already on the home page with loop prevention
                  if (!window.location.href.includes('loop_detected=true')) {
                    // Delay redirect slightly to allow console messages to be seen
                    setTimeout(() => {
                      window.location.href = homeUrl;
                    }, 100);
                  } else {
                    // We're already on the home page with loop prevention
                    // Add a visual indicator to help debugging
                    setTimeout(() => {
                      const div = document.createElement('div');
                      div.style.position = 'fixed';
                      div.style.top = '0';
                      div.style.left = '0';
                      div.style.right = '0';
                      div.style.backgroundColor = '#ffeb3b';
                      div.style.color = 'black';
                      div.style.padding = '10px';
                      div.style.zIndex = '9999';
                      div.style.textAlign = 'center';
                      div.innerHTML = 'Redirect loop detected and stopped. Try <a href="/auth/login?noredirect=true">logging in again</a>.';
                      document.body.appendChild(div);
                    }, 100);
                  }
                }
              } catch (e) {
                console.error('Error in redirect loop protection:', e);
              }
            })();
          `
        }} />
      </head>
      <body className={`${inter.variable} ${robotoMono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
