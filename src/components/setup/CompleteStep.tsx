
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface CompleteStepProps {
  onComplete: () => void;
}

const CompleteStep: React.FC<CompleteStepProps> = ({ onComplete }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
          Setup Complete
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-6">
          Your team planning app is now configured and ready to use. You can start by:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-gray-600 mb-6">
          <li>Adding team members and projects</li>
          <li>Setting up quarterly planning cycles</li>
          <li>Creating team allocations</li>
          <li>Tracking milestones and progress</li>
        </ul>
        <Button onClick={onComplete} className="w-full">
          Complete Setup
        </Button>
      </CardContent>
    </Card>
  );
};

export default CompleteStep;
