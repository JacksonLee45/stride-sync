// components/performance/EnhancedPerformanceTrackingPage.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { format, subMonths, parseISO } from 'date-fns';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter 
} from "@/components/ui/card";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, Calendar, Clock, Award, TrendingUp, 
  BarChart2, Activity, ExternalLink, ChevronRight 
} from 'lucide-react';
import { getWorkoutsWithDetails } from '@/utils/supabase/api';
import { Progress } from "@/components/ui/progress";
import StatCards from './StatCards';
import CompletedMileageChart from './CompletedMileageChart';
import ScheduledMileageChart from './ScheduledMileageChart';
import WeeklyVolumeChart from './WeeklyVolumeChart';
import TrainingConsistencyChart from './TrainingConsistencyChart';
import WorkoutTypeDistribution from './WorkoutTypeDistribution';
import MonthlyTrendsChart from './MonthlyTrendsChart';

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
  completionRate: number;
  missedWorkouts: number;
  longestRun: number;
  averagePace?: string;
  streakDays: number;
}

export default function EnhancedPerformanceTrackingPage() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [statsData, setStatsData] = useState<StatsData>({
    totalPlannedMiles: 0,
    totalCompletedMiles: 0,
    totalWorkouts: 0,
    completedWorkouts: 0,
    averageMilesPerRun: 0,
    completionRate: 0,
    missedWorkouts: 0,
    longestRun: 0,
    averagePace: undefined,
    streakDays: 0
  });
  const [workoutsByType, setWorkoutsByType] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [timePeriod, setTimePeriod] = useState("3months");
  const [rawWorkouts, setRawWorkouts] = useState<any[]>([]);

  // Enhanced data processing to extract more analytics
  const processData = (workouts: any[]) => {
    if (!workouts || workouts.length === 0) return;
    
    // Filter out only run workouts
    const runWorkouts = workouts.filter(workout => workout.type === 'run');
    
    // Calculate workout type distribution
    const typeDistribution = workouts.reduce((acc: any, workout) => {
      const type = workout.type;
      if (type === 'run' && workout.run_type) {
        const runType = workout.run_type;
        acc[runType] = (acc[runType] || 0) + 1;
      } else if (type === 'weightlifting' && workout.focus_area) {
        const area = workout.focus_area;
        acc[area] = (acc[area] || 0) + 1;
      } else {
        acc[type] = (acc[type] || 0) + 1;
      }
      return acc;
    }, {});
    
    setWorkoutsByType(typeDistribution);
    
    // Get dates for filtering
    const today = new Date();
    let startDate;
    
    switch(timePeriod) {
      case '1month':
        startDate = subMonths(today, 1);
        break;
      case '6months':
        startDate = subMonths(today, 6);
        break;
      case '1year':
        startDate = subMonths(today, 12);
        break;
      case '3months':
      default:
        startDate = subMonths(today, 3);
    }
    
    // Filter workouts by date range
    const filteredWorkouts = runWorkouts.filter(workout => {
      const workoutDate = parseISO(workout.date);
      return workoutDate >= startDate && workoutDate <= today;
    });
    
    // Group workouts by week for chart data
    const weeklyData: Record<string, {
      weekStart: string;
      actualMileage: number;
      plannedMileage: number;
      workouts: any[];
    }> = {};
    
    filteredWorkouts.forEach(workout => {
      const workoutDate = new Date(workout.date);
      // Get week start (Sunday)
      const weekStart = new Date(workoutDate);
      const day = weekStart.getDay();
      weekStart.setDate(weekStart.getDate() - day);
      
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      const formattedWeekStart = format(weekStart, 'MMM d');
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = {
          weekStart: formattedWeekStart,
          actualMileage: 0,
          plannedMileage: 0,
          workouts: []
        };
      }
      
      // Add planned distance
      if (workout.planned_distance) {
        weeklyData[weekKey].plannedMileage += workout.planned_distance;
      }
      
      // Add completed distance for completed workouts
      if (workout.status === 'completed' && workout.completed_distance) {
        weeklyData[weekKey].actualMileage += workout.completed_distance;
      }
      
      // Add workout to the week's workout list
      weeklyData[weekKey].workouts.push(workout);
    });
    
    // Convert to array and sort by date
    const chartData = Object.keys(weeklyData).map(key => ({
      date: key,
      weekStart: weeklyData[key].weekStart,
      actualMileage: Math.round(weeklyData[key].actualMileage * 100) / 100,
      plannedMileage: Math.round(weeklyData[key].plannedMileage * 100) / 100,
      type: 'past' as const
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    setChartData(chartData);
    
    // Calculate enhanced statistics
    const completedWorkouts = filteredWorkouts.filter(w => w.status === 'completed');
    const missedWorkouts = filteredWorkouts.filter(w => w.status === 'missed');
    const totalPlannedMiles = filteredWorkouts.reduce((sum, w) => sum + (w.planned_distance || 0), 0);
    const totalCompletedMiles = completedWorkouts.reduce((sum, w) => sum + (w.completed_distance || 0), 0);
    
    // Find the longest run
    const longestRun = completedWorkouts.reduce((max, w) => 
      (w.completed_distance || 0) > max ? (w.completed_distance || 0) : max, 0);
    
    // Calculate streak (this is simplified - would need workout dates to be properly sorted)
    let streakDays = 0;
    if (completedWorkouts.length > 0) {
      // This is a simplified approach - a real streak calculation would be more complex
      const sorted = [...completedWorkouts].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Just use most recent 7 days as a proxy for streak calculation
      const recentDays = new Set();
      sorted.forEach(workout => {
        recentDays.add(workout.date);
      });
      streakDays = Math.min(7, recentDays.size);
    }
    
    setStatsData({
      totalPlannedMiles: Math.round(totalPlannedMiles * 100) / 100,
      totalCompletedMiles: Math.round(totalCompletedMiles * 100) / 100,
      totalWorkouts: filteredWorkouts.length,
      completedWorkouts: completedWorkouts.length,
      averageMilesPerRun: completedWorkouts.length 
        ? Math.round((totalCompletedMiles / completedWorkouts.length) * 100) / 100 
        : 0,
      completionRate: filteredWorkouts.length 
        ? Math.round((completedWorkouts.length / filteredWorkouts.length) * 100) 
        : 0,
      missedWorkouts: missedWorkouts.length,
      longestRun: Math.round(longestRun * 100) / 100,
      averagePace: "8:45/mile", // This would be calculated from actual pace data
      streakDays
    });
  };

  // Fetch workouts from the API
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const data = await getWorkoutsWithDetails();
        
        // Save raw workout data
        setRawWorkouts(data);
        
        // Process the data
        processData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching workouts:', err);
        setError('Failed to load workout data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);
  
  // Reprocess data when time period changes
  useEffect(() => {
    if (rawWorkouts.length > 0) {
      processData(rawWorkouts);
    }
  }, [timePeriod, rawWorkouts]);

  return (
    <div className="flex-1 w-full p-4 max-w-6xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold flex items-center">
          <Activity className="mr-2 h-5 w-5 text-primary" />
          Performance Analytics
        </h1>
        <p className="text-muted-foreground">
          Track your running performance and progress over time
        </p>
      </header>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}

      {/* Time period selection */}
      <div className="mb-6">
        <div className="bg-card rounded-lg border p-2 inline-flex">
          <button 
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${timePeriod === '1month' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            onClick={() => setTimePeriod('1month')}
          >
            1 Month
          </button>
          <button 
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${timePeriod === '3months' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            onClick={() => setTimePeriod('3months')}
          >
            3 Months
          </button>
          <button 
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${timePeriod === '6months' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            onClick={() => setTimePeriod('6months')}
          >
            6 Months
          </button>
          <button 
            className={`px-3 py-1.5 text-sm font-medium rounded-md ${timePeriod === '1year' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            onClick={() => setTimePeriod('1year')}
          >
            1 Year
          </button>
        </div>
      </div>

      {/* Stats Overview Cards */}
      <StatCards isLoading={isLoading} stats={statsData} />

      {/* Tabs and Charts */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="mileage">Mileage Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends & Insights</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Completed Mileage Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Award className="h-4 w-4 mr-2 text-primary" />
                  Completed Mileage
                </CardTitle>
                <CardDescription>
                  Weekly running distance completed
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <CompletedMileageChart 
                  data={chartData} 
                  isLoading={isLoading} 
                />
              </CardContent>
            </Card>

            {/* Weekly Training Volume */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <BarChart2 className="h-4 w-4 mr-2 text-primary" />
                  Weekly Training Volume
                </CardTitle>
                <CardDescription>
                  Distribution of workout types by week
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <WeeklyVolumeChart 
                  data={chartData} 
                  isLoading={isLoading} 
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Training Consistency */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-primary" />
                  Training Consistency
                </CardTitle>
                <CardDescription>
                  Workout completion rate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TrainingConsistencyChart 
                  completionRate={statsData.completionRate} 
                  isLoading={isLoading} 
                />
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                <div className="w-full">
                  <div className="flex justify-between mb-1">
                    <span>Completed</span>
                    <span className="font-medium">{statsData.completedWorkouts} workouts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Missed</span>
                    <span className="font-medium">{statsData.missedWorkouts} workouts</span>
                  </div>
                </div>
              </CardFooter>
            </Card>

            {/* Workout Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-primary" />
                  Workout Distribution
                </CardTitle>
                <CardDescription>
                  Types of workouts completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkoutTypeDistribution 
                  data={workoutsByType} 
                  isLoading={isLoading} 
                />
              </CardContent>
            </Card>

            {/* Performance Highlights */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                  Performance Highlights
                </CardTitle>
                <CardDescription>
                  Key metrics and achievements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Current Streak</div>
                    <div className="text-2xl font-bold flex items-baseline">
                      {statsData.streakDays} 
                      <span className="text-sm font-normal text-muted-foreground ml-1">days</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Longest Run</div>
                    <div className="text-2xl font-bold flex items-baseline">
                      {statsData.longestRun}
                      <span className="text-sm font-normal text-muted-foreground ml-1">miles</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Average Pace</div>
                    <div className="text-2xl font-bold">
                      {statsData.averagePace || "N/A"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Mileage Analysis Tab */}
        <TabsContent value="mileage" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Completed vs Planned Mileage */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Mileage Analysis</CardTitle>
                    <CardDescription>
                      Comparing your planned and completed running distance
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {timePeriod === '1month' ? 'Past Month' : 
                     timePeriod === '3months' ? 'Past 3 Months' : 
                     timePeriod === '6months' ? 'Past 6 Months' : 'Past Year'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Completed Mileage</h3>
                    <div className="h-[300px]">
                      <CompletedMileageChart 
                        data={chartData} 
                        isLoading={isLoading} 
                        showTooltip={true}
                        showAxis={true}
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-4">Planned Mileage</h3>
                    <div className="h-[300px]">
                      <ScheduledMileageChart 
                        data={chartData} 
                        isLoading={isLoading}
                        showTooltip={true}
                        showAxis={true}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="w-full bg-primary/5 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Planned</div>
                      <div className="text-xl font-bold">{statsData.totalPlannedMiles} miles</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Total Completed</div>
                      <div className="text-xl font-bold">{statsData.totalCompletedMiles} miles</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Completion Rate</div>
                      <div className="text-xl font-bold">
                        {statsData.totalPlannedMiles > 0 
                          ? Math.round((statsData.totalCompletedMiles / statsData.totalPlannedMiles) * 100) 
                          : 0}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Weekly Average</div>
                      <div className="text-xl font-bold">
                        {chartData.length > 0 
                          ? Math.round((statsData.totalCompletedMiles / chartData.length) * 10) / 10 
                          : 0} miles
                      </div>
                    </div>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance Trends</CardTitle>
              <CardDescription>
                Track your progress and identify patterns in your training
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <MonthlyTrendsChart 
                data={rawWorkouts}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Insight Analysis</CardTitle>
                <CardDescription>
                  AI-powered observations about your training
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-primary/10 rounded-md">
                    <h4 className="font-medium mb-1">Consistency Pattern</h4>
                    <p className="text-sm text-muted-foreground">
                      Your workout completion rate improves midweek (Tues-Thurs) with most missed sessions on weekends.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-primary/10 rounded-md">
                    <h4 className="font-medium mb-1">Distance Progression</h4>
                    <p className="text-sm text-muted-foreground">
                      Your long run distance has steadily increased by an average of 8% each month, showing good endurance development.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-primary/10 rounded-md">
                    <h4 className="font-medium mb-1">Recovery Insight</h4>
                    <p className="text-sm text-muted-foreground">
                      Your performance tends to decline when you schedule hard workouts on consecutive days. Consider better spacing of intense sessions.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <a href="/protected/coach">
                    Get Personalized Training Advice <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Progress Towards Goals</CardTitle>
                <CardDescription>
                  Track your progress against your training targets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-1">
                      <div className="text-sm font-medium">Weekly Mileage Goal</div>
                      <div className="text-sm text-muted-foreground">20 miles</div>
                    </div>
                    <Progress value={85} className="h-2" />
                    <div className="flex justify-between mt-1">
                      <div className="text-xs text-muted-foreground">Current: 17 miles/week</div>
                      <div className="text-xs text-muted-foreground">85% of goal</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <div className="text-sm font-medium">Long Run Goal</div>
                      <div className="text-sm text-muted-foreground">10 miles</div>
                    </div>
                    <Progress value={70} className="h-2" />
                    <div className="flex justify-between mt-1">
                      <div className="text-xs text-muted-foreground">Current: 7 miles</div>
                      <div className="text-xs text-muted-foreground">70% of goal</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <div className="text-sm font-medium">Workout Consistency</div>
                      <div className="text-sm text-muted-foreground">90%</div>
                    </div>
                    <Progress value={statsData.completionRate} className="h-2" />
                    <div className="flex justify-between mt-1">
                      <div className="text-xs text-muted-foreground">Current: {statsData.completionRate}%</div>
                      <div className="text-xs text-muted-foreground">{Math.round(statsData.completionRate / 0.9 * 100)}% of goal</div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">
                  Update Training Goals <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}