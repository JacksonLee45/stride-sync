// app/api/plans/enroll/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// POST handler to enroll a user in a training plan
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const requestData = await request.json();
    const { planSlug, startDate } = requestData;
    
    console.log("Enrollment request:", { planSlug, startDate });
    
    if (!planSlug || !startDate) {
      return NextResponse.json({ error: 'Plan slug and start date are required' }, { status: 400 });
    }
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("Authentication error:", userError);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    console.log("User authenticated:", user.id);
    
    // First get the plan using the slug
    const { data: plan, error: planLookupError } = await supabase
      .from('plans')
      .select('id, duration_weeks, name')
      .eq('slug', planSlug)
      .single();
      
    if (planLookupError) {
      console.error('Error finding plan by slug:', planLookupError);
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    
    console.log("Found plan:", plan);
    const planId = plan.id;
    
    // Check if user is already enrolled in this plan
    const { data: existingEnrollment, error: checkError } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_id', planId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking enrollment:', checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }
    
    if (existingEnrollment) {
      console.log("User already enrolled in this plan:", existingEnrollment);
      return NextResponse.json({ 
        error: 'You are already enrolled in this plan',
        enrollment: existingEnrollment
      }, { status: 400 });
    }
    
    // Calculate end date
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + (plan.duration_weeks * 7));
    
    // Format date to YYYY-MM-DD
    const endDateString = end.toISOString().split('T')[0];
    
    console.log("Enrollment date range:", { startDate, endDateString });
    
    // Enroll user in the plan
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('user_plans')
      .insert([
        {
          user_id: user.id,
          plan_id: planId,
          start_date: startDate,
          end_date: endDateString,
          is_active: true
        }
      ])
      .select()
      .single();
    
    if (enrollmentError) {
      console.error('Error enrolling user in plan:', enrollmentError);
      return NextResponse.json({ error: enrollmentError.message }, { status: 500 });
    }
    
    console.log("Created enrollment:", enrollment);
    
    // Get all workouts from the plan
    const { data: planWorkouts, error: workoutsError } = await supabase
      .from('plan_workouts')
      .select('*')
      .eq('plan_id', planId);
    
    if (workoutsError) {
      console.error('Error fetching plan workouts:', workoutsError);
      return NextResponse.json({ error: workoutsError.message }, { status: 500 });
    }
    
    console.log(`Found ${planWorkouts.length} plan workouts to create`);
    
    // Create user workouts based on the plan workouts
    const userWorkouts = planWorkouts.map(planWorkout => {
      // Calculate the actual date based on day_number and startDate
      const workoutDate = new Date(start);
      workoutDate.setDate(start.getDate() + (planWorkout.day_number - 1));
      
      // Format date to YYYY-MM-DD
      const workoutDateString = workoutDate.toISOString().split('T')[0];
      
      // Create the base workout
      return {
        user_id: user.id,
        title: planWorkout.title,
        date: workoutDateString,
        type: planWorkout.type,
        notes: planWorkout.notes || '',
        status: 'planned',
        from_plan_id: planId,
        from_plan_workout_id: planWorkout.id
      };
    });
    
    console.log(`Prepared ${userWorkouts.length} workouts to create`);
    
    // Insert all workouts at once
    const { data: createdWorkouts, error: createError } = await supabase
      .from('workouts')
      .insert(userWorkouts)
      .select();
    
    if (createError) {
      console.error('Error creating workouts:', createError);
      
      // Attempt to rollback the enrollment
      await supabase
        .from('user_plans')
        .delete()
        .eq('id', enrollment.id);
        
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }
    
    console.log(`Successfully created ${createdWorkouts.length} workouts`);
    
    // For each created workout, add the type-specific details (run or weightlifting)
    let detailsCreated = 0;
    let detailsErrors = 0;
    
    for (let i = 0; i < createdWorkouts.length; i++) {
      const workout = createdWorkouts[i];
      const planWorkout = planWorkouts.find(pw => pw.id === workout.from_plan_workout_id);
      
      if (!planWorkout) {
        console.warn(`Could not find matching plan workout for workout ${workout.id}`);
        continue;
      }
      
      if (workout.type === 'run') {
        // Add run details
        // Extract run_details from planWorkout
        const runDetails = planWorkout.run_details || {};
        
        console.log(`Creating run details for workout ${workout.id}:`, runDetails);
        
        const { error: runError } = await supabase
          .from('run_workouts')
          .insert({
            id: workout.id,
            run_type: runDetails.run_type || 'Easy',
            planned_distance: runDetails.planned_distance,
            planned_pace: runDetails.planned_pace
          });
          
        if (runError) {
          console.error(`Error creating run details for workout ${workout.id}:`, runError);
          detailsErrors++;
        } else {
          detailsCreated++;
        }
      } else if (workout.type === 'weightlifting') {
        // Add weightlifting details
        // Extract weightlifting_details from planWorkout
        const liftDetails = planWorkout.weightlifting_details || {};
        
        console.log(`Creating weightlifting details for workout ${workout.id}:`, liftDetails);
        
        const { error: liftError } = await supabase
          .from('weightlifting_workouts')
          .insert({
            id: workout.id,
            focus_area: liftDetails.focus_area,
            planned_duration: liftDetails.planned_duration
          });
          
        if (liftError) {
          console.error(`Error creating weightlifting details for workout ${workout.id}:`, liftError);
          detailsErrors++;
        } else {
          detailsCreated++;
        }
      }
    }
    
    console.log(`Created ${detailsCreated} workout details with ${detailsErrors} errors`);
    
    return NextResponse.json({
      success: true,
      enrollment,
      workoutsCreated: createdWorkouts.length,
      detailsCreated,
      detailsErrors,
      planName: plan.name
    });
  } catch (err: any) {
    console.error('Error in POST /api/plans/enroll:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}