"use client";

import React, { useState } from 'react';
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
} from "@/components/ui/dialog";
import { 
  CompleteRunWorkoutData, 
  CompleteWeightliftingWorkoutData 
} from '@/utils/supabase/api';

interface WorkoutCompletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workout: any; // This would come from your API
  onComplete: (completionData: CompleteRunWorkoutData | CompleteWeightliftingWorkoutData) => void;
}

export default function WorkoutCompletionDialog({ 
  isOpen, 
  onClose, 
  workout, 
  onComplete 
}: WorkoutCompletionDialogProps) {
  // Initialize state based on workout type
  const [formData, setFormData] = useState({
    status: 'completed' as 'completed' | 'missed',
    completed_distance: '',
    completed_pace: '',
    completed_duration: '',
    completed_heart_rate: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare the data based on workout type
    if (workout.type === 'run') {
      const completionData: CompleteRunWorkoutData = {
        status: formData.status,
        completed_distance: formData.completed_distance ? parseFloat(formData.completed_distance) : undefined,
        completed_pace: formData.completed_pace || undefined,
        completed_heart_rate: formData.completed_heart_rate ? parseInt(formData.completed_heart_rate) : undefined
      };
      onComplete(completionData);
    } else {
      const completionData: CompleteWeightliftingWorkoutData = {
        status: formData.status,
        completed_duration: formData.completed_duration || undefined,
        completed_heart_rate: formData.completed_heart_rate ? parseInt(formData.completed_heart_rate) : undefined
      };
      onComplete(completionData);
    }
    
    onClose();
  };

  // If no workout is provided, don't render the dialog
  if (!workout) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete Workout: {workout.title}</DialogTitle>
          <DialogDescription>
            Record your completed workout data.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
            </select>
          </div>
          
          {formData.status === 'completed' && (
            <>
              {/* Show fields based on workout type */}
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
            </>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {formData.status === 'completed' ? 'Complete Workout' : 'Mark as Missed'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}