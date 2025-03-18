import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(
  request: Request,
  context: any
) {
  const id = context.params.id;
  try {
    const supabase = await createClient();
    const { data } = await request.json();
    
    // Get the current user for security check
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
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
      return NextResponse.json({ error: 'Workout not found or access denied' }, { status: 404 });
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
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    // Update the type-specific completed data
    if (workout.type === 'run') {
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
        return NextResponse.json({ error: detailsError.message }, { status: 500 });
      }
    } else {
      const { error: detailsError } = await supabase
        .from('weightlifting_workouts')
        .update({
          completed_duration: data.completed_duration || null,
          completed_heart_rate: data.completed_heart_rate || null
        })
        .eq('id', id);
      
      if (detailsError) {
        console.error('Error updating weightlifting workout details:', detailsError);
        return NextResponse.json({ error: detailsError.message }, { status: 500 });
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in POST /api/workouts/[id]/complete:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}