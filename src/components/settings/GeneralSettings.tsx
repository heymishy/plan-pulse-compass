import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ThemeSelector } from '@/components/ui/theme-selector';
import { VersionInfo } from '@/components/ui/version-info';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Settings2, Palette, Eye, Info } from 'lucide-react';

const GeneralSettings = () => {
  const { config, setConfig } = useApp();
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    appName: 'Team Planning',
    defaultCapacity: 40,
    defaultEmploymentType: 'full-time',
    dateFormat: 'DD/MM/YYYY',
  });

  const [showThemePreview, setShowThemePreview] = useState(false);

  const handleSave = () => {
    // Save general settings to config
    toast({
      title: 'Settings Saved',
      description: 'Your general settings have been updated successfully.',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Palette className="mr-2 h-5 w-5" />
              Theme & Appearance
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowThemePreview(!showThemePreview)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {showThemePreview ? 'Hide' : 'Show'} Preview
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Application Theme</Label>
            <div className="mt-2">
              <ThemeSelector variant="select" />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Choose a theme that suits your work environment and preferences.
              The system theme will automatically follow your operating system's
              appearance setting.
            </p>
          </div>

          {showThemePreview && (
            <div className="space-y-4">
              <div className="border-t pt-4">
                <Label className="text-sm font-medium">Theme Preview</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  See how each theme looks with sample UI elements
                </p>
                {/* ThemePreviewGrid component would go here */}
              </div>
            </div>
          )}

          <div>
            <Label>Quick Theme Selection</Label>
            <div className="mt-2">
              <ThemeSelector variant="buttons" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings2 className="mr-2 h-5 w-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="appName">Application Name</Label>
              <Input
                id="appName"
                value={settings.appName}
                onChange={e =>
                  setSettings({ ...settings, appName: e.target.value })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="defaultCapacity">
                Default Capacity (hours/week)
              </Label>
              <Input
                id="defaultCapacity"
                type="number"
                value={settings.defaultCapacity}
                onChange={e =>
                  setSettings({
                    ...settings,
                    defaultCapacity: parseInt(e.target.value),
                  })
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="employmentType">Default Employment Type</Label>
              <Select
                value={settings.defaultEmploymentType}
                onValueChange={value =>
                  setSettings({ ...settings, defaultEmploymentType: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full Time</SelectItem>
                  <SelectItem value="part-time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select
                value={settings.dateFormat}
                onValueChange={value =>
                  setSettings({ ...settings, dateFormat: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave}>Save Settings</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="mr-2 h-5 w-5" />
            Build Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VersionInfo variant="detailed" />
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneralSettings;
