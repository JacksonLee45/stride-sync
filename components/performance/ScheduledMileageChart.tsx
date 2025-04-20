// components/performance/ScheduledMileageChart.tsx
import React from 'react';
import {
  AreaChart, Area,
  XAxis, YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

interface ChartData {
  date: string;
  weekStart: string;
  actualMileage: number;
  plannedMileage: number;
  type: 'past' | 'future';
}

interface ScheduledMileageChartProps {
  data: ChartData[];
  isLoading: boolean;
  showTooltip?: boolean;
  showAxis?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover p-3 border rounded-md shadow-md">
        <p className="font-medium">{label}</p>
        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          Planned: {payload[0].value.toFixed(2)} miles
        </p>
      </div>
    );
  }
  return null;
};

const ScheduledMileageChart: React.FC<ScheduledMileageChartProps> = ({ 
  data, 
  isLoading,
  showTooltip = false,
  showAxis = false 
}) => {
  // Format date as "MMM DD" (e.g., "Jan 01")
  const formatXAxis = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr; // Already formatted as "MMM d" in the parent component
  };
  
  return (
    <div className="w-full h-full">
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
        </div>
      ) : data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 20, left: showAxis ? 20 : 0, bottom: showAxis ? 20 : 0 }}
          >
            {showAxis && <CartesianGrid strokeDasharray="3 3" opacity={0.2} />}
            
            {showAxis && (
              <XAxis 
                dataKey="weekStart"
                tick={{ fontSize: 12 }}
                tickFormatter={formatXAxis}
              />
            )}
            
            {showAxis && (
              <YAxis 
                tickFormatter={(value) => `${value}`}
                tick={{ fontSize: 12 }}
                width={35}
              />
            )}
            
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            
            <defs>
              <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            
            <Area
              type="monotone"
              dataKey="plannedMileage"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              fill="url(#colorPlanned)"
              name="Planned Mileage"
            />
            
            {/* Display a reference line for today */}
            {showAxis && (
              <ReferenceLine
                x={format(new Date(), 'MMM d')}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="3 3"
                label={{
                  value: 'Today',
                  position: 'insideTopRight',
                  style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' }
                }}
              />
            )}
          </AreaChart>
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

export default ScheduledMileageChart;