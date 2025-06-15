
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Calendar, SkipForward, Play } from 'lucide-react';
import { Cycle } from '@/types';
import { format } from 'date-fns';

interface CurrentStatusCardProps {
  currentQuarter?: Cycle;
  currentIteration?: Cycle;
}

const CurrentStatusCard: React.FC<CurrentStatusCardProps> = ({ currentQuarter, currentIteration }) => {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Current Status</CardTitle>
        <CardDescription>What's happening right now.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="flex items-center gap-4">
          <Calendar className="h-6 w-6 text-gray-500" />
          <div>
            <p className="font-semibold">{currentQuarter?.name || 'No Active Quarter'}</p>
            <p className="text-sm text-gray-500">
              {currentQuarter ? `${format(new Date(currentQuarter.startDate), 'MMM d')} - ${format(new Date(currentQuarter.endDate), 'MMM d, yyyy')}` : 'Please set up a new quarter.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <SkipForward className="h-6 w-6 text-gray-500" />
          <div>
            <p className="font-semibold">{currentIteration?.name || 'No Active Iteration'}</p>
            <p className="text-sm text-gray-500">
                {currentIteration ? `${format(new Date(currentIteration.startDate), 'MMM d')} - ${format(new Date(currentIteration.endDate), 'MMM d, yyyy')}` : 'Outside of an iteration.'}
            </p>
          </div>
        </div>
      </CardContent>
      <div className="p-6 pt-0">
        <Button asChild className="w-full">
          <Link to="/tracking">
            <Play className="mr-2" />
            Go to Tracking
          </Link>
        </Button>
      </div>
    </Card>
  );
};

export default CurrentStatusCard;
