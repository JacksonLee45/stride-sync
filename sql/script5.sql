-- Enhanced database schema modification
-- Will allow the coach to provide more comprehensive workouts

ALTER TABLE run_workouts
ADD COLUMN workout_structure JSONB,
ADD COLUMN target_heart_rate_zones TEXT[],
ADD COLUMN elevation_gain NUMERIC,
ADD COLUMN surface_type TEXT,
ADD COLUMN workout_category TEXT,
ADD COLUMN rpe_target INTEGER; -- Rate of Perceived Exertion (1-10 scale)

ALTER TABLE weightlifting_workouts
ADD COLUMN exercises JSONB,
ADD COLUMN circuit_based BOOLEAN DEFAULT FALSE,
ADD COLUMN target_muscle_groups TEXT[],
ADD COLUMN equipment_needed TEXT[],
ADD COLUMN workout_category TEXT; -- "Strength", "Power", "Endurance", etc.

CREATE TABLE workout_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- "run", "weightlifting", etc.
  workout_structure JSONB,
  difficulty_level TEXT, -- "beginner", "intermediate", "advanced"
  purpose TEXT, -- "recovery", "speed", "endurance", etc.
  duration_range JSONB, -- {"min": 20, "max": 40, "unit": "minutes"}
  tags TEXT[]
);

CREATE TABLE training_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  goal TEXT NOT NULL, -- "5k", "10k", "half marathon", etc.
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by TEXT, -- "AI" or "User" or "Coach"
  status TEXT DEFAULT 'active', -- "active", "completed", "abandoned"
  notes TEXT,
  metadata JSONB, -- For storing AI-related metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link workouts to specific training plans
ALTER TABLE workouts
ADD COLUMN training_plan_id UUID REFERENCES training_plans(id);

CREATE TABLE user_fitness_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  experience_level TEXT, -- "beginner", "intermediate", "advanced"
  weekly_mileage_avg NUMERIC,
  recent_race_results JSONB,
  training_paces JSONB, -- {"easy": "9:30/mile", "tempo": "8:00/mile", "interval": "7:15/mile"}
  max_heart_rate INTEGER,
  rest_heart_rate INTEGER,
  injuries_history JSONB,
  preferred_workout_days TEXT[],
  preferred_workout_times TEXT[],
  height NUMERIC,
  weight NUMERIC,
  goals JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE training_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  training_plan_id UUID REFERENCES training_plans(id) NOT NULL,
  name TEXT NOT NULL, -- "Base Building", "Speed Phase", "Taper", etc.
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  focus TEXT NOT NULL, -- "Endurance", "Speed", "Recovery", etc.
  weekly_mileage_target NUMERIC,
  intensity_profile JSONB, -- Distribution of workout intensities
  order_in_plan INTEGER NOT NULL,
  notes TEXT
);

CREATE TABLE workout_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES workouts(id) NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  metrics JSONB, -- Store custom metrics like {"avg_power": 250, "cadence": 180}
  user_notes TEXT,
  perceived_effort INTEGER, -- 1-10 scale
  recovery_score INTEGER, -- 1-10 scale
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_training_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  preferred_running_days TEXT[],
  max_weekly_runs INTEGER,
  max_weekly_mileage NUMERIC,
  long_run_day TEXT,
  avoid_consecutive_hard_days BOOLEAN DEFAULT TRUE,
  preferred_workout_types TEXT[],
  cross_training_preferences TEXT[],
  adaptive_planning BOOLEAN DEFAULT TRUE, -- Whether plans should adapt to missed workouts
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

