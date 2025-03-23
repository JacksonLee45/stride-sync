// components/performance/MonthlyTrendsChart.tsx
import React, { useMemo } from 'react';
import {
  ComposedChart, Line, Bar, 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Loader2 } from 'lucide-react';
import { format, parseISO, startOfMonth, isWithinInterval, subMonths } from 'date-fns';

interface MonthlyTrendsChartProps {
  data: any[];
  isLoading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover p-3 border rounded-md shadow-md">
        <p className="font-medium mb-1">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-sm flex items-center">
              <span 
                className="inline-block w-3 h-3 mr-2" 
                style={{ backgroundColor: entry.color }}
              />
              <span>
                {entry.name}: {entry.name.includes('Rate') 
                  ? `${entry.value}%` 
                  : entry.name.includes('Pace') 
                    ? entry.value 
                    : `${entry.value.toFixed(1)} miles`}
              </span>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const MonthlyTrendsChart: React.FC<MonthlyTrendsChartProps> = ({ data, isLoading }) => {
  // Process data to get monthly aggregates
  const monthlyData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Get the last 12 months
    const today = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = subMonths(today, 11 - i);
      return {
        month: format(d, 'yyyy-MM'),
        displayMonth: format(d, 'MMM yyyy')
      };
    });
    
    // Filter run workouts only
    const runWorkouts = data.filter(workout => workout.type === 'run');
    
    // Prepare the result with all months
    const result = months.map(({ month, displayMonth }) => {
      const monthStart = startOfMonth(parseISO(month + '-01'));
      const monthEnd = startOfMonth(new Date(monthStart));
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(monthEnd.getDate() - 1); // Last day of month
      
      // Filter workouts for this month
      const monthWorkouts = runWorkouts.filter(workout => {
        const workoutDate = parseISO(workout.date);
        return isWithinInterval(workoutDate, { start: monthStart, end: monthEnd });
      });
      
      // Calculate metrics
      const totalScheduled = monthWorkouts.reduce((sum, w) => sum + (w.planned_distance || 0), 0);
      const completedWorkouts = monthWorkouts.filter(w => w.status === 'completed');
      const totalCompleted = completedWorkouts.reduce((sum, w) => sum + (w.completed_distance || 0), 0);
      const completionRate = monthWorkouts.length 
        ? (completedWorkouts.length / monthWorkouts.length) * 100 
        : 0;
        
      // Calculate average pace (simplified without actual pace conversion)
      const avgPace = "8:45"; // This would require actual pace data
      
      // Find longest run distance
      const longestRun = completedWorkouts.reduce(
        (max, w) => Math.max(max, w.completed_distance || 0), 0
      );
      
      return {
        month: displayMonth,
        totalMiles: Math.round(totalCompleted * 10) / 10,
        scheduledMiles: Math.round(totalScheduled * 10) / 10,
        longestRun: Math.round(longestRun * 10) / 10,
        completionRate: Math.round(completionRate),
        avgPace: avgPace
      };
    });
    
    return result;
  }, [data]);
  
  return (
    <div className="w-full h-full">
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
        </div>
      ) : monthlyData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={monthlyData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              yAxisId="left"
              orientation="left"
              tickFormatter={(value) => `${value}mi`}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) => `${value}%`}
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} />
            
            <Bar 
              yAxisId="left"
              dataKey="totalMiles" 
              name="Total Mileage" 
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Bar 
              yAxisId="left"
              dataKey="longestRun" 
              name="Longest Run" 
              fill="hsl(var(--amber-500, 245 158 11))"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="completionRate" 
              name="Completion Rate" 
              stroke="hsl(var(--cyan-500, 45 212 191))"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p>No data available for trend analysis</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyTrendsChart;