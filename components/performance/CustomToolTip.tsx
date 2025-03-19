// components/performance/CustomTooltip.tsx
import React from 'react';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover p-3 border rounded-md shadow-md">
        <p className="font-medium">{data.weekStart}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm">
            {entry.name === 'Completed Mileage' ? 'Completed: ' : 'Planned: '}
            {entry.value > 0 ? entry.value.toFixed(2) : '0'} miles
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default CustomTooltip;