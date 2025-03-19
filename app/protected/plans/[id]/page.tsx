"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CalendarDays, Clock, Calendar, Award, 
  PlusCircle, ChevronLeft, Shield, Loader2
} from 'lucide-react';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Helper function to format date (instead of using date-fns)
const formatDateToYYYYMMDD = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// This would come from your API
const mockPlan = {
  id: "plan-5k-beginner",
  name: "Beginner 5K Training Plan",
  description: "Perfect for first-time 5K runners or those looking to build consistent running habits. This 8-week plan gradually increases distance while including rest days to prevent injury.",
  category: "5k",
  difficulty: "beginner",
  durationWeeks: 8,
  workoutsPerWeek: 3,
  totalWorkouts: 24,
  estimatedCompletion: "2 months",
  highlights: [
    "3 runs per week",
    "Built-in rest days",
    "Gradual mileage increase",
    "Includes strength training recommendations"
  ]
};

// This would come from your API - these are the workouts in the plan
const mockWorkouts = Array(8).fill(null).map((_, weekIndex) => ({
  week: weekIndex + 1,
  workouts: [
    {
      id: `w${weekIndex + 1}-1`,
      dayNumber: weekIndex * 7 + 1,
      title: "Easy Run",
      type: "run",
      distance: 1 + Math.min(3, Math.floor(weekIndex / 2)),
      duration: "20-30 min",
      notes: "Focus on comfortable pace and form"
    },
    {
      id: `w${weekIndex + 1}-2`,
      dayNumber: weekIndex * 7 + 3,
      title: "Interval Training",
      type: "run",
      distance: 1.5 + Math.min(2, Math.floor(weekIndex / 3)),
      duration: "25-35 min",
      notes: "5 min warm up, 5x(3 min run, 2 min walk), 5 min cool down"
    },
    {
      id: `w${weekIndex + 1}-3`,
      dayNumber: weekIndex * 7 + 5,
      title: weekIndex === 7 ? "5K Race" : "Long Run",
      type: "run",
      distance: 2 + Math.min(3, Math.floor(weekIndex / 1.5)),
      duration: weekIndex === 7 ? "Race day!" : "30-45 min",
      notes: weekIndex === 7 ? "Good luck! Run your own race and enjoy the experience." : "Build endurance with a steady, comfortable pace"
    }
  ]
}));

export default function PlanDetailPage({ params }: { params: { id: string } }) {
  const [plan, setPlan] = useState(mockPlan);
  const [workouts, setWorkouts] = useState(mockWorkouts);
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  const router = useRouter();
  
  // In a real implementation, you would fetch the plan data from your API
  useEffect(() => {
    const id = params.id;
    if (id) {
      // fetchPlanDetails(id);
      console.log("Fetching plan details for ID:", id);
    }
  }, [params.id]);
  
  const handleEnroll = async () => {
    setIsLoading(true);
    try {
      // Call your API to enroll in the plan
      // await enrollInPlan({
      //   planId: plan.id,
      //   startDate: startDate
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsEnrollDialogOpen(false);
      // Show success message and redirect to calendar
      router.push('/protected');
    } catch (error) {
      console.error('Error enrolling in plan:', error);
      // Show error message
    } finally {
      setIsLoading(false);
    }
  };
  
  const getDifficultyColor = (difficulty) => {
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
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
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
                <Badge className={getDifficultyColor(plan.difficulty)}>
                  {plan.difficulty.charAt(0).toUpperCase() + plan.difficulty.slice(1)}
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
                  <span>{plan.durationWeeks} weeks</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>{plan.workoutsPerWeek} workouts per week</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span>{plan.totalWorkouts} total workouts</span>
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
              <Button className="w-full" onClick={() => setIsEnrollDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Start This Plan
              </Button>
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
                    This beginner-friendly 5K plan is designed to help you cross the finish line of your first 5K with confidence. 
                    The plan gradually builds your endurance while respecting your body's need for recovery.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">What to expect</h3>
                      <p className="text-muted-foreground">
                        Each week includes three workouts: an easy run for aerobic development, 
                        interval training to build speed, and a longer run to increase endurance. 
                        The plan culminates with a 5K race or time trial in the final week.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Who it's for</h3>
                      <p className="text-muted-foreground">
                        This plan is perfect for first-time runners who can walk for 30 minutes continuously
                        and want to build up to running a 5K. It's also suitable for returning runners looking to
                        rebuild their base after time off.
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
              {workouts.map((week) => (
                <Card key={week.week}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Week {week.week}</CardTitle>
                    <CardDescription>
                      {week.week === plan.durationWeeks ? 'Race week!' : `Building ${week.week === 1 ? 'your foundation' : 'endurance and speed'}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {week.workouts.map((workout) => (
                        <div key={workout.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{workout.title}</h4>
                            <Badge variant="outline">Day {workout.dayNumber % 7 || 7}</Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                            <div className="flex items-center">
                              <span className="text-muted-foreground mr-2">Distance:</span>
                              <span>{workout.distance} miles</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-muted-foreground mr-2">Duration:</span>
                              <span>{workout.duration}</span>
                            </div>
                          </div>
                          
                          <p className="text-muted-foreground text-sm">{workout.notes}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                  onChange={(e) => setStartDate(new Date(e.target.value))}
                  min={formatDateToYYYYMMDD(new Date())}
                />
              </div>
              
              <div className="rounded-lg border p-4 bg-muted/50">
                <h4 className="font-medium mb-2 text-sm">What happens next?</h4>
                <p className="text-sm text-muted-foreground">
                  All workouts from this plan will be added to your calendar, starting on the date you selected.
                  You can modify or delete individual workouts at any time.
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEnrollDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEnroll} disabled={isLoading}>
              {isLoading ? (
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
  );
}

// Helper component for enrollment dialog
const Label = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium mb-1">
    {children}
  </label>
);

const Input = ({ ...props }) => (
  <input
    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    {...props}
  />
);