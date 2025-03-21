// app/api/plans/[slug]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  request: Request,
  context: any
) {
  const params = await context.params;
  const slug = params.slug;
  
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get the plan details by slug instead of id
    const { data: plan, error } = await supabase
      .from('plans')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error) {
      console.error('Error fetching plan:', error);
      if (error.code === 'PGRST116') { // No rows returned
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Get the workouts for this plan using the plan's id
    const { data: workouts, error: workoutsError } = await supabase
      .from('plan_workouts')
      .select('*')
      .eq('plan_id', plan.id)
      .order('day_number', { ascending: true });
    
    if (workoutsError) {
      console.error('Error fetching plan workouts:', workoutsError);
      return NextResponse.json({ error: workoutsError.message }, { status: 500 });
    }
    
    // Check if the user is already enrolled in this plan
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_id', plan.id)
      .maybeSingle();
    
    if (enrollmentError) {
      console.error('Error checking enrollment:', enrollmentError);
      // Continue without enrollment info
    }
    
    return NextResponse.json({
      ...plan,
      workouts,
      isEnrolled: !!enrollment,
      enrollment
    });
  } catch (err: any) {
    console.error('Error in GET /api/plans/[slug]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}