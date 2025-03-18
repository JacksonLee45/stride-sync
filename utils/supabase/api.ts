// Client-side API functions that communicate with the server API endpoints

export interface Workout {
  id?: string;
  user_id?: string;
  title: string;
  date: string;
  type: 'run' | 'weightlifting';
  notes?: string;
  status?: 'planned' | 'completed' | 'missed';
}

export interface RunWorkout {
  id?: string;
  run_type: 'Long' | 'Fast' | 'Tempo' | 'Shakeout' | 'Short';
  planned_distance?: number; // in miles
  planned_pace?: string; // stored as text like "8:30/mile"
  completed_distance?: number; // in miles
  completed_pace?: string; // stored as text like "8:30/mile"
  completed_heart_rate?: number; // average heart rate in BPM
}

export interface WeightliftingWorkout {
  id?: string;
  focus_area?: string;
  planned_duration?: string; // stored as text like "45min"
  completed_duration?: string; // stored as text like "50min"
  completed_heart_rate?: number; // average heart rate in BPM
}

export interface CompleteRunWorkoutData {
  status: 'completed' | 'missed';
  completed_distance?: number;
  completed_pace?: string;
  completed_heart_rate?: number;
}

export interface CompleteWeightliftingWorkoutData {
  status: 'completed' | 'missed';
  completed_duration?: string;
  completed_heart_rate?: number;
}

// Create a new workout (both types)
export async function createWorkout(
  workout: Workout,
  workoutDetails: RunWorkout | WeightliftingWorkout
) {
  try {
    const response = await fetch('/api/workouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ workout, workoutDetails }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create workout');
    }

    return await response.json();
  } catch (err) {
    console.error('Unexpected error in createWorkout:', err);
    throw err;
  }
}

// Fetch all workouts for the current user
export async function getWorkouts() {
  try {
    const response = await fetch('/api/workouts');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch workouts');
    }
    
    return await response.json();
  } catch (err) {
    console.error('Error fetching workouts:', err);
    throw err;
  }
}

// Fetch workouts with their type-specific details
export async function getWorkoutsWithDetails() {
  try {
    const response = await fetch('/api/workouts');
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch workouts');
    }
    
    return await response.json();
  } catch (err) {
    console.error('Error in getWorkoutsWithDetails:', err);
    throw err;
  }
}

// Get a single workout with details
export async function getWorkout(id: string) {
  try {
    const response = await fetch(`/api/workouts/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch workout');
    }
    
    return await response.json();
  } catch (err) {
    console.error('Error fetching workout:', err);
    throw err;
  }
}

// Update a workout
export async function updateWorkout(
  id: string,
  workout: Partial<Workout>,
  workoutDetails: Partial<RunWorkout> | Partial<WeightliftingWorkout>
) {
  try {
    const response = await fetch(`/api/workouts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ workout, workoutDetails }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update workout');
    }

    return await response.json();
  } catch (err) {
    console.error('Error updating workout:', err);
    throw err;
  }
}

// Delete a workout
export async function deleteWorkout(id: string) {
  try {
    const response = await fetch(`/api/workouts/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete workout');
    }

    return true;
  } catch (err) {
    console.error('Error deleting workout:', err);
    throw err;
  }
}

// Complete a run workout
export async function completeRunWorkout(id: string, data: CompleteRunWorkoutData) {
  try {
    const response = await fetch(`/api/workouts/${id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to complete workout');
    }

    return await response.json();
  } catch (err) {
    console.error('Error in completeRunWorkout:', err);
    throw err;
  }
}

// Complete a weightlifting workout
export async function completeWeightliftingWorkout(id: string, data: CompleteWeightliftingWorkoutData) {
  try {
    const response = await fetch(`/api/workouts/${id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to complete workout');
    }

    return await response.json();
  } catch (err) {
    console.error('Error in completeWeightliftingWorkout:', err);
    throw err;
  }
}