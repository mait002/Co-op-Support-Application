# COSA Backend Integration Guide

This document provides comprehensive guidance for backend developers on how to integrate with the Co-op Support Application (COSA) frontend. It covers authentication flows, API endpoints, data structures, and best practices for a seamless integration.

## Table of Contents

1. [Overview](#overview)
2. [Authentication System](#authentication-system)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [File Uploads](#file-uploads)
6. [Testing and Development](#testing-and-development)
7. [Error Handling](#error-handling)
8. [Security Considerations](#security-considerations)

## Overview

The COSA frontend is built with Next.js 14 using the App Router architecture. It implements a role-based system with three primary user types:
- **Students**: Apply for co-op programs and submit work term reports
- **Employers**: Submit evaluations for students
- **Administrators**: Manage applications, reports, and evaluations

The frontend currently uses client-side authentication with localStorage/sessionStorage for demo purposes, which needs to be replaced with proper backend authentication.

## Authentication System

### Current Implementation

The frontend uses a context-based authentication system (`AuthContext.js`) that provides:
- Login/logout functionality
- User registration
- Role-based access control
- State management for authentication status

### Required Backend Endpoints

1. **User Registration**
   ```
   POST /api/auth/register
   ```
   - Request Body:
     ```json
     {
       "firstName": "string",
       "lastName": "string",
       "email": "string",
       "password": "string",
       "role": "student|employer|admin",
       "studentId": "string (optional)",
       "companyName": "string (optional)",
       "companyPosition": "string (optional)"
     }
     ```
   - Response (201 Created):
     ```json
     {
       "id": "string",
       "firstName": "string",
       "lastName": "string",
       "email": "string",
       "role": "string",
       "createdAt": "ISO date string"
     }
     ```

2. **User Login**
   ```
   POST /api/auth/login
   ```
   - Request Body:
     ```json
     {
       "email": "string",
       "password": "string",
       "rememberMe": "boolean"
     }
     ```
   - Response (200 OK):
     ```json
     {
       "token": "string (JWT token)",
       "user": {
         "id": "string",
         "firstName": "string",
         "lastName": "string",
         "email": "string",
         "role": "string"
       }
     }
     ```

3. **User Logout**
   ```
   POST /api/auth/logout
   ```
   - Request: May include token in authorization header
   - Response (200 OK):
     ```json
     {
       "success": true,
       "message": "Logged out successfully"
     }
     ```

4. **Get Current User**
   ```
   GET /api/auth/user
   ```
   - Headers: Authorization with JWT token
   - Response (200 OK):
     ```json
     {
       "id": "string",
       "firstName": "string",
       "lastName": "string",
       "email": "string",
       "role": "string",
       "studentId": "string (if student)",
       "companyName": "string (if employer)",
       "companyPosition": "string (if employer)"
     }
     ```

### Authentication Implementation

1. **JWT Tokens**:
   - Generate JWT tokens upon successful login
   - Include user ID and role in token payload
   - Set appropriate expiration times (short for regular sessions, longer if "remember me" is checked)
   - Consider using refresh tokens for extended sessions

2. **Token Storage**:
   - The frontend stores tokens in localStorage (for "remember me") or sessionStorage (for session-only)
   - Implement CSRF protection for additional security

3. **Integration with Frontend**:
   - The frontend's `AuthContext.js` needs to be updated to:
     - Send proper authentication requests to your API
     - Store and manage JWT tokens
     - Handle token expiration and renewal

## API Endpoints

### Student Application Flow

1. **Submit Application**
   ```
   POST /api/applications
   ```
   - Headers: Authorization with JWT token
   - Request Body (multipart/form-data for file uploads):
     ```json
     {
       "personalInfo": {
         "program": "string",
         "graduationYear": "number",
         "gpa": "number"
       },
       "experience": {
         "workExperience": "string",
         "relevantCourses": "string",
         "skills": "string"
       },
       "statement": {
         "whyInterested": "string",
         "careerGoals": "string"
       },
       "termsAgreed": "boolean"
     }
     ```
   - Response (201 Created):
     ```json
     {
       "id": "string",
       "status": "pending",
       "submittedAt": "ISO date string",
       "studentId": "string (reference to user)",
       "resumeUrl": "string (if uploaded)"
     }
     ```

2. **Get Application**
   ```
   GET /api/applications/:id
   ```
   - Headers: Authorization with JWT token
   - Response (200 OK): Complete application object

3. **Get Student Applications**
   ```
   GET /api/applications/student
   ```
   - Headers: Authorization with JWT token
   - Query Parameters: 
     - status (optional): Filter by status
     - page, limit: For pagination
   - Response (200 OK): Array of application objects with pagination

### Work Term Reports

1. **Submit Report**
   ```
   POST /api/reports
   ```
   - Headers: Authorization with JWT token
   - Request Body (multipart/form-data):
     ```json
     {
       "term": "Fall|Winter|Summer",
       "year": "number",
       "employerName": "string",
       "position": "string",
       "summary": "string",
       "learningOutcomes": "string",
       "challenges": "string",
       "confidential": "boolean"
     }
     ```
   - Response (201 Created): Report object

2. **Get Report**
   ```
   GET /api/reports/:id
   ```
   - Headers: Authorization with JWT token
   - Response (200 OK): Complete report object

3. **Get Student Reports**
   ```
   GET /api/reports/student
   ```
   - Headers: Authorization with JWT token
   - Response (200 OK): Array of report objects

### Employer Evaluations

1. **Submit Evaluation**
   ```
   POST /api/evaluations
   ```
   - Headers: Authorization with JWT token
   - Request Body:
     ```json
     {
       "studentId": "string",
       "term": "string",
       "year": "number",
       "performance": "number (1-5)",
       "strengths": "string",
       "weaknesses": "string",
       "comments": "string"
     }
     ```
   - Response (201 Created): Evaluation object

2. **Get Evaluation**
   ```
   GET /api/evaluations/:id
   ```
   - Headers: Authorization with JWT token
   - Response (200 OK): Complete evaluation object

3. **Get Employer Evaluations**
   ```
   GET /api/evaluations/employer
   ```
   - Headers: Authorization with JWT token
   - Response (200 OK): Array of evaluation objects

### Admin Dashboard

1. **Get Dashboard Statistics**
   ```
   GET /api/admin/dashboard
   ```
   - Headers: Authorization with JWT token
   - Response (200 OK):
     ```json
     {
       "applicationStats": {
         "total": "number",
         "pending": "number",
         "approved": "number",
         "rejected": "number"
       },
       "reportStats": {
         "total": "number",
         "submitted": "number",
         "pending": "number"
       },
       "evaluationStats": {
         "total": "number",
         "submitted": "number"
       },
       "recentApplications": [
         {
           "id": "string",
           "studentName": "string",
           "program": "string",
           "status": "string",
           "submittedAt": "ISO date string"
         }
       ],
       "recentReports": [
         {
           "id": "string",
           "studentName": "string",
           "term": "string",
           "year": "number",
           "submittedAt": "ISO date string"
         }
       ]
     }
     ```

2. **Get All Applications (Admin)**
   ```
   GET /api/admin/applications
   ```
   - Headers: Authorization with JWT token
   - Query Parameters:
     - status: Filter by status
     - search: Search by student name or ID
     - page, limit: For pagination
   - Response (200 OK): Array of application objects with pagination

3. **Update Application Status**
   ```
   PUT /api/admin/applications/:id/status
   ```
   - Headers: Authorization with JWT token
   - Request Body:
     ```json
     {
       "status": "pending|approved|rejected",
       "feedback": "string (optional)"
     }
     ```
   - Response (200 OK): Updated application object

4. **Get All Reports (Admin)**
   ```
   GET /api/admin/reports
   ```
   - Headers: Authorization with JWT token
   - Query Parameters: Similar to applications
   - Response (200 OK): Array of report objects with pagination

## Data Models

### User Model

```json
{
  "id": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "passwordHash": "string (hashed, never sent to frontend)",
  "role": "student|employer|admin",
  "studentId": "string (if student)",
  "companyName": "string (if employer)",
  "companyPosition": "string (if employer)",
  "createdAt": "date",
  "updatedAt": "date",
  "lastLogin": "date"
}
```

### Application Model

```json
{
  "id": "string",
  "studentId": "string (reference to user)",
  "status": "pending|approved|rejected",
  "personalInfo": {
    "program": "string",
    "graduationYear": "number",
    "gpa": "number"
  },
  "experience": {
    "workExperience": "string",
    "relevantCourses": "string",
    "skills": "string"
  },
  "statement": {
    "whyInterested": "string",
    "careerGoals": "string"
  },
  "resumeUrl": "string",
  "feedback": "string",
  "reviewedBy": "string (admin user ID)",
  "submittedAt": "date",
  "updatedAt": "date"
}
```

### Report Model

```json
{
  "id": "string",
  "studentId": "string (reference to user)",
  "term": "Fall|Winter|Summer",
  "year": "number",
  "employerName": "string",
  "position": "string",
  "summary": "string",
  "learningOutcomes": "string",
  "challenges": "string",
  "reportUrl": "string (file upload)",
  "status": "submitted|reviewed",
  "feedback": "string",
  "confidential": "boolean",
  "submittedAt": "date",
  "updatedAt": "date"
}
```

### Evaluation Model

```json
{
  "id": "string",
  "employerId": "string (reference to user)",
  "studentId": "string (reference to user)",
  "term": "string",
  "year": "number",
  "performance": "number (1-5)",
  "strengths": "string",
  "weaknesses": "string",
  "comments": "string",
  "submittedAt": "date",
  "updatedAt": "date"
}
```

## File Uploads

The frontend handles file uploads in the following areas:
1. Student application (resume upload)
2. Work term report submission

### Implementation Requirements

1. **File Storage**:
   - Implement secure file storage (e.g., Amazon S3, Google Cloud Storage)
   - Generate secure, random filenames
   - Set proper CORS and access controls

2. **API Endpoints**:
   - Handle multipart/form-data requests
   - Validate file types (PDF, DOCX, etc.)
   - Enforce file size limits
   - Return secure URLs for uploaded files

3. **Security Considerations**:
   - Scan files for malware
   - Implement proper access controls (only authorized users can access specific files)
   - Consider using signed URLs with expiration for file access

## Testing and Development

### API Documentation

Consider implementing Swagger/OpenAPI documentation for your API endpoints:
```
GET /api/docs
```

### Testing Endpoints

1. **Health Check**
   ```
   GET /api/health
   ```
   - Response: Status of API and dependencies

2. **Demo Data (Development Only)**
   ```
   POST /api/dev/seed
   ```
   - Populate database with test data (protected by environment)

## Error Handling

The frontend expects consistent error responses:

```json
{
  "error": {
    "code": "string (e.g., 'INVALID_CREDENTIALS')",
    "message": "string (user-friendly message)",
    "details": "object (optional additional details)"
  }
}
```

Common error codes the frontend can handle:
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Permission denied
- `INVALID_CREDENTIALS`: Wrong email/password
- `VALIDATION_ERROR`: Invalid input data
- `NOT_FOUND`: Resource not found
- `INTERNAL_ERROR`: Server error

## Security Considerations

1. **Authentication**:
   - Implement proper password hashing (bcrypt or Argon2)
   - Use HTTPS for all API communications
   - Implement proper JWT handling with expiration
   - Consider refresh token rotation

2. **Authorization**:
   - Enforce role-based access control
   - Validate permissions for every request
   - Implement proper data isolation between users

3. **Data Validation**:
   - Validate all incoming request data
   - Sanitize user input to prevent injection attacks
   - Implement rate limiting to prevent abuse

4. **CORS**:
   - Configure CORS to allow only the frontend domain
   - Use proper headers for cookies and authentication

---

## Development Environment

To set up the development environment for testing with the frontend:

1. The frontend runs on port 3000 by default, so configure your API to run on a different port (e.g., 8000)

2. Set up CORS to allow requests from `http://localhost:3000`

3. Create a `.env` file in your backend project with necessary configuration:
   ```
   PORT=8000
   DATABASE_URL=...
   JWT_SECRET=...
   FRONTEND_URL=http://localhost:3000
   ```

4. Implement the authentication endpoints first to allow testing the full application flow

---

For any questions or clarifications, please contact me :)

Happy coding!
