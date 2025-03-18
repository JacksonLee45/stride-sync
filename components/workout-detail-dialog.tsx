"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Check, Edit, Clock, Award } from 'lucide-react';
import { Workout } from './dashboard';
import { CompleteRunWorkoutData, CompleteWeightliftingWorkoutData } from '@/utils/supabase/api';

interface WorkoutDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workout: Workout | null;
  onComplete: (completionData: CompleteRunWorkoutData | CompleteWeightliftingWorkoutData) => void;
  onUpdate: (id: string, workout: any) => Promise<any>;
}

export default function WorkoutDetailDialog({ 
  isOpen, 
  onClose, 
  workout, 
  onComplete,
  onUpdate
}: WorkoutDetailDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isCompletingWorkout, setIsCompletingWorkout] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    type: 'run' as 'run' | 'weightlifting',
    runType: 'Long' as 'Long' | 'Fast' | 'Tempo' | 'Shakeout' | 'Short',
    planned_distance: '',
    planned_pace: '',
    focus_area: '',
    planned_duration: '',
    notes: '',
    
    // Completion fields
    completed_distance: '',
    completed_pace: '',
    completed_duration: '',
    completed_heart_rate: ''
  });

  useEffect(() => {
    if (workout && isOpen) {
      setFormData({
        title: workout.title || '',
        date: workout.date || new Date().toISOString().split('T')[0],
        type: workout.type || 'run',
        runType: workout.run_type || 'Long',
        planned_distance: workout.planned_distance?.toString() || '',
        planned_pace: workout.planned_pace || '',
        focus_area: workout.focus_area || '',
        planned_duration: workout.planned_duration || '',
        notes: workout.notes || '',
        
        // Completion fields
        completed_distance: workout.completed_distance?.toString() || '',
        completed_pace: workout.completed_pace || '',
        completed_duration: workout.completed_duration || '',
        completed_heart_rate: workout.completed_heart_rate?.toString() || ''
      });
      
      // Reset UI states
      setIsEditing(false);
      setIsCompletingWorkout(false);
    }
  }, [workout, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    if (!workout || !workout.id) return;
    
    const updatedWorkout = {
      workout: {
        title: formData.title,
        date: formData.date,
        notes: formData.notes,
      },
      workoutDetails: workout.type === 'run' 
        ? {
            run_type: formData.runType,
            planned_distance: formData.planned_distance ? parseFloat(formData.planned_distance) : undefined,
            planned_pace: formData.planned_pace
          }
        : {
            focus_area: formData.focus_area,
            planned_duration: formData.planned_duration
          }
    };
    
    try {
      const updatedData = await onUpdate(workout.id, updatedWorkout);
      
      // Update the form data with the response from the server
      if (updatedData) {
        setFormData({
          ...formData,
          // Update any fields that might have been changed on the server
          title: updatedData.title || formData.title,
          date: updatedData.date || formData.date,
          notes: updatedData.notes || formData.notes
        });
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving changes:', error);
      // Keep editing mode open if there's an error
    }
  };

  const handleComplete = () => {
    if (!workout || !workout.id) return;
    
    const completionData = workout.type === 'run'
      ? {
          status: 'completed' as const,
          completed_distance: formData.completed_distance ? parseFloat(formData.completed_distance) : undefined,
          completed_pace: formData.completed_pace || undefined,
          completed_heart_rate: formData.completed_heart_rate ? parseInt(formData.completed_heart_rate) : undefined
        }
      : {
          status: 'completed' as const,
          completed_duration: formData.completed_duration || undefined,
          completed_heart_rate: formData.completed_heart_rate ? parseInt(formData.completed_heart_rate) : undefined
        };
    
    onComplete(completionData);
    setIsCompletingWorkout(false);
  };

  const handleMarkAsMissed = () => {
    if (!workout || !workout.id) return;
    
    const missedData = workout.type === 'run'
      ? { status: 'missed' as const }
      : { status: 'missed' as const };
    
    onComplete(missedData);
  };

  if (!workout) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{isEditing ? 'Edit Workout' : 'Workout Details'}</span>
            {!isEditing && workout.status === 'planned' && (
              <Button 
                onClick={() => setIsEditing(true)} 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
              >
                <Edit size={14} /> Edit
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the details of your workout' 
              : isCompletingWorkout 
                ? 'Enter your completed workout data' 
                : `${workout.type === 'run' ? 'Run' : 'Strength'} workout on ${new Date(workout.date).toLocaleDateString()}`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {/* View Mode */}
          {!isEditing && !isCompletingWorkout && (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  {workout.type === 'run' ? (
                    <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/50">
                      <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  ) : (
                    <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/50">
                      <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  )}
                  <span className="font-semibold text-lg">{workout.title}</span>
                </div>
                {workout.status === 'completed' ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300">
                    <Check className="mr-1" size={12} />Completed
                  </span>
                ) : workout.status === 'missed' ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300">
                    Missed
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-300">
                    Planned
                  </span>
                )}
              </div>
              
              {/* Workout Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Date</h3>
                  <p>{new Date(workout.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Type</h3>
                  <p className="capitalize">{workout.type}</p>
                </div>
                
                {workout.type === 'run' && (
                  <>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Run Type</h3>
                      <p>{workout.run_type}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Planned Distance</h3>
                      <p>{workout.planned_distance ? `${workout.planned_distance} miles` : 'Not specified'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Planned Pace</h3>
                      <p>{workout.planned_pace || 'Not specified'}</p>
                    </div>
                    {workout.status === 'completed' && (
                      <>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Completed Distance</h3>
                          <p>{workout.completed_distance ? `${workout.completed_distance} miles` : 'Not recorded'}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Actual Pace</h3>
                          <p>{workout.completed_pace || 'Not recorded'}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Heart Rate</h3>
                          <p>{workout.completed_heart_rate ? `${workout.completed_heart_rate} bpm` : 'Not recorded'}</p>
                        </div>
                      </>
                    )}
                  </>
                )}
                
                {workout.type === 'weightlifting' && (
                  <>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Focus Area</h3>
                      <p>{workout.focus_area || 'Not specified'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Planned Duration</h3>
                      <p>{workout.planned_duration || 'Not specified'}</p>
                    </div>
                    {workout.status === 'completed' && (
                      <>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Actual Duration</h3>
                          <p>{workout.completed_duration || 'Not recorded'}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Heart Rate</h3>
                          <p>{workout.completed_heart_rate ? `${workout.completed_heart_rate} bpm` : 'Not recorded'}</p>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
              
              {workout.notes && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Notes</h3>
                  <p className="text-sm whitespace-pre-line">{workout.notes}</p>
                </div>
              )}
            </div>
          )}
          
          {/* Edit Mode */}
          {isEditing && (
            <form className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Workout Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>
              
              {workout.type === 'run' ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="runType">Run Type</Label>
                    <select
                      id="runType"
                      name="runType"
                      value={formData.runType}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="Long">Long</option>
                      <option value="Fast">Fast</option>
                      <option value="Tempo">Tempo</option>
                      <option value="Shakeout">Shakeout</option>
                      <option value="Short">Short</option>
                    </select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="planned_distance">Planned Distance (miles)</Label>
                    <Input
                      id="planned_distance"
                      name="planned_distance"
                      type="number"
                      step="0.01"
                      value={formData.planned_distance}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="planned_pace">Planned Pace</Label>
                    <Input
                      id="planned_pace"
                      name="planned_pace"
                      value={formData.planned_pace}
                      onChange={handleChange}
                      placeholder="e.g., 8:30/mile"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="focus_area">Focus Area</Label>
                    <Input
                      id="focus_area"
                      name="focus_area"
                      value={formData.focus_area}
                      onChange={handleChange}
                      placeholder="e.g., Upper Body, Lower Body, Core"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="planned_duration">Planned Duration</Label>
                    <Input
                      id="planned_duration"
                      name="planned_duration"
                      value={formData.planned_duration}
                      onChange={handleChange}
                      placeholder="e.g., 45min, 1hr 30min"
                    />
                  </div>
                </>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </form>
          )}
          
          {/* Complete Workout Mode */}
          {isCompletingWorkout && (
            <form className="space-y-4">
              {workout.type === 'run' ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="completed_distance">Completed Distance (miles)</Label>
                    <Input
                      id="completed_distance"
                      name="completed_distance"
                      type="number"
                      step="0.01"
                      value={formData.completed_distance}
                      onChange={handleChange}
                      placeholder="e.g., 5.2"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="completed_pace">Completed Pace</Label>
                    <Input
                      id="completed_pace"
                      name="completed_pace"
                      value={formData.completed_pace}
                      onChange={handleChange}
                      placeholder="e.g., 8:30/mile"
                    />
                  </div>
                </>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="completed_duration">Completed Duration</Label>
                  <Input
                    id="completed_duration"
                    name="completed_duration"
                    value={formData.completed_duration}
                    onChange={handleChange}
                    placeholder="e.g., 45min"
                  />
                </div>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="completed_heart_rate">Avg Heart Rate (BPM)</Label>
                <Input
                  id="completed_heart_rate"
                  name="completed_heart_rate"
                  type="number"
                  value={formData.completed_heart_rate}
                  onChange={handleChange}
                  placeholder="e.g., 145"
                />
              </div>
            </form>
          )}
        </div>
        
        <DialogFooter>
          {/* View Mode Buttons */}
          {!isEditing && !isCompletingWorkout && workout.status === 'planned' && (
            <>
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleMarkAsMissed}
              >
                Mark as Missed
              </Button>
              <Button 
                type="button"
                variant="default"
                onClick={() => setIsCompletingWorkout(true)}
                className="gap-1"
              >
                <Check size={16} /> Mark as Complete
              </Button>
            </>
          )}
          
          {/* Edit Mode Buttons */}
          {isEditing && (
            <>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                onClick={handleSaveChanges}
              >
                Save Changes
              </Button>
            </>
          )}
          
          {/* Complete Mode Buttons */}
          {isCompletingWorkout && (
            <>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCompletingWorkout(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                onClick={handleComplete}
              >
                Complete Workout
              </Button>
            </>
          )}
          
          {/* Close button when just viewing a completed/missed workout */}
          {!isEditing && !isCompletingWorkout && workout.status !== 'planned' && (
            <Button 
              type="button" 
              onClick={onClose}
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}