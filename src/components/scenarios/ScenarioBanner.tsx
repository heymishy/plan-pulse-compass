import React from 'react';
import { useScenarios } from '@/context/ScenarioContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Save, X, Eye, Clock, ArrowLeft } from 'lucide-react';
import { ScenarioSwitcher } from './ScenarioSwitcher';

interface ScenarioBannerProps {
  className?: string;
}

export const ScenarioBanner: React.FC<ScenarioBannerProps> = ({
  className = '',
}) => {
  const {
    isInScenarioMode,
    activeScenarioId,
    scenarios,
    hasUnsavedChanges,
    switchToLive,
    saveCurrentScenario,
    discardChanges,
  } = useScenarios();

  if (!isInScenarioMode || !activeScenarioId) {
    return null;
  }

  const activeScenario = scenarios.find(s => s.id === activeScenarioId);

  if (!activeScenario) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSave = async () => {
    try {
      await saveCurrentScenario();
    } catch (error) {
      console.error('Failed to save scenario:', error);
    }
  };

  const handleDiscard = () => {
    if (confirm('Are you sure you want to discard all unsaved changes?')) {
      discardChanges();
    }
  };

  const handleExitScenario = () => {
    if (hasUnsavedChanges) {
      if (
        confirm(
          'You have unsaved changes. Are you sure you want to exit scenario mode? Changes will be lost.'
        )
      ) {
        switchToLive();
      }
    } else {
      switchToLive();
    }
  };

  return (
    <div
      className={`bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200 dark:border-blue-800 ${className}`}
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Scenario info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <Badge
                variant="default"
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Eye className="h-3 w-3 mr-1" />
                Scenario Mode
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-medium text-blue-900 dark:text-blue-100">
                {activeScenario.name}
              </span>
              {activeScenario.templateName && (
                <Badge
                  variant="outline"
                  className="text-xs border-blue-300 text-blue-700 dark:text-blue-300"
                >
                  {activeScenario.templateName}
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-4 text-sm text-blue-700 dark:text-blue-300">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Created {formatDate(activeScenario.createdDate)}</span>
              </div>

              {activeScenario.description && (
                <span className="max-w-64 truncate">
                  {activeScenario.description}
                </span>
              )}
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-3">
            {/* Change status indicator */}
            {hasUnsavedChanges && (
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <Badge
                  variant="secondary"
                  className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                >
                  Unsaved Changes
                </Badge>
              </div>
            )}

            {/* Scenario switcher (compact mode) */}
            <ScenarioSwitcher variant="compact" />

            {/* Action buttons */}
            <div className="flex items-center space-x-2">
              {hasUnsavedChanges && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDiscard}
                    className="text-xs border-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Discard
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="text-xs bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                </>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={handleExitScenario}
                className="text-xs border-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900"
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Exit Scenario
              </Button>
            </div>
          </div>
        </div>

        {/* Warning message for first-time users */}
        <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
          <AlertTriangle className="h-3 w-3 inline mr-1" />
          You are viewing and editing scenario data. Changes made here will not
          affect your live plan.
        </div>
      </div>
    </div>
  );
};

export default ScenarioBanner;
