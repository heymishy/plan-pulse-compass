/**
 * Unified Data Management Hub
 *
 * Modern, cohesive interface for all import/export operations
 * Replaces the fragmented approach with a task-oriented design
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload,
  Download,
  Database,
  Users,
  Briefcase,
  BarChart3,
  FileText,
  Settings,
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

// Import existing components for functionality
import AdvancedDataImport from './AdvancedDataImport';
import EnhancedImportExport from './EnhancedImportExport';
import EnhancedProjectsImportExport from './EnhancedProjectsImportExport';
import TrackingImportExport from './TrackingImportExport';
import SkillsImportExport from './SkillsImportExport';
import BulkRemovalSettings from './BulkRemovalSettings';

// Data category definitions
const DATA_CATEGORIES = {
  core: {
    id: 'core',
    name: 'Core Data',
    description: 'People, teams, skills, and organizational structure',
    icon: Users,
    color: 'blue',
    components: ['people', 'teams', 'skills', 'roles', 'divisions'],
  },
  projects: {
    id: 'projects',
    name: 'Projects & Work',
    description: 'Projects, epics, allocations, and work planning',
    icon: Briefcase,
    color: 'green',
    components: ['projects', 'epics', 'allocations', 'iterations'],
  },
  analytics: {
    id: 'analytics',
    name: 'Analytics & Tracking',
    description: 'Performance tracking, metrics, and reporting data',
    icon: BarChart3,
    color: 'purple',
    components: ['tracking', 'metrics', 'reports'],
  },
} as const;

type CategoryId = keyof typeof DATA_CATEGORIES;
type OperationType = 'import' | 'export' | 'manage';

interface DataStats {
  people: number;
  teams: number;
  projects: number;
  skills: number;
  allocations: number;
}

const UnifiedDataManagement: React.FC = () => {
  const { people, teams, projects, skills, allocations } = useApp();
  const [activeCategory, setActiveCategory] = useState<CategoryId>('core');
  const [activeOperation, setActiveOperation] =
    useState<OperationType>('import');

  // Calculate data statistics
  const dataStats: DataStats = useMemo(
    () => ({
      people: people.length,
      teams: teams.length,
      projects: projects.length,
      skills: skills.length,
      allocations: allocations.length,
    }),
    [people, teams, projects, skills, allocations]
  );

  // Quick action handlers
  const handleImportAll = () => {
    // TODO: Implement bulk import workflow
    console.log('Import All initiated');
  };

  const handleExportAll = () => {
    // TODO: Implement bulk export workflow
    console.log('Export All initiated');
  };

  const handleDownloadTemplates = () => {
    // TODO: Implement template download
    console.log('Download Templates initiated');
  };

  // Render category stats
  const renderCategoryStats = (categoryId: CategoryId) => {
    const getStatsForCategory = () => {
      switch (categoryId) {
        case 'core':
          return [
            { label: 'People', value: dataStats.people },
            { label: 'Teams', value: dataStats.teams },
            { label: 'Skills', value: dataStats.skills },
          ];
        case 'projects':
          return [
            { label: 'Projects', value: dataStats.projects },
            { label: 'Allocations', value: dataStats.allocations },
          ];
        case 'analytics':
          return [{ label: 'Tracking Records', value: 0 }];
        default:
          return [];
      }
    };

    const stats = getStatsForCategory();

    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {stats.map((stat, index) => (
          <Badge
            key={index}
            variant="outline"
            className="text-blue-600 border-blue-200"
          >
            {stat.label}: {stat.value.toLocaleString()}
          </Badge>
        ))}
      </div>
    );
  };

  // Render operation content
  const renderOperationContent = () => {
    const key = `${activeCategory}-${activeOperation}`;

    switch (key) {
      case 'core-import':
      case 'core-export':
        return <EnhancedImportExport />;

      case 'core-manage':
        return <SkillsImportExport />;

      case 'projects-import':
      case 'projects-export':
        return <EnhancedProjectsImportExport />;

      case 'projects-manage':
        return <AdvancedDataImport />;

      case 'analytics-import':
      case 'analytics-export':
      case 'analytics-manage':
        return <TrackingImportExport />;

      default:
        return (
          <div className="text-center py-8 text-gray-500">
            <Info className="h-8 w-8 mx-auto mb-2" />
            <p>Select a category and operation to get started</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Data Management Hub</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Centralized import, export, and data management operations
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplates}
              >
                <FileText className="h-4 w-4 mr-1" />
                Templates
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportAll}>
                <Download className="h-4 w-4 mr-1" />
                Export All
              </Button>
              <Button size="sm" onClick={handleImportAll}>
                <Upload className="h-4 w-4 mr-1" />
                Import All
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Interface */}
      <Card>
        <CardContent className="pt-6">
          <Tabs
            value={activeCategory}
            onValueChange={value => setActiveCategory(value as CategoryId)}
          >
            {/* Category Tabs */}
            <TabsList className="grid w-full grid-cols-3 mb-6">
              {Object.entries(DATA_CATEGORIES).map(([id, category]) => {
                const Icon = category.icon;
                return (
                  <TabsTrigger
                    key={id}
                    value={id}
                    className="flex items-center space-x-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{category.name}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Category Content */}
            {Object.entries(DATA_CATEGORIES).map(([id, category]) => (
              <TabsContent key={id} value={id} className="space-y-6">
                {/* Category Header */}
                <div className="border-b pb-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <category.icon className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">
                    {category.description}
                  </p>
                  {renderCategoryStats(id as CategoryId)}
                </div>

                {/* Operation Tabs */}
                <Tabs
                  value={activeOperation}
                  onValueChange={value =>
                    setActiveOperation(value as OperationType)
                  }
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger
                      value="import"
                      className="flex items-center space-x-2"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Import</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="export"
                      className="flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Export</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="manage"
                      className="flex items-center space-x-2"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Manage</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="import" className="mt-6">
                    {renderOperationContent()}
                  </TabsContent>

                  <TabsContent value="export" className="mt-6">
                    {renderOperationContent()}
                  </TabsContent>

                  <TabsContent value="manage" className="mt-6">
                    {renderOperationContent()}
                    {/* Additional bulk operations for manage tab */}
                    {activeCategory === 'core' && (
                      <div className="mt-6 pt-6 border-t">
                        <BulkRemovalSettings />
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Help & Documentation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm mb-1">Getting Started</h4>
              <p className="text-sm text-gray-600 mb-2">
                Use templates for consistent data formatting, preview imports
                before applying, and always backup your data before bulk
                operations.
              </p>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>• Download templates first</span>
                <span>• Preview before importing</span>
                <span>• Use bulk operations carefully</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedDataManagement;
