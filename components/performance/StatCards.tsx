// components/performance/StatCards.tsx
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { 
  CalendarIcon, 
  BarChart2Icon, 
  TrendingUpIcon, 
  Award, 
  Calendar, 
  Clock, 
  Zap, 
  Target
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StatsData {
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

interface StatCardsProps {
  isLoading: boolean;
  stats: StatsData;
}

const StatCard = ({ 
  title, 
  value, 
  suffix = "", 
  icon: Icon, 
  loading, 
  trend = null,
  iconColor = "text-primary"
}: { 
  title: string; 
  value: string | number;
  suffix?: string;
  icon: React.ElementType;
  loading: boolean;
  trend?: { value: number; label: string } | null;
  iconColor?: string;
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className={`h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center ${iconColor}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {loading ? (
        <>
          <div className="h-8 w-24 bg-muted rounded animate-pulse" />
          <div className="h-4 w-16 bg-muted rounded animate-pulse mt-1" />
        </>
      ) : (
        <>
          <div className="text-2xl font-bold flex items-baseline">
            {value}
            {suffix && <span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span>}
          </div>
          {trend && (
            <div className={`flex items-center text-xs mt-2 ${trend.value > 0 ? 'text-green-500' : trend.value < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
              {trend.value > 0 ? (
                <TrendingUpIcon className="h-3 w-3 mr-1 rotate-0" />
              ) : trend.value < 0 ? (
                <TrendingUpIcon className="h-3 w-3 mr-1 rotate-180" />
              ) : (
                <TrendingUpIcon className="h-3 w-3 mr-1 rotate-90" />
              )}
              <span>{trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}</span>
            </div>
          )}
        </>
      )}
    </CardContent>
  </Card>
);

const StatCards: React.FC<StatCardsProps> = ({ isLoading, stats }) => {
  // Calculate trends (would be based on previous period data in a real app)
  // Here we're using dummy data for illustration
  const mileageTrend = { value: 12, label: 'vs prev. period' };
  const completionTrend = { value: 4, label: 'vs prev. period' };
  const workoutTrend = { value: -2, label: 'vs prev. period' };
  const paceTrend = { value: 3, label: 'improvement' };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {/* Total Mileage Card */}
      <StatCard
        title="Total Mileage"
        value={stats.totalCompletedMiles}
        suffix="miles"
        icon={BarChart2Icon}
        loading={isLoading}
        trend={mileageTrend}
      />
      
      {/* Workout Completion Rate */}
      <StatCard
        title="Completion Rate"
        value={stats.completionRate}
        suffix="%"
        icon={Target}
        loading={isLoading}
        trend={completionTrend}
        iconColor="text-cyan-500"
      />
      
      {/* Total Workouts */}
      <StatCard
        title="Total Workouts"
        value={stats.totalWorkouts}
        icon={Calendar}
        loading={isLoading}
        trend={workoutTrend}
        iconColor="text-amber-500"
      />
      
      {/* Average Pace or Current Streak */}
      <StatCard
        title={stats.averagePace ? "Average Pace" : "Current Streak"}
        value={stats.averagePace || stats.streakDays}
        suffix={stats.averagePace ? "" : "days"}
        icon={stats.averagePace ? Clock : Zap}
        loading={isLoading}
        trend={stats.averagePace ? paceTrend : null}
        iconColor="text-rose-500"
      />
    </div>
  );
};

export default StatCards;