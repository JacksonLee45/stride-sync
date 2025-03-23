// app/api/coach/save-plan/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Add TypeScript interfaces for the workout plan data
interface RunWorkout {
  title: string;
  date: string;
  type: 'run';
  runType: string;
  distance: number;
  pace?: string;
  notes?: string;
}

interface WeightliftingWorkout {
  title: string;
  date: string;
  type: 'weightlifting';
  focusArea: string;
  duration: string;
  notes?: string;
}

type Workout = RunWorkout | WeightliftingWorkout;

interface WorkoutPlan {
  planName: string;
  planDescription: string;
  targetRace?: string;
  duration?: string;
  workouts: Workout[];
}

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
    
    console.log(`Received ${workoutPlan.workouts.length} workouts to save`);
    
    // Validate workouts before processing
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day for comparison
    
    const validWorkouts = workoutPlan.workouts.filter((workout: any) => {
      // Basic validation for all workouts
      const hasBasicFields = workout && 
                            workout.title && 
                            workout.date && 
                            (workout.date.match(/^\d{4}-\d{2}-\d{2}$/)) && 
                            workout.type && 
                            (workout.type === 'run' || workout.type === 'weightlifting');
      
      if (!hasBasicFields) {
        console.warn('Skipping workout with missing basic fields:', workout);
        return false;
      }
      
      // Date validation - ensure date is today or future
      const workoutDate = new Date(workout.date);
      workoutDate.setHours(0, 0, 0, 0);
      const isValidDate = workoutDate >= today;
      
      if (!isValidDate) {
        console.warn(`Skipping workout with past date: ${workout.date}`, workout);
        return false;
      }
      
      // Type-specific validation
      if (workout.type === 'run') {
        const isValidRun = workout.runType && (workout.distance !== undefined);
        if (!isValidRun) {
          console.warn('Skipping run workout with missing run-specific fields:', workout);
        }
        return isValidRun;
      } else if (workout.type === 'weightlifting') {
        const isValidStrength = workout.focusArea && workout.duration;
        if (!isValidStrength) {
          console.warn('Skipping weightlifting workout with missing strength-specific fields:', workout);
        }
        return isValidStrength;
      }
      
      return false;
    });
    
    // Fix past dates if needed (ensure all workouts start from today)
    if (validWorkouts.length > 0) {
      const allDates = validWorkouts.map((w: any) => new Date(w.date));
      const earliestDate = new Date(Math.min(...allDates.map((d: Date) => d.getTime())));
      
      // If earliest date is in the past, shift all workouts forward
      if (earliestDate < today) {
        console.log('Fixing past dates by shifting workouts forward');
        
        const msPerDay = 24 * 60 * 60 * 1000;
        const daysToShift = Math.ceil((today.getTime() - earliestDate.getTime()) / msPerDay);
        
        // Shift all workout dates forward
        validWorkouts.forEach((workout: any) => {
          const oldDate = new Date(workout.date);
          const newDate = new Date(oldDate.getTime() + (daysToShift * msPerDay));
          workout.date = newDate.toISOString().split('T')[0];
        });
      }
    }
    
    console.log(`After validation, saving ${validWorkouts.length} valid workouts`);
    
    if (validWorkouts.length === 0) {
      return NextResponse.json({ 
        error: 'No valid workouts found in plan',
        totalReceived: workoutPlan.workouts.length 
      }, { status: 400 });
    }
    
    // First, create a training plan record
    const { data: trainingPlan, error: planError } = await supabase
      .from('training_plans')
      .insert({
        user_id: user.id,
        name: workoutPlan.planName,
        description: workoutPlan.planDescription,
        goal: workoutPlan.targetRace || 'General fitness',
        start_date: validWorkouts[0]?.date || new Date().toISOString().split('T')[0],
        end_date: validWorkouts[validWorkouts.length - 1]?.date || new Date().toISOString().split('T')[0],
        created_by: 'AI',
        metadata: {
          conversation_id: conversationId,
          generated_at: new Date().toISOString(),
          total_workouts_received: workoutPlan.workouts.length,
          valid_workouts_count: validWorkouts.length
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
    for (const workout of validWorkouts) {
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
          workouts_attempted: validWorkouts.length
        }
      })
      .eq('id', trainingPlanId);
    
    return NextResponse.json({
      success: true,
      trainingPlanId,
      savedWorkouts: successfulWorkouts,
      totalWorkouts: workoutPlan.workouts.length,
      validWorkouts: validWorkouts.length
    });
    
  } catch (err: any) {
    console.error('Error saving workout plan:', err);
    return NextResponse.json(
      { error: 'Failed to save workout plan', details: err.message },
      { status: 500 }
    );
  }
}