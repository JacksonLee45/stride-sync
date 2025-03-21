-- Insert beginner 5K plan
INSERT INTO plans (
  name, 
  description, 
  category, 
  difficulty_level, 
  duration_weeks, 
  workouts_per_week, 
  total_workouts,
  highlights
) VALUES (
  'Beginner 5K Training Plan',
  'Perfect for first-time 5K runners or those looking to build consistent running habits.',
  '5k',
  'beginner',
  8,
  3,
  24,
  '["3 runs per week", "Built-in rest days", "Gradual mileage increase", "Includes strength training recommendations"]'::jsonb
);

-- Insert intermediate 5K plan
INSERT INTO plans (
  name, 
  description, 
  category, 
  difficulty_level, 
  duration_weeks, 
  workouts_per_week, 
  total_workouts,
  highlights
) VALUES (
  'Intermediate 5K Training Plan',
  'Designed to help runners improve their 5K time with more structured workouts.',
  '5k',
  'intermediate',
  8,
  4,
  32,
  '["4 runs per week", "Speed workouts", "Tempo runs", "Strength training"]'::jsonb
);

-- Insert beginner 10K plan
INSERT INTO plans (
  name, 
  description, 
  category, 
  difficulty_level, 
  duration_weeks, 
  workouts_per_week, 
  total_workouts,
  highlights
) VALUES (
  'Beginner 10K Training Plan',
  'Build endurance and prepare for your first 10K race with this progressive plan.',
  '10k',
  'beginner',
  10,
  3,
  30,
  '["3 runs per week", "Long runs", "Recovery days", "Cross-training options"]'::jsonb
);

-- Insert intermediate 10K plan
INSERT INTO plans (
  name, 
  description, 
  category, 
  difficulty_level, 
  duration_weeks, 
  workouts_per_week, 
  total_workouts,
  highlights
) VALUES (
  'Intermediate 10K Training Plan',
  'Take your 10K performance to the next level with speed work and targeted training.',
  '10k',
  'intermediate',
  10,
  4,
  40,
  '["4 runs per week", "Interval training", "Tempo runs", "Hill workouts"]'::jsonb
);

-- Insert beginner half marathon plan
INSERT INTO plans (
  name, 
  description, 
  category, 
  difficulty_level, 
  duration_weeks, 
  workouts_per_week, 
  total_workouts,
  highlights
) VALUES (
  'Beginner Half Marathon Training Plan',
  'Gradually build endurance to complete your first 13.1 mile race with confidence.',
  'half-marathon',
  'beginner',
  12,
  4,
  48,
  '["4 runs per week", "Progressive long runs", "Cross-training", "Recovery weeks"]'::jsonb
);

-- Insert intermediate half marathon plan
INSERT INTO plans (
  name, 
  description, 
  category, 
  difficulty_level, 
  duration_weeks, 
  workouts_per_week, 
  total_workouts,
  highlights
) VALUES (
  'Intermediate Half Marathon Training Plan',
  'Improve your half marathon performance with structured workouts and increased mileage.',
  'half-marathon',
  'intermediate',
  12,
  5,
  60,
  '["5 runs per week", "Speed workouts", "Progressive long runs", "Race-specific training"]'::jsonb
);

-- Insert beginner marathon plan
INSERT INTO plans (
  name, 
  description, 
  category, 
  difficulty_level, 
  duration_weeks, 
  workouts_per_week, 
  total_workouts,
  highlights
) VALUES (
  'Beginner Marathon Training Plan',
  'A conservative approach to prepare first-time marathoners for the full 26.2 mile distance.',
  'marathon',
  'beginner',
  16,
  4,
  64,
  '["4 runs per week", "Gradual distance building", "Recovery weeks", "Fueling strategies"]'::jsonb
);

-- Insert intermediate marathon plan
INSERT INTO plans (
  name, 
  description, 
  category, 
  difficulty_level, 
  duration_weeks, 
  workouts_per_week, 
  total_workouts,
  highlights
) VALUES (
  'Intermediate Marathon Training Plan',
  'Build on your marathon experience with increased mileage and more specific workouts.',
  'marathon',
  'intermediate',
  16,
  5,
  80,
  '["5 runs per week", "Long runs up to 20 miles", "Marathon-pace runs", "Recovery strategies"]'::jsonb
);

