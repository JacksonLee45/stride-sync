// components/performance-tracking-page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { getWorkoutsWithDetails } from '@/utils/supabase/api';
import { CalendarIcon, BarChart2Icon, TrendingUpIcon } from 'lucide-react';

interface ChartData {
  date: string;
  weekStart: string;
  actualMileage: number;
  plannedMileage: number;
  type: 'past' | 'future';
}

export default function PerformanceTrackingPage() {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalPlannedMiles: 0,
    totalCompletedMiles: 0,
    totalWorkouts: 0,
    completedWorkouts: 0,
    averageMilesPerRun: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("weekly");

  // Fetch workouts from the API
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const data = await getWorkoutsWithDetails();
        setWorkouts(data);
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

  // Process workout data for the chart
  const processData = (workouts: any[]) => {
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
      
      // Add planned mileage (if available)
      if (workout.planned_distance) {
        weekData.plannedMileage += workout.planned_distance;
        totalPlannedMiles += workout.planned_distance;
      }
      
      // Add completed mileage for past workouts with completed data
      if (workoutDate <= today && workout.status === 'completed' && workout.completed_distance) {
        weekData.actualMileage += workout.completed_distance;
        totalCompletedMiles += workout.completed_distance;
        completedWorkouts++;
      }
    });
    
    // Convert map to array and sort by date
    const processedData = Array.from(weeklyData.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculate statistics
    const averageMilesPerRun = completedWorkouts > 0 
      ? +(totalCompletedMiles / completedWorkouts).toFixed(2)
      : 0;
    
    // Update state
    setChartData(processedData);
    setTotalStats({
      totalPlannedMiles: +totalPlannedMiles.toFixed(2),
      totalCompletedMiles: +totalCompletedMiles.toFixed(2),
      totalWorkouts,
      completedWorkouts,
      averageMilesPerRun
    });
  };

  // Helper function to format date as "Mon DD"
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover p-3 border rounded-md shadow-md">
          <p className="font-medium">{data.weekStart}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm">
              {entry.name === 'actualMileage' ? 'Completed: ' : 'Planned: '}
              {entry.value.toFixed(2)} miles
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Chart configurations based on the active tab
  const getChartConfig = () => {
    // Today's date for reference line
    const today = new Date().toISOString().split('T')[0];
    
    return {
      weekly: {
        data: chartData,
        xAxisKey: 'weekStart',
        referenceLine: today
      }
    };
  };

  const config = getChartConfig();

  return (
    <div className="flex-1 w-full p-4 max-w-6xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Performance Tracking</h1>
        <p className="text-muted-foreground">Track your running mileage and performance over time</p>
      </header>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Mileage
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-6 w-16 bg-muted rounded animate-pulse" />
              ) : (
                `${totalStats.totalCompletedMiles} miles`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? (
                <div className="h-3 w-24 bg-muted rounded animate-pulse mt-1" />
              ) : (
                `of ${totalStats.totalPlannedMiles} miles planned`
              )}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Completion Rate
            </CardTitle>
            <BarChart2Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-6 w-12 bg-muted rounded animate-pulse" />
              ) : (
                `${Math.round((totalStats.completedWorkouts / (totalStats.totalWorkouts || 1)) * 100)}%`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? (
                <div className="h-3 w-28 bg-muted rounded animate-pulse mt-1" />
              ) : (
                `${totalStats.completedWorkouts} of ${totalStats.totalWorkouts} workouts`
              )}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Average Per Run
            </CardTitle>
            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <div className="h-6 w-14 bg-muted rounded animate-pulse" />
              ) : (
                `${totalStats.averageMilesPerRun} miles`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoading ? (
                <div className="h-3 w-20 bg-muted rounded animate-pulse mt-1" />
              ) : (
                `Last 3 months`
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Chart */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="weekly">Weekly Mileage</TabsTrigger>
        </TabsList>
        
        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Running Mileage</CardTitle>
              <CardDescription>
                The past 3 months and planned mileage for the next month
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {isLoading ? (
                <div className="w-full h-full bg-muted/30 rounded-md flex items-center justify-center">
                  <div className="text-muted-foreground">Loading chart data...</div>
                </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={config.weekly.data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      dataKey={config.weekly.xAxisKey} 
                      angle={-45}
                      textAnchor="end"
                      tick={{ fontSize: 12 }}
                      height={60}
                    />
                    <YAxis 
                      label={{ 
                        value: 'Miles', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { textAnchor: 'middle' }
                      }} 
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={36} />
                    <ReferenceLine 
                      x={formatDate(new Date())} 
                      stroke="#888" 
                      strokeDasharray="3 3"
                      label={{ 
                        value: 'Today', 
                        position: 'insideTopRight',
                        style: { fontSize: 11 }
                      }}
                    />
                    <Bar 
                      name="Completed Mileage" 
                      dataKey="actualMileage" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      name="Planned Mileage" 
                      dataKey="plannedMileage" 
                      fill="hsl(var(--muted-foreground)/0.5)" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">No run data available for the selected period</p>
                    <Button asChild>
                      <a href="/protected">Add a Workout</a>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}