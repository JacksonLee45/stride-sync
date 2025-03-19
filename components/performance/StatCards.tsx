// components/performance/StatCards.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, BarChart2Icon, TrendingUpIcon } from 'lucide-react';

interface StatsData {
  totalPlannedMiles: number;
  totalCompletedMiles: number;
  totalWorkouts: number;
  completedWorkouts: number;
  averageMilesPerRun: number;
}

interface StatCardsProps {
  isLoading: boolean;
  stats: StatsData;
}

const StatCards: React.FC<StatCardsProps> = ({ isLoading, stats }) => {
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-6">
      {/* Total Mileage Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Total Mileage
          </CardTitle>
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <>
              <div className="h-6 w-16 bg-muted rounded animate-pulse" />
              <div className="h-3 w-24 bg-muted rounded animate-pulse mt-1" />
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">
                {stats.totalCompletedMiles} miles
              </div>
              <span className="text-xs text-muted-foreground">
                of {stats.totalPlannedMiles} miles planned
              </span>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Completion Rate Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Completion Rate
          </CardTitle>
          <BarChart2Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <>
              <div className="h-6 w-12 bg-muted rounded animate-pulse" />
              <div className="h-3 w-28 bg-muted rounded animate-pulse mt-1" />
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">
                {Math.round((stats.completedWorkouts / (stats.totalWorkouts || 1)) * 100)}%
              </div>
              <span className="text-xs text-muted-foreground">
                {stats.completedWorkouts} of {stats.totalWorkouts} workouts
              </span>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Average Per Run Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Average Per Run
          </CardTitle>
          <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <>
              <div className="h-6 w-14 bg-muted rounded animate-pulse" />
              <div className="h-3 w-20 bg-muted rounded animate-pulse mt-1" />
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">
                {stats.averageMilesPerRun} miles
              </div>
              <span className="text-xs text-muted-foreground">
                Last 3 months
              </span>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StatCards;