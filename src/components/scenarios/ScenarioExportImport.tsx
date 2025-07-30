import React, { useState, useRef } from 'react';
import { useScenarios } from '@/context/ScenarioContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Download,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Calendar,
  Users,
  Target,
  DollarSign,
  Share,
} from 'lucide-react';
import type { Scenario } from '@/types/scenarioTypes';

interface ScenarioExportImportProps {
  scenarios: Scenario[];
}

interface ExportData {
  version: string;
  exportedAt: string;
  scenarios: Scenario[];
  metadata: {
    totalScenarios: number;
    includesLiveData: boolean;
    exportedBy: string;
  };
}

const ScenarioExportImport: React.FC<ScenarioExportImportProps> = ({
  scenarios,
}) => {
  const { createScenario } = useScenarios();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedScenarios, setSelectedScenarios] = useState<Set<string>>(
    new Set()
  );
  const [importPreview, setImportPreview] = useState<ExportData | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Export scenarios to JSON
  const exportScenarios = (scenarioIds: string[]) => {
    const scenariosToExport = scenarios.filter(s => scenarioIds.includes(s.id));

    const exportData: ExportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      scenarios: scenariosToExport,
      metadata: {
        totalScenarios: scenariosToExport.length,
        includesLiveData: true,
        exportedBy: 'Plan Pulse Compass',
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scenarios-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: `Successfully exported ${scenariosToExport.length} scenario(s)`,
    });

    setIsExportDialogOpen(false);
    setSelectedScenarios(new Set());
  };

  // Handle file selection for import
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const content = e.target?.result as string;
        const importData: ExportData = JSON.parse(content);

        // Validate import data structure
        if (
          !importData.version ||
          !importData.scenarios ||
          !Array.isArray(importData.scenarios)
        ) {
          throw new Error('Invalid scenario export file format');
        }

        setImportPreview(importData);
        setIsImportDialogOpen(true);
      } catch (error) {
        toast({
          title: 'Import Error',
          description:
            'Failed to parse scenario file. Please check the file format.',
          variant: 'destructive',
        });
      }
    };

    reader.readAsText(file);
  };

  // Import scenarios from file
  const importScenarios = async () => {
    if (!importPreview) return;

    setIsImporting(true);
    let importedCount = 0;
    let errorCount = 0;

    try {
      for (const scenario of importPreview.scenarios) {
        try {
          // Create new scenario with imported data but new ID and timestamps
          await createScenario({
            name: `${scenario.name} (Imported)`,
            description: scenario.description
              ? `${scenario.description} - Imported on ${new Date().toLocaleDateString()}`
              : `Imported scenario from ${new Date(importPreview.exportedAt).toLocaleDateString()}`,
            // Don't import template info as it might not be available
          });

          importedCount++;
        } catch (error) {
          console.error(`Failed to import scenario ${scenario.name}:`, error);
          errorCount++;
        }
      }

      toast({
        title: 'Import Complete',
        description: `Successfully imported ${importedCount} scenario(s)${errorCount > 0 ? `. ${errorCount} failed.` : ''}`,
        variant: errorCount === 0 ? 'default' : 'destructive',
      });
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: 'Failed to import scenarios. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      setIsImportDialogOpen(false);
      setImportPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toggleScenarioSelection = (scenarioId: string) => {
    const newSelection = new Set(selectedScenarios);
    if (newSelection.has(scenarioId)) {
      newSelection.delete(scenarioId);
    } else {
      newSelection.add(scenarioId);
    }
    setSelectedScenarios(newSelection);
  };

  const selectAllScenarios = () => {
    if (selectedScenarios.size === scenarios.length) {
      setSelectedScenarios(new Set());
    } else {
      setSelectedScenarios(new Set(scenarios.map(s => s.id)));
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Export & Import</h3>
          <p className="text-sm text-gray-600">
            Share scenarios with other users or backup your scenario data
          </p>
        </div>
        <div className="flex space-x-2">
          {/* Import Button */}
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>

          {/* Export Button */}
          <Dialog
            open={isExportDialogOpen}
            onOpenChange={setIsExportDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Export Scenarios</DialogTitle>
                <DialogDescription>
                  Select scenarios to export as a JSON file
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedScenarios.size} of {scenarios.length} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllScenarios}
                  >
                    {selectedScenarios.size === scenarios.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </Button>
                </div>

                <div className="max-h-60 overflow-y-auto border rounded-lg">
                  {scenarios.map(scenario => (
                    <div
                      key={scenario.id}
                      className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                        selectedScenarios.has(scenario.id)
                          ? 'bg-blue-50 border-blue-200'
                          : ''
                      }`}
                      onClick={() => toggleScenarioSelection(scenario.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{scenario.name}</span>
                            {scenario.templateName && (
                              <Badge variant="secondary" className="text-xs">
                                {scenario.templateName}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                            <span>
                              Created{' '}
                              {new Date(
                                scenario.createdDate
                              ).toLocaleDateString()}
                            </span>
                            <span>{scenario.modifications.length} changes</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {selectedScenarios.has(scenario.id) && (
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsExportDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={selectedScenarios.size === 0}
                    onClick={() =>
                      exportScenarios(Array.from(selectedScenarios))
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export {selectedScenarios.size} Scenario
                    {selectedScenarios.size !== 1 ? 's' : ''}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Import Preview Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Scenarios</DialogTitle>
            <DialogDescription>
              Review the scenarios to be imported
            </DialogDescription>
          </DialogHeader>

          {importPreview && (
            <div className="space-y-4">
              {/* Import Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Import Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Export Date:</span>
                      <span className="ml-2">
                        {new Date(
                          importPreview.exportedAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Version:</span>
                      <span className="ml-2">{importPreview.version}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Scenarios:</span>
                      <span className="ml-2">
                        {importPreview.scenarios.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Exported By:</span>
                      <span className="ml-2">
                        {importPreview.metadata.exportedBy}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Scenarios to Import */}
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                {importPreview.scenarios.map((scenario, index) => (
                  <div key={index} className="p-3 border-b last:border-b-0">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{scenario.name}</span>
                          {scenario.templateName && (
                            <Badge variant="secondary" className="text-xs">
                              {scenario.templateName}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                          <span>
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {new Date(
                              scenario.createdDate
                            ).toLocaleDateString()}
                          </span>
                          <span>
                            <Target className="h-3 w-3 inline mr-1" />
                            {scenario.modifications.length} changes
                          </span>
                          <span>
                            <Users className="h-3 w-3 inline mr-1" />
                            {scenario.data.teams.length} teams
                          </span>
                          <span>
                            <DollarSign className="h-3 w-3 inline mr-1" />
                            {scenario.data.projects.length} projects
                          </span>
                        </div>
                        {scenario.description && (
                          <p className="text-xs text-gray-600 mt-1">
                            {scenario.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    Scenarios will be imported with new IDs and marked as
                    imported
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsImportDialogOpen(false);
                      setImportPreview(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button disabled={isImporting} onClick={importScenarios}>
                    {isImporting ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import {importPreview.scenarios.length} Scenario
                        {importPreview.scenarios.length !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <Share className="h-4 w-4" />
            <span>How to Share Scenarios</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Export</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Select scenarios to export</li>
                <li>• Download as JSON file</li>
                <li>• Share file with team members</li>
                <li>• Includes all scenario data</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Import</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Choose JSON file from export</li>
                <li>• Preview scenarios before import</li>
                <li>• Scenarios get new IDs when imported</li>
                <li>• Marked as imported for tracking</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScenarioExportImport;
