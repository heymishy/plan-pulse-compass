/**
 * ScenarioFinancialTest - Demo component to test the new financial scenario features
 * This component demonstrates the key financial capabilities requested by the user
 */

import React, { useState, useEffect } from 'react';
import { useScenarios } from '@/context/ScenarioContext';
import {
  useScenarioAwareTeams,
  useScenarioAwarePlanning,
  useScenarioAwareProjects,
} from '@/hooks/useScenarioAwareContext';
import { useScenarioAwareOperations } from '@/hooks/useScenarioAwareOperations';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  TrendingUp,
  Users,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Calculator,
  Target,
} from 'lucide-react';
import type { ScenarioFinancialComparison } from '@/types/scenarioFinancialTypes';

const ScenarioFinancialTest: React.FC = () => {
  const {
    scenarios,
    isInScenarioMode,
    activeScenarioId,
    createScenario,
    createScenarioFromTemplate,
    switchToScenario,
    switchToLive,
    getScenarioFinancialComparison,
    refreshScenarioFinancialAnalysis,
  } = useScenarios();

  const { teams, people } = useScenarioAwareTeams();
  const planningContext = useScenarioAwarePlanning();
  const projectContext = useScenarioAwareProjects();
  const scenarioOps = useScenarioAwareOperations();
  const { toast } = useToast();
  const [financialComparison, setFinancialComparison] =
    useState<ScenarioFinancialComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Test data status
  const hasTestData = teams && people && teams.length > 0 && people.length > 0;

  // Sample test scenarios
  const testScenarios = [
    {
      name: 'Budget Cut 10%',
      description: 'Reduce all project budgets by 10% to see financial impact',
      templateId: 'budget-cut-10',
      parameters: { budgetReduction: 10 },
    },
    {
      name: 'Project Timeline Delay',
      description: 'Delay project timelines and analyze resource impact',
      templateId: 'project-delay',
      parameters: { delayWeeks: 4 },
    },
    {
      name: 'Team Expansion Test',
      description: 'Add a new team member to test team expansion scenario',
      templateId: 'team-expansion',
      parameters: {
        newPersonName: 'Sarah Johnson',
        targetTeamId: teams && teams.length > 0 ? teams[0].id : 'default-team',
        roleId: 'developer-role',
      },
    },
    {
      name: 'Custom Financial Analysis',
      description:
        'Create a custom scenario to analyze team costs vs project budgets',
      templateId: undefined,
      parameters: {},
    },
  ];

  // Create test scenario
  const handleCreateTestScenario = async (
    scenario: (typeof testScenarios)[0]
  ) => {
    try {
      setLoading(true);
      setError(null);

      let scenarioId: string;

      if (scenario.templateId) {
        scenarioId = await createScenarioFromTemplate(
          scenario.templateId,
          scenario.parameters
        );
      } else {
        scenarioId = await createScenario({
          name: scenario.name,
          description: scenario.description,
        });
      }

      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));

      // Switch to the new scenario
      try {
        await switchToScenario(scenarioId);

        // Get financial comparison if possible
        if (getScenarioFinancialComparison) {
          try {
            const comparison = await getScenarioFinancialComparison(scenarioId);
            setFinancialComparison(comparison);
          } catch (comparisonError) {
            console.warn(
              'Financial comparison not available:',
              comparisonError
            );
          }
        }
      } catch (switchError) {
        console.warn(
          'Could not switch to scenario immediately, but scenario was created:',
          switchError
        );
        // The scenario was created successfully, just couldn't switch to it immediately
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create scenario'
      );
    } finally {
      setLoading(false);
    }
  };

  // Load financial comparison for active scenario
  useEffect(() => {
    const loadFinancialComparison = async () => {
      if (
        isInScenarioMode &&
        activeScenarioId &&
        getScenarioFinancialComparison
      ) {
        try {
          setLoading(true);
          const comparison =
            await getScenarioFinancialComparison(activeScenarioId);
          setFinancialComparison(comparison);
        } catch (err) {
          console.warn('Could not load financial comparison:', err);
          setFinancialComparison(null);
        } finally {
          setLoading(false);
        }
      } else {
        setFinancialComparison(null);
      }
    };

    loadFinancialComparison();
  }, [isInScenarioMode, activeScenarioId, getScenarioFinancialComparison]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (!hasTestData) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Test Data Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              To test the scenario financial features, you need some teams and
              people data first. Please add teams and team members through the
              Teams page, then return here to test scenarios.
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => (window.location.href = '/teams')}
            className="mt-4"
          >
            Go to Teams Page
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Create test allocations to demonstrate project burn rate changes
  const createTestAllocations = async () => {
    const { projects } = projectContext;

    // Find Team 1 and D365 project
    const team1 = teams.find(t => t.name?.toLowerCase().includes('team 1'));
    const d365Project = projects.find(p =>
      p.name?.toLowerCase().includes('d365')
    );
    const team1People = people.filter(p => p.teamId === team1?.id);

    if (team1 && d365Project && team1People.length > 0) {
      try {
        // Create allocations for first 2 Team 1 members to D365 project
        const allocationsToCreate = team1People.slice(0, 2).map(person => ({
          personId: person.id,
          teamId: team1.id,
          projectId: d365Project.id,
          epicId: '',
          cycleId: 'test-cycle',
          percentage: 80,
          type: 'project' as const,
          startDate: '2024-01-01',
          endDate: '2024-03-31',
          notes: 'Test allocation for project burn rate demonstration',
        }));

        // Use scenario-aware operations to add allocations
        for (const allocation of allocationsToCreate) {
          await scenarioOps.allocation.add(allocation);
        }

        toast({
          title: 'Test Allocations Created',
          description: `Created ${allocationsToCreate.length} test allocations for Team 1 to ${d365Project.name}`,
        });

        // Refresh financial analysis if in scenario mode
        if (isInScenarioMode) {
          await refreshScenarioFinancialAnalysis();
        }
      } catch (error) {
        console.error('Error creating test allocations:', error);
        toast({
          title: 'Error Creating Allocations',
          description: 'Failed to create test allocations. Please try again.',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Cannot Create Test Allocations',
        description: 'Need Team 1 with members and D365 project',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Scenario Financial Testing Dashboard
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Test the new financial scenario planning features: team costs, burn
            rates, and budget analysis
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant={isInScenarioMode ? 'default' : 'secondary'}>
              {isInScenarioMode ? 'Scenario Mode' : 'Live Mode'}
            </Badge>
            {isInScenarioMode && (
              <Button variant="outline" size="sm" onClick={switchToLive}>
                Switch to Live
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={createTestAllocations}
              className="ml-auto"
            >
              Create Test Allocations
            </Button>
            <div className="text-sm text-muted-foreground">
              Teams: {teams?.length || 0} | People: {people?.length || 0} |
              Scenarios: {scenarios.length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="create" className="w-full">
        <TabsList>
          <TabsTrigger value="create">Create Test Scenarios</TabsTrigger>
          <TabsTrigger value="analysis">Financial Analysis</TabsTrigger>
          <TabsTrigger value="existing">Existing Scenarios</TabsTrigger>
        </TabsList>

        {/* Create Test Scenarios */}
        <TabsContent value="create" className="space-y-4">
          <div className="grid gap-4">
            {testScenarios.map((scenario, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{scenario.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {scenario.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleCreateTestScenario(scenario)}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? 'Creating...' : 'Create & Test This Scenario'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Financial Analysis */}
        <TabsContent value="analysis" className="space-y-4">
          {!isInScenarioMode ? (
            <Alert>
              <AlertDescription>
                Create or switch to a scenario to see financial analysis
                comparison.
              </AlertDescription>
            </Alert>
          ) : financialComparison ? (
            <div className="space-y-4">
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Financial Impact Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">
                        Total Cost Difference
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(
                          financialComparison.summary.totalCostDifference
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Budget Variance</div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(
                          financialComparison.summary.totalBudgetVariance
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Team Cost Changes */}
              {financialComparison.teamCostChanges.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Team Cost Changes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Team</TableHead>
                          <TableHead>Live Cost</TableHead>
                          <TableHead>Scenario Cost</TableHead>
                          <TableHead>Difference</TableHead>
                          <TableHead>% Change</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {financialComparison.teamCostChanges.map(change => (
                          <TableRow key={change.teamId}>
                            <TableCell className="font-medium">
                              {change.teamName}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(change.liveCost)}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(change.scenarioCost)}
                            </TableCell>
                            <TableCell
                              className={
                                change.difference >= 0
                                  ? 'text-red-600'
                                  : 'text-green-600'
                              }
                            >
                              {formatCurrency(change.difference)}
                            </TableCell>
                            <TableCell
                              className={
                                change.percentageChange >= 0
                                  ? 'text-red-600'
                                  : 'text-green-600'
                              }
                            >
                              {formatPercentage(change.percentageChange)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Project Burn Changes */}
              {financialComparison.projectBurnChanges.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Project Burn Rate Changes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Project</TableHead>
                          <TableHead>Live Burn Rate</TableHead>
                          <TableHead>Scenario Burn Rate</TableHead>
                          <TableHead>Budget Impact</TableHead>
                          <TableHead>Quarterly Variance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {financialComparison.projectBurnChanges.map(change => (
                          <TableRow key={change.projectId}>
                            <TableCell className="font-medium">
                              {change.projectName}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(change.liveBurnRate)}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(change.scenarioBurnRate)}
                            </TableCell>
                            <TableCell
                              className={
                                change.budgetImpact >= 0
                                  ? 'text-red-600'
                                  : 'text-green-600'
                              }
                            >
                              {formatCurrency(change.budgetImpact)}
                            </TableCell>
                            <TableCell
                              className={
                                change.quarterlyVariance >= 0
                                  ? 'text-red-600'
                                  : 'text-green-600'
                              }
                            >
                              {formatCurrency(change.quarterlyVariance)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Detailed Calculation Breakdown */}
              {financialComparison.detailedBreakdown &&
                financialComparison.detailedBreakdown.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Detailed Cost Calculation Breakdown
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        See exactly how team changes impact costs
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {financialComparison.detailedBreakdown.map(
                          breakdown => (
                            <div
                              key={breakdown.teamId}
                              className="border rounded-lg p-4"
                            >
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-semibold text-lg">
                                  {breakdown.teamName}
                                </h4>
                                <div className="text-right">
                                  <div className="text-sm text-muted-foreground">
                                    Annual Impact
                                  </div>
                                  <div
                                    className={`text-xl font-bold ${breakdown.annualImpact >= 0 ? 'text-red-600' : 'text-green-600'}`}
                                  >
                                    {formatCurrency(breakdown.annualImpact)}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                <div className="bg-blue-50 p-3 rounded">
                                  <div className="text-sm text-blue-700 font-medium">
                                    Team Size Change
                                  </div>
                                  <div className="text-lg font-bold text-blue-900">
                                    {breakdown.liveHeadcount} →{' '}
                                    {breakdown.scenarioHeadcount}
                                    <span
                                      className={`ml-2 text-sm ${breakdown.headcountChange >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                    >
                                      (
                                      {breakdown.headcountChange >= 0
                                        ? '+'
                                        : ''}
                                      {breakdown.headcountChange})
                                    </span>
                                  </div>
                                </div>

                                <div className="bg-green-50 p-3 rounded">
                                  <div className="text-sm text-green-700 font-medium">
                                    Cost Per Person
                                  </div>
                                  <div className="text-lg font-bold text-green-900">
                                    {formatCurrency(
                                      breakdown.liveCostPerPerson
                                    )}{' '}
                                    →{' '}
                                    {formatCurrency(
                                      breakdown.scenarioCostPerPerson
                                    )}
                                  </div>
                                </div>

                                <div className="bg-purple-50 p-3 rounded">
                                  <div className="text-sm text-purple-700 font-medium">
                                    Quarterly Impact
                                  </div>
                                  <div
                                    className={`text-lg font-bold ${breakdown.quarterlyImpact >= 0 ? 'text-red-600' : 'text-green-600'}`}
                                  >
                                    {formatCurrency(breakdown.quarterlyImpact)}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <h5 className="font-medium text-sm text-gray-700 mb-2">
                                  Cost Component Breakdown:
                                </h5>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                                  <div className="flex justify-between">
                                    <span>Base Salaries:</span>
                                    <span
                                      className={
                                        breakdown.costBreakdown
                                          .baseSalariesDiff >= 0
                                          ? 'text-red-600'
                                          : 'text-green-600'
                                      }
                                    >
                                      {formatCurrency(
                                        breakdown.costBreakdown.baseSalariesDiff
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Overhead:</span>
                                    <span
                                      className={
                                        breakdown.costBreakdown.overheadDiff >=
                                        0
                                          ? 'text-red-600'
                                          : 'text-green-600'
                                      }
                                    >
                                      {formatCurrency(
                                        breakdown.costBreakdown.overheadDiff
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>PM Costs:</span>
                                    <span
                                      className={
                                        breakdown.costBreakdown
                                          .projectManagementDiff >= 0
                                          ? 'text-red-600'
                                          : 'text-green-600'
                                      }
                                    >
                                      {formatCurrency(
                                        breakdown.costBreakdown
                                          .projectManagementDiff
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Licensing:</span>
                                    <span
                                      className={
                                        breakdown.costBreakdown.licensingDiff >=
                                        0
                                          ? 'text-red-600'
                                          : 'text-green-600'
                                      }
                                    >
                                      {formatCurrency(
                                        breakdown.costBreakdown.licensingDiff
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Other:</span>
                                    <span
                                      className={
                                        breakdown.costBreakdown.otherDiff >= 0
                                          ? 'text-red-600'
                                          : 'text-green-600'
                                      }
                                    >
                                      {formatCurrency(
                                        breakdown.costBreakdown.otherDiff
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {breakdown.headcountChange !== 0 && (
                                <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                                  <strong>Calculation:</strong>{' '}
                                  {Math.abs(breakdown.headcountChange)}{' '}
                                  {breakdown.headcountChange > 0
                                    ? 'additional'
                                    : 'fewer'}{' '}
                                  team member
                                  {Math.abs(breakdown.headcountChange) !== 1
                                    ? 's'
                                    : ''}
                                  ×{' '}
                                  {formatCurrency(
                                    Math.abs(
                                      breakdown.annualImpact /
                                        breakdown.headcountChange
                                    )
                                  )}{' '}
                                  average cost per person ={' '}
                                  {formatCurrency(breakdown.annualImpact)}{' '}
                                  annual impact
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                {loading
                  ? 'Loading financial analysis...'
                  : 'No financial analysis available for this scenario.'}
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Existing Scenarios */}
        <TabsContent value="existing" className="space-y-4">
          {scenarios.length === 0 ? (
            <Alert>
              <AlertDescription>
                No scenarios created yet. Use the "Create Test Scenarios" tab to
                get started.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-2">
              {scenarios.map(scenario => (
                <Card key={scenario.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{scenario.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {scenario.description || 'No description'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {activeScenarioId === scenario.id && (
                          <Badge variant="default">Active</Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              await switchToScenario(scenario.id);
                              // Try to load financial comparison
                              if (getScenarioFinancialComparison) {
                                try {
                                  const comparison =
                                    await getScenarioFinancialComparison(
                                      scenario.id
                                    );
                                  setFinancialComparison(comparison);
                                } catch (err) {
                                  console.warn(
                                    'Financial comparison not available:',
                                    err
                                  );
                                }
                              }
                            } catch (err) {
                              setError(
                                err instanceof Error
                                  ? err.message
                                  : 'Failed to switch scenario'
                              );
                            }
                          }}
                          disabled={activeScenarioId === scenario.id}
                        >
                          Switch to Scenario
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScenarioFinancialTest;
