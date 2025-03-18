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
} from "@/components/ui/dialog";

interface WorkoutFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (workout: any) => void;
  initialDate?: string; // Optional prop to set initial date
}

export default function WorkoutFormDialog({ isOpen, onClose, onSave, initialDate }: WorkoutFormDialogProps) {
  const [workoutType, setWorkoutType] = useState<'run' | 'weightlifting'>('run');
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0], // Today's date as default
    type: 'run' as 'run' | 'weightlifting',
    // Run specific fields
    runType: 'Long' as 'Long' | 'Fast' | 'Tempo' | 'Shakeout' | 'Short',
    distance: '',
    pace: '',
    // Weightlifting specific fields
    duration: '',
    focusArea: '',
    notes: '',
  });

  // Update form when dialog opens or initialDate changes
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        date: initialDate || new Date().toISOString().split('T')[0]
      }));
    }
  }, [isOpen, initialDate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleWorkoutTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as 'run' | 'weightlifting';
    setWorkoutType(newType);
    setFormData(prev => ({
      ...prev,
      type: newType,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save the workout
    onSave(formData);
    
    // Reset form
    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      type: 'run',
      runType: 'Long',
      distance: '',
      pace: '',
      duration: '',
      focusArea: '',
      notes: '',
    });
    setWorkoutType('run');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Workout</DialogTitle>
          <DialogDescription>
            Create a new workout session. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Workout Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., Morning Run, Leg Day"
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
          
          <div className="grid gap-2">
            <Label htmlFor="type">Workout Type</Label>
            <select
              id="type"
              name="type"
              value={workoutType}
              onChange={handleWorkoutTypeChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="run">Run</option>
              <option value="weightlifting">Weightlifting</option>
            </select>
          </div>
          
          {/* Show fields based on workout type */}
          {workoutType === 'run' ? (
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
                <Label htmlFor="distance">Planned Distance (miles)</Label>
                <Input
                  id="distance"
                  name="distance"
                  type="number"
                  step="0.01"
                  value={formData.distance}
                  onChange={handleChange}
                  placeholder="e.g., 5.2"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="pace">Planned Pace</Label>
                <Input
                  id="pace"
                  name="pace"
                  value={formData.pace}
                  onChange={handleChange}
                  placeholder="e.g., 8:30/mile"
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="duration">Planned Duration</Label>
                <Input
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="e.g., 45min, 1hr 30min"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="focusArea">Focus Area</Label>
                <Input
                  id="focusArea"
                  name="focusArea"
                  value={formData.focusArea}
                  onChange={handleChange}
                  placeholder="e.g., Upper Body, Lower Body, Core"
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
              placeholder="Add any additional notes here"
              className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Workout</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}