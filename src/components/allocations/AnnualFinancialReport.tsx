
import React from 'react';
import { AppConfig, Allocation, Cycle, Team, Project, Epic, Person, Role } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Target, BarChartBig } from 'lucide-react';
import { calculateProjectCostForYear } from '@/utils/financialCalculations';
import { formatCurrency } from '@/utils/currency';

interface AnnualFinancialReportProps {
  allocations: Allocation[];
  cycles: Cycle[];
  teams: Team[];
  projects: Project[];
  epics: Epic[];
  people: Person[];
  roles: Role[];
  config: AppConfig | null;
}

const AnnualFinancialReport: React.FC<AnnualFinancialReportProps> = ({
  allocations,
  cycles,
  teams,
  projects,
  epics,
  people,
  roles,
  config,
}) => {
  if (!config) {
    return <div>Loading configuration...</div>;
  }

  const { quarters } = config;

  const reportData = React.useMemo(() => {
    if (!config) return [];
    return projects.map(project => {
      const { totalAnnualCost, quarterlyCosts } = calculateProjectCostForYear(
        project, epics, allocations, cycles, people, roles, teams, config
      );
      return {
        projectId: project.id,
        projectName: project.name,
        totalAnnualCost,
        quarterlyCosts,
      };
    });
  }, [projects, epics, allocations, cycles, people, roles, teams, config]);

  const totalAnnualCostForAllProjects = reportData.reduce((sum, data) => sum + data.totalAnnualCost, 0);
  const averageProjectCost = reportData.length > 0 ? totalAnnualCostForAllProjects / reportData.length : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">Projects in report</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Annual Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAnnualCostForAllProjects)}</div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Avg. Project Cost</CardTitle>
            <BarChartBig className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageProjectCost)}</div>
            <p className="text-xs text-muted-foreground">Average annual cost per project</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Annual Financial Report by Project</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                {quarters.map(q => <TableHead key={q.id} className="text-right">{q.name}</TableHead>)}
                <TableHead className="text-right font-bold">Annual Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map(data => (
                <TableRow key={data.projectId}>
                  <TableCell className="font-medium">{data.projectName}</TableCell>
                  {quarters.map(q => (
                    <TableCell key={q.id} className="text-right">
                      {formatCurrency(data.quarterlyCosts[q.name] ?? 0)}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold">
                    {formatCurrency(data.totalAnnualCost)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnnualFinancialReport;
