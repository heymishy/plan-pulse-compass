
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon } from 'lucide-react';
import GeneralSettings from '@/components/settings/GeneralSettings';
import FinancialSettings from '@/components/settings/FinancialSettings';
import TeamsSettings from '@/components/settings/TeamsSettings';
import ImportExportSettings from '@/components/settings/ImportExportSettings';
import AdvancedSettings from '@/components/settings/AdvancedSettings';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <SettingsIcon className="mr-3 h-8 w-8" />
          Settings
        </h1>
        <p className="text-gray-600">
          Manage your application configuration and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="teams">Teams & Roles</TabsTrigger>
          <TabsTrigger value="import">Import/Export</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="financial" className="mt-6">
          <FinancialSettings />
        </TabsContent>

        <TabsContent value="teams" className="mt-6">
          <TeamsSettings />
        </TabsContent>

        <TabsContent value="import" className="mt-6">
          <ImportExportSettings />
        </TabsContent>

        <TabsContent value="advanced" className="mt-6">
          <AdvancedSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
