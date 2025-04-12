-- Create employer_evaluation_forms table to store detailed evaluation data
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
  
  -- Link to existing evaluations table (optional)
  evaluation_id UUID REFERENCES evaluations(id)
);

-- Enable RLS on employer_evaluation_forms
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

-- Students can view evaluations about themselves through evaluations table link
CREATE POLICY "Students can view linked evaluation forms" 
  ON employer_evaluation_forms FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM evaluations 
    WHERE evaluations.id = employer_evaluation_forms.evaluation_id 
    AND evaluations.student_id = auth.uid()
  ));

-- Admins can view all evaluation forms
CREATE POLICY "Admins can view all evaluation forms" 
  ON employer_evaluation_forms FOR SELECT 
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

-- Admins can update evaluation forms
CREATE POLICY "Admins can update evaluation forms" 
  ON employer_evaluation_forms FOR UPDATE 
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

-- Create a function to submit an employer evaluation form
CREATE OR REPLACE FUNCTION submit_employer_evaluation(
  p_employer_id UUID,
  p_student_name TEXT,
  p_student_email TEXT,
  p_work_term TEXT,
  p_knowledge INTEGER,
  p_skills INTEGER,
  p_behaviour INTEGER,
  p_attitude INTEGER,
  p_comments TEXT
) RETURNS UUID AS $$
DECLARE
  new_form_id UUID;
  existing_evaluation_id UUID;
BEGIN
  -- Check if there's an existing evaluation relationship
  SELECT e.id INTO existing_evaluation_id 
  FROM evaluations e
  JOIN profiles p ON e.student_id = p.id
  WHERE e.employer_id = p_employer_id 
    AND p.email = p_student_email 
    AND p.role = 'student'
  LIMIT 1;
  
  -- Create the new evaluation form
  INSERT INTO employer_evaluation_forms (
    employer_id,
    student_name,
    student_email,
    work_term,
    knowledge,
    skills,
    behaviour,
    attitude,
    comments,
    evaluation_id
  ) VALUES (
    p_employer_id,
    p_student_name,
    p_student_email,
    p_work_term,
    p_knowledge,
    p_skills,
    p_behaviour,
    p_attitude,
    p_comments,
    existing_evaluation_id
  ) RETURNING id INTO new_form_id;
  
  -- If there's an existing evaluation, update its status
  IF existing_evaluation_id IS NOT NULL THEN
    UPDATE evaluations 
    SET status = 'submitted',
        submission_date = CURRENT_TIMESTAMP
    WHERE id = existing_evaluation_id;
  END IF;
  
  RETURN new_form_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 