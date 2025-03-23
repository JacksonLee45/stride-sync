// components/performance/TrainingConsistencyChart.tsx
import React from 'react';
import {
  PieChart, Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';
import { Loader2 } from 'lucide-react';

interface TrainingConsistencyChartProps {
  completionRate: number;
  isLoading: boolean;
}

const TrainingConsistencyChart: React.FC<TrainingConsistencyChartProps> = ({ 
  completionRate, 
  isLoading 
}) => {
  // Calculate the missed rate
  const missedRate = 100 - completionRate;
  
  // Prepare data for the pie chart
  const data = [
    { name: 'Completed', value: completionRate },
    { name: 'Missed', value: missedRate }
  ];
  
  // Colors for the chart
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))'];
  
  // Get the color based on completion rate
  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'text-green-500';
    if (rate >= 60) return 'text-amber-500';
    return 'text-red-500';
  };
  
  const completionColor = getCompletionColor(completionRate);
  
  return (
    <div className="w-full h-[180px] flex flex-col items-center justify-center">
      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      ) : (
        <div className="relative w-[160px] h-[160px]">
          {/* The PieChart */}
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={0}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    strokeWidth={0}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center Text - positioned absolutely */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${completionColor}`}>
              {completionRate}%
            </span>
            <span className="text-xs text-muted-foreground mt-2">
              completion
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingConsistencyChart;