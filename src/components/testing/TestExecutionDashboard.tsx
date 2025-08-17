import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import {
  TestCase,
  TestSuite,
  TestConfiguration,
  CITier,
  TestExecution,
  FeatureArea,
  TestType,
  TestPriority,
  TestStatus,
} from '@/types/testTypes';
import TestPyramidVisualization from './TestPyramidVisualization';
import { testConfigManager } from '@/utils/testConfigManager';
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  Filter,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Activity,
  Target,
  FileText,
  Users,
  Zap,
  Eye,
  EyeOff,
} from 'lucide-react';

interface TestExecutionDashboardProps {
  testInventory?: {
    testCases: TestCase[];
    testSuites: TestSuite[];
    pyramidMetrics: any;
  };
}

const TestExecutionDashboard: React.FC<TestExecutionDashboardProps> = ({
  testInventory,
}) => {
  const [config, setConfig] = useState<TestConfiguration | null>(null);
  const [selectedTier, setSelectedTier] = useState<CITier>('lightning');
  const [filterFeature, setFilterFeature] = useState<FeatureArea | 'all'>(
    'all'
  );
  const [filterType, setFilterType] = useState<TestType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<TestStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyEnabled, setShowOnlyEnabled] = useState(false);
  const [executionHistory, setExecutionHistory] = useState<TestExecution[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    loadConfiguration();
    loadExecutionHistory();
  }, []);

  const loadConfiguration = async () => {
    try {
      const loadedConfig = await testConfigManager.loadConfig();
      setConfig(loadedConfig);
    } catch (error) {
      console.error('Failed to load test configuration:', error);
    }
  };

  const loadExecutionHistory = () => {
    // Mock execution history - in real implementation, this would come from test runner
    const mockHistory: TestExecution[] = Array.from({ length: 30 }, (_, i) => ({
      id: `exec-${i}`,
      timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      testId: `test-${i % 10}`,
      status:
        Math.random() > 0.15
          ? 'passed'
          : Math.random() > 0.5
            ? 'failed'
            : 'skipped',
      duration: Math.floor(Math.random() * 5000) + 100,
      ciTier: ['lightning', 'comprehensive', 'quality'][i % 3] as CITier,
      retries: Math.floor(Math.random() * 3),
      environment: {
        os: 'linux',
        browser: 'chromium',
        viewport: '1280x720',
        node: 'v18.17.0',
      },
    }));
    setExecutionHistory(mockHistory);
  };

  const filteredTestCases =
    testInventory?.testCases.filter(test => {
      if (filterFeature !== 'all' && test.featureArea !== filterFeature)
        return false;
      if (filterType !== 'all' && test.type !== filterType) return false;
      if (filterStatus !== 'all' && test.status !== filterStatus) return false;
      if (
        searchTerm &&
        !test.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;
      return true;
    }) || [];

  const filteredTestSuites =
    testInventory?.testSuites.filter(suite => {
      if (showOnlyEnabled && !suite.enabled) return false;
      if (filterFeature !== 'all' && suite.featureArea !== filterFeature)
        return false;
      if (filterType !== 'all' && suite.type !== filterType) return false;
      return true;
    }) || [];

  const handleToggleSuite = async (suiteId: string, enabled: boolean) => {
    try {
      await testConfigManager.updateTestSuite(suiteId, { enabled });
      loadConfiguration(); // Reload to reflect changes
    } catch (error) {
      console.error('Failed to toggle test suite:', error);
    }
  };

  const handleToggleSuiteTier = async (
    suiteId: string,
    tier: keyof TestSuite['ciConfig'],
    enabled: boolean
  ) => {
    try {
      await testConfigManager.toggleSuiteForTier(suiteId, tier, enabled);
      loadConfiguration();
    } catch (error) {
      console.error('Failed to toggle suite tier:', error);
    }
  };

  const runTests = async (tier: CITier) => {
    setIsRunning(true);
    try {
      // Mock test execution - in real implementation, this would trigger actual test runs
      console.log(`Running ${tier} tests...`);

      // Simulate test execution with delays
      setTimeout(() => {
        setIsRunning(false);
        loadExecutionHistory(); // Refresh history
      }, 3000);
    } catch (error) {
      console.error('Failed to run tests:', error);
      setIsRunning(false);
    }
  };

  const exportConfiguration = () => {
    if (!config) return;

    const ciConfig = testConfigManager.generateCIConfig(selectedTier);
    const blob = new Blob([JSON.stringify(ciConfig, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-config-${selectedTier}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getExecutionStats = () => {
    const recentExecutions = executionHistory.slice(0, 100);
    const passed = recentExecutions.filter(e => e.status === 'passed').length;
    const failed = recentExecutions.filter(e => e.status === 'failed').length;
    const avgDuration =
      recentExecutions.reduce((sum, e) => sum + e.duration, 0) /
      recentExecutions.length;

    return {
      total: recentExecutions.length,
      passed,
      failed,
      passRate: Math.round((passed / recentExecutions.length) * 100),
      avgDuration: Math.round(avgDuration),
    };
  };

  const getExecutionTrend = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayExecutions = executionHistory.filter(e =>
        e.timestamp.startsWith(date)
      );

      return {
        date: date.slice(-5), // MM-DD format
        passed: dayExecutions.filter(e => e.status === 'passed').length,
        failed: dayExecutions.filter(e => e.status === 'failed').length,
        total: dayExecutions.length,
      };
    });
  };

  const stats = getExecutionStats();
  const trendData = getExecutionTrend();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Test Execution Dashboard
          </h2>
          <p className="text-muted-foreground">
            Manage and monitor your comprehensive test suite across all layers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportConfiguration}>
            <Download className="h-4 w-4 mr-2" />
            Export Config
          </Button>
          <Button onClick={() => runTests(selectedTier)} disabled={isRunning}>
            {isRunning ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Tests
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Tests
                </p>
                <p className="text-3xl font-bold">
                  {testInventory?.testCases.length || 0}
                </p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pass Rate
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.passRate}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Avg Duration
                </p>
                <p className="text-3xl font-bold">{stats.avgDuration}ms</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Test Suites
                </p>
                <p className="text-3xl font-bold">
                  {testInventory?.testSuites.length || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Execution Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Execution Trend (Last 7 Days)</CardTitle>
          <CardDescription>Test execution results over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="passed"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="failed"
                stackId="1"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Tabs
        value={selectedTier}
        onValueChange={value => setSelectedTier(value as CITier)}
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="lightning">
            <Zap className="h-4 w-4 mr-2" />
            Lightning
          </TabsTrigger>
          <TabsTrigger value="comprehensive">
            <Activity className="h-4 w-4 mr-2" />
            Comprehensive
          </TabsTrigger>
          <TabsTrigger value="quality">
            <Target className="h-4 w-4 mr-2" />
            Quality
          </TabsTrigger>
          <TabsTrigger value="all">
            <Settings className="h-4 w-4 mr-2" />
            All Tests
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Feature Area</Label>
                <Select
                  value={filterFeature}
                  onValueChange={value =>
                    setFilterFeature(value as FeatureArea | 'all')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Features</SelectItem>
                    <SelectItem value="dashboard">Dashboard</SelectItem>
                    <SelectItem value="teams">Teams</SelectItem>
                    <SelectItem value="projects">Projects</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="core">Core</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Test Type</Label>
                <Select
                  value={filterType}
                  onValueChange={value =>
                    setFilterType(value as TestType | 'all')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="unit">Unit</SelectItem>
                    <SelectItem value="integration">Integration</SelectItem>
                    <SelectItem value="e2e">E2E</SelectItem>
                    <SelectItem value="accessibility">Accessibility</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filterStatus}
                  onValueChange={value =>
                    setFilterStatus(value as TestStatus | 'all')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                    <SelectItem value="flaky">Flaky</SelectItem>
                    <SelectItem value="deprecated">Deprecated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Search</Label>
                <Input
                  placeholder="Search tests..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Show Only Enabled</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={showOnlyEnabled}
                    onCheckedChange={setShowOnlyEnabled}
                  />
                  <Label className="text-sm">Enabled only</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="all">
          {testInventory?.pyramidMetrics && (
            <TestPyramidVisualization
              metrics={testInventory.pyramidMetrics}
              interactive={true}
              onLayerClick={layer => setFilterType(layer)}
            />
          )}
        </TabsContent>

        <TabsContent value={selectedTier}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Test Suites */}
            <Card>
              <CardHeader>
                <CardTitle>Test Suites Configuration</CardTitle>
                <CardDescription>
                  Enable/disable test suites for {selectedTier} tier
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {filteredTestSuites.map(suite => (
                      <div
                        key={suite.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{suite.type}</Badge>
                            <span className="font-medium">{suite.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {suite.tests.length} tests • {suite.featureArea}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={
                              suite.ciConfig[
                                selectedTier as keyof typeof suite.ciConfig
                              ]
                            }
                            onCheckedChange={checked =>
                              handleToggleSuiteTier(
                                suite.id,
                                selectedTier as keyof typeof suite.ciConfig,
                                checked
                              )
                            }
                          />
                          {suite.enabled ? (
                            <Eye className="h-4 w-4 text-green-600" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Test Cases */}
            <Card>
              <CardHeader>
                <CardTitle>Test Cases</CardTitle>
                <CardDescription>
                  Individual test cases ({filteredTestCases.length} shown)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {filteredTestCases.map(test => (
                      <div key={test.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  test.priority === 'critical'
                                    ? 'destructive'
                                    : 'outline'
                                }
                                className="text-xs"
                              >
                                {test.priority}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {test.type}
                              </Badge>
                              <Badge
                                variant={
                                  test.status === 'active'
                                    ? 'default'
                                    : 'secondary'
                                }
                                className="text-xs"
                              >
                                {test.status}
                              </Badge>
                            </div>
                            <p className="font-medium text-sm">{test.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {test.filePath} • {test.estimatedDuration}ms
                            </p>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            {Math.round(test.stability * 100)}% stable
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestExecutionDashboard;
