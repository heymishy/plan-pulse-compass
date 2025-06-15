
import React from 'react';
import { AppConfig, Allocation, Cycle, Team, Project, Epic, RunWorkCategory } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Target, BarChartBig } from 'lucide-react';

interface AnnualAllocationReportProps {
  allocations: Allocation[];
  cycles: Cycle[];
  teams: Team[];
  projects: Project[];
  epics: Epic[];
  runWorkCategories: RunWorkCategory[];
  config: AppConfig | null;
}

const AnnualAllocationReport: React.FC<AnnualAllocationReportProps> = ({
  allocations,
  cycles,
  teams,
  projects,
  config,
}) => {
  if (!config) {
    return <div>Loading configuration...</div>;
  }

  const { quarters } = config;

  const getIterationsForQuarter = (quarterId: string) => {
    return cycles.filter(c => c.type === 'iteration' && c.parentCycleId === quarterId);
  };

  const reportData = React.useMemo(() => {
    return teams.map(team => {
      const quarterlyAllocations: { [quarterName: string]: number } = {};
      let totalPercentageOverYear = 0;
      let totalIterationsInYear = 0;

      quarters.forEach(quarter => {
        const quarterIterations = cycles.filter(c => c.type === 'iteration' && c.parentCycleId === quarter.id);
        const numIterations = quarterIterations.length;

        if (numIterations === 0) {
          quarterlyAllocations[quarter.name] = 0;
          return;
        }

        const teamAllocationsForQuarter = allocations.filter(
          a => a.teamId === team.id && a.cycleId === quarter.id
        );

        const allocationByIteration: { [iterNum: number]: number } = {};
        teamAllocationsForQuarter.forEach(alloc => {
          allocationByIteration[alloc.iterationNumber] = (allocationByIteration[alloc.iterationNumber] || 0) + alloc.percentage;
        });
        
        const quarterTotalPercentage = Object.values(allocationByIteration).reduce((sum, p) => sum + p, 0);
        const avgAllocation = quarterTotalPercentage / numIterations;
        
        quarterlyAllocations[quarter.name] = isNaN(avgAllocation) ? 0 : avgAllocation;
        
        totalPercentageOverYear += quarterTotalPercentage;
        totalIterationsInYear += numIterations;
      });
      
      const annualAverage = totalIterationsInYear > 0 ? totalPercentageOverYear / totalIterationsInYear : 0;

      return {
        teamId: team.id,
        teamName: team.name,
        quarterlyAllocations,
        annualAverage,
      };
    });
  }, [teams, allocations, cycles, quarters]);

  const overallAnnualAverage = reportData.length > 0 ? reportData.reduce((sum, data) => sum + data.annualAverage, 0) / reportData.length : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams.length}</div>
            <p className="text-xs text-muted-foreground">Teams included in report</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">Across all allocations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Avg. Annual Allocation</CardTitle>
            <BarChartBig className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallAnnualAverage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Average allocation across all teams</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Annual Allocation by Team</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                {quarters.map(q => <TableHead key={q.id} className="text-right">{q.name}</TableHead>)}
                <TableHead className="text-right font-bold">Annual Avg.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map(data => (
                <TableRow key={data.teamId}>
                  <TableCell className="font-medium">{data.teamName}</TableCell>
                  {quarters.map(q => (
                    <TableCell key={q.id} className="text-right">
                      {data.quarterlyAllocations[q.name]?.toFixed(1) ?? '0.0'}%
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-bold">
                    {data.annualAverage.toFixed(1)}%
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

export default AnnualAllocationReport;
