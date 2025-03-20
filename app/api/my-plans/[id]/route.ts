import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  request: Request,
  context: any
) {
  const id = context.params.id;
  
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get the specific user plan with plan details
    const { data: userPlan, error } = await supabase
      .from('user_plans')
      .select(`
        *,
        plan:plans(*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching user plan:', error);
      if (error.code === 'PGRST116') { // No rows returned
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Get workouts associated with this plan
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('from_plan_id', userPlan.plan_id);
    
    if (workoutsError) {
      console.error('Error fetching plan workouts:', workoutsError);
      return NextResponse.json({ error: workoutsError.message }, { status: 500 });
    }
    
    // Calculate progress statistics
    const totalWorkouts = workouts.length;
    const completedWorkouts = workouts.filter(w => w.status === 'completed').length;
    const progress = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;
    
    // Return the plan with additional statistics
    return NextResponse.json({
      ...userPlan,
      progress,
      stats: {
        totalWorkouts,
        completedWorkouts
      },
      workouts
    });
  } catch (err: any) {
    console.error('Error in GET /api/my-plans/[id]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: any
) {
  const id = context.params.id;
  
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get the URL to extract query parameters
    const url = new URL(request.url);
    const deleteWorkouts = url.searchParams.get('deleteWorkouts') === 'true';
    
    // First verify the plan belongs to the user
    const { data: userPlan, error: planError } = await supabase
      .from('user_plans')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (planError) {
      console.error('Error fetching plan to unenroll:', planError);
      return NextResponse.json({ error: 'Plan not found or access denied' }, { status: 404 });
    }
    
    // If deleteWorkouts is true, first delete future workouts
    if (deleteWorkouts) {
      const today = new Date().toISOString().split('T')[0];
      
      // Delete future workouts from this plan
      const { error: deleteWorkoutsError } = await supabase
        .from('workouts')
        .delete()
        .eq('user_id', user.id)
        .eq('from_plan_id', userPlan.plan_id)
        .gte('date', today);
      
      if (deleteWorkoutsError) {
        console.error('Error deleting workouts:', deleteWorkoutsError);
        return NextResponse.json({ error: deleteWorkoutsError.message }, { status: 500 });
      }
    }
    
    // Delete the user_plan record
    const { error: deleteError } = await supabase
      .from('user_plans')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (deleteError) {
      console.error('Error deleting plan enrollment:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in DELETE /api/my-plans/[id]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}