-- Insert runner's strength training plan
INSERT INTO plans (
  name, 
  description, 
  category, 
  difficulty_level, 
  duration_weeks, 
  workouts_per_week, 
  total_workouts,
  highlights
) VALUES (
  'Runner''s Strength Training Plan',
  'Complement your running with targeted strength exercises to prevent injury and improve performance.',
  'strength',
  'beginner',
  8,
  2,
  16,
  '["2 strength sessions per week", "Running-specific exercises", "No gym required", "Progressive overload"]'::jsonb
);

-- Retrieve the IDs of the inserted plans to use for workouts
DO $$ 
DECLARE
    beginner_5k_id UUID;
    strength_id UUID;
BEGIN
    -- Get the beginner 5K plan ID
    SELECT id INTO beginner_5k_id FROM plans WHERE name = 'Beginner 5K Training Plan' LIMIT 1;
    
    -- Get the strength plan ID
    SELECT id INTO strength_id FROM plans WHERE name = 'Runner''s Strength Training Plan' LIMIT 1;
    
    -- Insert workouts for beginner 5K plan - Week 1
    INSERT INTO plan_workouts (
        plan_id, 
        day_number, 
        title, 
        type, 
        notes, 
        run_details
    ) VALUES 
        (beginner_5k_id, 1, 'Easy Run', 'run', 'Focus on comfortable pace and form', 
         '{"run_type": "Easy", "planned_distance": 1, "planned_pace": "13-15 min/mile"}'::jsonb),
        (beginner_5k_id, 3, 'Interval Training', 'run', '5 min warm up, 5x(1 min run, 2 min walk), 5 min cool down', 
         '{"run_type": "Interval", "planned_distance": 1.5, "planned_pace": "12-14 min/mile"}'::jsonb),
        (beginner_5k_id, 5, 'Long Run', 'run', 'Build endurance with a steady, comfortable pace', 
         '{"run_type": "Long", "planned_distance": 2, "planned_pace": "13-15 min/mile"}'::jsonb);
    
    -- Week 2
    INSERT INTO plan_workouts (
        plan_id, 
        day_number, 
        title, 
        type, 
        notes, 
        run_details
    ) VALUES 
        (beginner_5k_id, 8, 'Easy Run', 'run', 'Focus on comfortable pace and form', 
         '{"run_type": "Easy", "planned_distance": 1.5, "planned_pace": "13-15 min/mile"}'::jsonb),
        (beginner_5k_id, 10, 'Interval Training', 'run', '5 min warm up, 6x(1 min run, 2 min walk), 5 min cool down', 
         '{"run_type": "Interval", "planned_distance": 1.5, "planned_pace": "12-14 min/mile"}'::jsonb),
        (beginner_5k_id, 12, 'Long Run', 'run', 'Build endurance with a steady, comfortable pace', 
         '{"run_type": "Long", "planned_distance": 2.5, "planned_pace": "13-15 min/mile"}'::jsonb);
    
    -- Week 8 (final week)
    INSERT INTO plan_workouts (
        plan_id, 
        day_number, 
        title, 
        type, 
        notes, 
        run_details
    ) VALUES 
        (beginner_5k_id, 50, 'Easy Run', 'run', 'Light, easy run to keep legs fresh', 
         '{"run_type": "Easy", "planned_distance": 2, "planned_pace": "12-14 min/mile"}'::jsonb),
        (beginner_5k_id, 52, 'Race Prep', 'run', '5 min warm up, 10 min at race pace, 5 min cool down', 
         '{"run_type": "Tempo", "planned_distance": 2, "planned_pace": "11-13 min/mile"}'::jsonb),
        (beginner_5k_id, 54, '5K Race', 'run', 'Good luck! Run your own race and enjoy the experience.', 
         '{"run_type": "Race", "planned_distance": 3.1, "planned_pace": "Race pace"}'::jsonb);
    
    -- Insert sample strength plan workouts
    INSERT INTO plan_workouts (
        plan_id, 
        day_number, 
        title, 
        type, 
        notes, 
        weightlifting_details
    ) VALUES 
        (strength_id, 1, 'Lower Body Strength', 'weightlifting', 'Focus on form and control', 
         '{"focus_area": "Lower Body", "planned_duration": "30 min"}'::jsonb),
        (strength_id, 4, 'Core & Upper Body', 'weightlifting', 'Mix of bodyweight and light resistance exercises', 
         '{"focus_area": "Core & Upper Body", "planned_duration": "30 min"}'::jsonb);
END $$;