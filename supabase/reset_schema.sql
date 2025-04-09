-- First, drop all triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.assign_student_to_employer(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.create_admin_account(TEXT, TEXT, TEXT, TEXT);

-- Drop tables in the correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS evaluations;
DROP TABLE IF EXISTS work_term_reports;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS profiles;

-- Now you can run your schema.sql file again 