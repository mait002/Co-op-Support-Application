-- Create profiles table for storing user information
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'employer', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Student specific fields
  student_id TEXT,
  
  -- Employer specific fields
  company_name TEXT,
  company_position TEXT
);

-- Create a function to handle profile creation after user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  first_name TEXT;
  last_name TEXT;
  role TEXT;
  student_id TEXT;
  company_name TEXT;
  company_position TEXT;
BEGIN
  -- Extract user metadata
  first_name := NEW.raw_user_meta_data->>'firstName';
  last_name := NEW.raw_user_meta_data->>'lastName';
  role := NEW.raw_user_meta_data->>'role';
  student_id := NEW.raw_user_meta_data->>'studentId';
  company_name := NEW.raw_user_meta_data->>'companyName';
  company_position := NEW.raw_user_meta_data->>'companyPosition';
  
  -- If the user doesn't exist in profiles, add them
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.profiles (
      id, 
      email, 
      first_name, 
      last_name, 
      role,
      student_id,
      company_name,
      company_position
    ) VALUES (
      NEW.id, 
      NEW.email, 
      first_name,
      last_name,
      COALESCE(role, 'student'),
      student_id,
      company_name,
      company_position
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after a user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create applications table for co-op program applications
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resume_url TEXT,
  major TEXT,
  gpa NUMERIC(3, 2),
  expected_graduation DATE,
  comments TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  review_date TIMESTAMP WITH TIME ZONE
);

-- Create work term reports table
CREATE TABLE work_term_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) NOT NULL,
  work_term TEXT NOT NULL, -- e.g., 'Summer 2023'
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  report_url TEXT,
  report_type TEXT NOT NULL CHECK (report_type IN ('interim', 'final')),
  comments TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  review_date TIMESTAMP WITH TIME ZONE
);

-- Create student evaluations by employers
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES profiles(id) NOT NULL,
  employer_id UUID REFERENCES profiles(id) NOT NULL,
  work_term TEXT NOT NULL,
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'submitted',
  evaluation_data JSONB, -- Store form responses in JSON
  comments TEXT,
  evaluation_url TEXT -- For PDF uploads
);

-- Create employer evaluation forms table for detailed evaluations
CREATE TABLE employer_evaluation_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID REFERENCES profiles(id) NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  work_term TEXT NOT NULL,
  knowledge INTEGER NOT NULL CHECK (knowledge BETWEEN 1 AND 5),
  skills INTEGER NOT NULL CHECK (skills BETWEEN 1 AND 5),
  behaviour INTEGER NOT NULL CHECK (behaviour BETWEEN 1 AND 5),
  attitude INTEGER NOT NULL CHECK (attitude BETWEEN 1 AND 5),
  comments TEXT,
  submission_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  evaluation_id UUID REFERENCES evaluations(id)
);

-- Create Row Level Security (RLS) policies

-- Profiles RLS: Users can see and edit only their own profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
  ON profiles FOR SELECT 
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

-- Applications RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Students can view and create their own applications
CREATE POLICY "Students can view own applications" 
  ON applications FOR SELECT 
  USING (auth.uid() = student_id);

CREATE POLICY "Students can create applications" 
  ON applications FOR INSERT 
  WITH CHECK (auth.uid() = student_id);

-- Admins can view and update all applications
CREATE POLICY "Admins can view all applications" 
  ON applications FOR SELECT 
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

CREATE POLICY "Admins can update applications" 
  ON applications FOR UPDATE 
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

-- Work Term Reports RLS
ALTER TABLE work_term_reports ENABLE ROW LEVEL SECURITY;

-- Students can view and insert their own reports
CREATE POLICY "Students can view own reports" 
  ON work_term_reports FOR SELECT 
  USING (auth.uid() = student_id);

CREATE POLICY "Students can create reports" 
  ON work_term_reports FOR INSERT 
  WITH CHECK (auth.uid() = student_id);

-- Admins can view and update all reports
CREATE POLICY "Admins can view all reports" 
  ON work_term_reports FOR SELECT 
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

