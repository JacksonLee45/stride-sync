// components/performance/DataProcessing.ts

export interface ChartData {
    date: string;
    weekStart: string;
    actualMileage: number;
    plannedMileage: number;
    type: 'past' | 'future';
  }
  
  export interface StatsData {
    totalPlannedMiles: number;
    totalCompletedMiles: number;
    totalWorkouts: number;
    completedWorkouts: number;
    averageMilesPerRun: number;
  }
  
  export interface ProcessedData {
    chartData: ChartData[];
    stats: StatsData;
  }
  
  // Helper function to format date as "Mon DD"
  export const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  // Process workout data for charts and stats
  export const processWorkoutData = (workouts: any[]): ProcessedData => {
    // Filter out only run workouts
    const runWorkouts = workouts.filter(workout => workout.type === 'run');
    
    // Get the range of dates (3 months past to 1 month future)
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    const oneMonthAhead = new Date();
    oneMonthAhead.setMonth(today.getMonth() + 1);
    
    // Group workouts by week
    const weeklyData: Map<string, ChartData> = new Map();
    
    // Track totals for stats
    let totalPlannedMiles = 0;
    let totalCompletedMiles = 0;
    let totalWorkouts = runWorkouts.length;
    let completedWorkouts = 0;
    
    // Process each workout
    runWorkouts.forEach(workout => {
      const workoutDate = new Date(workout.date);
      
      // Skip if outside our range
      if (workoutDate < threeMonthsAgo || workoutDate > oneMonthAhead) return;
      
      // Determine the start of the week for this workout (use Sunday as first day)
      const weekStart = new Date(workoutDate);
      const day = weekStart.getDay(); // 0 is Sunday
      weekStart.setDate(weekStart.getDate() - day);
      
      const weekKey = weekStart.toISOString().split('T')[0];
      
      // Initialize week data if not exists
      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, {
          date: weekKey,
          weekStart: formatDate(weekStart),
          actualMileage: 0,
          plannedMileage: 0,
          type: workoutDate <= today ? 'past' : 'future'
        });
      }
      
      const weekData = weeklyData.get(weekKey)!;
      
      // For past dates: only track completed mileage (no planned mileage)
      if (workoutDate <= today) {
        // Only add completed mileage for workouts with status 'completed'
        if (workout.status === 'completed' && workout.completed_distance) {
          weekData.actualMileage += workout.completed_distance;
          totalCompletedMiles += workout.completed_distance;
          completedWorkouts++;
        }
        // All other statuses for past dates are considered missed
        // No planned mileage is shown for past dates
      }
      // For future dates: only track planned mileage
      else {
        // Add planned mileage only for future dates
        if (workout.planned_distance) {
          weekData.plannedMileage += workout.planned_distance;
          totalPlannedMiles += workout.planned_distance;
        }
      }
    });
    
    // Convert map to array and sort by date
    const chartData = Array.from(weeklyData.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculate statistics
    const averageMilesPerRun = completedWorkouts > 0 
      ? +(totalCompletedMiles / completedWorkouts).toFixed(2)
      : 0;
    
    // Return processed data
    return {
      chartData,
      stats: {
        totalPlannedMiles: +totalPlannedMiles.toFixed(2),
        totalCompletedMiles: +totalCompletedMiles.toFixed(2),
        totalWorkouts,
        completedWorkouts,
        averageMilesPerRun
      }
    };
  };