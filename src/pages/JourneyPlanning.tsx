
import React from 'react';
import { useApp } from '@/context/AppContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map, Target, Users, Star } from 'lucide-react';
import GoalsTable from '@/components/goals/GoalsTable';
import NorthStarDialog from '@/components/goals/NorthStarDialog';
import JourneyCanvasView from '@/components/goals/JourneyCanvasView';

const JourneyPlanning = () => {
  const { isSetupComplete, goals, northStar } = useApp();

  if (!isSetupComplete) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Required</h2>
          <p className="text-gray-600 mb-6">
            Please complete the initial setup to access journey planning features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Goal-Centric Journey Planning</h1>
        <p className="text-gray-600">
          Visual strategic planning through iterative goal progression.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Star className="h-4 w-4 mr-2 text-yellow-500" />
              North Star Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {northStar ? (
              <div>
                <div className="text-lg font-semibold">{northStar.title}</div>
                <div className="text-sm text-gray-500">{northStar.timeHorizon}</div>
                <div className="mt-2">
                  <NorthStarDialog trigger={
                    <button className="text-sm text-blue-600 hover:text-blue-800">
                      Edit North Star
                    </button>
                  } />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-gray-500">No North Star defined</div>
                <NorthStarDialog />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Map className="h-4 w-4 mr-2" />
              Active Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goals.filter(g => g.status === 'in-progress').length}</div>
            <p className="text-xs text-gray-500">of {goals.length} total goals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {goals.length > 0 ? Math.round((goals.filter(g => g.status === 'completed').length / goals.length) * 100) : 0}%
            </div>
            <p className="text-xs text-gray-500">Goals completed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="canvas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="canvas">Journey Canvas</TabsTrigger>
          <TabsTrigger value="manage">Manage Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="canvas">
          <JourneyCanvasView />
        </TabsContent>

        <TabsContent value="manage">
          <GoalsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JourneyPlanning;
