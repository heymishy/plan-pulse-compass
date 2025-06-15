
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Calendar, Users, FolderOpen } from 'lucide-react';

const QuickActionsCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button asChild className="w-full justify-start">
          <Link to="/planning">
            <Calendar className="mr-2 h-4 w-4" />
            Plan Current Quarter
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full justify-start">
          <Link to="/allocations">
            <Users className="mr-2 h-4 w-4" />
            Manage Team Allocations
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full justify-start">
          <Link to="/reports">
            <FolderOpen className="mr-2 h-4 w-4" />
            View Reports
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuickActionsCard;
