import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

export const CanvasLegend = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Legend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-200 border-2 border-blue-500 rounded"></div>
            <span>Divisions</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-200 border-2 border-green-500 rounded"></div>
            <span>Teams</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-200 border-2 border-yellow-500 rounded"></div>
            <span>Projects</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-pink-200 border-2 border-pink-500 rounded"></div>
            <span>Epics</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-sky-200 border-2 border-sky-500 rounded-full"></div>
            <span>People</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-200 border-2 border-gray-500 rounded"></div>
            <span>Run Work</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-200 border-2 border-gray-500 rounded"></div>
            <span>Milestones</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-indigo-200 border-2 border-indigo-500 rounded"></div>
            <span>Skills</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-0.5 bg-green-500"></div>
            <span>Assignment</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-0.5 border-t-2 border-dashed border-green-500"></div>
            <span>Epic/Project Link</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-0.5 bg-purple-500"></div>
            <span>Allocation</span>
          </div>
           <div className="flex items-center space-x-2 col-span-2 sm:col-span-1">
            <DollarSign className="w-4 h-4 text-gray-600" />
            <span className="text-gray-600">Financial Indicators</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
