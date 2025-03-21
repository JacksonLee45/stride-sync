-- Profiles table - extends the auth.users table with additional user information
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT,
  username TEXT UNIQUE
);

-- Workouts table - stores the base workout information common to all workout types
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('run', 'weightlifting')),
  notes TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'missed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Run workouts table - stores run-specific information
CREATE TABLE run_workouts (
  id UUID PRIMARY KEY REFERENCES workouts(id) ON DELETE CASCADE,
  run_type TEXT NOT NULL CHECK (run_type IN ('Long', 'Fast', 'Tempo', 'Shakeout', 'Short')),
  planned_distance NUMERIC(5,2), -- in miles
  planned_pace TEXT, -- stored as text like "8:30/mile"
  completed_distance NUMERIC(5,2), -- in miles
  completed_pace TEXT, -- stored as text like "8:30/mile"
  completed_heart_rate INTEGER -- average heart rate in BPM
);

-- Weightlifting workouts table - stores weightlifting-specific information
CREATE TABLE weightlifting_workouts (
  id UUID PRIMARY KEY REFERENCES workouts(id) ON DELETE CASCADE,
  focus_area TEXT,
  planned_duration TEXT, -- stored as text like "45min"
  completed_duration TEXT, -- stored as text like "50min"
  completed_heart_rate INTEGER -- average heart rate in BPM
);

-- Create RLS (Row Level Security) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE run_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE weightlifting_workouts ENABLE ROW LEVEL SECURITY;

-- Profiles security policy - users can only read/write their own profile
CREATE POLICY "Users can read their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Workouts security policy - users can only read/write their own workouts
CREATE POLICY "Users can read their own workouts" 
  ON workouts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workouts" 
  ON workouts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts" 
  ON workouts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts" 
  ON workouts FOR DELETE 
  USING (auth.uid() = user_id);

-- Run workouts security policy - inherits from workouts table via foreign key
CREATE POLICY "Users can read their own run workouts" 
  ON run_workouts FOR SELECT 
  USING (EXISTS (SELECT 1 FROM workouts WHERE workouts.id = run_workouts.id AND workouts.user_id = auth.uid()));

CREATE POLICY "Users can insert their own run workouts" 
  ON run_workouts FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM workouts WHERE workouts.id = run_workouts.id AND workouts.user_id = auth.uid()));

CREATE POLICY "Users can update their own run workouts" 
  ON run_workouts FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM workouts WHERE workouts.id = run_workouts.id AND workouts.user_id = auth.uid()));

CREATE POLICY "Users can delete their own run workouts" 
  ON run_workouts FOR DELETE 
  USING (EXISTS (SELECT 1 FROM workouts WHERE workouts.id = run_workouts.id AND workouts.user_id = auth.uid()));

-- Weightlifting workouts security policy - inherits from workouts table via foreign key
CREATE POLICY "Users can read their own weightlifting workouts" 
  ON weightlifting_workouts FOR SELECT 
  USING (EXISTS (SELECT 1 FROM workouts WHERE workouts.id = weightlifting_workouts.id AND workouts.user_id = auth.uid()));

CREATE POLICY "Users can insert their own weightlifting workouts" 
  ON weightlifting_workouts FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM workouts WHERE workouts.id = weightlifting_workouts.id AND workouts.user_id = auth.uid()));

CREATE POLICY "Users can update their own weightlifting workouts" 
  ON weightlifting_workouts FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM workouts WHERE workouts.id = weightlifting_workouts.id AND workouts.user_id = auth.uid()));

CREATE POLICY "Users can delete their own weightlifting workouts" 
  ON weightlifting_workouts FOR DELETE 
  USING (EXISTS (SELECT 1 FROM workouts WHERE workouts.id = weightlifting_workouts.id AND workouts.user_id = auth.uid()));

-- Create indexes for better query performance
CREATE INDEX workouts_user_id_idx ON workouts(user_id);
CREATE INDEX workouts_date_idx ON workouts(date);
CREATE INDEX workouts_type_idx ON workouts(type);
CREATE INDEX workouts_status_idx ON workouts(status);

-- Create functions to handle workout completion
CREATE OR REPLACE FUNCTION complete_run_workout(
  workout_id UUID,
  p_status TEXT,
  p_completed_distance NUMERIC(5,2),
  p_completed_pace TEXT,
  p_completed_heart_rate INTEGER
) RETURNS VOID AS $$
BEGIN
  -- Update the main workout status
  UPDATE workouts 
  SET status = p_status, updated_at = NOW()
  WHERE id = workout_id;
  
  -- Update the run-specific completed data
  UPDATE run_workouts
  SET 
    completed_distance = p_completed_distance,
    completed_pace = p_completed_pace,
    completed_heart_rate = p_completed_heart_rate
  WHERE id = workout_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION complete_weightlifting_workout(
  workout_id UUID,
  p_status TEXT,
  p_completed_duration TEXT,
  p_completed_heart_rate INTEGER
) RETURNS VOID AS $$
BEGIN
  -- Update the main workout status
  UPDATE workouts 
  SET status = p_status, updated_at = NOW()
  WHERE id = workout_id;
  
  -- Update the weightlifting-specific completed data
  UPDATE weightlifting_workouts
  SET 
    completed_duration = p_completed_duration,
    completed_heart_rate = p_completed_heart_rate
  WHERE id = workout_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;