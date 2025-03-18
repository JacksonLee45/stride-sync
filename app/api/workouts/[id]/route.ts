import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET a single workout with details
export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const id = context.params.id;
  
  try {
    const supabase = await createClient();
    
    // Get the current user for security check
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get the base workout
    const { data: workout, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching workout:', error);
      if (error.code === 'PGRST116') { // No rows returned
        return NextResponse.json(null, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!workout) {
      return NextResponse.json(null, { status: 404 });
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
      return NextResponse.json({ error: detailsError.message }, { status: 500 });
    }
    
    return NextResponse.json({ ...workout, ...(details || {}) });
  } catch (err: any) {
    console.error('Error in GET /api/workouts/[id]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT to update a workout
export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  const id = context.params.id;
  
  try {
    const supabase = await createClient();
    const { workout, workoutDetails } = await request.json();
    
    // Get the current user for security check
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // First verify this workout belongs to the user
    const { data: existingWorkout, error: fetchError } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (fetchError || !existingWorkout) {
      console.error('Error fetching workout to update:', fetchError);
      return NextResponse.json({ error: 'Workout not found or access denied' }, { status: 404 });
    }
    
    // Update the base workout
    const { data: workoutData, error: workoutError } = await supabase
      .from('workouts')
      .update(workout)
      .eq('id', id)
      .select()
      .single();
    
    if (workoutError) {
      console.error('Error updating workout:', workoutError);
      return NextResponse.json({ error: workoutError.message }, { status: 500 });
    }
    
    // Then, update the specific workout type details
    const tableName = workoutData.type === 'run' ? 'run_workouts' : 'weightlifting_workouts';
    
    const { error: detailsError } = await supabase
      .from(tableName)
      .update(workoutDetails)
      .eq('id', id);
    
    if (detailsError) {
      console.error(`Error updating ${workoutData.type} details:`, detailsError);
      return NextResponse.json({ error: detailsError.message }, { status: 500 });
    }
    
    // Get the updated workout with details to return
    const { data: updatedWorkout, error: getError } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', id)
      .single();
      
    const { data: updatedDetails, error: getDetailsError } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    return NextResponse.json({ 
      ...updatedWorkout, 
      ...(updatedDetails || {}) 
    });
  } catch (err: any) {
    console.error('Error in PUT /api/workouts/[id]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE a workout
export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  const id = context.params.id;
  
  try {
    const supabase = await createClient();
    
    // Get the current user for security check
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // First verify this workout belongs to the user
    const { data: existingWorkout, error: fetchError } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (fetchError || !existingWorkout) {
      console.error('Error fetching workout to delete:', fetchError);
      return NextResponse.json({ error: 'Workout not found or access denied' }, { status: 404 });
    }
    
    // The run_workouts and weightlifting_workouts records will be deleted automatically
    // due to the ON DELETE CASCADE constraint
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting workout:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in DELETE /api/workouts/[id]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}