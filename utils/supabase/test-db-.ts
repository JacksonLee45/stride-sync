import { createClient } from './client';

// Test if the database tables are set up correctly
export async function testDatabaseSetup() {
  const supabase = createClient();
  const results = {
    workouts: false,
    run_workouts: false,
    weightlifting_workouts: false,
    user: null as any
  };
  
  try {
    // Test if the user is authenticated
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('User auth error:', userError);
      results.user = `Error: ${userError.message}`;
    } else {
      results.user = userData.user;
    }
    
    // Test if the workouts table exists and can be accessed
    const { data: workoutsData, error: workoutsError } = await supabase
      .from('workouts')
      .select('id')
      .limit(1);
    
    if (workoutsError) {
      console.error('Workouts table error:', workoutsError);
    } else {
      results.workouts = true;
    }
    
    // Test if the run_workouts table exists and can be accessed
    const { data: runWorkoutsData, error: runWorkoutsError } = await supabase
      .from('run_workouts')
      .select('id')
      .limit(1);
    
    if (runWorkoutsError) {
      console.error('Run workouts table error:', runWorkoutsError);
    } else {
      results.run_workouts = true;
    }
    
    // Test if the weightlifting_workouts table exists and can be accessed
    const { data: weightliftingWorkoutsData, error: weightliftingWorkoutsError } = await supabase
      .from('weightlifting_workouts')
      .select('id')
      .limit(1);
    
    if (weightliftingWorkoutsError) {
      console.error('Weightlifting workouts table error:', weightliftingWorkoutsError);
    } else {
      results.weightlifting_workouts = true;
    }
    
    return results;
  } catch (err) {
    console.error('Unexpected error testing database:', err);
    throw err;
  }
}