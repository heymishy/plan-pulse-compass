
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DashboardData } from '@/utils/dashboardUtils';

interface IterationMetricsCardProps {
  iterationMetrics: DashboardData['iterationMetrics'];
}

const IterationMetricsCard: React.FC<IterationMetricsCardProps> = ({ iterationMetrics }) => {
  const { planned, actual } = iterationMetrics;
  const variance = actual - planned;
  const varianceColor = variance > 0 ? 'text-red-600' : 'text-green-600';
  const varianceSign = variance > 0 ? '+' : '';
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Iteration Load</CardTitle>
        <CardDescription>Planned vs. Actual team capacity for current iteration.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-around text-center">
            <div>
                <p className="text-sm text-gray-500">Planned</p>
                <p className="text-2xl font-bold">{planned.toFixed(0)}%</p>
            </div>
            <div>
                <p className="text-sm text-gray-500">Actual</p>
                <p className="text-2xl font-bold">{actual.toFixed(0)}%</p>
            </div>
             <div>
                <p className="text-sm text-gray-500">Variance</p>
                <p className={`text-2xl font-bold ${varianceColor}`}>
                  {varianceSign}{variance.toFixed(0)}%
                </p>
            </div>
        </div>
         <div className="text-xs text-gray-500 text-center pt-2">
            A positive variance means the team was over-allocated compared to the plan.
        </div>
      </CardContent>
    </Card>
  );
};

export default IterationMetricsCard;
