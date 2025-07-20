import React, { useState } from 'react';
import { useScenarios } from '@/context/ScenarioContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  Plus,
  Play,
  MoreHorizontal,
  Trash2,
  Copy,
  Settings,
} from 'lucide-react';
import { CreateScenarioDialog } from './CreateScenarioDialog';

interface ScenarioSwitcherProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export const ScenarioSwitcher: React.FC<ScenarioSwitcherProps> = ({
  className = '',
  variant = 'default',
}) => {
  const {
    scenarios,
    activeScenarioId,
    isInScenarioMode,
    switchToScenario,
    switchToLive,
    deleteScenario,
    hasUnsavedChanges,
  } = useScenarios();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const activeScenario = scenarios.find(s => s.id === activeScenarioId);

  const handleSwitchToLive = () => {
    if (hasUnsavedChanges) {
      setPendingAction(() => switchToLive);
      setShowUnsavedWarning(true);
    } else {
      switchToLive();
    }
  };

  const handleSwitchToScenario = (scenarioId: string) => {
    if (hasUnsavedChanges && scenarioId !== activeScenarioId) {
      setPendingAction(() => () => switchToScenario(scenarioId));
      setShowUnsavedWarning(true);
    } else {
      switchToScenario(scenarioId);
    }
  };

  const handleDeleteScenario = (
    scenarioId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    if (
      confirm(
        'Are you sure you want to delete this scenario? This action cannot be undone.'
      )
    ) {
      deleteScenario(scenarioId);
    }
  };

  const handleProceedWithAction = () => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setShowUnsavedWarning(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Badge
          variant={isInScenarioMode ? 'default' : 'secondary'}
          className="text-xs"
        >
          {isInScenarioMode ? 'Scenario' : 'Live'}
        </Badge>
        {isInScenarioMode && activeScenario && (
          <span className="text-sm text-muted-foreground truncate max-w-32">
            {activeScenario.name}
          </span>
        )}
      </div>
    );
  }

  return (
    <>
      <div className={`flex items-center space-x-3 ${className}`}>
        {/* Main Scenario Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-[200px] justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  {isInScenarioMode ? (
                    <>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <span className="font-medium">
                        {activeScenario?.name || 'Unknown Scenario'}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="font-medium">Live Plan</span>
                    </>
                  )}
                </div>
                {hasUnsavedChanges && (
                  <Badge variant="destructive" className="text-xs px-1">
                    •
                  </Badge>
                )}
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            {/* Live Mode Option */}
            <DropdownMenuItem
              onClick={handleSwitchToLive}
              className={!isInScenarioMode ? 'bg-accent' : ''}
            >
              <div className="flex items-center space-x-3 w-full">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div className="flex-1">
                  <div className="font-medium">Live Plan</div>
                  <div className="text-xs text-muted-foreground">
                    Current live planning data
                  </div>
                </div>
                {!isInScenarioMode && (
                  <Play className="h-3 w-3 text-green-500" />
                )}
              </div>
            </DropdownMenuItem>

            {scenarios.length > 0 && <DropdownMenuSeparator />}

            {/* Scenario Options */}
            {scenarios.map(scenario => (
              <DropdownMenuItem
                key={scenario.id}
                onClick={() => handleSwitchToScenario(scenario.id)}
                className={scenario.id === activeScenarioId ? 'bg-accent' : ''}
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{scenario.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Created {formatDate(scenario.createdDate)}
                      {scenario.templateName && ` • ${scenario.templateName}`}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    {scenario.id === activeScenarioId && (
                      <Play className="h-3 w-3 text-blue-500" />
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={e => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" side="right">
                        <DropdownMenuItem
                          onClick={e => {
                            e.stopPropagation();
                            // TODO: Implement duplicate scenario
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={e => handleDeleteScenario(scenario.id, e)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            {/* Create New Scenario */}
            <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
              <div className="flex items-center space-x-3 w-full">
                <Plus className="h-4 w-4 text-muted-foreground" />
                <span>Create New Scenario</span>
              </div>
            </DropdownMenuItem>

            {/* Manage Scenarios */}
            <DropdownMenuItem>
              <div className="flex items-center space-x-3 w-full">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>Manage Scenarios</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Scenario Status Indicator */}
        {isInScenarioMode && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              Scenario Mode
            </Badge>
            {hasUnsavedChanges && (
              <Badge variant="secondary" className="text-xs">
                Unsaved Changes
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Create Scenario Dialog */}
      <CreateScenarioDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      {/* Unsaved Changes Warning Dialog */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md">
            <h3 className="text-lg font-semibold mb-2">Unsaved Changes</h3>
            <p className="text-muted-foreground mb-4">
              You have unsaved changes in the current scenario. If you continue,
              these changes will be lost.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowUnsavedWarning(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleProceedWithAction}>
                Discard Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
