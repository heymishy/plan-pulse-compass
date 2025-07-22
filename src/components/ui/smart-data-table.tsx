/**
 * Smart Data Table Component
 * Enhanced data table with loading states, error handling, and built-in actions
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from './data-table';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

export interface PaginationConfig {
  /** Current page (0-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of items */
  total: number;
  /** Page change handler */
  onPageChange: (page: number) => void;
  /** Page size change handler */
  onPageSizeChange?: (pageSize: number) => void;
}

export interface SmartDataTableProps<T> {
  /** Table data */
  data: T[];
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
  /** Row selection handler */
  onRowSelect?: (rows: T[]) => void;
  /** Column sorting handler */
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  /** Filter change handler */
  onFilter?: (filters: Record<string, any>) => void;
  /** Pagination configuration */
  pagination?: PaginationConfig;
  /** Action buttons/components */
  actions?: React.ReactNode;
  /** Empty state message */
  emptyMessage?: string;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Custom error component */
  errorComponent?: React.ReactNode;
  /** Table container className */
  className?: string;
  /** Enable row selection */
  enableSelection?: boolean;
  /** Enable column resizing */
  enableResizing?: boolean;
  /** Enable column visibility toggle */
  enableColumnVisibility?: boolean;
}

// Loading skeleton for tables
const DataTableSkeleton: React.FC<{
  columns: number;
  rows?: number;
  className?: string;
}> = ({ columns, rows = 10, className }) => (
  <div className={cn('w-full space-y-3', className)}>
    {/* Header skeleton */}
    <div className="flex space-x-2 border-b pb-3">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={`header-${i}`} className="h-4 flex-1" />
      ))}
    </div>

    {/* Row skeletons */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="flex space-x-2 py-2">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton
            key={`cell-${rowIndex}-${colIndex}`}
            className="h-4 flex-1"
          />
        ))}
      </div>
    ))}
  </div>
);

// Empty state component
const EmptyState: React.FC<{
  message: string;
  className?: string;
}> = ({ message, className }) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center py-12 text-center',
      className
    )}
  >
    <div className="rounded-full bg-muted p-3 mb-4">
      <AlertCircle className="h-6 w-6 text-muted-foreground" />
    </div>
    <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
  </div>
);

const SmartDataTable = <T,>({
  data,
  columns,
  loading = false,
  error = null,
  onRowSelect,
  onSort,
  onFilter,
  pagination,
  actions,
  emptyMessage = 'No data available',
  loadingComponent,
  errorComponent,
  className,
  enableSelection = false,
  enableResizing = true,
  enableColumnVisibility = true,
}: SmartDataTableProps<T>): React.ReactElement => {
  // Loading state
  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        {actions && (
          <div className="flex justify-between items-center">
            <div className="flex-1" />
            <div className="flex gap-2">{actions}</div>
          </div>
        )}
        {loadingComponent || (
          <DataTableSkeleton
            columns={columns.length}
            rows={pagination?.pageSize || 10}
          />
        )}
      </div>
    );
  }

  // Error state
  if (error) {
    const defaultErrorComponent = (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Data</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );

    return (
      <div className={cn('space-y-4', className)}>
        {actions && (
          <div className="flex justify-between items-center">
            <div className="flex-1" />
            <div className="flex gap-2">{actions}</div>
          </div>
        )}
        {errorComponent || defaultErrorComponent}
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className={cn('space-y-4', className)}>
        {actions && (
          <div className="flex justify-between items-center">
            <div className="flex-1" />
            <div className="flex gap-2">{actions}</div>
          </div>
        )}
        <EmptyState message={emptyMessage} />
      </div>
    );
  }

  // Main table render
  return (
    <div className={cn('space-y-4', className)}>
      {/* Actions bar */}
      {actions && (
        <div className="flex justify-between items-center">
          <div className="flex-1">
            {/* Could add bulk selection info here */}
          </div>
          <div className="flex gap-2">{actions}</div>
        </div>
      )}

      {/* Data table */}
      <DataTable
        data={data}
        columns={columns}
        onRowSelect={onRowSelect}
        onSort={onSort}
        onFilter={onFilter}
        pagination={pagination}
        enableSelection={enableSelection}
        enableResizing={enableResizing}
        enableColumnVisibility={enableColumnVisibility}
      />

      {/* Pagination info */}
      {pagination && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing{' '}
            {Math.min(
              pagination.page * pagination.pageSize + 1,
              pagination.total
            )}
            -
            {Math.min(
              (pagination.page + 1) * pagination.pageSize,
              pagination.total
            )}{' '}
            of {pagination.total} results
          </div>
          <div>
            Page {pagination.page + 1} of{' '}
            {Math.ceil(pagination.total / pagination.pageSize)}
          </div>
        </div>
      )}
    </div>
  );
};

// Export types for external use
export type { ColumnDef };
export { SmartDataTable, DataTableSkeleton, EmptyState };
