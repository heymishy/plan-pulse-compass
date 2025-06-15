
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Target, Flag } from 'lucide-react';
import { DashboardData } from '@/utils/dashboardUtils';

interface QuarterlyProgressCardProps {
  quarterlyProgress: DashboardData['quarterlyProgress'];
}

const QuarterlyProgressCard: React.FC<QuarterlyProgressCardProps> = ({ quarterlyProgress }) => {
  const { epics, milestones } = quarterlyProgress;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quarterly Goal Progress</CardTitle>
        <CardDescription>How we are tracking against our quarterly goals.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-gray-500" />
                <p className="text-sm font-medium">Epics Completed</p>
            </div>
            <p className="text-sm text-gray-500">{epics.completed} of {epics.total}</p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Progress value={epics.percentage} />
              </TooltipTrigger>
              <TooltipContent>
                <p>{Math.round(epics.percentage)}% Complete</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div>
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-gray-500" />
                <p className="text-sm font-medium">Milestones Hit</p>
            </div>
            <p className="text-sm text-gray-500">{milestones.completed} of {milestones.total}</p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Progress value={milestones.percentage} />
              </TooltipTrigger>
              <TooltipContent>
                <p>{Math.round(milestones.percentage)}% Complete</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuarterlyProgressCard;
