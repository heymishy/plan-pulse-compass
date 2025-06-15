
import React from 'react';
import { Project, Epic, Allocation, Cycle, Person, Role, Team, AppConfig } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { calculateProjectCost } from '@/utils/financialCalculations';

interface ProjectFinancialsTableProps {
  projects: Project[];
  appData: {
    epics: Epic[];
    allocations: Allocation[];
    cycles: Cycle[];
    people: Person[];
    roles: Role[];
    teams: Team[];
    config: AppConfig;
  };
}

interface ProjectFinancialData {
  id: string;
  name: string;
  budget: number;
  totalCost: number;
  variance: number;
  monthlyBurnRate: number;
}

const ProjectFinancialsTable: React.FC<ProjectFinancialsTableProps> = ({ projects, appData }) => {
  const { epics, allocations, cycles, people, roles, teams } = appData;

  const financialData: ProjectFinancialData[] = projects.map(project => {
    const costData = calculateProjectCost(project, epics, allocations, cycles, people, roles, teams);
    return {
      id: project.id,
      name: project.name,
      budget: project.budget || 0,
      totalCost: costData.totalCost,
      variance: (project.budget || 0) - costData.totalCost,
      monthlyBurnRate: costData.monthlyBurnRate,
    };
  });
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Financials</CardTitle>
        <CardDescription>A summary of budget, forecast cost, and variance for all projects.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead className="text-right">Budget</TableHead>
              <TableHead className="text-right">Total Cost (Forecast)</TableHead>
              <TableHead className="text-right">Variance</TableHead>
              <TableHead className="text-right">Monthly Burn Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {financialData.length > 0 ? (
              financialData.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.budget)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.totalCost)}</TableCell>
                  <TableCell className={`text-right font-medium ${item.variance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(item.variance)}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(item.monthlyBurnRate)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No projects to display. Add projects to see financial data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ProjectFinancialsTable;
