"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  CalendarDays, Clock, Calendar, Award, 
  PlusCircle, ChevronLeft, Shield, Loader2, AlertTriangle
} from 'lucide-react';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";

// Helper function to format date as YYYY-MM-DD
const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Define interfaces for type safety
interface PlanData {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty_level: string;
  duration_weeks: number;
  workouts_per_week: number;
  highlights: string[];
  isEnrolled?: boolean;
  enrollment?: any;
}

interface PlanWorkout {
  id: string;
  plan_id: string;
  day_number: number;
  title: string;
  type: string;
  notes: string;
  run_details?: {
    run_type?: string;
    planned_distance?: number;
    planned_pace?: string;
  };
  weightlifting_details?: {
    focus_area?: string;
    planned_duration?: string;
  };
}

interface WeeklyWorkout {
  week: number;
  workouts: PlanWorkout[];
}

export default function PlanDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState<WeeklyWorkout[]>([]);
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch the plan details
  useEffect(() => {
    async function fetchPlanDetails() {
      if (!id) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/plans/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Plan not found');
          } else {
            throw new Error('Failed to fetch plan details');
          }
          return;
        }
        
        const data = await response.json();
        setPlan(data);
        
        // Organize workouts by week
        if (data.workouts && data.workouts.length > 0) {
          const workoutsByWeek: { [week: number]: PlanWorkout[] } = {};
          
          data.workouts.forEach((workout: PlanWorkout) => {
            // Calculate which week this workout belongs to (1-indexed)
            const week = Math.floor((workout.day_number - 1) / 7) + 1;
            
            if (!workoutsByWeek[week]) {
              workoutsByWeek[week] = [];
            }
            
            workoutsByWeek[week].push(workout);
          });
          
          // Convert to array format for easier rendering
          const weeklyWorkoutsArray: WeeklyWorkout[] = Object.keys(workoutsByWeek)
            .map(week => ({
              week: parseInt(week),
              workouts: workoutsByWeek[parseInt(week)].sort((a, b) => a.day_number - b.day_number)
            }))
            .sort((a, b) => a.week - b.week);
          
          setWeeklyWorkouts(weeklyWorkoutsArray);
        }
        
        setError(null);
      } catch (err: any) {
        console.error('Error fetching plan details:', err);
        setError('Failed to load plan details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPlanDetails();
  }, [id]);
  
  const handleEnroll = async () => {
    if (!plan) return;
    
    setIsEnrolling(true);
    
    try {
      const response = await fetch('/api/plans/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          startDate: formatDateToYYYYMMDD(startDate)
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to enroll in plan');
      }
      
      const data = await response.json();
      
      // Close dialog and show success message
      setIsEnrollDialogOpen(false);
      
      toast({
        title: "Successfully enrolled!",
        description: `${plan.name} has been added to your calendar. ${data.workoutsCreated} workouts have been scheduled.`,
        variant: "default",
      });
      
      // Redirect to calendar view
      router.push('/protected');
    } catch (err: any) {
      console.error('Error enrolling in plan:', err);
      toast({
        title: "Enrollment failed",
        description: err.message || "There was a problem enrolling in this plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEnrolling(false);
    }
  };
  
  const getDifficultyColor = (difficulty: string): string => {
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
  
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="max-w-6xl mx-auto p-4">
          <Button 
            variant="ghost" 
            className="mb-4 pl-0"
            onClick={() => router.back()}
          >
            <ChevronLeft size={16} className="mr-2" />
            Back to Plans
          </Button>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card className="animate-pulse">
                <CardHeader>
                  <div className="h-5 w-20 bg-muted rounded-full mb-2"></div>
                  <div className="h-6 w-3/4 bg-muted rounded-md mb-1"></div>
                  <div className="h-4 w-full bg-muted rounded-md"></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-4 bg-muted rounded-md"></div>
                  <div className="h-4 bg-muted rounded-md"></div>
                  <div className="h-4 bg-muted rounded-md"></div>
                  <div className="h-20 bg-muted rounded-md"></div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2">
              <div className="h-10 w-72 bg-muted rounded-md mb-4"></div>
              <Card className="animate-pulse">
                <CardHeader>
                  <div className="h-6 w-1/3 bg-muted rounded-md"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-4 bg-muted rounded-md"></div>
                    <div className="h-4 bg-muted rounded-md"></div>
                    <div className="h-4 bg-muted rounded-md"></div>
                    <div className="h-4 bg-muted rounded-md"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error || !plan) {
    return (
      <div className="w-full">
        <div className="max-w-6xl mx-auto p-4">
          <Button 
            variant="ghost" 
            className="mb-4 pl-0"
            onClick={() => router.back()}
          >
            <ChevronLeft size={16} className="mr-2" />
            Back to Plans
          </Button>
          
          <div className="p-6 rounded-lg border bg-destructive/10 text-destructive text-center">
            <AlertTriangle className="h-10 w-10 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{error || 'Plan not found'}</h3>
            <p className="mb-4">We couldn't load the training plan you requested.</p>
            <Button onClick={() => router.push('/protected/plans')}>
              Browse Available Plans
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto p-4">
      <Button 
        variant="ghost" 
        className="mb-4 pl-0"
        onClick={() => router.back()}
      >
        <ChevronLeft size={16} className="mr-2" />
        Back to Plans
      </Button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Plan info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge className={getDifficultyColor(plan.difficulty_level)}>
                  {plan.difficulty_level.charAt(0).toUpperCase() + plan.difficulty_level.slice(1)}
                </Badge>
                <Badge variant="outline">{plan.category.toUpperCase()}</Badge>
              </div>
              <CardTitle className="text-2xl mt-2">{plan.name}</CardTitle>
              <CardDescription className="text-md">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <CalendarDays className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>{plan.duration_weeks} weeks</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>{plan.workouts_per_week} workouts per week</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>{plan.duration_weeks * plan.workouts_per_week} total workouts</span>
                </div>
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium mb-2 flex items-center">
                    <Award className="h-5 w-5 mr-2 text-primary" />
                    Plan Highlights
                  </h4>
                  <ul className="space-y-2">
                    {plan.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-start">
                        <Shield className="h-4 w-4 mr-2 text-muted-foreground mt-0.5" />
                        <span className="text-sm">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              {plan.isEnrolled ? (
                <Button className="w-full" variant="secondary" disabled>
                  Already Enrolled
                </Button>
              ) : (
                <Button className="w-full" onClick={() => setIsEnrollDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Start This Plan
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
        
        {/* Right column - Plan details */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Plan Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    This {plan.difficulty_level} {plan.category} plan is designed to help you succeed with a structured 
                    approach to training. Over {plan.duration_weeks} weeks, you'll gradually build your fitness with 
                    {plan.workouts_per_week} weekly workouts.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">What to expect</h3>
                      <p className="text-muted-foreground">
                        {plan.category.includes('5k') && 'This 5K plan features a mix of easy runs, interval training, and long runs to build both endurance and speed.'}
                        {plan.category.includes('10k') && 'This 10K plan balances endurance-building long runs with speed work to prepare you for race day.'}
                        {plan.category.includes('half-marathon') && 'This half marathon plan gradually builds your mileage while incorporating recovery periods to prevent injury.'}
                        {plan.category.includes('marathon') && 'This marathon plan features progressive long runs and specific workouts to prepare you for the full 26.2 miles.'}
                        {plan.category.includes('strength') && 'This strength training plan complements your running with targeted exercises to build power and prevent injuries.'}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Who it's for</h3>
                      <p className="text-muted-foreground">
                        {plan.difficulty_level === 'beginner' && 'This plan is ideal for newcomers to the distance or those returning after a break.'}
                        {plan.difficulty_level === 'intermediate' && 'This plan is designed for those who have completed the distance before and are looking to improve their performance.'}
                        {plan.difficulty_level === 'advanced' && 'This plan is challenging and best suited for experienced runners looking to push their limits.'}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Recommended gear</h3>
                      <p className="text-muted-foreground">
                        A good pair of running shoes is essential. Consider visiting a specialty running store
                        for a proper fitting. Comfortable, moisture-wicking clothing and a watch or phone app
                        to track your time and distance are also helpful.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="schedule" className="space-y-6">
              {weeklyWorkouts.length > 0 ? (
                weeklyWorkouts.map((week) => (
                  <Card key={week.week}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Week {week.week}</CardTitle>
                      <CardDescription>
                        {week.week === plan.duration_weeks ? 'Final week!' : `Building ${week.week === 1 ? 'your foundation' : 'endurance and speed'}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {week.workouts.map((workout) => (
                          <div key={workout.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">{workout.title}</h4>
                              <Badge variant="outline">Day {workout.day_number % 7 || 7}</Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                              {workout.type === 'run' && workout.run_details && (
                                <>
                                  <div className="flex items-center">
                                    <span className="text-muted-foreground mr-2">Distance:</span>
                                    <span>{workout.run_details.planned_distance} miles</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-muted-foreground mr-2">Pace:</span>
                                    <span>{workout.run_details.planned_pace}</span>
                                  </div>
                                </>
                              )}
                              
                              {workout.type === 'weightlifting' && workout.weightlifting_details && (
                                <>
                                  <div className="flex items-center">
                                    <span className="text-muted-foreground mr-2">Focus:</span>
                                    <span>{workout.weightlifting_details.focus_area}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <span className="text-muted-foreground mr-2">Duration:</span>
                                    <span>{workout.weightlifting_details.planned_duration}</span>
                                  </div>
                                </>
                              )}
                            </div>
                            
                            <p className="text-muted-foreground text-sm">{workout.notes}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No workout schedule available for this plan.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Enrollment Dialog */}
      <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Training Plan</DialogTitle>
            <DialogDescription>
              You're about to begin the {plan.name}. Choose when you want to start.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formatDateToYYYYMMDD(startDate)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(new Date(e.target.value))}
                  min={formatDateToYYYYMMDD(new Date())}
                />
              </div>
              
              <div className="rounded-lg border p-4 bg-muted/50">
                <h4 className="font-medium mb-2 text-sm">What happens next?</h4>
                <p className="text-sm text-muted-foreground">
                  All {plan.duration_weeks * plan.workouts_per_week} workouts from this plan will be added to your calendar, starting on the date you selected.
                  You can modify or delete individual workouts at any time.
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEnrollDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEnroll} disabled={isEnrolling}>
              {isEnrolling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding to calendar...
                </>
              ) : (
                <>Add to Calendar</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}

// Helper component for enrollment dialog
interface LabelProps {
  children: React.ReactNode;
  htmlFor: string;
}

const Label = ({ children, htmlFor }: LabelProps) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium mb-1">
    {children}
  </label>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = (props: InputProps) => (
  <input
    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    {...props}
  />
);