import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET handler to fetch workouts with details
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // First get all workouts for this user
    const { data: workouts, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching workouts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!workouts || workouts.length === 0) {
      return NextResponse.json([]);
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
    const workoutsWithDetails = workouts.map(workout => {
      if (workout.type === 'run') {
        const details = runDetails.find(d => d.id === workout.id) || {};
        return { ...workout, ...details };
      } else {
        const details = weightliftingDetails.find(d => d.id === workout.id) || {};
        return { ...workout, ...details };
      }
    });
    
    return NextResponse.json(workoutsWithDetails);
  } catch (err: any) {
    console.error('Error in GET /api/workouts:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST handler to create a new workout
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { workout, workoutDetails } = await request.json();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Make sure the workout has the user_id set
    const workoutWithUserId = {
      ...workout,
      user_id: user.id,
    };
    
    // First, create the base workout
    const { data: workoutData, error: workoutError } = await supabase
      .from('workouts')
      .insert([workoutWithUserId])
      .select()
      .single();
    
    if (workoutError) {
      console.error('Error creating workout:', workoutError);
      return NextResponse.json({ error: workoutError.message }, { status: 500 });
    }
    
    if (!workoutData) {
      return NextResponse.json({ error: 'No data returned from workout creation' }, { status: 500 });
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
      return NextResponse.json({ error: detailsError.message }, { status: 500 });
    }
    
    return NextResponse.json({ ...workoutData, ...detailsWithId });
  } catch (err: any) {
    console.error('Error in POST /api/workouts:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}