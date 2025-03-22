// app/api/coach/save-plan/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get the current user for security check
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get request body
    const { workoutPlan, conversationId } = await request.json();
    
    if (!workoutPlan || !workoutPlan.workouts || !Array.isArray(workoutPlan.workouts)) {
      return NextResponse.json({ error: 'Invalid workout plan' }, { status: 400 });
    }
    
    // First, create a training plan record
    const { data: trainingPlan, error: planError } = await supabase
      .from('training_plans')
      .insert({
        user_id: user.id,
        name: workoutPlan.planName,
        description: workoutPlan.planDescription,
        goal: workoutPlan.targetRace || 'General fitness',
        start_date: workoutPlan.workouts[0]?.date || new Date().toISOString().split('T')[0],
        end_date: workoutPlan.workouts[workoutPlan.workouts.length - 1]?.date || new Date().toISOString().split('T')[0],
        created_by: 'AI',
        metadata: {
          conversation_id: conversationId,
          generated_at: new Date().toISOString()
        }
      })
      .select()
      .single();
    
    if (planError) {
      console.error('Error creating training plan:', planError);
      return NextResponse.json({ error: 'Failed to create training plan' }, { status: 500 });
    }
    
    const trainingPlanId = trainingPlan.id;
    
    // Array to track each workout creation result
    const workoutResults = [];
    
    // Create each workout
    for (const workout of workoutPlan.workouts) {
      try {
        // Create the base workout
        const workoutData = {
          user_id: user.id,
          title: workout.title,
          date: workout.date,
          type: workout.type,
          notes: workout.notes || '',
          status: 'planned',
          training_plan_id: trainingPlanId
        };
        
        const { data: createdWorkout, error: workoutError } = await supabase
          .from('workouts')
          .insert(workoutData)
          .select()
          .single();
        
        if (workoutError) {
          console.error('Error creating workout:', workoutError);
          workoutResults.push({ success: false, error: workoutError.message });
          continue;
        }
        
        // Create workout details based on type
        if (workout.type === 'run') {
          const runDetails = {
            id: createdWorkout.id,
            run_type: workout.runType || 'Easy',
            planned_distance: workout.distance || null,
            planned_pace: workout.pace || null
          };
          
          const { error: runError } = await supabase
            .from('run_workouts')
            .insert(runDetails);
          
          if (runError) {
            console.error('Error creating run details:', runError);
            workoutResults.push({ success: false, error: runError.message });
            continue;
          }
        } else if (workout.type === 'weightlifting') {
          const strengthDetails = {
            id: createdWorkout.id,
            focus_area: workout.focusArea || null,
            planned_duration: workout.duration || null
          };
          
          const { error: strengthError } = await supabase
            .from('weightlifting_workouts')
            .insert(strengthDetails);
          
          if (strengthError) {
            console.error('Error creating strength details:', strengthError);
            workoutResults.push({ success: false, error: strengthError.message });
            continue;
          }
        }
        
        workoutResults.push({ success: true, workoutId: createdWorkout.id });
        
      } catch (err) {
        console.error('Error processing workout:', err);
        workoutResults.push({ success: false, error: 'Internal server error' });
      }
    }
    
    // Calculate success stats
    const successfulWorkouts = workoutResults.filter(r => r.success).length;
    
    // Update the training plan with the number of workouts created
    await supabase
      .from('training_plans')
      .update({
        metadata: {
          ...trainingPlan.metadata,
          workouts_created: successfulWorkouts,
          total_workouts: workoutPlan.workouts.length
        }
      })
      .eq('id', trainingPlanId);
    
    return NextResponse.json({
      success: true,
      trainingPlanId,
      savedWorkouts: successfulWorkouts,
      totalWorkouts: workoutPlan.workouts.length
    });
    
  } catch (err: any) {
    console.error('Error saving workout plan:', err);
    return NextResponse.json(
      { error: 'Failed to save workout plan' },
      { status: 500 }
    );
  }
}