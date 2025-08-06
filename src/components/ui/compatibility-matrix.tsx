import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { 
  Search, 
  Download, 
  MoreHorizontal, 
  ArrowUpDown, 
  Filter,
  AlertCircle,
  Grid3X3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useKeyboardNavigation } from '@/hooks/useAccessibility';
import { VisuallyHidden } from '@/components/ui/accessibility';

// Core interfaces
export interface CompatibilityScore {
  score: number; // 0-100
  level: 'low' | 'medium' | 'high';
  reasoning?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface MatrixItem {
  id: string;
  name: string;
  description?: string;
}

export interface MatrixCellData<R extends MatrixItem, C extends MatrixItem> {
  rowItem: R;
  columnItem: C;
  score: CompatibilityScore;
  rowIndex: number;
  columnIndex: number;
}

export type CompatibilityScorer<R extends MatrixItem, C extends MatrixItem> = (
  rowItem: R,
  columnItem: C
) => CompatibilityScore;

export type ColorScheme = 'default' | 'blue' | 'green' | 'purple' | 'orange';
export type ExportFormat = 'csv' | 'json' | 'xlsx';

// Props interface
export interface CompatibilityMatrixProps<R extends MatrixItem, C extends MatrixItem> {
  // Data
  rowItems: R[];
  columnItems: C[];
  compatibilityScorer: CompatibilityScorer<R, C>;
  
  // Labels
  rowLabel: string;
  columnLabel: string;
  title?: string;
  description?: string;
  
  // Visual customization
  colorScheme?: ColorScheme;
  compact?: boolean;
  showScores?: boolean;
  showTooltips?: boolean;
  highContrast?: boolean;
  
  // Interactions
  interactive?: boolean;
  onCellClick?: (data: MatrixCellData<R, C>) => void;
  onRowClick?: (item: R, index: number) => void;
  onColumnClick?: (item: C, index: number) => void;
  
  // Features
  searchable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  exportable?: boolean;
  virtualized?: boolean;
  
  // Customization
  renderCell?: (data: MatrixCellData<R, C>) => React.ReactNode;
  renderRowHeader?: (item: R, index: number) => React.ReactNode;
  renderColumnHeader?: (item: C, index: number) => React.ReactNode;
  
  // Export
  onExport?: (format: ExportFormat, data: MatrixCellData<R, C>[]) => void;
  
