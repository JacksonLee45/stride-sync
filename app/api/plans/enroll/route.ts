// app/api/plans/enroll/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// POST handler to enroll a user in a training plan
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { planId, startDate } = await request.json();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get the plan details to calculate the end date
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('duration_weeks')
      .eq('id', planId)
      .single();
    
    if (planError) {
      console.error('Error fetching plan:', planError);
      return NextResponse.json({ error: planError.message }, { status: 500 });
    }
    
    // Calculate end date
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + (plan.duration_weeks * 7));
    
    // Enroll user in the plan
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('user_plans')
      .insert([
        {
          user_id: user.id,
          plan_id: planId,
          start_date: startDate,
          end_date: end.toISOString().split('T')[0],
          is_active: true
        }
      ])
      .select()
      .single();
    
    if (enrollmentError) {
      console.error('Error enrolling user in plan:', enrollmentError);
      return NextResponse.json({ error: enrollmentError.message }, { status: 500 });
    }
    
    // Get all workouts from the plan
    const { data: planWorkouts, error: workoutsError } = await supabase
      .from('plan_workouts')
      .select('*')
      .eq('plan_id', planId);
    
    if (workoutsError) {
      console.error('Error fetching plan workouts:', workoutsError);
      return NextResponse.json({ error: workoutsError.message }, { status: 500 });
    }
    
    // Create user workouts based on the plan workouts
    const userWorkouts = planWorkouts.map(planWorkout => {
      // Calculate the actual date based on day_number and startDate
      const workoutDate = new Date(start);
      workoutDate.setDate(start.getDate() + (planWorkout.day_number - 1));
      
      // Create the base workout
      const workout = {
        user_id: user.id,
        title: planWorkout.title,
        date: workoutDate.toISOString().split('T')[0],
        type: planWorkout.type,
        notes: planWorkout.notes,
        status: 'planned',
        from_plan_id: planId,
        from_plan_workout_id: planWorkout.id
      };
      
      return workout;
    });
    
    // Insert all workouts at once
    const { data: createdWorkouts, error: createError } = await supabase
      .from('workouts')
      .insert(userWorkouts)
      .select();
    
    if (createError) {
      console.error('Error creating workouts:', createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }
    
    // For each created workout, add the type-specific details (run or weightlifting)
    for (let i = 0; i < createdWorkouts.length; i++) {
      const workout = createdWorkouts[i];
      const planWorkout = planWorkouts.find(pw => pw.id === workout.from_plan_workout_id);
      
      if (workout.type === 'run') {
        // Add run details
        await supabase
          .from('run_workouts')
          .insert({
            id: workout.id,
            run_type: planWorkout.run_details?.run_type || 'Easy',
            planned_distance: planWorkout.run_details?.planned_distance,
            planned_pace: planWorkout.run_details?.planned_pace
          });
      } else if (workout.type === 'weightlifting') {
        // Add weightlifting details
        await supabase
          .from('weightlifting_workouts')
          .insert({
            id: workout.id,
            focus_area: planWorkout.weightlifting_details?.focus_area,
            planned_duration: planWorkout.weightlifting_details?.planned_duration
          });
      }
    }
    
    return NextResponse.json({
      success: true,
      enrollment,
      workoutsCreated: createdWorkouts.length
    });
  } catch (err: any) {
    console.error('Error in POST /api/plans/enroll:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}