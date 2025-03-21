// app/api/my-plans/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET handler to fetch user's enrolled plans
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get user's plans with plan details
    const { data: userPlans, error } = await supabase
      .from('user_plans')
      .select(`
        *,
        plan:plans(*)
      `)
      .eq('user_id', user.id)
      .order('start_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching user plans:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Calculate progress for each plan
    const userPlansWithProgress = await Promise.all(userPlans.map(async (userPlan) => {
      // Get workouts from this plan
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('from_plan_id', userPlan.plan_id);
      
      if (workoutsError) {
        console.error('Error fetching plan workouts:', workoutsError);
        return userPlan;
      }
      
      const totalWorkouts = workouts.length;
      const completedWorkouts = workouts.filter(w => w.status === 'completed').length;
      const progress = totalWorkouts > 0 ? Math.round((completedWorkouts / totalWorkouts) * 100) : 0;
      
      return {
        ...userPlan,
        progress,
        stats: {
          totalWorkouts,
          completedWorkouts
        }
      };
    }));
    
    return NextResponse.json(userPlansWithProgress);
  } catch (err: any) {
    console.error('Error in GET /api/my-plans:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}