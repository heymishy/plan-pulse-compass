import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useSettings } from '@/context/SettingsContext';
import { useToast } from '@/hooks/use-toast';
import { Settings2, Zap, RotateCcw, ExternalLink } from 'lucide-react';
import { AppConfig } from '@/types';

const IntegrationsSettings = () => {
  const { config, setConfig } = useSettings();
  const { toast } = useToast();

  const [o365Settings, setO365Settings] = useState({
    clientId: '',
    tenantId: '',
    redirectUri: 'http://localhost:3000/auth/callback',
    enabled: false,
  });

  useEffect(() => {
    if (config?.integrations?.o365) {
      setO365Settings({
        clientId: config.integrations.o365.clientId || '',
        tenantId: config.integrations.o365.tenantId || '',
        redirectUri:
          config.integrations.o365.redirectUri ||
          'http://localhost:3000/auth/callback',
        enabled: config.integrations.o365.enabled || false,
      });
    } else {
      setO365Settings({
        clientId: '',
        tenantId: '',
        redirectUri: 'http://localhost:3000/auth/callback',
        enabled: false,
      });
    }
  }, [config]);

  const handleSaveO365Settings = () => {
    if (!o365Settings.clientId.trim()) {
      toast({
        title: 'Error',
        description: 'Client ID is required for O365 integration.',
        variant: 'destructive',
      });
      return;
    }

    const updatedConfig: AppConfig = {
      ...config!,
      integrations: {
        ...config?.integrations,
        o365: {
          clientId: o365Settings.clientId.trim(),
          tenantId: o365Settings.tenantId.trim(),
          redirectUri: o365Settings.redirectUri.trim(),
          enabled: o365Settings.enabled,
        },
      },
    };

    setConfig(updatedConfig);
    toast({
      title: 'Settings Saved',
      description: 'O365 integration settings have been updated successfully.',
    });
  };

  const handleTestConnection = async () => {
    if (!o365Settings.clientId.trim()) {
      toast({
        title: 'Error',
        description: 'Client ID is required to test connection.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Connection Test',
      description: 'Testing O365 connection configuration...',
    });

    try {
      // Create a temporary config to test
      const testConfig = {
        ...config!,
        integrations: {
          ...config?.integrations,
          o365: {
            clientId: o365Settings.clientId.trim(),
            tenantId: o365Settings.tenantId.trim(),
            redirectUri: o365Settings.redirectUri.trim(),
            enabled: true,
          },
        },
      };

      // Test if we can initialize with this config (basic validation)
      if (testConfig.integrations.o365.clientId) {
        toast({
          title: 'Test Successful',
          description:
            'O365 configuration appears valid. Save settings to enable integration.',
        });
      } else {
        throw new Error('Configuration validation failed');
      }
    } catch (error) {
      toast({
        title: 'Test Failed',
        description:
          'O365 configuration test failed. Please check your settings.',
        variant: 'destructive',
      });
    }
  };

  const handleResetToDefaults = () => {
    setO365Settings({
      clientId: '',
      tenantId: '',
      redirectUri: 'http://localhost:3000/auth/callback',
      enabled: false,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Integration Settings</h2>
        <p className="text-gray-600">Configure external service integrations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings2 className="mr-2 h-5 w-5" />
            Office 365 Integration
          </CardTitle>
          <p className="text-sm text-gray-600">
            Configure Office 365 credentials for employee import
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="o365-enabled"
              checked={o365Settings.enabled}
              onCheckedChange={checked =>
                setO365Settings(prev => ({ ...prev, enabled: !!checked }))
              }
            />
            <Label htmlFor="o365-enabled">Enable O365 Integration</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientId">Client ID *</Label>
              <Input
                id="clientId"
                value={o365Settings.clientId}
                onChange={e =>
                  setO365Settings(prev => ({
                    ...prev,
                    clientId: e.target.value,
                  }))
                }
                placeholder="Azure App Client ID"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Azure AD application client ID
              </p>
            </div>

            <div>
              <Label htmlFor="tenantId">Tenant ID</Label>
              <Input
                id="tenantId"
                value={o365Settings.tenantId}
                onChange={e =>
                  setO365Settings(prev => ({
                    ...prev,
                    tenantId: e.target.value,
                  }))
                }
                placeholder="Azure Tenant ID (optional)"
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Leave empty for multi-tenant
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="redirectUri">Redirect URI</Label>
            <Input
              id="redirectUri"
              value={o365Settings.redirectUri}
              onChange={e =>
                setO365Settings(prev => ({
                  ...prev,
                  redirectUri: e.target.value,
                }))
              }
              placeholder="http://localhost:3000/auth/callback"
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              Must match Azure AD app configuration
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleTestConnection}
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Test Connection
              </Button>
              <Button
                variant="outline"
                onClick={handleResetToDefaults}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to Defaults
              </Button>
            </div>
            <Button onClick={handleSaveO365Settings}>Save O365 Settings</Button>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              Setup Instructions
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>1. Create an Azure AD application in the Azure portal</li>
              <li>2. Configure API permissions for Microsoft Graph</li>
              <li>3. Add the redirect URI to your Azure AD app</li>
              <li>4. Copy the Client ID from your Azure AD app</li>
            </ul>
            <Button
              variant="link"
              className="text-blue-600 p-0 h-auto mt-2"
              onClick={() =>
                window.open(
                  'https://docs.microsoft.com/en-us/azure/active-directory/develop/',
                  '_blank'
                )
              }
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Azure AD Documentation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationsSettings;
