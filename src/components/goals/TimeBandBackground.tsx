import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Cycle } from '@/types';

interface TimeBandBackgroundProps {
  data: {
    cycle: Cycle;
    width: number;
    height: number;
    isUnassigned?: boolean;
  };
}

const TimeBandBackground: React.FC<TimeBandBackgroundProps> = ({ data }) => {
  const { cycle, width, height, isUnassigned } = data;

  return (
    <div
      className={`border-2 border-dashed rounded-lg flex items-center justify-center text-lg font-semibold ${
        isUnassigned
          ? 'border-gray-300 bg-gray-50 text-gray-500'
          : 'border-blue-300 bg-blue-50 text-blue-700'
      }`}
      style={{ width, height }}
    >
      <div className="text-center">
        <div>{cycle.name}</div>
        {cycle.startDate && cycle.endDate && (
          <div className="text-sm opacity-70">
            {cycle.startDate} - {cycle.endDate}
          </div>
        )}
      </div>

      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
};

export default TimeBandBackground;
