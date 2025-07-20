import React, { useState, useEffect, useMemo } from 'react';
import { useScenarios } from '@/context/ScenarioContext';
import { useApp } from '@/context/AppContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Equal,
  DollarSign,
  Users,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Info,
  Minus,
  Plus,
} from 'lucide-react';
import type {
  Scenario,
  ScenarioComparison as ScenarioComparisonType,
} from '@/types/scenarioTypes';

interface ScenarioComparisonProps {
  scenario: Scenario;
  onBack: () => void;
}

interface ChangeItem {
  type: 'added' | 'removed' | 'modified';
  category: 'teams' | 'projects' | 'allocations' | 'goals' | 'financial';
  entity: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  details?: any;
}

export const ScenarioComparison: React.FC<ScenarioComparisonProps> = ({
  scenario,
  onBack,
}) => {
  const { getScenarioComparison } = useScenarios();
  const liveData = useApp();

  const [comparison, setComparison] = useState<ScenarioComparisonType | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['summary'])
  );

  // Calculate detailed comparison
  const detailedComparison = useMemo(() => {
    if (!scenario) return null;

    const changes: ChangeItem[] = [];

    // Compare teams
    const liveTeams = liveData.teams;
    const scenarioTeams = scenario.data.teams;

    // Find added teams
    scenarioTeams.forEach(scenarioTeam => {
      const liveTeam = liveTeams.find(t => t.id === scenarioTeam.id);
      if (!liveTeam) {
        changes.push({
          type: 'added',
          category: 'teams',
          entity: scenarioTeam.name,
          description: `New team "${scenarioTeam.name}" added`,
          impact: 'medium',
          details: scenarioTeam,
        });
      } else {
        // Check for modifications
        const modifications = [];
        if (liveTeam.name !== scenarioTeam.name) {
          modifications.push(
            `Name: "${liveTeam.name}" → "${scenarioTeam.name}"`
          );
        }
        if (liveTeam.capacity !== scenarioTeam.capacity) {
          modifications.push(
            `Capacity: ${liveTeam.capacity} → ${scenarioTeam.capacity}`
          );
        }
        if (liveTeam.status !== scenarioTeam.status) {
          modifications.push(
            `Status: ${liveTeam.status} → ${scenarioTeam.status}`
          );
        }

        if (modifications.length > 0) {
          changes.push({
            type: 'modified',
            category: 'teams',
            entity: scenarioTeam.name,
            description: `Team "${scenarioTeam.name}" modified: ${modifications.join(', ')}`,
            impact: modifications.length > 1 ? 'high' : 'medium',
            details: { live: liveTeam, scenario: scenarioTeam, modifications },
          });
        }
      }
    });

    // Find removed teams
    liveTeams.forEach(liveTeam => {
      const scenarioTeam = scenarioTeams.find(t => t.id === liveTeam.id);
      if (!scenarioTeam) {
        changes.push({
          type: 'removed',
          category: 'teams',
          entity: liveTeam.name,
          description: `Team "${liveTeam.name}" removed`,
          impact: 'high',
          details: liveTeam,
        });
      }
    });

    // Compare projects
    const liveProjects = liveData.projects;
    const scenarioProjects = scenario.data.projects;

    scenarioProjects.forEach(scenarioProject => {
      const liveProject = liveProjects.find(p => p.id === scenarioProject.id);
      if (!liveProject) {
        changes.push({
          type: 'added',
          category: 'projects',
          entity: scenarioProject.name,
          description: `New project "${scenarioProject.name}" added`,
          impact: 'high',
          details: scenarioProject,
        });
      } else {
        const modifications = [];
        if (liveProject.name !== scenarioProject.name) {
          modifications.push(
            `Name: "${liveProject.name}" → "${scenarioProject.name}"`
          );
        }
        if (liveProject.budget !== scenarioProject.budget) {
          const liveBudget = liveProject.budget || 0;
          const scenarioBudget = scenarioProject.budget || 0;
          const change = scenarioBudget - liveBudget;
          const changeText =
            change > 0
              ? `+$${change.toLocaleString()}`
              : `-$${Math.abs(change).toLocaleString()}`;
          modifications.push(
            `Budget: $${liveBudget.toLocaleString()} → $${scenarioBudget.toLocaleString()} (${changeText})`
          );
        }
        if (liveProject.status !== scenarioProject.status) {
          modifications.push(
            `Status: ${liveProject.status} → ${scenarioProject.status}`
          );
        }
        if (liveProject.startDate !== scenarioProject.startDate) {
          modifications.push(
            `Start Date: ${liveProject.startDate} → ${scenarioProject.startDate}`
          );
        }
        if (liveProject.endDate !== scenarioProject.endDate) {
          modifications.push(
            `End Date: ${liveProject.endDate || 'None'} → ${scenarioProject.endDate || 'None'}`
          );
        }

        if (modifications.length > 0) {
          changes.push({
            type: 'modified',
            category: 'projects',
            entity: scenarioProject.name,
            description: `Project "${scenarioProject.name}" modified: ${modifications.join(', ')}`,
            impact: modifications.some(
              m => m.includes('Budget') || m.includes('Date')
            )
              ? 'high'
              : 'medium',
            details: {
              live: liveProject,
              scenario: scenarioProject,
              modifications,
            },
          });
        }
      }
    });

    liveProjects.forEach(liveProject => {
      const scenarioProject = scenarioProjects.find(
        p => p.id === liveProject.id
      );
      if (!scenarioProject) {
        changes.push({
          type: 'removed',
          category: 'projects',
          entity: liveProject.name,
          description: `Project "${liveProject.name}" removed`,
          impact: 'high',
          details: liveProject,
        });
      }
    });

    // Compare allocations
    const liveAllocations = liveData.allocations;
    const scenarioAllocations = scenario.data.allocations;

    const allocationChanges = {
      added: scenarioAllocations.filter(
        sa => !liveAllocations.find(la => la.id === sa.id)
      ).length,
      removed: liveAllocations.filter(
        la => !scenarioAllocations.find(sa => sa.id === la.id)
      ).length,
      modified: 0,
    };

    scenarioAllocations.forEach(scenarioAllocation => {
      const liveAllocation = liveAllocations.find(
        la => la.id === scenarioAllocation.id
      );
      if (
        liveAllocation &&
        liveAllocation.percentage !== scenarioAllocation.percentage
      ) {
        allocationChanges.modified++;
      }
    });

    if (
      allocationChanges.added > 0 ||
      allocationChanges.removed > 0 ||
      allocationChanges.modified > 0
    ) {
      changes.push({
        type: 'modified',
        category: 'allocations',
        entity: 'Resource Allocations',
        description: `Allocation changes: ${allocationChanges.added} added, ${allocationChanges.removed} removed, ${allocationChanges.modified} modified`,
        impact:
          allocationChanges.added +
            allocationChanges.removed +
            allocationChanges.modified >
          10
            ? 'high'
            : 'medium',
        details: allocationChanges,
      });
    }

    return {
      changes,
      summary: {
        totalChanges: changes.length,
        byCategory: changes.reduce(
          (acc, change) => {
            acc[change.category] = (acc[change.category] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        byImpact: changes.reduce(
          (acc, change) => {
            acc[change.impact] = (acc[change.impact] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
      },
    };
  }, [scenario, liveData]);

  useEffect(() => {
    const loadComparison = async () => {
      setIsLoading(true);
      try {
        const comp = await getScenarioComparison(scenario.id);
        setComparison(comp);
      } catch (error) {
        console.error('Failed to load scenario comparison:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadComparison();
  }, [scenario.id, getScenarioComparison]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getChangeIcon = (type: 'added' | 'removed' | 'modified') => {
    switch (type) {
      case 'added':
        return <Plus className="h-4 w-4 text-green-500" />;
      case 'removed':
        return <Minus className="h-4 w-4 text-red-500" />;
      case 'modified':
        return <Equal className="h-4 w-4 text-blue-500" />;
    }
  };

  const getImpactBadge = (impact: 'low' | 'medium' | 'high') => {
    const variants = {
      low: 'secondary',
      medium: 'default',
      high: 'destructive',
    } as const;

    return <Badge variant={variants[impact]}>{impact}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Analyzing Scenario...</h2>
            <p className="text-muted-foreground">
              Comparing "{scenario.name}" with live data
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">
            Loading comparison...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Scenario Comparison</h2>
          <p className="text-muted-foreground">
            Comparing "{scenario.name}" with live planning data
          </p>
        </div>
      </div>

      {/* Scenario Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>{scenario.name}</span>
            {scenario.templateName && (
              <Badge variant="secondary">{scenario.templateName}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            <div className="flex items-center space-x-4 text-sm">
              <span>Created {formatDate(scenario.createdDate)}</span>
              <span>•</span>
              <span>Last modified {formatDate(scenario.lastModified)}</span>
              {scenario.description && (
                <>
                  <span>•</span>
                  <span>{scenario.description}</span>
                </>
              )}
            </div>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Summary Overview */}
      <Collapsible
        open={expandedSections.has('summary')}
        onOpenChange={() => toggleSection('summary')}
      >
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Summary Overview</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {detailedComparison?.changes.length || 0} changes
                  </Badge>
                  {expandedSections.has('summary') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Changes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {detailedComparison?.changes.length || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Differences from live data
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Impact Level
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      {detailedComparison?.summary.byImpact.high ? (
                        <>
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-red-500 font-medium">High</span>
                        </>
                      ) : detailedComparison?.summary.byImpact.medium ? (
                        <>
                          <Info className="h-4 w-4 text-yellow-500" />
                          <span className="text-yellow-500 font-medium">
                            Medium
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-green-500 font-medium">
                            Low
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {detailedComparison?.summary.byImpact.high || 0} high
                      impact changes
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Categories Affected
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {
                        Object.keys(
                          detailedComparison?.summary.byCategory || {}
                        ).length
                      }
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Planning categories
                    </div>
                  </CardContent>
                </Card>
              </div>

              {detailedComparison?.summary.byCategory && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Changes by Category</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(detailedComparison.summary.byCategory).map(
                      ([category, count]) => (
                        <Badge key={category} variant="outline">
                          {category}: {count}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Detailed Changes */}
      <Collapsible
        open={expandedSections.has('changes')}
        onOpenChange={() => toggleSection('changes')}
      >
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Detailed Changes</span>
                </CardTitle>
                {expandedSections.has('changes') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              {detailedComparison?.changes.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Change</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Impact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailedComparison.changes.map((change, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getChangeIcon(change.type)}
                            <span className="capitalize">{change.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {change.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {change.entity}
                        </TableCell>
                        <TableCell className="max-w-md">
                          <div className="text-sm">{change.description}</div>
                        </TableCell>
                        <TableCell>{getImpactBadge(change.impact)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    No Changes Detected
                  </h3>
                  <p className="text-muted-foreground">
                    This scenario is identical to your live planning data.
                  </p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Financial Impact */}
      <Collapsible
        open={expandedSections.has('financial')}
        onOpenChange={() => toggleSection('financial')}
      >
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Financial Impact</span>
                </CardTitle>
                {expandedSections.has('financial') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Financial Analysis</h3>
                <p className="text-muted-foreground">
                  Detailed financial impact analysis will be available in a
                  future update.
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};
