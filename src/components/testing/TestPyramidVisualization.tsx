import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { TestPyramidMetrics } from '@/types/testTypes';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';

interface TestPyramidVisualizationProps {
  metrics: TestPyramidMetrics;
  showRecommendations?: boolean;
  interactive?: boolean;
  onLayerClick?: (layer: 'unit' | 'integration' | 'e2e') => void;
}

const TestPyramidVisualization: React.FC<TestPyramidVisualizationProps> = ({
  metrics,
  showRecommendations = true,
  interactive = false,
  onLayerClick,
}) => {
  const pyramidData = [
    {
      name: 'Unit Tests',
      count: metrics.unit.count,
      percentage: metrics.unit.percentage,
      avgDuration: metrics.unit.avgDuration,
      stability: metrics.unit.stability,
      color: '#10b981', // green
      ideal: 70,
      layer: 'unit' as const,
    },
    {
      name: 'Integration Tests',
      count: metrics.integration.count,
      percentage: metrics.integration.percentage,
      avgDuration: metrics.integration.avgDuration,
      stability: metrics.integration.stability,
      color: '#f59e0b', // amber
      ideal: 20,
      layer: 'integration' as const,
    },
    {
      name: 'E2E Tests',
      count: metrics.e2e.count,
      percentage: metrics.e2e.percentage,
      avgDuration: metrics.e2e.avgDuration,
      stability: metrics.e2e.stability,
      color: '#ef4444', // red
      ideal: 10,
      layer: 'e2e' as const,
    },
  ];

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'optimal':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'inverted':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'optimal':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'inverted':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const LayerCard = ({ layer }: { layer: (typeof pyramidData)[0] }) => (
    <Card
      className={`cursor-pointer transition-all ${
        interactive ? 'hover:shadow-md hover:scale-105' : ''
      }`}
      onClick={() => interactive && onLayerClick?.(layer.layer)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">{layer.name}</CardTitle>
          <Badge
            variant="outline"
            style={{ borderColor: layer.color, color: layer.color }}
          >
            {layer.count} tests
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Current</span>
            <span className="font-medium">{layer.percentage}%</span>
          </div>
          <Progress
            value={layer.percentage}
            className="h-3"
            style={{
              backgroundColor: '#f3f4f6',
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Target: {layer.ideal}%</span>
            <span
              className={
                layer.percentage > layer.ideal
                  ? 'text-yellow-600'
                  : 'text-green-600'
              }
            >
              {layer.percentage > layer.ideal
                ? `+${layer.percentage - layer.ideal}%`
                : '✓'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Avg Duration</span>
            </div>
            <span className="font-medium">
              {formatDuration(layer.avgDuration)}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Stability</span>
            </div>
            <span
              className={`font-medium ${
                layer.stability >= 0.95
                  ? 'text-green-600'
                  : layer.stability >= 0.9
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}
            >
              {Math.round(layer.stability * 100)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header with overall health */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getHealthIcon(metrics.pyramidHealth)}
                Test Pyramid Analysis
              </CardTitle>
              <CardDescription>
                Distribution and health of your test suite across the testing
                pyramid
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={getHealthColor(metrics.pyramidHealth)}
            >
              {metrics.pyramidHealth.charAt(0).toUpperCase() +
                metrics.pyramidHealth.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{metrics.total}</div>
              <div className="text-sm text-muted-foreground">Total Tests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {metrics.unit.count}
              </div>
              <div className="text-sm text-muted-foreground">Unit Tests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatDuration(
                  (metrics.unit.avgDuration * metrics.unit.count +
                    metrics.integration.avgDuration *
                      metrics.integration.count +
                    metrics.e2e.avgDuration * metrics.e2e.count) /
                    metrics.total
                )}
              </div>
              <div className="text-sm text-muted-foreground">Avg Duration</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layer breakdown cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pyramidData.map(layer => (
          <LayerCard key={layer.layer} layer={layer} />
        ))}
      </div>

      {/* Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pyramid Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Test Distribution</CardTitle>
            <CardDescription>
              Current vs. ideal test distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={pyramidData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'percentage' ? `${value}%` : value,
                    name === 'percentage'
                      ? 'Current'
                      : name === 'ideal'
                        ? 'Target'
                        : name,
                  ]}
                />
                <Bar dataKey="percentage" fill="#8884d8" name="Current %" />
                <Bar
                  dataKey="ideal"
                  fill="#82ca9d"
                  name="Target %"
                  opacity={0.7}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Test Type Distribution</CardTitle>
            <CardDescription>Proportion of each test type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pyramidData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                >
                  {pyramidData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} tests`, 'Count']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>
            Duration and stability across test layers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pyramidData.map(layer => (
              <div key={layer.layer} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: layer.color }}
                  />
                  <span className="font-medium">{layer.name}</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-medium">
                      {formatDuration(layer.avgDuration)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stability:</span>
                    <span
                      className={`font-medium ${
                        layer.stability >= 0.95
                          ? 'text-green-600'
                          : layer.stability >= 0.9
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {Math.round(layer.stability * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {showRecommendations && metrics.recommendations.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Recommendations:</div>
              <ul className="list-disc list-inside space-y-1">
                {metrics.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm">
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default TestPyramidVisualization;
