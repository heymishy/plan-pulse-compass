
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const RecentActivityCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-500">
          No recent activity to display
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivityCard;
