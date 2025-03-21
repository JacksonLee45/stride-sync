"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trash2, Calendar, Clock, Badge, XCircle, AlertTriangle, Loader2
} from 'lucide-react';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle 
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";

// Define interfaces for type safety
interface PlanData {
  name: string;
  description: string;
  category: string;
  difficulty_level: string;
  duration_weeks: number;
  workouts_per_week: number;
}

interface EnrolledPlan {
  id: string;
  user_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  progress: number;
  stats: {
    totalWorkouts: number;
    completedWorkouts: number;
  };
  plan: PlanData;
}

export default function MyPlansPage() {
  const [enrolledPlans, setEnrolledPlans] = useState<EnrolledPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<EnrolledPlan | null>(null);
  const [deleteWorkouts, setDeleteWorkouts] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Fetch enrolled plans
  useEffect(() => {
    async function fetchMyPlans() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/my-plans');
        
        if (!response.ok) {
          throw new Error('Failed to fetch your plans');
        }
        
        const data = await response.json();
        setEnrolledPlans(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching plans:', err);
        setError('Failed to load your training plans. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchMyPlans();
  }, []);
  
  const openDeleteDialog = (plan: EnrolledPlan) => {
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
  };
  
  const handleUnenroll = async () => {
    if (!planToDelete) return;
    
    setIsDeleting(true);
    try {
      // Call API to unenroll from the plan
      const response = await fetch(`/api/my-plans/${planToDelete.id}?deleteWorkouts=${deleteWorkouts}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unenroll from plan');
      }
      
      // Update local state
      setEnrolledPlans(prev => prev.filter(p => p.id !== planToDelete.id));
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
      
      toast({
        title: "Successfully unenrolled",
        description: deleteWorkouts 
          ? "Future workouts from this plan have been removed from your calendar." 
          : "You have been unenrolled from the plan. Existing workouts remain on your calendar.",
        variant: "default",
      });
    } catch (err: any) {
      console.error('Error unenrolling from plan:', err);
      toast({
        title: "Unenroll failed",
        description: err.message || "There was a problem unenrolling from this plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  const getProgressColor = (progress: number) => {
    if (progress < 30) return '';
    if (progress < 70) return '';
    return '';
  };
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'intermediate':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'advanced':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case '5k': return '5K';
      case '10k': return '10K';
      case 'half-marathon': return 'Half Marathon';
      case 'marathon': return 'Marathon';
      case 'strength': return 'Strength Training';
      default: return category;
    }
  };
  
  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto p-4">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Training Plans</h1>
          <p className="text-muted-foreground">
            Track progress and manage your active training plans.
          </p>
        </div>
        <Button asChild>
          <Link href="/protected/plans">Browse Plans</Link>
        </Button>
      </header>
      
      {error && (
        <div className="p-4 mb-6 bg-destructive/10 border border-destructive text-destructive rounded-md">
          <p>{error}</p>
        </div>
      )}
      
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array(2).fill(null).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-5 w-1/3 bg-muted rounded-full"></div>
                <div className="h-6 w-3/4 bg-muted rounded-md mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full bg-muted rounded-full mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded-md"></div>
                  <div className="h-4 bg-muted rounded-md"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : enrolledPlans.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {enrolledPlans.map((enrollment) => (
            <Card key={enrollment.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(enrollment.plan.difficulty_level)}`}>
                      {enrollment.plan.difficulty_level.charAt(0).toUpperCase() + enrollment.plan.difficulty_level.slice(1)}
                    </div>
                    <div className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                      {getCategoryLabel(enrollment.plan.category)}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => openDeleteDialog(enrollment)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
                <CardTitle>{enrollment.plan.name}</CardTitle>
                <CardDescription>
                  {formatDate(enrollment.start_date)} - {formatDate(enrollment.end_date)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span>{enrollment.progress}%</span>
                  </div>
                  <Progress value={enrollment.progress} className={getProgressColor(enrollment.progress)} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <Badge className="h-5 w-5 mr-2 text-muted-foreground" />
                    <span>
                      {enrollment.stats.completedWorkouts} / {enrollment.stats.totalWorkouts} workouts completed
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                    <span>{enrollment.plan.duration_weeks} weeks total</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/protected/plans/${enrollment.plan_id}`}>
                    View Plan Details
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
            <Calendar className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No active training plans</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-4">
            You haven't enrolled in any training plans yet. Browse our collection of plans to find one that matches your goals.
          </p>
          <Button asChild>
            <Link href="/protected/plans">Browse Training Plans</Link>
          </Button>
        </div>
      )}
      
      {/* Unenroll Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unenroll from Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to unenroll from {planToDelete?.plan.name}?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-950 rounded-md border border-amber-200 dark:border-amber-800">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    This will stop tracking your progress for this plan
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    You can enroll again later, but your progress will be reset.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <div className="flex h-5 items-center">
                <input
                  id="delete-workouts"
                  type="checkbox"
                  checked={deleteWorkouts}
                  onChange={(e) => setDeleteWorkouts(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </div>
              <div className="ml-2 text-sm">
                <label htmlFor="delete-workouts" className="font-medium">
                  Also remove future workouts from my calendar
                </label>
                <p className="text-gray-500 dark:text-gray-400">
                  This will delete all remaining workouts from this plan from your calendar.
                  Completed workouts will remain in your history.
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleUnenroll} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Unenrolling...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Unenroll
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}