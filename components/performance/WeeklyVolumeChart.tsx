// components/performance/WeeklyVolumeChart.tsx
import React from 'react';
import {
  BarChart, Bar,
  XAxis, YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Loader2 } from 'lucide-react';

interface ChartData {
  date: string;
  weekStart: string;
  actualMileage: number;
  plannedMileage: number;
  type: 'past' | 'future';
}

interface WeeklyVolumeChartProps {
  data: ChartData[];
  isLoading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover p-3 border rounded-md shadow-md">
        <p className="font-medium">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-sm flex items-center">
              <span 
                className="inline-block w-3 h-3 mr-2" 
                style={{ backgroundColor: entry.color }}
              />
              <span>{entry.name}: {entry.value} miles</span>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const WeeklyVolumeChart: React.FC<WeeklyVolumeChartProps> = ({ data, isLoading }) => {
  // Process data to show completed vs planned but not fulfilled
  const processedData = data.map(week => {
    // Calculate the miles that were planned but not completed
    const notCompletedMiles = Math.max(0, week.plannedMileage - week.actualMileage);
    
    return {
      weekStart: week.weekStart,
      completed: week.actualMileage,
      notCompleted: notCompletedMiles
    };
  });
  
  // Colors for the chart
  const colors = {
    completed: 'hsl(var(--primary))',
    notCompleted: 'hsl(var(--muted))'
  };
  
  return (
    <div className="w-full h-full">
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
        </div>
      ) : processedData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={processedData}
            margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
            <XAxis 
              dataKey="weekStart" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tickFormatter={(value) => `${value}`}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} />
            <Bar 
              dataKey="completed" 
              name="Completed" 
              stackId="a" 
              fill={colors.completed}
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="notCompleted" 
              name="Planned but not completed" 
              stackId="a" 
              fill={colors.notCompleted}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p>No data available for the selected period</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyVolumeChart;