
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Settings2 } from 'lucide-react';

const GeneralSettings = () => {
  const { config, setConfig } = useApp();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState({
    appName: 'Team Planning',
    defaultCapacity: 40,
    defaultEmploymentType: 'full-time',
    dateFormat: 'DD/MM/YYYY',
  });

  const handleSave = () => {
    // Save general settings to config
    toast({
      title: "Settings Saved",
      description: "Your general settings have been updated successfully.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings2 className="mr-2 h-5 w-5" />
          General Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label htmlFor="appName">Application Name</Label>
            <Input
              id="appName"
              value={settings.appName}
              onChange={(e) => setSettings(prev => ({ ...prev, appName: e.target.value }))}
              placeholder="Team Planning"
            />
          </div>
          
          <div>
            <Label htmlFor="defaultCapacity">Default Weekly Capacity (hours)</Label>
            <Input
              id="defaultCapacity"
              type="number"
              value={settings.defaultCapacity}
              onChange={(e) => setSettings(prev => ({ ...prev, defaultCapacity: Number(e.target.value) }))}
              placeholder="40"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label>Default Employment Type</Label>
            <Select 
              value={settings.defaultEmploymentType} 
              onValueChange={(value) => setSettings(prev => ({ ...prev, defaultEmploymentType: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
                <SelectItem value="contractor">Contractor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Date Format</Label>
            <Select 
              value={settings.dateFormat} 
              onValueChange={(value) => setSettings(prev => ({ ...prev, dateFormat: value }))}
            >
              <SelectTrigger>
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
          <Button onClick={handleSave}>
            Save General Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneralSettings;
