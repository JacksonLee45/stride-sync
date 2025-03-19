// components/performance/PerformanceTrackingPage.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getWorkoutsWithDetails } from '@/utils/supabase/api';
import { processWorkoutData, type ChartData, type StatsData } from './DataProcessing';
import StatCards from './StatCards';
import MileageAreaChart from './MileageAreaChart';

export default function PerformanceTrackingPage() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [totalStats, setTotalStats] = useState<StatsData>({
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
        
        // Process the data using our utility function
        const processedData = processWorkoutData(data);
        
        // Update state with processed data
        setChartData(processedData.chartData);
        setTotalStats(processedData.stats);
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

  // Chart configurations based on the active tab
  const getChartConfig = () => {
    return {
      weekly: {
        data: chartData,
        xAxisKey: 'weekStart'
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

      {/* Stats Cards Component */}
      <StatCards isLoading={isLoading} stats={totalStats} />

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
              <MileageAreaChart 
                data={config.weekly.data} 
                isLoading={isLoading} 
                xAxisKey={config.weekly.xAxisKey} 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}