import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ArrowRight,
  Calculator,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { calculateAllocationCost } from '@/utils/financialCalculations';
import { getCurrentQuarterByDate } from '@/utils/dateUtils';

interface FinancialMetrics {
  currentQuarterBudget: number;
  currentQuarterSpend: number;
  variance: number;
  variancePercentage: number;
  burnRate: number;
  projectedSpend: number;
  atRiskProjects: number;
}

const FinancialOverviewCard = () => {
  const { allocations, projects, people, roles, cycles, config } = useApp();

  const financialMetrics = useMemo((): FinancialMetrics => {
    const currentQuarterCycle = getCurrentQuarterByDate(
      cycles.filter(c => c.type === 'quarterly')
    );
    const currentQuarterCycles = currentQuarterCycle
      ? cycles.filter(
          cycle =>
            cycle.quarter === currentQuarterCycle.quarter &&
            cycle.financialYear === currentQuarterCycle.financialYear
        )
      : [];

    // Calculate current quarter allocations cost
    const currentQuarterAllocations = allocations.filter(allocation =>
      currentQuarterCycles.some(cycle => cycle.id === allocation.cycleId)
    );

    let totalSpend = 0;
    let totalBudget = 0;

    // Calculate actual spend from allocations
    currentQuarterAllocations.forEach(allocation => {
      const cycle = currentQuarterCycles.find(c => c.id === allocation.cycleId);
      if (cycle) {
        const teamMembers = people.filter(
          p => p.teamId === allocation.teamId && p.isActive
        );
        const cost = calculateAllocationCost(
          allocation,
          cycle,
          teamMembers,
          roles,
          config
        );
        totalSpend += cost;
      }
    });

    // Calculate budget from active projects
    const activeProjects = projects.filter(p => p.status === 'active');
    activeProjects.forEach(project => {
      if (project.budgets) {
        const currentBudget = project.budgets.find(
          b => b.financialYear === currentQuarterCycle?.financialYear
        );
        if (currentBudget) {
          totalBudget += currentBudget.amount;
        }
      }
    });

    const variance = totalBudget - totalSpend;
    const variancePercentage =
      totalBudget > 0 ? (variance / totalBudget) * 100 : 0;

    // Calculate burn rate (spend per cycle)
    const burnRate =
      currentQuarterCycles.length > 0
        ? totalSpend / currentQuarterCycles.length
        : 0;

    // Project spend to end of quarter
    const remainingCycles = Math.max(0, 6 - currentQuarterCycles.length); // Assuming 6 cycles per quarter
    const projectedSpend = totalSpend + burnRate * remainingCycles;

    // Count at-risk projects (over budget or high variance)
    const atRiskProjects = activeProjects.filter(project => {
      if (!project.budgets) return false;
      const budget = project.budgets.find(
        b => b.financialYear === currentQuarterCycle?.financialYear
      );
      if (!budget) return false;

      const projectAllocations = currentQuarterAllocations.filter(
        a => a.projectId === project.id
      );
      const projectSpend = projectAllocations.reduce((sum, allocation) => {
        const cycle = currentQuarterCycles.find(
          c => c.id === allocation.cycleId
        );
        if (cycle) {
          const teamMembers = people.filter(
            p => p.teamId === allocation.teamId && p.isActive
          );
          return (
            sum +
            calculateAllocationCost(
              allocation,
              cycle,
              teamMembers,
              roles,
              config
            )
          );
        }
        return sum;
      }, 0);

      return projectSpend > budget.amount * 0.8; // 80% threshold
    }).length;

    return {
      currentQuarterBudget: totalBudget,
      currentQuarterSpend: totalSpend,
      variance,
      variancePercentage,
      burnRate,
      projectedSpend,
      atRiskProjects,
    };
  }, [allocations, projects, people, roles, cycles, config]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: config.currencySymbol || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getVarianceColor = (percentage: number) => {
    if (percentage > 10) return 'text-green-600';
    if (percentage > 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getVarianceIcon = (percentage: number) => {
    if (percentage > 0) return TrendingUp;
    return TrendingDown;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          Financial Overview
        </CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Budget vs Spend */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Budget</span>
              <span className="font-medium">
                {formatCurrency(financialMetrics.currentQuarterBudget)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Spend</span>
              <span className="font-medium">
                {formatCurrency(financialMetrics.currentQuarterSpend)}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{
                  width: `${Math.min(100, (financialMetrics.currentQuarterSpend / financialMetrics.currentQuarterBudget) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Variance */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Variance</span>
            <div className="flex items-center space-x-1">
              {React.createElement(
                getVarianceIcon(financialMetrics.variancePercentage),
                {
                  className: `h-4 w-4 ${getVarianceColor(financialMetrics.variancePercentage)}`,
                }
              )}
              <span
                className={`font-medium ${getVarianceColor(financialMetrics.variancePercentage)}`}
              >
                {formatCurrency(Math.abs(financialMetrics.variance))}
              </span>
              <Badge
                variant={
                  financialMetrics.variancePercentage > 0
                    ? 'default'
                    : 'destructive'
                }
                className="text-xs"
              >
                {financialMetrics.variancePercentage > 0 ? '+' : ''}
                {financialMetrics.variancePercentage.toFixed(1)}%
              </Badge>
            </div>
          </div>

          {/* Projected Spend */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Projected Q End
            </span>
            <span className="font-medium">
              {formatCurrency(financialMetrics.projectedSpend)}
            </span>
          </div>

          {/* At Risk Projects */}
          {financialMetrics.atRiskProjects > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center">
                <AlertCircle className="h-3 w-3 mr-1 text-red-500" />
                At Risk Projects
              </span>
              <Badge variant="destructive">
                {financialMetrics.atRiskProjects}
              </Badge>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-2 pt-2 border-t">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full justify-between"
            >
              <Link to="/financials">
                <span className="flex items-center">
                  <Calculator className="h-3 w-3 mr-1" />
                  Financial Details
                </span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialOverviewCard;
