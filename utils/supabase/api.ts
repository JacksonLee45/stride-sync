import { createClient } from '@/utils/supabase/client';

export interface Workout {
  id?: string;
  user_id?: string;
  title: string;
  date: string;
  type: 'run' | 'weightlifting';
  notes?: string;
  status?: 'planned' | 'completed' | 'missed';
}

export interface RunWorkout {
  id?: string;
  run_type: 'Long' | 'Fast' | 'Tempo' | 'Shakeout' | 'Short';
  planned_distance?: number; // in miles
  planned_pace?: string; // stored as text like "8:30/mile"
  completed_distance?: number; // in miles
  completed_pace?: string; // stored as text like "8:30/mile"
  completed_heart_rate?: number; // average heart rate in BPM
}

export interface WeightliftingWorkout {
  id?: string;
  focus_area?: string;
  planned_duration?: string; // stored as text like "45min"
  completed_duration?: string; // stored as text like "50min"
  completed_heart_rate?: number; // average heart rate in BPM
}

export interface CompleteRunWorkoutData {
  status: 'completed' | 'missed';
  completed_distance?: number;
  completed_pace?: string;
  completed_heart_rate?: number;
}

export interface CompleteWeightliftingWorkoutData {
  status: 'completed' | 'missed';
  completed_duration?: string;
  completed_heart_rate?: number;
}

// Create a new workout (both types)
export async function createWorkout(
    workout: Workout,
    workoutDetails: RunWorkout | WeightliftingWorkout
  ) {
    const supabase = createClient();
    
    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error(`User not authenticated: ${userError?.message || 'No user found'}`);
      }
      
      // Make sure the workout has the user_id set
      const workoutWithUserId = {
        ...workout,
        user_id: user.id,
      };
      
      console.log("Creating workout with user_id:", workoutWithUserId);
      
      // First, create the base workout
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .insert([workoutWithUserId])
        .select()
        .single();
      
      if (workoutError) {
        console.error('Error creating workout:', workoutError);
        throw new Error(`Failed to create workout: ${workoutError.message} (${workoutError.code})`);
      }
      
      if (!workoutData) {
        throw new Error('No data returned from workout creation');
      }
      
      // Then, create the specific workout type details
      const tableName = workout.type === 'run' ? 'run_workouts' : 'weightlifting_workouts';
      
      // Assign the workout ID to the details
      const detailsWithId = {
        ...workoutDetails,
        id: workoutData.id,
      };
      
      const { data: detailsData, error: detailsError } = await supabase
        .from(tableName)
        .insert([detailsWithId])
        .select();
      
      if (detailsError) {
        console.error(`Error creating ${workout.type} details:`, detailsError);
        // Attempt to rollback the workout creation
        await supabase.from('workouts').delete().eq('id', workoutData.id);
        throw new Error(`Failed to create workout details: ${detailsError.message} (${detailsError.code})`);
      }
      
      return { ...workoutData, ...detailsWithId };
    } catch (err) {
      console.error('Unexpected error in createWorkout:', err);
      throw err;
    }
  }

// Fetch all workouts for the current user
export async function getWorkouts() {
  const supabase = createClient();
  
  const { data: workouts, error } = await supabase
    .from('workouts')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) {
    console.error('Error fetching workouts:', error);
    throw error;
  }
  
  return workouts;
}

// Fetch workouts with their type-specific details
export async function getWorkoutsWithDetails() {
    const supabase = createClient();
    
    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('User not authenticated:', userError);
        throw new Error(`User not authenticated: ${userError?.message || 'No user found'}`);
      }
      
      // First get all workouts for this user
      const { data: workouts, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Error fetching workouts:', error);
        throw error;
      }
      
      if (!workouts || workouts.length === 0) {
        return [];
      }
      
      // Separate workouts by type
      const runWorkoutIds = workouts
        .filter(w => w.type === 'run')
        .map(w => w.id);
        
      const weightliftingWorkoutIds = workouts
        .filter(w => w.type === 'weightlifting')
        .map(w => w.id);
      
      // Fetch run workout details if any
      let runDetails: any[] = [];
      if (runWorkoutIds.length > 0) {
        const { data, error } = await supabase
          .from('run_workouts')
          .select('*')
          .in('id', runWorkoutIds);
          
        if (error) {
          console.error('Error fetching run details:', error);
        }
        
        if (data) {
          runDetails = data;
        }
      }
      
      // Fetch weightlifting workout details if any
      let weightliftingDetails: any[] = [];
      if (weightliftingWorkoutIds.length > 0) {
        const { data, error } = await supabase
          .from('weightlifting_workouts')
          .select('*')
          .in('id', weightliftingWorkoutIds);
          
        if (error) {
          console.error('Error fetching weightlifting details:', error);
        }
        
        if (data) {
          weightliftingDetails = data;
        }
      }
      
      // Combine workouts with their details
      return workouts.map(workout => {
        if (workout.type === 'run') {
          const details = runDetails.find(d => d.id === workout.id) || {};
          return { ...workout, ...details };
        } else {
          const details = weightliftingDetails.find(d => d.id === workout.id) || {};
          return { ...workout, ...details };
        }
      });
    } catch (err) {
      console.error('Error in getWorkoutsWithDetails:', err);
      throw err;
    }
  }

