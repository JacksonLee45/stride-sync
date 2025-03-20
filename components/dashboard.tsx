"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Check, X, MoreHorizontal } from "lucide-react";
import dynamic from 'next/dynamic';
import { ConfigProvider, theme } from 'antd';
import { useTheme } from 'next-themes';
import WorkoutFormDialog from "./workout-form-dialog";
import WorkoutCompletionDialog from "./workout-completion-dialog";
import WorkoutDetailDialog from "./workout-detail-dialog";
import { 
  getWorkoutsWithDetails, 
  createWorkout, 
  completeRunWorkout, 
  completeWeightliftingWorkout,
  updateWorkout,
  Workout as ApiWorkout,
  RunWorkout as ApiRunWorkout,
  WeightliftingWorkout as ApiWeightliftingWorkout,
  CompleteRunWorkoutData,
  CompleteWeightliftingWorkoutData
} from '@/utils/supabase/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Combined workout type for UI
export interface Workout extends ApiWorkout {
  // Run specific fields
  run_type?: 'Long' | 'Fast' | 'Tempo' | 'Shakeout' | 'Short';
  planned_distance?: number;
  planned_pace?: string;
  completed_distance?: number;
  completed_pace?: string;
  // Weightlifting specific fields
  focus_area?: string;
  planned_duration?: string;
  completed_duration?: string;
  // Common fields
  completed_heart_rate?: number;
}

// Create a simple CSS module to be used instead of importing from styles
const calendarCss = {
  calendarWrapper: 'calendar-wrapper'
};

// Dynamically import the Calendar component from antd with no SSR
// This prevents hydration errors since antd's Calendar relies on browser APIs
const Calendar = dynamic(
  () => import('antd').then((antd) => antd.Calendar),
  { ssr: false, loading: () => <CalendarSkeleton /> }
);

