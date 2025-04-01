# COSA - Co-op Support Application (Frontend)

This is the frontend repository for COSA, a comprehensive application designed to streamline the co-op program application and reporting process. This application allows students to apply for provisional acceptance to the co-op program, and later submit their work term reports. It also allows employers to provide evaluations for students who have completed work terms.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Technologies Used](#technologies-used)
3. [Getting Started](#getting-started)
4. [Key Features](#key-features)
5. [API Integration Points](#api-integration-points)
6. [Authentication](#authentication)
7. [File Upload](#file-upload)
8. [Deployment](#deployment)

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
```

## Technologies Used

- **Next.js 14.1.0** - React framework with App Router
- **React 18.2.0** - Frontend library
- **CSS Modules** - For component-level styling

## Getting Started

1. **Installation**

```bash
# Clone the repository
git clone <repository-url>
cd coop-front

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Key Features

- **Authentication** - User registration and login functionality
- **Role-based Access** - Different interfaces for students, employers, and administrators
- **Application Form** - For students to apply to the co-op program
- **Report Submission** - For students to submit work term reports
- **Employer Evaluations** - For employers to evaluate students
- **Admin Dashboard** - For co-op coordinators to manage applications and reports

## API Integration Points

The frontend is designed to work with a RESTful API backend. Here are the key API endpoints that need to be implemented:

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current user

### Student Applications

- `POST /api/applications/submit` - Submit a new application
- `GET /api/applications/:id` - Get application details
- `GET /api/applications/student/:id` - Get all applications for a student

### Work Term Reports

- `POST /api/reports/submit` - Submit a work term report
- `GET /api/reports/:id` - Get report details
- `GET /api/reports/student/:id` - Get all reports for a student

### Employer Evaluations

- `POST /api/evaluations/submit` - Submit an evaluation
- `GET /api/evaluations/:id` - Get evaluation details
- `GET /api/evaluations/employer/:id` - Get all evaluations for an employer

### Admin

- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/applications` - Get all applications (with filtering)
- `PUT /api/admin/applications/:id/status` - Update application status
- `GET /api/admin/reports` - Get all reports (with filtering)
- `POST /api/admin/evaluations/reminder` - Send reminder emails

## Authentication

The current implementation uses localStorage for demonstration purposes, but the backend should implement a proper authentication system with:

1. JWT tokens or secure sessions
2. Password hashing
3. Role-based authorization
4. CSRF protection

Modify the `MainLayout.js` component to integrate with your authentication system.

## File Upload

File uploads are implemented for:

1. Student resumes in the application form
2. Work term reports

The backend should implement secure file handling:
- Store files in secure storage (e.g., AWS S3)
- Implement validation for file type and size
- Associate files with the appropriate user/application/report

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

For any questions or issues, please contact [your-email@example.com].

Happy coding!
