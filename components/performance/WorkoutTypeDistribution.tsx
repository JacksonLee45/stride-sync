// components/performance/WorkoutTypeDistribution.tsx
import React from 'react';
import {
  PieChart, Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { Loader2 } from 'lucide-react';

interface WorkoutTypeDistributionProps {
  data: Record<string, number>;
  isLoading: boolean;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--cyan-500, 45 212 191))',
  'hsl(var(--amber-500, 245 158 11))',
  'hsl(var(--violet-500, 139 92 246))',
  'hsl(var(--rose-500, 244 63 94))',
  'hsl(var(--indigo-500, 99 102 241))',
  'hsl(var(--emerald-500, 16 185 129))'
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover p-3 border rounded-md shadow-md">
        <p className="font-medium">{payload[0].name}</p>
        <p className="text-sm">
          {payload[0].value} workouts ({payload[0].payload.percentage.toFixed(0)}%)
        </p>
      </div>
    );
  }
  return null;
};

const WorkoutTypeDistribution: React.FC<WorkoutTypeDistributionProps> = ({ 
  data, 
  isLoading 
}) => {
  // Transform the data into the format expected by the PieChart
  const transformData = (data: Record<string, number>) => {
    // Get the total count
    const total = Object.values(data).reduce((sum, count) => sum + count, 0);
    
    // Transform to array with percentages
    return Object.entries(data).map(([name, value]) => ({
      name: formatWorkoutType(name),
      value,
      percentage: (value / total) * 100
    })).sort((a, b) => b.value - a.value); // Sort by value descending
  };
  
  // Format workout type names for display
  const formatWorkoutType = (type: string) => {
    // Capitalize first letter of each word
    return type.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  const chartData = transformData(data);
  
  return (
    <div className="w-full h-[180px]">
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
        </div>
      ) : chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={60}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percentage }) => `${name} ${percentage.toFixed(0)}%`}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p>No data available</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutTypeDistribution;