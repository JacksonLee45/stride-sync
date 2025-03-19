// components/performance/MileageAreaChart.tsx
import React from 'react';
import {
  AreaChart, Area,
  XAxis, YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Button } from "@/components/ui/button";
import CustomTooltip from './CustomToolTip';

interface ChartData {
  date: string;
  weekStart: string;
  actualMileage: number;
  plannedMileage: number;
  type: 'past' | 'future';
}

interface MileageAreaChartProps {
  data: ChartData[];
  isLoading: boolean;
  xAxisKey: string;
}

const MileageAreaChart: React.FC<MileageAreaChartProps> = ({ data, isLoading, xAxisKey }) => {
  // Format date as "Mon DD"
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {isLoading ? (
        <div className="w-full h-full bg-muted/30 rounded-md flex items-center justify-center">
          <div className="text-muted-foreground">Loading chart data...</div>
        </div>
      ) : data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis
              dataKey={xAxisKey}
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
            <Area
              name="Completed Mileage"
              dataKey="actualMileage"
              fill="hsl(var(--primary))"
              stroke="hsl(var(--primary))"
              fillOpacity={0.6}
              stackId="1"
            />
            <Area
              name="Planned Mileage"
              dataKey={(dataPoint) => {
                // Only display planned mileage for future dates
                return dataPoint.type === 'future' ? dataPoint.plannedMileage : 0;
              }}
              fill="hsl(var(--muted-foreground)/0.5)"
              stroke="hsl(var(--muted-foreground))"
              fillOpacity={0.4}
              stackId="2"
            />
          </AreaChart>
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
    </>
  );
};

export default MileageAreaChart;