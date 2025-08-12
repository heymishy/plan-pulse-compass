import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout, Grid3x3 } from 'lucide-react';
import UnifiedDataManagement from './UnifiedDataManagement';

// Legacy components for backward compatibility
import AdvancedDataImport from './AdvancedDataImport';
import EnhancedImportExport from './EnhancedImportExport';
import EnhancedProjectsImportExport from './EnhancedProjectsImportExport';
import TrackingImportExport from './TrackingImportExport';
import SkillsImportExport from './SkillsImportExport';
import BulkRemovalSettings from './BulkRemovalSettings';

const ImportExportSettings = () => {
  const [viewMode, setViewMode] = useState<'unified' | 'legacy'>('unified');

  return (
    <div className="space-y-4">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Import & Export</h2>
          <p className="text-sm text-gray-500">
            Manage your data with import, export, and bulk operations
          </p>
        </div>

        <Tabs
          value={viewMode}
          onValueChange={value => setViewMode(value as 'unified' | 'legacy')}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="unified"
              className="flex items-center space-x-2"
            >
              <Layout className="h-4 w-4" />
              <span>Unified View</span>
              <Badge variant="secondary" className="ml-1 text-xs">
                New
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="legacy" className="flex items-center space-x-2">
              <Grid3x3 className="h-4 w-4" />
              <span>Legacy View</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'unified' ? (
        <UnifiedDataManagement />
      ) : (
        <div className="space-y-6">
          <AdvancedDataImport />
          <EnhancedImportExport />
          <EnhancedProjectsImportExport />
          <TrackingImportExport />
          <SkillsImportExport />
          <BulkRemovalSettings />
        </div>
      )}
    </div>
  );
};

export default ImportExportSettings;