CREATE POLICY "Admins can update reports" 
  ON work_term_reports FOR UPDATE 
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

-- Evaluations RLS
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Employers can view, create and update their own evaluations
CREATE POLICY "Employers can view own evaluations" 
  ON evaluations FOR SELECT 
  USING (auth.uid() = employer_id);

CREATE POLICY "Employers can create evaluations" 
  ON evaluations FOR INSERT 
  WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "Employers can update own evaluations" 
  ON evaluations FOR UPDATE 
  USING (auth.uid() = employer_id);

-- Students can view evaluations about themselves
CREATE POLICY "Students can view own evaluations" 
  ON evaluations FOR SELECT 
  USING (auth.uid() = student_id);

-- Admins can view all evaluations
CREATE POLICY "Admins can view all evaluations" 
  ON evaluations FOR SELECT 
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

-- Employer Evaluation Forms RLS
ALTER TABLE employer_evaluation_forms ENABLE ROW LEVEL SECURITY;

-- Employers can view and create their own evaluation forms
CREATE POLICY "Employers can view own evaluation forms" 
  ON employer_evaluation_forms FOR SELECT 
  USING (auth.uid() = employer_id);

CREATE POLICY "Employers can create evaluation forms" 
  ON employer_evaluation_forms FOR INSERT 
  WITH CHECK (auth.uid() = employer_id);

CREATE POLICY "Employers can update own evaluation forms" 
  ON employer_evaluation_forms FOR UPDATE 
  USING (auth.uid() = employer_id);

-- Students can view evaluations about themselves
CREATE POLICY "Students can view own evaluation forms" 
  ON employer_evaluation_forms FOR SELECT 
  USING (auth.uid() = student_id);

-- Admins can view all evaluation forms
CREATE POLICY "Admins can view all evaluation forms" 
  ON employer_evaluation_forms FOR SELECT 
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

-- Admins can update evaluation forms status
CREATE POLICY "Admins can update evaluation forms" 
  ON employer_evaluation_forms FOR UPDATE 
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

-- Create functions for student-employer assignments

-- Function to assign a student to an employer
CREATE OR REPLACE FUNCTION assign_student_to_employer(
  student_uuid UUID,
  employer_uuid UUID,
  work_term_name TEXT
) RETURNS UUID AS $$
DECLARE
  new_evaluation_id UUID;
BEGIN
  -- Validate input
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = student_uuid AND role = 'student') THEN
    RAISE EXCEPTION 'Invalid student ID';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = employer_uuid AND role = 'employer') THEN
    RAISE EXCEPTION 'Invalid employer ID';
  END IF;
  
  -- Create an empty evaluation record to establish the relationship
  INSERT INTO evaluations (
    student_id,
    employer_id,
    work_term,
    status
  ) VALUES (
    student_uuid,
    employer_uuid,
    work_term_name,
    'pending'
  ) RETURNING id INTO new_evaluation_id;
  
  RETURN new_evaluation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- This helps with running the SQL script multiple times safely
DO $$ BEGIN
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EXCEPTION
    WHEN OTHERS THEN null;
END $$;

-- Make sure profiles can be created by the trigger function
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow the trigger function to insert profiles for new users
CREATE POLICY "Allow trigger function to create profiles" 
  ON profiles FOR INSERT
  WITH CHECK (true);

-- New function to create an admin account
CREATE OR REPLACE FUNCTION public.create_admin_account(
  admin_email TEXT,
  admin_password TEXT,
  first_name TEXT,
  last_name TEXT
) RETURNS JSON AS $$
DECLARE
  new_user JSON;
  error_response TEXT;
BEGIN
  -- Create user with admin role
  BEGIN
    SELECT content INTO new_user
    FROM auth.create_user(
      admin_email,
      admin_password,
      '{
        "role": "admin",
        "firstName": "' || first_name || '",
        "lastName": "' || last_name || '"
      }'::jsonb
    );
  EXCEPTION
    WHEN OTHERS THEN
      error_response := SQLERRM;
      RETURN json_build_object('error', error_response);
  END;
  
  RETURN json_build_object('success', true, 'user', new_user);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 