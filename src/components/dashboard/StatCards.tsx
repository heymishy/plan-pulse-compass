
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FolderOpen, Calendar } from 'lucide-react';
import { Person, Team, Project, Allocation } from '@/types';

interface StatCardsProps {
  people: Person[];
  teams: Team[];
  projects: Project[];
  allocations: Allocation[];
}

const StatCards: React.FC<StatCardsProps> = ({ people, teams, projects, allocations }) => {
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
  );
};

export default StatCards;
