
import React from 'react';
import { Team, Person, Role } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  calculateTeamWeeklyCost,
  calculateTeamMonthlyCost,
  calculateTeamQuarterlyCost,
  calculateTeamAnnualCost
} from '@/utils/financialCalculations';

interface TeamFinancialsTableProps {
  teams: Team[];
  people: Person[];
  roles: Role[];
}

interface TeamFinancialData {
  id: string;
  name: string;
  weeklyCost: number;
  monthlyCost: number;
  quarterlyCost: number;
  annualCost: number;
}

const TeamFinancialsTable: React.FC<TeamFinancialsTableProps> = ({ teams, people, roles }) => {
  
  const financialData: TeamFinancialData[] = teams.map(team => {
    const teamMembers = people.filter(p => p.teamId === team.id && p.isActive);
    return {
      id: team.id,
      name: team.name,
      weeklyCost: calculateTeamWeeklyCost(teamMembers, roles),
      monthlyCost: calculateTeamMonthlyCost(teamMembers, roles),
      quarterlyCost: calculateTeamQuarterlyCost(teamMembers, roles),
      annualCost: calculateTeamAnnualCost(teamMembers, roles),
    };
  });
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Cost Analysis</CardTitle>
        <CardDescription>A summary of forecasted costs for each team.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead className="text-right">Weekly Cost</TableHead>
              <TableHead className="text-right">Monthly Cost</TableHead>
              <TableHead className="text-right">Quarterly Cost</TableHead>
              <TableHead className="text-right">Annual Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {financialData.length > 0 ? (
              financialData.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.weeklyCost)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.monthlyCost)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.quarterlyCost)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.annualCost)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No teams to display.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default TeamFinancialsTable;
