
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Settings, CheckCircle, AlertCircle, ExternalLink, 
  Database, Cloud, Zap, Shield, Activity 
} from 'lucide-react';

const IntegrationHub = () => {
  const [integrations, setIntegrations] = useState([
    {
      id: 'jira',
      name: 'Jira',
      description: 'Project management and issue tracking',
      status: 'connected',
      enabled: true,
      icon: '🔧',
      features: ['Epic sync', 'Sprint planning', 'Issue tracking'],
      lastSync: '2 minutes ago'
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Team communication and notifications',
      status: 'connected',
      enabled: true,
      icon: '💬',
      features: ['Status updates', 'Milestone alerts', 'Daily summaries'],
      lastSync: '5 minutes ago'
    },
    {
      id: 'github',
      name: 'GitHub',
      description: 'Code repository and development tracking',
      status: 'pending',
      enabled: false,
      icon: '🐙',
      features: ['Commit tracking', 'PR analysis', 'Code metrics'],
      lastSync: 'Never'
    },
    {
      id: 'azure',
      name: 'Azure DevOps',
      description: 'CI/CD pipeline and deployment tracking',
      status: 'available',
      enabled: false,
      icon: '☁️',
      features: ['Pipeline monitoring', 'Release tracking', 'Test results'],
      lastSync: 'Not connected'
    }
  ]);

  const toggleIntegration = (id: string) => {
    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === id
          ? { ...integration, enabled: !integration.enabled }
          : integration
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'available': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected': return <Badge className="bg-green-500">Connected</Badge>;
      case 'pending': return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'available': return <Badge variant="outline">Available</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Integration Hub</h2>
          <p className="text-gray-600">Connect and manage external tools and services</p>
        </div>
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          Configure Integrations
        </Button>
      </div>

      {/* Integration Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Active Integrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {integrations.filter(i => i.status === 'connected' && i.enabled).length}
            </div>
            <p className="text-xs text-gray-500">Connected and enabled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Pending Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {integrations.filter(i => i.status === 'pending').length}
            </div>
            <p className="text-xs text-gray-500">Require configuration</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Data Sync Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">98%</div>
            <p className="text-xs text-gray-500">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              API Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">1.2K</div>
            <p className="text-xs text-gray-500">Today</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="integrations">Available Integrations</TabsTrigger>
          <TabsTrigger value="settings">Sync Settings</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          <TabsTrigger value="security">Security & Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {integrations.map(integration => (
              <Card key={integration.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{integration.icon}</span>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <p className="text-sm text-gray-600">{integration.description}</p>
                      </div>
                    </div>
                    {getStatusBadge(integration.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Enable Integration</span>
                      <Switch
                        checked={integration.enabled}
                        onCheckedChange={() => toggleIntegration(integration.id)}
                        disabled={integration.status !== 'connected'}
                      />
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">Features</p>
                      <div className="flex flex-wrap gap-1">
                        {integration.features.map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Last sync: {integration.lastSync}</span>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Synchronization Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Sync Frequency</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Project data</span>
                      <Badge variant="outline">Every 15 minutes</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Team allocations</span>
                      <Badge variant="outline">Every 30 minutes</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Financial data</span>
                      <Badge variant="outline">Daily</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Data Retention</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Activity logs</span>
                      <Badge variant="outline">30 days</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Sync history</span>
                      <Badge variant="outline">90 days</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Error logs</span>
                      <Badge variant="outline">180 days</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Sync Health Monitoring</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Jira Integration</span>
                      <span>99.2%</span>
                    </div>
                    <Progress value={99.2} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Slack Integration</span>
                      <span>97.8%</span>
                    </div>
                    <Progress value={97.8} className="h-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { time: '2 minutes ago', action: 'Jira sync completed', status: 'success', details: '142 issues updated' },
                  { time: '5 minutes ago', action: 'Slack notification sent', status: 'success', details: 'Daily team summary' },
                  { time: '15 minutes ago', action: 'Budget data refreshed', status: 'success', details: 'All divisions updated' },
                  { time: '1 hour ago', action: 'GitHub webhook received', status: 'pending', details: 'Awaiting processing' },
                  { time: '2 hours ago', action: 'Azure DevOps connection failed', status: 'error', details: 'Authentication expired' }
                ].map((log, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        log.status === 'success' ? 'bg-green-500' :
                        log.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="font-medium text-sm">{log.action}</p>
                        <p className="text-xs text-gray-500">{log.details}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{log.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Security & Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">API Security</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">SSL/TLS Encryption</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">OAuth 2.0 Authentication</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Rate Limiting</span>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Data Permissions</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="text-sm font-medium">Project Data</span>
                        <p className="text-xs text-gray-500">Read and write access to project information</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="text-sm font-medium">Team Data</span>
                        <p className="text-xs text-gray-500">Access to team member information and allocations</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <span className="text-sm font-medium">Financial Data</span>
                        <p className="text-xs text-gray-500">Budget and cost information</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationHub;