// Skeleton loader component for the calendar
function CalendarSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-12 bg-muted rounded mb-4"></div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={`header-${i}`} className="h-8 bg-muted rounded"></div>
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, weekIndex) => (
        <div key={`week-${weekIndex}`} className="grid grid-cols-7 gap-2 mt-2">
          {Array.from({ length: 7 }).map((_, dayIndex) => (
            <div 
              key={`day-${weekIndex}-${dayIndex}`} 
              className="h-24 bg-muted/50 rounded flex items-center justify-center"
            >
              <div className="h-6 w-6 bg-muted rounded-full"></div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Explicitly typing Dashboard as a React FC (Function Component)
const Dashboard: React.FC = () => {
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]); // Default to today
  
  // Fetch workouts from the API
  const fetchWorkouts = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching workouts...");
      
      // Fetch real data from Supabase
      const data = await getWorkoutsWithDetails();
      setWorkouts(data);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching workouts:', err);
      setError('Failed to load workouts. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Set isClient to true after component mounts and fetch workouts
  useEffect(() => {
    console.log("Dashboard component mounted");
    setIsClient(true);
    fetchWorkouts();
  }, []);
  
  // Convert the form data to API format and save the workout
  const handleSaveWorkout = async (formWorkout: any) => {
    try {
      console.log("Saving workout:", formWorkout);
      
      // Convert the workout form data to API format
      const workoutData: ApiWorkout = {
        title: formWorkout.title,
        date: formWorkout.date,
        type: formWorkout.type,
        notes: formWorkout.notes,
        status: 'planned'
      };
      
      let workoutDetails: ApiRunWorkout | ApiWeightliftingWorkout;
      
      if (formWorkout.type === 'run') {
        workoutDetails = {
          run_type: formWorkout.runType || 'Long',
          planned_distance: formWorkout.distance ? parseFloat(formWorkout.distance) : undefined,
          planned_pace: formWorkout.pace || undefined
        };
      } else {
        workoutDetails = {
          focus_area: formWorkout.focusArea || undefined,
          planned_duration: formWorkout.duration || undefined
        };
      }
      
      console.log("About to create workout with data:", workoutData);
      console.log("And details:", workoutDetails);
      
      // Save the workout using the API
      const savedWorkout = await createWorkout(workoutData, workoutDetails);
      console.log("Workout saved successfully:", savedWorkout);
      
      // Refresh the workout list
      fetchWorkouts();
      
      // Close the dialog
      setIsFormDialogOpen(false);
    } catch (err: any) {
      console.error('Error saving workout:', err);
      // Show detailed error to user
      alert(`Failed to save workout: ${err?.message || 'Unknown error'}`);
    }
  };
  
  // Handle completing a workout
  const handleCompleteWorkout = async (completionData: CompleteRunWorkoutData | CompleteWeightliftingWorkoutData) => {
    if (!selectedWorkout || !selectedWorkout.id) return;
    
    try {
      console.log("Completing workout:", selectedWorkout.id, completionData);
      
      if (selectedWorkout.type === 'run') {
        console.log("Calling completeRunWorkout with data:", {
          id: selectedWorkout.id,
          data: completionData
        });
        await completeRunWorkout(
          selectedWorkout.id, 
          completionData as CompleteRunWorkoutData
        );
      } else {
        console.log("Calling completeWeightliftingWorkout with data:", {
          id: selectedWorkout.id,
          data: completionData
        });
        await completeWeightliftingWorkout(
          selectedWorkout.id, 
          completionData as CompleteWeightliftingWorkoutData
        );
      }
      
      console.log("Workout completed successfully");
      
      // Refresh the workout list
      fetchWorkouts();
      
      // Reset the selected workout
      setSelectedWorkout(null);
      setIsCompletionDialogOpen(false);
      setIsDetailDialogOpen(false);
    } catch (err: any) {
      console.error('Error completing workout:', err);
      // Show detailed error to user
      alert(`Failed to complete workout: ${err?.message || 'Unknown error'}`);
    }
  };
  
  // Handle updating a workout
  const handleUpdateWorkout = async (id: string, workoutData: any) => {
    try {
      console.log("Updating workout:", id, workoutData);
      
      // Get the updated workout data from the API
      const updatedWorkout = await updateWorkout(id, workoutData.workout, workoutData.workoutDetails);
      
      console.log("Workout updated successfully:", updatedWorkout);
      
      // Update the selected workout with the new data
      if (selectedWorkout && selectedWorkout.id === id) {
        setSelectedWorkout({
          ...selectedWorkout,
          ...updatedWorkout
        });
      }
      
      // Refresh the workout list
      fetchWorkouts();
      
      // Return the updated workout data to the caller
      return updatedWorkout;
    } catch (err: any) {
      console.error('Error updating workout:', err);
      // Show detailed error to user
      alert(`Failed to update workout: ${err?.message || 'Unknown error'}`);
      throw err; // Re-throw so the dialog component can handle it
    }
  };
  
  // Handle opening the completion dialog
  const openCompletionDialog = (workout: Workout) => {
    setSelectedWorkout(workout);
    setIsCompletionDialogOpen(true);
  };
  
  // Handle opening the detail dialog
  const openDetailDialog = (workout: Workout) => {
    setSelectedWorkout(workout);
    setIsDetailDialogOpen(true);
  };

  // Handle calendar cell click
  const handleCalendarCellClick = (date: any) => {
    const formattedDate = date.format('YYYY-MM-DD');
    setSelectedDate(formattedDate);
    setIsFormDialogOpen(true);
  };
  
  // Function to get status badge style
  const getStatusBadge = (status: string | undefined) => {
    switch(status) {
      case 'completed':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
          <Check className="mr-1" size={12} />Completed
        </span>;
      case 'missed':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
          <X className="mr-1" size={12} />Missed
        </span>;
      default: // planned
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
          Planned
        </span>;
    }
  };
  
  // Function to handle calendar date cell rendering
  const dateCellRender = (value: any) => {
    const dateString = value.format('YYYY-MM-DD');
    const dateWorkouts = workouts.filter(workout => workout.date === dateString);
    
    return (
      <div 
        className="h-full cursor-pointer" 
        onClick={(e) => {
          // Prevent the click from bubbling up to the calendar's default behavior
          e.stopPropagation();
          handleCalendarCellClick(value);
        }}
      >
        {dateWorkouts.length > 0 ? (
          <ul className="list-none m-0 p-0">
            {dateWorkouts.map(workout => (
              <li key={workout.id} className="text-xs mb-1 flex items-center justify-between group">
                <span 
                  className={`
                    px-2 py-1 rounded-sm flex-grow mr-1 cursor-pointer hover:opacity-80
                    ${workout.type === 'run' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-purple-100 dark:bg-purple-900'}
                    ${workout.status === 'completed' ? 'border-l-2 border-green-500' : 
                      workout.status === 'missed' ? 'border-l-2 border-red-500' : ''}
                  `}
                  onClick={(e) => {
                    e.stopPropagation();
                    openDetailDialog(workout);
                  }}
                >
                  {workout.title}
                </span>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()} // Prevent click from triggering cell click
                    >
                      <MoreHorizontal size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {workout.status === 'planned' && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation(); // Prevent click from triggering cell click
                        openCompletionDialog(workout);
                      }}>
                        Mark as complete
                      </DropdownMenuItem>
                    )}
                    {/* Could add other actions like Edit, Delete, etc. */}
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))}
          </ul>
        ) : (
          <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Plus size={16} className="text-primary" />
          </div>
        )}
      </div>
    );
  };

  // Get the current theme
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  
  console.log("Rendering Dashboard, isClient:", isClient);
  
  // Custom theme configuration for Ant Design
  const customTheme = {
    token: {
      colorPrimary: '#2563eb', // Blue primary color
      borderRadius: 8,
      colorBgContainer: isDarkMode ? '#111' : '#fff',
      colorBgElevated: isDarkMode ? '#1e1e1e' : '#fff',
      colorText: isDarkMode ? '#e5e5e5' : '#111',
      colorTextSecondary: isDarkMode ? '#a3a3a3' : '#6b7280',
      colorSplit: isDarkMode ? '#333' : '#e5e5e5',
      colorBorder: isDarkMode ? '#333' : '#e5e5e5',
    },
    algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
  };

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto p-4">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your Workout Calendar</h1>
          <Button 
            onClick={() => {
              setSelectedDate(new Date().toISOString().split('T')[0]); // Reset to today
              setIsFormDialogOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            New Workout
          </Button>
        </header>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <p>{error}</p>
          </div>
        )}

        <div className="bg-card rounded-lg border shadow-sm p-4">
          {isLoading ? (
            <CalendarSkeleton />
          ) : isClient ? (
            <ConfigProvider theme={customTheme}>
              <div className={calendarCss.calendarWrapper}>
                <Calendar 
                  fullscreen={true} 
                  cellRender={dateCellRender}
                />
              </div>
            </ConfigProvider>
          ) : (
            <div>Loading calendar...</div>
          )}
        </div>

        {/* Form dialog for creating new workouts */}
        <WorkoutFormDialog 
          isOpen={isFormDialogOpen}
          onClose={() => setIsFormDialogOpen(false)}
          onSave={handleSaveWorkout}
          initialDate={selectedDate}
        />

        {/* Completion dialog for marking workouts as complete */}
        {selectedWorkout && (
          <WorkoutCompletionDialog 
            isOpen={isCompletionDialogOpen}
            onClose={() => {
              setIsCompletionDialogOpen(false);
              setSelectedWorkout(null);
            }}
            workout={selectedWorkout}
            onComplete={handleCompleteWorkout}
          />
        )}

        {/* Detail dialog for viewing and editing workouts */}
        {selectedWorkout && (
          <WorkoutDetailDialog
            isOpen={isDetailDialogOpen}
            onClose={() => {
              setIsDetailDialogOpen(false);
              setSelectedWorkout(null);
            }}
            workout={selectedWorkout}
            onComplete={handleCompleteWorkout}
            onUpdate={handleUpdateWorkout}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;