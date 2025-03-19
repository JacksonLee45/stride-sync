// app/api/performance/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '3months'; // Default to 3 months
    
    // Calculate date range based on period
    const endDate = new Date();
    let startDate = new Date();
    
    switch(period) {
      case '1month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case '6months':
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case '1year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case '3months':
      default:
        startDate.setMonth(endDate.getMonth() - 3);
    }
    
    // Get future date for planned workouts
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 1);
    
    // Format dates for query
    const startDateStr = startDate.toISOString().split('T')[0];
    const futureDateStr = futureDate.toISOString().split('T')[0];
    
    // Get all run workouts within date range
    const { data: workouts, error } = await supabase
      .from('workouts')
      .select(`
        id,
        user_id,
        title,
        date,
        type,
        status,
        notes,
        run_workouts (
          run_type,
          planned_distance,
          planned_pace,
          completed_distance,
          completed_pace,
          completed_heart_rate
        )
      `)
      .eq('user_id', user.id)
      .eq('type', 'run')
      .gte('date', startDateStr)
      .lte('date', futureDateStr)
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching performance data:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Process data to include all fields in a flat structure
    const processedWorkouts = workouts.map(workout => {
      const runDetails = workout.run_workouts?.[0] || {};
      // Create a new object without the run_workouts property
      const { run_workouts, ...workoutWithoutDetails } = workout;
      
      return {
        ...workoutWithoutDetails,
        ...runDetails,
      };
    });
    
    // Calculate performance stats
    const completedWorkouts = processedWorkouts.filter(w => w.status === 'completed');
    const totalPlannedMiles = processedWorkouts.reduce((sum, w) => 
      sum + (w.planned_distance || 0), 0);
    const totalCompletedMiles = completedWorkouts.reduce((sum, w) => 
      sum + (w.completed_distance || 0), 0);
    const avgMilesPerRun = completedWorkouts.length 
      ? totalCompletedMiles / completedWorkouts.length 
      : 0;
    
    // Group data by week for chart
    interface WeeklyDataItem {
      weekStart: string;
      actualMileage: number;
      plannedMileage: number;
      workouts: any[];
      type: 'past' | 'future';
    }
    
    const weeklyData: Record<string, WeeklyDataItem> = {};
    const today = new Date();
    
    processedWorkouts.forEach(workout => {
      const workoutDate = new Date(workout.date);
      // Get week start (Sunday)
      const weekStart = new Date(workoutDate);
      const day = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - day);
      
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          weekStart: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          actualMileage: 0,
          plannedMileage: 0,
          workouts: [],
          type: workoutDate <= today ? 'past' : 'future'
        };
      }
      
      // Add planned distance
      if (workout.planned_distance) {
        weeklyData[weekKey].plannedMileage += workout.planned_distance;
      }
      
      // Add completed distance for past workouts
      if (workout.status === 'completed' && workout.completed_distance) {
        weeklyData[weekKey].actualMileage += workout.completed_distance;
      }
      
      // Add workout to the week's workout list
      weeklyData[weekKey].workouts.push(workout);
    });
    
    // Convert to array and sort by date
    const chartData = Object.keys(weeklyData).map(key => ({
      date: key,
      ...weeklyData[key]
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return NextResponse.json({
      workouts: processedWorkouts,
      stats: {
        totalWorkouts: processedWorkouts.length,
        completedWorkouts: completedWorkouts.length,
        totalPlannedMiles: Math.round(totalPlannedMiles * 100) / 100,
        totalCompletedMiles: Math.round(totalCompletedMiles * 100) / 100,
        avgMilesPerRun: Math.round(avgMilesPerRun * 100) / 100,
        completion: completedWorkouts.length / (processedWorkouts.length || 1)
      },
      chartData
    });
  } catch (err: any) {
    console.error('Error in GET /api/performance:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}