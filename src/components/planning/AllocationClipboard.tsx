import React, { useState, useContext, createContext, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import {
  Copy,
  Clipboard,
  ClipboardPaste,
  X,
  Check,
  AlertCircle,
  Users,
  Calendar,
} from 'lucide-react';
import { Allocation, Team, Epic } from '@/types';

interface ClipboardData {
  allocations: Allocation[];
  sourceTeamId: string;
  sourceTeamName: string;
  sourceIterationNumber: number;
  copiedAt: Date;
  metadata: {
    totalPercentage: number;
    epicCount: number;
    hasRunWork: boolean;
  };
}

interface AllocationClipboardContextType {
  clipboardData: ClipboardData | null;
  copyAllocations: (
    allocations: Allocation[],
    sourceTeam: Team,
    iterationNumber: number
  ) => void;
  pasteAllocations: (
    targetTeamId: string,
    targetIterationNumber: number,
    options?: PasteOptions,
    targetCycleId?: string
  ) => Promise<Allocation[]>;
  clearClipboard: () => void;
  hasData: boolean;
}

interface PasteOptions {
  overwrite?: boolean;
  scaleToCapacity?: boolean;
  targetCapacity?: number;
}

const AllocationClipboardContext =
  createContext<AllocationClipboardContextType>({
    clipboardData: null,
    copyAllocations: () => {},
    pasteAllocations: async () => [],
    clearClipboard: () => {},
    hasData: false,
  });

export const useAllocationClipboard = () => {
  const context = useContext(AllocationClipboardContext);
  if (!context) {
    throw new Error(
      'useAllocationClipboard must be used within AllocationClipboardProvider'
    );
  }
  return context;
};

interface AllocationClipboardProviderProps {
  children: ReactNode;
  onAllocationsChange: (allocations: Allocation[]) => void;
  allAllocations: Allocation[];
  selectedCycleId: string;
}

export const AllocationClipboardProvider: React.FC<
  AllocationClipboardProviderProps
> = ({ children, onAllocationsChange, allAllocations, selectedCycleId }) => {
  const [clipboardData, setClipboardData] = useState<ClipboardData | null>(
    null
  );

  const copyAllocations = (
    allocations: Allocation[],
    sourceTeam: Team,
    iterationNumber: number
  ) => {
    if (allocations.length === 0) {
      toast({
        title: 'Nothing to copy',
        description: 'No allocations found for this team and iteration.',
        variant: 'destructive',
      });
      return;
    }

    const totalPercentage = allocations.reduce(
      (sum, alloc) => sum + alloc.percentage,
      0
    );
    const epicCount = new Set(
      allocations.filter(a => a.epicId).map(a => a.epicId)
    ).size;
    const hasRunWork = allocations.some(a => a.runWorkCategoryId);

    const clipboard: ClipboardData = {
      allocations: allocations.map(alloc => ({ ...alloc })), // Deep copy
      sourceTeamId: sourceTeam.id,
      sourceTeamName: sourceTeam.name,
      sourceIterationNumber: iterationNumber,
      copiedAt: new Date(),
      metadata: {
        totalPercentage,
        epicCount,
        hasRunWork,
      },
    };

    setClipboardData(clipboard);

    toast({
      title: 'Allocations copied',
      description: `Copied ${allocations.length} allocation(s) from ${sourceTeam.name}, Iteration ${iterationNumber}`,
    });
  };

  const pasteAllocations = async (
    targetTeamId: string,
    targetIterationNumber: number,
    options: PasteOptions = {},
    targetCycleId?: string
  ): Promise<Allocation[]> => {
    if (!clipboardData) {
      toast({
        title: 'Nothing to paste',
        description:
          'No allocations in clipboard. Copy some allocations first.',
        variant: 'destructive',
      });
      return [];
    }

    const {
      overwrite = false,
      scaleToCapacity = false,
      targetCapacity = 100,
    } = options;

    // Check if pasting to same location
    if (
      targetTeamId === clipboardData.sourceTeamId &&
      targetIterationNumber === clipboardData.sourceIterationNumber
    ) {
      toast({
        title: 'Cannot paste to same location',
        description:
          "You're trying to paste to the same team and iteration where you copied from.",
        variant: 'destructive',
      });
      return [];
    }

    // Use targetCycleId if provided, otherwise fall back to selectedCycleId
    const effectiveCycleId = targetCycleId || selectedCycleId;

    // Get existing allocations for target
    const existingAllocations = allAllocations.filter(
      a =>
        a.teamId === targetTeamId &&
        a.iterationNumber === targetIterationNumber &&
        a.cycleId === effectiveCycleId
    );

    if (existingAllocations.length > 0 && !overwrite) {
      toast({
        title: 'Target has existing allocations',
        description:
          'The target already has allocations. Use overwrite mode to replace them.',
        variant: 'destructive',
      });
      return [];
    }

    // Calculate scaling factor if needed
    let scalingFactor = 1;
    if (scaleToCapacity && clipboardData.metadata.totalPercentage > 0) {
      scalingFactor = targetCapacity / clipboardData.metadata.totalPercentage;
    }

    // Create new allocations
    const newAllocations: Allocation[] = clipboardData.allocations.map(
      sourceAlloc => ({
        ...sourceAlloc,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
        teamId: targetTeamId,
        iterationNumber: targetIterationNumber,
        cycleId: effectiveCycleId,
        percentage: Math.round(sourceAlloc.percentage * scalingFactor),
      })
    );

    // Update allocations list
    let updatedAllocations = [...allAllocations];

    // Remove existing allocations if overwriting
    if (overwrite) {
      updatedAllocations = updatedAllocations.filter(
        a =>
          !(
            a.teamId === targetTeamId &&
            a.iterationNumber === targetIterationNumber &&
            a.cycleId === effectiveCycleId
          )
      );
    }

    // Add new allocations
    updatedAllocations = [...updatedAllocations, ...newAllocations];
    onAllocationsChange(updatedAllocations);

    const scalingText = scaleToCapacity
      ? ` (scaled ${Math.round(scalingFactor * 100)}%)`
      : '';
    toast({
      title: 'Allocations pasted',
      description: `Pasted ${newAllocations.length} allocation(s)${scalingText}`,
    });

    return newAllocations;
  };

  const clearClipboard = () => {
    setClipboardData(null);
    toast({
      title: 'Clipboard cleared',
      description: 'Allocation clipboard has been cleared.',
    });
  };

  const value: AllocationClipboardContextType = {
    clipboardData,
    copyAllocations,
    pasteAllocations,
    clearClipboard,
    hasData: clipboardData !== null,
  };

  return (
    <AllocationClipboardContext.Provider value={value}>
      {children}
    </AllocationClipboardContext.Provider>
  );
};

interface ClipboardControlsProps {
  teamId: string;
  teamName: string;
  iterationNumber: number;
  allocations: Allocation[];
  onPaste?: (newAllocations: Allocation[]) => void;
  compact?: boolean;
  cycleId?: string;
}

export const ClipboardControls: React.FC<ClipboardControlsProps> = ({
  teamId,
  teamName,
  iterationNumber,
  allocations,
  onPaste,
  compact = false,
  cycleId,
}) => {
  const { clipboardData, copyAllocations, pasteAllocations, hasData } =
    useAllocationClipboard();
  const [isPasting, setIsPasting] = useState(false);

  const handleCopy = () => {
    copyAllocations(
      allocations,
      { id: teamId, name: teamName } as Team,
      iterationNumber
    );
  };

  const handlePaste = async (options: PasteOptions = {}) => {
    setIsPasting(true);
    try {
      const newAllocations = await pasteAllocations(
        teamId,
        iterationNumber,
        options,
        cycleId
      );
      if (newAllocations.length > 0 && onPaste) {
        onPaste(newAllocations);
      }
    } finally {
      setIsPasting(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          disabled={allocations.length === 0}
          className="h-6 w-6 p-0"
        >
          <Copy className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handlePaste({ overwrite: true })}
          disabled={!hasData || isPasting}
          className="h-6 w-6 p-0"
        >
          <ClipboardPaste className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        disabled={allocations.length === 0}
        className="text-xs"
      >
        <Copy className="h-3 w-3 mr-1" />
        Copy
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePaste({ overwrite: true })}
        disabled={!hasData || isPasting}
        className="text-xs"
      >
        <ClipboardPaste className="h-3 w-3 mr-1" />
        Paste
      </Button>
    </div>
  );
};

interface ClipboardStatusProps {
  epics: Epic[];
}

export const ClipboardStatus: React.FC<ClipboardStatusProps> = ({ epics }) => {
  const { clipboardData, clearClipboard, hasData } = useAllocationClipboard();

  if (!hasData || !clipboardData) {
    return null;
  }

  const epicNames = clipboardData.allocations
    .filter(a => a.epicId)
    .map(a => epics.find(e => e.id === a.epicId)?.name)
    .filter(Boolean)
    .slice(0, 3);

  const timeSinceCopy = Math.floor(
    (Date.now() - clipboardData.copiedAt.getTime()) / 1000 / 60
  );

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clipboard className="h-4 w-4 text-blue-600" />
            <div className="text-sm">
              <div className="font-medium text-blue-900">
                Clipboard: {clipboardData.allocations.length} allocation(s)
              </div>
              <div className="text-blue-700 text-xs">
                From {clipboardData.sourceTeamName}, Iteration{' '}
                {clipboardData.sourceIterationNumber}
                {timeSinceCopy > 0 && ` • ${timeSinceCopy}m ago`}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Badge variant="outline" className="text-xs bg-white">
                <Users className="h-3 w-3 mr-1" />
                {clipboardData.metadata.totalPercentage}%
              </Badge>
              {clipboardData.metadata.epicCount > 0 && (
                <Badge variant="outline" className="text-xs bg-white">
                  {clipboardData.metadata.epicCount} epic
                  {clipboardData.metadata.epicCount !== 1 ? 's' : ''}
                </Badge>
              )}
              {clipboardData.metadata.hasRunWork && (
                <Badge variant="outline" className="text-xs bg-white">
                  Run work
                </Badge>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={clearClipboard}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {epicNames.length > 0 && (
          <div className="mt-2 text-xs text-blue-700">
            Epics: {epicNames.join(', ')}
            {clipboardData.allocations.filter(a => a.epicId).length > 3 &&
              ` + ${clipboardData.allocations.filter(a => a.epicId).length - 3} more`}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AllocationClipboardProvider;
