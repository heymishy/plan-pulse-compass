import React, { useState, useMemo } from 'react';
import { useScenarios } from '@/context/ScenarioContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Copy,
  Eye,
  Calendar,
  GitBranch,
  BarChart3,
  Filter,
  SortAsc,
  SortDesc,
  Clock,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { CreateScenarioDialog } from './CreateScenarioDialog';
import { ScenarioComparison } from './ScenarioComparison';
import type { Scenario } from '@/types/scenarioTypes';

interface ScenarioManagementProps {
  className?: string;
}

type SortField = 'name' | 'createdDate' | 'lastModified' | 'templateName';
type SortDirection = 'asc' | 'desc';

export const ScenarioManagement: React.FC<ScenarioManagementProps> = ({
  className = '',
}) => {
  const {
    scenarios,
    activeScenarioId,
    templates,
    switchToScenario,
    switchToLive,
    deleteScenario,
    cleanupExpiredScenarios,
  } = useScenarios();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(
    null
  );
  const [showComparison, setShowComparison] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('lastModified');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterTemplate, setFilterTemplate] = useState<string>('all');

  // Filtered and sorted scenarios
  const filteredScenarios = useMemo(() => {
    const filtered = scenarios.filter(scenario => {
      const matchesSearch =
        scenario.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (scenario.description
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ??
          false);

      const matchesTemplate =
        filterTemplate === 'all' ||
        scenario.templateName === filterTemplate ||
        (filterTemplate === 'blank' && !scenario.templateName);

      return matchesSearch && matchesTemplate;
    });

    // Sort scenarios
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'createdDate':
          aValue = new Date(a.createdDate);
          bValue = new Date(b.createdDate);
          break;
        case 'lastModified':
          aValue = new Date(a.lastModified);
          bValue = new Date(b.lastModified);
          break;
        case 'templateName':
          aValue = a.templateName || '';
          bValue = b.templateName || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [scenarios, searchQuery, filterTemplate, sortField, sortDirection]);

  // Template options for filtering
  const templateOptions = useMemo(() => {
    const uniqueTemplates = new Set<string>();
    scenarios.forEach(scenario => {
      if (scenario.templateName) {
        uniqueTemplates.add(scenario.templateName);
      }
    });
    return Array.from(uniqueTemplates).sort();
  }, [scenarios]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleDeleteScenario = async (scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    if (
      confirm(
        `Are you sure you want to delete "${scenario.name}"? This action cannot be undone.`
      )
    ) {
      await deleteScenario(scenarioId);
    }
  };

  const handleDuplicateScenario = (scenario: Scenario) => {
    // TODO: Implement scenario duplication
    console.log('Duplicate scenario:', scenario.name);
  };

  const handleViewScenario = (scenario: Scenario) => {
    switchToScenario(scenario.id);
  };

  const handleCompareScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setShowComparison(true);
  };

  const handleCleanupExpired = async () => {
    if (confirm('This will remove all expired scenarios. Continue?')) {
      await cleanupExpiredScenarios();
    }
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

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <SortAsc className="h-4 w-4" />
    ) : (
      <SortDesc className="h-4 w-4" />
    );
  };

  if (showComparison && selectedScenario) {
    return (
      <ScenarioComparison
        scenario={selectedScenario}
        onBack={() => {
          setShowComparison(false);
          setSelectedScenario(null);
        }}
      />
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Scenario Management</h2>
          <p className="text-muted-foreground">
            Create, manage, and compare planning scenarios to analyze different
            strategic options.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleCleanupExpired}>
            <Trash2 className="h-4 w-4 mr-2" />
            Cleanup Expired
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Scenario
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Scenarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scenarios.length}</div>
            <div className="text-xs text-muted-foreground">
              {activeScenarioId ? '1 active' : 'In live mode'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Templates Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <div className="text-xs text-muted-foreground">
              Built-in templates
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                scenarios.filter(s => {
                  const daysSinceModified = Math.floor(
                    (new Date().getTime() -
                      new Date(s.lastModified).getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  return daysSinceModified <= 7;
                }).length
              }
            </div>
            <div className="text-xs text-muted-foreground">
              Modified this week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(JSON.stringify(scenarios).length / 1024)}KB
            </div>
            <div className="text-xs text-muted-foreground">Local storage</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search scenarios..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={filterTemplate}
                onChange={e => setFilterTemplate(e.target.value)}
                className="h-10 px-3 py-2 border border-input rounded-md text-sm"
              >
                <option value="all">All Templates</option>
                <option value="blank">Blank Scenarios</option>
                {templateOptions.map(template => (
                  <option key={template} value={template}>
                    {template}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scenarios Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <GitBranch className="h-5 w-5 mr-2" />
            Your Scenarios ({filteredScenarios.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredScenarios.length === 0 ? (
            <div className="text-center py-12">
              <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No scenarios found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterTemplate !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Create your first scenario to start analyzing different planning options.'}
              </p>
              {!searchQuery && filterTemplate === 'all' && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Scenario
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Name</span>
                      {getSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('createdDate')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Created</span>
                      {getSortIcon('createdDate')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('lastModified')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Last Modified</span>
                      {getSortIcon('lastModified')}
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredScenarios.map(scenario => (
                  <TableRow key={scenario.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{scenario.name}</div>
                        {scenario.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-64">
                            {scenario.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {scenario.templateName ? (
                        <Badge variant="secondary" className="text-xs">
                          {scenario.templateName}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Blank
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {scenario.id === activeScenarioId ? (
                          <Badge variant="default" className="text-xs">
                            <Activity className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatRelativeTime(scenario.createdDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatRelativeTime(scenario.lastModified)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewScenario(scenario)}
                          disabled={scenario.id === activeScenarioId}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          {scenario.id === activeScenarioId ? 'Active' : 'View'}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCompareScenario(scenario)}
                        >
                          <BarChart3 className="h-3 w-3 mr-1" />
                          Compare
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleDuplicateScenario(scenario)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteScenario(scenario.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Scenario Dialog */}
      <CreateScenarioDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
};