  // Styling
  className?: string;
  maxHeight?: string;
}

// Helper functions
const getScoreColorClass = (score: number, scheme: ColorScheme = 'default') => {
  const baseClasses = {
    default: {
      high: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-red-100 text-red-800 border-red-200'
    },
    blue: {
      high: 'bg-blue-100 text-blue-800 border-blue-200',
      medium: 'bg-blue-50 text-blue-700 border-blue-100',
      low: 'bg-gray-100 text-gray-800 border-gray-200'
    },
    green: {
      high: 'bg-green-100 text-green-800 border-green-200',
      medium: 'bg-green-50 text-green-700 border-green-100',
      low: 'bg-gray-100 text-gray-800 border-gray-200'
    },
    purple: {
      high: 'bg-purple-100 text-purple-800 border-purple-200',
      medium: 'bg-purple-50 text-purple-700 border-purple-100',
      low: 'bg-gray-100 text-gray-800 border-gray-200'
    },
    orange: {
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-orange-50 text-orange-700 border-orange-100',
      low: 'bg-gray-100 text-gray-800 border-gray-200'
    }
  };

  const level = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
  return baseClasses[scheme][level];
};

const formatScore = (score: number): string => `${Math.round(score)}%`;

export function CompatibilityMatrix<R extends MatrixItem, C extends MatrixItem>({
  rowItems,
  columnItems,
  compatibilityScorer,
  rowLabel,
  columnLabel,
  title,
  description,
  colorScheme = 'default',
  compact = false,
  showScores = true,
  showTooltips = false,
  highContrast = false,
  interactive = false,
  onCellClick,
  onRowClick,
  onColumnClick,
  searchable = false,
  sortable = false,
  filterable = false,
  exportable = false,
  virtualized = false,
  renderCell,
  renderRowHeader,
  renderColumnHeader,
  onExport,
  className,
  maxHeight = "600px"
}: CompatibilityMatrixProps<R, C>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'score'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [minCompatibility, setMinCompatibility] = useState(0);
  const [focusedCell, setFocusedCell] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const tableRef = useRef<HTMLTableElement>(null);

  // Validate props and set warnings
  useEffect(() => {
    if (!rowItems || !Array.isArray(rowItems)) {
      console.warn('Invalid rowItems prop: expected array');
      return;
    }
    if (!columnItems || !Array.isArray(columnItems)) {
      console.warn('Invalid columnItems prop: expected array');
      return;
    }
  }, [rowItems, columnItems]);

  // Generate matrix data with error handling
  const matrixData = useMemo(() => {
    if (!rowItems || !columnItems || !compatibilityScorer || !Array.isArray(rowItems) || !Array.isArray(columnItems)) {
      return [];
    }

    try {
      const data: MatrixCellData<R, C>[] = [];
      let hasErrors = false;
      
      rowItems.forEach((rowItem, rowIndex) => {
        columnItems.forEach((columnItem, columnIndex) => {
          try {
            const score = compatibilityScorer(rowItem, columnItem);
            data.push({
              rowItem,
              columnItem,
              score,
              rowIndex,
              columnIndex
            });
          } catch (err) {
            console.error('Error calculating compatibility score:', err);
            hasErrors = true;
            data.push({
              rowItem,
              columnItem,
              score: { score: 0, level: 'low', reasoning: 'Error calculating score' },
              rowIndex,
              columnIndex
            });
          }
        });
      });
      
      if (hasErrors) {
        setError('Error calculating compatibility');
      } else {
        setError(null);
      }
      return data;
    } catch (err) {
      setError('Error calculating compatibility');
      return [];
    }
  }, [rowItems, columnItems, compatibilityScorer]);

  // Filter and sort rows
  const filteredRows = useMemo(() => {
    if (!rowItems || !Array.isArray(rowItems)) {
      return [];
    }
    let filtered = [...rowItems];

    // Apply search filter
    if (searchable && searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortable) {
      filtered.sort((a, b) => {
        if (sortBy === 'name') {
          const comparison = a.name.localeCompare(b.name);
          return sortOrder === 'asc' ? comparison : -comparison;
        } else {
          // Sort by average compatibility score
          const aScore = columnItems.reduce((sum, col) => {
            const cellData = matrixData.find(d => d.rowItem.id === a.id && d.columnItem.id === col.id);
            return sum + (cellData?.score.score || 0);
          }, 0) / columnItems.length;
          
          const bScore = columnItems.reduce((sum, col) => {
            const cellData = matrixData.find(d => d.rowItem.id === b.id && d.columnItem.id === col.id);
            return sum + (cellData?.score.score || 0);
          }, 0) / columnItems.length;
          
          const comparison = aScore - bScore;
          return sortOrder === 'asc' ? comparison : -comparison;
        }
      });
    }

    return filtered;
  }, [rowItems, searchTerm, sortBy, sortOrder, columnItems, matrixData, searchable, sortable]);

  // Handle cell click
  const handleCellClick = useCallback((data: MatrixCellData<R, C>) => {
    onCellClick?.(data);
  }, [onCellClick]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        setFocusedCell([rowIndex, Math.min(colIndex + 1, columnItems.length - 1)]);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setFocusedCell([rowIndex, Math.max(colIndex - 1, 0)]);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedCell([Math.min(rowIndex + 1, filteredRows.length - 1), colIndex]);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedCell([Math.max(rowIndex - 1, 0), colIndex]);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        const cellData = matrixData.find(d => 
          d.rowItem.id === filteredRows[rowIndex].id && 
          d.columnItem.id === columnItems[colIndex].id
        );
        if (cellData) {
          handleCellClick(cellData);
        }
        break;
    }
  }, [columnItems, filteredRows, matrixData, handleCellClick]);

  // Export functionality
  const handleExport = useCallback((format: ExportFormat) => {
    if (!onExport) return;
    
    const exportData = matrixData.filter(data => 
      filteredRows.some(row => row.id === data.rowItem.id) &&
      data.score.score >= minCompatibility
    );
    
    onExport(format, exportData);
  }, [onExport, matrixData, filteredRows, minCompatibility]);

  // Default cell renderer
  const defaultRenderCell = useCallback((data: MatrixCellData<R, C>) => {
    const cellContent = (
      <div className={cn(
        "w-full h-full flex items-center justify-center p-2 border rounded",
        getScoreColorClass(data.score.score, colorScheme),
        compact && "p-1 text-xs",
        highContrast && "border-2 font-bold"
      )}>
        {showScores && formatScore(data.score.score)}
        {!showScores && (
          <div className={cn(
            "w-3 h-3 rounded-full",
            data.score.score >= 70 ? "bg-green-500" : 
            data.score.score >= 40 ? "bg-yellow-500" : "bg-red-500"
          )} />
        )}
      </div>
    );

    if (!showTooltips) return cellContent;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {cellContent}
          </TooltipTrigger>
          <TooltipContent>
            <div className="max-w-xs">
              <p className="font-medium">
                {data.rowItem.name} × {data.columnItem.name}
              </p>
              <p className="text-sm text-muted-foreground">
                Score: {formatScore(data.score.score)} ({data.score.level})
              </p>
              {data.score.reasoning && (
                <p className="text-sm mt-1">{data.score.reasoning}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }, [colorScheme, compact, highContrast, showScores, showTooltips]);

  // Handle empty state
  if (!rowItems?.length || !columnItems?.length) {
    return (
      <Card className={cn("flex items-center justify-center p-8", className)}>
        <div className="text-center">
          <Grid3X3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">No data available</p>
          <p className="text-sm text-muted-foreground">
            Add {!rowItems?.length ? rowLabel.toLowerCase() : columnLabel.toLowerCase()} to view the compatibility matrix
          </p>
        </div>
      </Card>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Card className={cn("flex items-center justify-center p-8", className)}>
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <p className="text-lg font-medium text-red-600">Error calculating compatibility</p>
          <p className="text-sm text-muted-foreground">
            Please check your compatibility scorer function
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      {(title || searchable || sortable || filterable || exportable) && (
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              {title && <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5" />
                {title}
              </CardTitle>}
              {description && (
                <VisuallyHidden>
                  <div id="matrix-description">{description}</div>
                </VisuallyHidden>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {sortable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (sortBy === 'score') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('score');
                      setSortOrder('desc');
                    }
                  }}
                >
                  <ArrowUpDown className="h-4 w-4 mr-1" />
                  Sort by Score
                </Button>
              )}
              
              {exportable && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Export CSV
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                      Export CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('json')}>
                      Export JSON
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              {exportable && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                      More Options
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleExport('json')}>
                      Export JSON
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          
          {/* Controls */}
          {(searchable || filterable) && (
            <div className="flex items-center gap-4 mt-4">
              {searchable && (
                <div className="flex-1 max-w-sm">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={`Search ${rowLabel.toLowerCase()}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              )}
              
              {filterable && (
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <label htmlFor="compatibility-threshold" className="text-sm font-medium">
                    Minimum Compatibility
                  </label>
                  <Slider
                    id="compatibility-threshold"
                    value={[minCompatibility]}
                    onValueChange={(values) => setMinCompatibility(values[0])}
                    max={100}
                    step={5}
                    className="w-24"
                    aria-label="Minimum Compatibility"
                  />
                  <Badge variant="outline" className="min-w-12">
                    {minCompatibility}%
                  </Badge>
                </div>
              )}
            </div>
          )}
        </CardHeader>
      )}
      
      <CardContent className="p-0">
        <div 
          className="overflow-auto border rounded-lg"
          style={{ maxHeight }}
          data-testid={virtualized ? "virtualized-matrix" : undefined}
        >
          <table 
            ref={tableRef}
            className={cn(
              "w-full border-collapse",
              compact && "text-sm",
              highContrast && "high-contrast"
            )}
            role="table"
            aria-label={`${rowLabel} vs ${columnLabel} compatibility matrix`}
            aria-describedby={description ? "matrix-description" : undefined}
          >
            <thead>
              <tr>
                <th 
                  scope="col" 
                  className="sticky top-0 left-0 z-20 bg-background border-b border-r p-3 text-left font-medium"
                >
                  <div className="flex items-center gap-2">
                    <span>{rowLabel}</span>
                    <div className="text-xs text-muted-foreground">↓</div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{columnLabel}</span>
                    <div className="text-xs text-muted-foreground">→</div>
                  </div>
                </th>
                {columnItems.map((item, index) => (
                  <th 
                    key={item.id}
                    scope="col" 
                    className="sticky top-0 z-10 bg-background border-b p-3 text-center font-medium min-w-24"
                  >
                    {renderColumnHeader ? renderColumnHeader(item, index) : (
                      <div className="space-y-1">
                        <div className="font-medium truncate" title={item.name}>
                          {item.name}
                        </div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground truncate" title={item.description}>
                            {item.description}
                          </div>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((rowItem, rowIndex) => (
                <tr key={rowItem.id}>
                  <th 
                    scope="row" 
                    className="sticky left-0 z-10 bg-background border-r p-3 text-left font-medium"
                  >
                    {renderRowHeader ? renderRowHeader(rowItem, rowIndex) : (
                      <div className="space-y-1">
                        <div className="font-medium truncate" title={rowItem.name}>
                          {rowItem.name}
                        </div>
                        {rowItem.description && (
                          <div className="text-xs text-muted-foreground truncate" title={rowItem.description}>
                            {rowItem.description}
                          </div>
                        )}
                      </div>
                    )}
                  </th>
                  {columnItems.map((columnItem, colIndex) => {
                    const cellData = matrixData.find(d => 
                      d.rowItem.id === rowItem.id && d.columnItem.id === columnItem.id
                    );
                    
                    if (!cellData || cellData.score.score < minCompatibility) {
                      return (
                        <td key={`${rowItem.id}-${columnItem.id}`} className="p-1 text-center border-b">
                          <div className="w-full h-12 flex items-center justify-center text-muted-foreground">
                            -
                          </div>
                        </td>
                      );
                    }

                    const isFocused = focusedCell?.[0] === rowIndex && focusedCell?.[1] === colIndex;

                    return (
                      <td 
                        key={`${rowItem.id}-${columnItem.id}`} 
                        className="p-1 text-center border-b"
                        role="cell"
                        aria-label={`${rowItem.name} compatibility with ${columnItem.name}: ${formatScore(cellData.score.score)} (${cellData.score.level})`}
                      >
                        {interactive ? (
                          <button
                            className={cn(
                              "w-full h-12 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded",
                              isFocused && "ring-2 ring-primary"
                            )}
                            onClick={() => handleCellClick(cellData)}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                            tabIndex={isFocused ? 0 : -1}
                          >
                            {renderCell ? renderCell(cellData) : defaultRenderCell(cellData)}
                          </button>
                        ) : (
                          <div className="w-full h-12">
                            {renderCell ? renderCell(cellData) : defaultRenderCell(cellData)}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default CompatibilityMatrix;