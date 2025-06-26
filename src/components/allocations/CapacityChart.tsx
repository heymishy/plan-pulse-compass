import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  TooltipProps,
} from 'recharts';
import { Team, Cycle, Allocation } from '@/types';
import { calculateTeamCapacity } from '@/utils/capacityUtils';

interface CapacityChartProps {
  teams: Team[];
  iterations: Cycle[];
  allocations: Allocation[];
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const CapacityChart: React.FC<CapacityChartProps> = ({
  teams,
  iterations,
  allocations,
}) => {
  const getChartData = () => {
    return iterations.map((iteration, index) => {
      const iterationNumber = index + 1;
      let totalCapacity = 0;
      let totalAllocated = 0;
      let overAllocated = 0;

      teams.forEach(team => {
        const capacity = calculateTeamCapacity(
          team,
          iterationNumber,
          allocations,
          iterations
        );
        totalCapacity += capacity.capacityHours;

        if (capacity.allocatedPercentage <= 100) {
          totalAllocated +=
            capacity.capacityHours * (capacity.allocatedPercentage / 100);
        } else {
          totalAllocated += capacity.capacityHours;
          overAllocated +=
            capacity.capacityHours *
            ((capacity.allocatedPercentage - 100) / 100);
        }
      });

      return {
        name: `Iteration ${iterationNumber}`,
        capacity: Math.round(totalCapacity),
        allocated: Math.round(totalAllocated),
        overAllocated: Math.round(overAllocated),
        available: Math.round(Math.max(0, totalCapacity - totalAllocated)),
      };
    });
  };

  const data = getChartData();

  const CustomTooltip: React.FC<CustomTooltipProps> = ({
    active,
    payload,
    label,
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}h
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Capacity Utilization Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: '400px' }}>
            <ResponsiveContainer>
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis
                  label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar
                  dataKey="available"
                  stackId="a"
                  fill="#e5e7eb"
                  name="Available"
                />
                <Bar
                  dataKey="allocated"
                  stackId="a"
                  fill="#10b981"
                  name="Allocated"
                />
                <Bar
                  dataKey="overAllocated"
                  stackId="a"
                  fill="#ef4444"
                  name="Over Allocated"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Team Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Team Capacity Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map(team => {
              const teamData = iterations.map((iteration, index) => {
                const capacity = calculateTeamCapacity(
                  team,
                  index + 1,
                  allocations,
                  iterations
                );
                return {
                  iteration: index + 1,
                  percentage: capacity.allocatedPercentage,
                  hours: Math.round(
                    capacity.capacityHours *
                      (capacity.allocatedPercentage / 100)
                  ),
                  capacity: Math.round(capacity.capacityHours),
                };
              });

              const avgUtilization =
                teamData.reduce((sum, d) => sum + d.percentage, 0) /
                teamData.length;

              return (
                <div key={team.id} className="p-4 border rounded-lg">
                  <div className="font-medium mb-2">{team.name}</div>
                  <div className="text-sm text-gray-600 mb-3">
                    Avg. Utilization: {Math.round(avgUtilization)}%
                  </div>

                  <div className="space-y-2">
                    {teamData.map(data => (
                      <div
                        key={data.iteration}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>Iter {data.iteration}:</span>
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              data.percentage === 100
                                ? 'bg-green-500'
                                : data.percentage > 100
                                  ? 'bg-red-500'
                                  : data.percentage > 0
                                    ? 'bg-yellow-500'
                                    : 'bg-gray-300'
                            }`}
                          ></div>
                          <span>{data.percentage}%</span>
                          <span className="text-gray-500">({data.hours}h)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CapacityChart;
