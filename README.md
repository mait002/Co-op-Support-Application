# COSA - Co-op Support Application (Frontend)

This is the frontend repository for COSA, a comprehensive application designed to streamline the co-op program application and reporting process. This application allows students to apply for provisional acceptance to the co-op program, and later submit their work term reports. It also allows employers to provide evaluations for students who have completed work terms.

### Contributors: 
Dhruven Jayswal (dhruven.jayswal@torontomu.ca)
Kent Romio (kent.romio@torontomu.ca)
Armin Farzanehnia (afarzanehnia@torontomu.ca)
Wilbert Chang (wilbert.chang@torontomu.ca)
Nathan Chandra (nathan.l.chandra@torontomu.ca)
Maitreyee Das Urmi (maitreyee.urmi@torontomu.ca)

## Table of Contents

1. [Project Structure](#project-structure)
2. [Technologies Used](#technologies-used)
3. [Getting Started](#getting-started)
4. [Supabase Setup](#supabase-setup)
5. [Key Features](#key-features)
6. [API Integration Points](#api-integration-points)
7. [Authentication](#authentication)
8. [File Upload](#file-upload)
9. [Deployment](#deployment)

## Project Structure

The project follows a modular approach with the Next.js App Router structure:

```
app/
├── auth/             # Authentication-related pages
│   ├── login/        # Login page
│   └── signup/       # Signup page
├── admin/            # Admin dashboard and functionality
│   └── dashboard/    # Admin dashboard
├── student/          # Student-related pages
│   ├── application/  # Student application form
│   └── dashboard/    # Student dashboard (to be implemented)
├── employer/         # Employer-related pages (to be implemented)
├── components/       # Reusable components
│   ├── Header.js     # Main navigation header
│   ├── Footer.js     # Page footer
│   └── MainLayout.js # Main layout wrapper
└── globals.css       # Global styles
lib/
├── supabase.js       # Supabase client configuration
├── api.js            # API service layer for Supabase
supabase/
├── schema.sql        # SQL schema for Supabase database
```

## Technologies Used

- **Next.js 14.1.0** - React framework with App Router
- **React 18.2.0** - Frontend library
- **Supabase** - Backend-as-a-Service for auth and database
- **CSS Modules** - For component-level styling

## Getting Started

1. **Installation**

```bash
# Clone the repository
git clone <repository-url>
cd coop-front

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Update NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local

# Start the development server
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Supabase Setup

1. Create a new project in [Supabase](https://supabase.com)
2. Get your Supabase URL and anon key from the project settings
3. Update `.env.local` with these credentials
4. Go to the SQL Editor in Supabase and run the schema in `supabase/schema.sql`
5. Set up Storage buckets for resume and report uploads:
   - Create buckets named `resumes` and `reports`
   - Set the bucket permissions to allow authenticated uploads

## Key Features

- **Authentication** - User registration and login functionality
- **Role-based Access** - Different interfaces for students, employers, and administrators
- **Application Form** - For students to apply to the co-op program
- **Report Submission** - For students to submit work term reports
- **Employer Evaluations** - For employers to evaluate students
- **Admin Dashboard** - For co-op coordinators to manage applications and reports

## API Integration Points

The frontend integrates with Supabase for the following operations:

### Authentication

- User registration (students, employers, admins)
- User login and session management
- Role-based access control

### Student Applications

- Submit a new application
- Get application details and status
- View all applications for a student

### Work Term Reports

- Submit a work term report
- Get report details
- View all reports for a student

### Employer Evaluations

- Submit an evaluation
- Get evaluation details
- View all evaluations by an employer

### Admin

- Get dashboard statistics
- View and manage all applications
- View and manage all reports
- View and manage evaluations

## Authentication

Authentication is implemented using Supabase Auth:

1. JWT tokens are stored in HTTP-only cookies
2. User metadata includes role information (student, employer, admin)
3. Password hashing and security is handled by Supabase
4. Role-based authorization is enforced by middleware

## File Upload

File uploads are handled using Supabase Storage:

- Student resumes in the application form
- Work term reports
- Employer evaluation uploads

Files are stored securely in appropriate Supabase Storage buckets.

## Deployment

This Next.js application can be deployed using:

- Vercel (recommended)
- Netlify
- AWS Amplify
- Any other platform supporting Next.js

## Development Notes

### Environment Variables

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Replace the URL with your backend API URL.

### Customization

- Colors and theme settings can be modified in `app/globals.css`
- Reusable components are in the `app/components` directory

---

For any questions or issues, please contact me.
Happy coding!
