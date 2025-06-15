
import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Users, FolderOpen, Calendar, AlertTriangle } from 'lucide-react';
import { getDashboardData } from '@/utils/dashboardUtils';

const Dashboard = () => {
  const { people, teams, projects, allocations, isSetupComplete, cycles, actualAllocations, iterationReviews, epics } = useApp();

  const dashboardData = useMemo(() => {
    if (!isSetupComplete) return null;
    return getDashboardData(cycles, allocations, actualAllocations, iterationReviews, projects, epics);
  }, [isSetupComplete, cycles, allocations, actualAllocations, iterationReviews, projects, epics]);

  // You can check the browser's console to see the calculated data.
  console.log('Dashboard Data:', dashboardData);

  if (!isSetupComplete) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Required</h2>
          <p className="text-gray-600 mb-6">
            Please complete the initial setup to start using the planning app.
          </p>
          <Button asChild>
            <Link to="/setup">Go to Setup</Link>
          </Button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Active People',
      value: people.filter(p => p.isActive).length,
      total: people.length,
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Teams',
      value: teams.length,
      icon: Users,
      color: 'text-green-600',
    },
    {
      title: 'Active Projects',
      value: projects.filter(p => p.status === 'active').length,
      total: projects.length,
      icon: FolderOpen,
      color: 'text-purple-600',
    },
    {
      title: 'Current Quarter Allocations',
      value: allocations.length,
      icon: Calendar,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Overview of your team planning and capacity management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stat.value}
                  {stat.total && (
                    <span className="text-sm text-gray-500 font-normal">
                      /{stat.total}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
      </div>
    </div>
  );
};

export default Dashboard;
