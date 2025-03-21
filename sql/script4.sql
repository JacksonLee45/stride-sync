-- First, add the slug column to the plans table
ALTER TABLE plans ADD COLUMN slug TEXT UNIQUE;

-- Update existing plans with slugs based on their names
-- This will convert "Beginner 5K Training Plan" to "beginner-5k-training-plan"
UPDATE plans SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]', '-', 'g'));

-- Clean up any extra hyphens that might have been created (like '--' from spaces)
UPDATE plans SET slug = regexp_replace(slug, '-+', '-', 'g');

-- Remove any leading or trailing hyphens
UPDATE plans SET slug = regexp_replace(slug, '^-|-$', '', 'g');

-- Verify the slugs were created correctly
SELECT id, name, slug FROM plans;