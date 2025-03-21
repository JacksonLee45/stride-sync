-- Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Create plans table
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- '5k', '10k', 'half-marathon', 'marathon', 'strength'
  difficulty_level TEXT NOT NULL, -- 'beginner', 'intermediate', 'advanced'
  duration_weeks INTEGER NOT NULL,
  workouts_per_week INTEGER NOT NULL,
  total_workouts INTEGER NOT NULL,
  highlights JSONB, -- Array of highlight strings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure category is valid
  CONSTRAINT valid_category CHECK (category IN ('5k', '10k', 'half-marathon', 'marathon', 'strength')),
  
  -- Ensure difficulty is valid
  CONSTRAINT valid_difficulty CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced'))
);

-- Create plan_workouts table
CREATE TABLE plan_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL, -- 1-based day number in the plan (1 = day 1)
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- 'run', 'weightlifting'
  notes TEXT,
  run_details JSONB, -- For run workouts: { run_type, planned_distance, planned_pace }
  weightlifting_details JSONB, -- For weightlifting workouts: { focus_area, planned_duration }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure run or weightlifting has appropriate details
  CONSTRAINT valid_workout_type CHECK (type IN ('run', 'weightlifting')),
  CONSTRAINT run_has_details CHECK (type != 'run' OR run_details IS NOT NULL),
  CONSTRAINT weightlifting_has_details CHECK (type != 'weightlifting' OR weightlifting_details IS NOT NULL),
  
  -- Ensure each day_number is unique within a plan
  UNIQUE (plan_id, day_number)
);

-- Create user_plans table (for enrollments)
CREATE TABLE user_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure end_date is after start_date
  CONSTRAINT valid_dates CHECK (end_date > start_date),
  
  -- Prevent duplicate enrollments in the same plan
  UNIQUE (user_id, plan_id, is_active)
);

-- Modify existing workouts table to add plan references
ALTER TABLE workouts 
ADD COLUMN from_plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
ADD COLUMN from_plan_workout_id UUID REFERENCES plan_workouts(id) ON DELETE SET NULL;

-- Create RLS policies for plans
CREATE POLICY "Plans are viewable by authenticated users"
  ON plans FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create RLS policies for plan_workouts
CREATE POLICY "Plan workouts are viewable by authenticated users"
  ON plan_workouts FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create RLS policies for user_plans
CREATE POLICY "Users can view their own plan enrollments"
  ON user_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own plan enrollments"
  ON user_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plan enrollments"
  ON user_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plan enrollments"
  ON user_plans FOR DELETE
  USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_plans_category ON plans(category);
CREATE INDEX idx_plans_difficulty ON plans(difficulty_level);
CREATE INDEX idx_plan_workouts_plan_id ON plan_workouts(plan_id);
CREATE INDEX idx_user_plans_user_id ON user_plans(user_id);
CREATE INDEX idx_user_plans_plan_id ON user_plans(plan_id);
CREATE INDEX idx_workouts_from_plan_id ON workouts(from_plan_id);