// Get a single workout with details
export async function getWorkout(id: string) {
  const supabase = createClient();
  
  // Get the base workout
  const { data: workout, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching workout:', error);
    throw error;
  }
  
  if (!workout) {
    return null;
  }
  
  // Get the type-specific details
  const tableName = workout.type === 'run' ? 'run_workouts' : 'weightlifting_workouts';
  
  const { data: details, error: detailsError } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', id)
    .single();
  
  if (detailsError && detailsError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error(`Error fetching ${workout.type} details:`, detailsError);
    throw detailsError;
  }
  
  return { ...workout, ...(details || {}) };
}

// Update a workout
export async function updateWorkout(
  id: string,
  workout: Partial<Workout>,
  workoutDetails: Partial<RunWorkout> | Partial<WeightliftingWorkout>
) {
  const supabase = createClient();
  
  // First, update the base workout
  const { data: workoutData, error: workoutError } = await supabase
    .from('workouts')
    .update(workout)
    .eq('id', id)
    .select()
    .single();
  
  if (workoutError) {
    console.error('Error updating workout:', workoutError);
    throw workoutError;
  }
  
  // Then, update the specific workout type details
  const tableName = workoutData.type === 'run' ? 'run_workouts' : 'weightlifting_workouts';
  
  const { error: detailsError } = await supabase
    .from(tableName)
    .update(workoutDetails)
    .eq('id', id);
  
  if (detailsError) {
    console.error(`Error updating ${workoutData.type} details:`, detailsError);
    throw detailsError;
  }
  
  return { ...workoutData, ...workoutDetails };
}

// Delete a workout
export async function deleteWorkout(id: string) {
  const supabase = createClient();
  
  // The run_workouts and weightlifting_workouts records will be deleted automatically
  // due to the ON DELETE CASCADE constraint
  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting workout:', error);
    throw error;
  }
  
  return true;
}

// Complete a run workout
export async function completeRunWorkout(id: string, data: CompleteRunWorkoutData) {
    const supabase = createClient();
    
    try {
      // Get the current user for security check
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error(`User not authenticated: ${userError?.message || 'No user found'}`);
      }
      
      // First verify this workout belongs to the user
      const { data: workout, error: fetchError } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
      
      if (fetchError || !workout) {
        console.error('Error fetching workout to complete:', fetchError);
        throw new Error(`Cannot complete workout: ${fetchError?.message || 'Workout not found'}`);
      }
      
      // Update the main workout status directly
      const { error: updateError } = await supabase
        .from('workouts')
        .update({ 
          status: data.status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);
      
      if (updateError) {
        console.error('Error updating workout status:', updateError);
        throw new Error(`Failed to update workout status: ${updateError.message}`);
      }
      
      // Update the run-specific completed data
      const { error: detailsError } = await supabase
        .from('run_workouts')
        .update({
          completed_distance: data.completed_distance || null,
          completed_pace: data.completed_pace || null,
          completed_heart_rate: data.completed_heart_rate || null
        })
        .eq('id', id);
      
      if (detailsError) {
        console.error('Error updating run workout details:', detailsError);
        throw new Error(`Failed to update run details: ${detailsError.message}`);
      }
      
      return true;
    } catch (err) {
      console.error('Error in completeRunWorkout:', err);
      throw err;
    }
  }
  
  // Complete a weightlifting workout
  export async function completeWeightliftingWorkout(id: string, data: CompleteWeightliftingWorkoutData) {
    const supabase = createClient();
    
    try {
      // Get the current user for security check
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error(`User not authenticated: ${userError?.message || 'No user found'}`);
      }
      
      // First verify this workout belongs to the user
      const { data: workout, error: fetchError } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
      
      if (fetchError || !workout) {
        console.error('Error fetching workout to complete:', fetchError);
        throw new Error(`Cannot complete workout: ${fetchError?.message || 'Workout not found'}`);
      }
      
      // Update the main workout status directly
      const { error: updateError } = await supabase
        .from('workouts')
        .update({ 
          status: data.status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);
      
      if (updateError) {
        console.error('Error updating workout status:', updateError);
        throw new Error(`Failed to update workout status: ${updateError.message}`);
      }
      
      // Update the weightlifting-specific completed data
      const { error: detailsError } = await supabase
        .from('weightlifting_workouts')
        .update({
          completed_duration: data.completed_duration || null,
          completed_heart_rate: data.completed_heart_rate || null
        })
        .eq('id', id);
      
      if (detailsError) {
        console.error('Error updating weightlifting workout details:', detailsError);
        throw new Error(`Failed to update weightlifting details: ${detailsError.message}`);
      }
      
      return true;
    } catch (err) {
      console.error('Error in completeWeightliftingWorkout:', err);
      throw err;
    }
  }