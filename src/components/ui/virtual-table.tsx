import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { FixedSizeList as List, VariableSizeList } from 'react-window';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, ChevronUp, ChevronDown } from 'lucide-react';

export interface VirtualTableColumn<T = any> {
  key: string;
  header: string;
  width: number;
  render?: (value: any, item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
}

export interface VirtualTableProps<T = any> {
  data: T[];
  columns: VirtualTableColumn<T>[];
  height: number;
  itemSize?: number;
  overscan?: number;
  onRowClick?: (item: T, index: number) => void;
  searchable?: boolean;
  filterable?: boolean;
  className?: string;
  emptyMessage?: string;
}

interface FilterValue {
  column: string;
  value: string;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  column: string | null;
  direction: SortDirection;
}

// Optimized row renderer for large datasets
const VirtualTableRow = React.memo<{
  index: number;
  style: React.CSSProperties;
  data: {
    items: any[];
    columns: VirtualTableColumn[];
    onRowClick?: (item: any, index: number) => void;
  };
}>(({ index, style, data }) => {
  const { items, columns, onRowClick } = data;
  const item = items[index];

  const handleClick = useCallback(() => {
    onRowClick?.(item, index);
  }, [item, index, onRowClick]);

  return (
    <div
      style={style}
      className="flex border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
      onClick={handleClick}
    >
      {columns.map(column => (
        <div
          key={column.key}
          className="flex items-center px-4 py-3 text-sm"
          style={{
            width: column.width,
            minWidth: column.width,
            maxWidth: column.width,
          }}
        >
          {column.render ? (
            column.render(item[column.key], item, index)
          ) : (
            <span className="truncate">{item[column.key]}</span>
          )}
        </div>
      ))}
    </div>
  );
});

VirtualTableRow.displayName = 'VirtualTableRow';

export function VirtualTable<T = any>({
  data,
  columns,
  height,
  itemSize = 48,
  overscan = 10,
  onRowClick,
  searchable = false,
  filterable = false,
  className = '',
  emptyMessage = 'No data available',
}: VirtualTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterValue[]>([]);
  const [sortState, setSortState] = useState<SortState>({
    column: null,
    direction: null,
  });
  const listRef = useRef<List>(null);

  // Memoized filtered and sorted data for performance
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        columns.some(column => {
          const value = item[column.key];
          return value && String(value).toLowerCase().includes(searchLower);
        })
      );
    }

    // Apply column filters
    if (filters.length > 0) {
      filtered = filtered.filter(item =>
        filters.every(filter => {
          const value = item[filter.column];
          return (
            value &&
            String(value).toLowerCase().includes(filter.value.toLowerCase())
          );
        })
      );
    }

    // Apply sorting
    if (sortState.column) {
      filtered.sort((a, b) => {
        const aVal = a[sortState.column!];
        const bVal = b[sortState.column!];

        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        else if (aVal > bVal) comparison = 1;

        return sortState.direction === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [data, searchTerm, filters, sortState, columns]);

  // Handle column sorting
  const handleSort = useCallback((columnKey: string) => {
    setSortState(prevState => {
      if (prevState.column === columnKey) {
        // Cycle through: asc -> desc -> null
        const direction =
          prevState.direction === 'asc'
            ? 'desc'
            : prevState.direction === 'desc'
              ? null
              : 'asc';
        return { column: direction ? columnKey : null, direction };
      }
      return { column: columnKey, direction: 'asc' };
    });
  }, []);

  // Handle adding column filter
  const handleAddFilter = useCallback((columnKey: string, value: string) => {
    if (!value.trim()) return;

    setFilters(prev => [
      ...prev.filter(f => f.column !== columnKey),
      { column: columnKey, value },
    ]);
  }, []);

  // Handle removing filter
  const handleRemoveFilter = useCallback((columnKey: string) => {
    setFilters(prev => prev.filter(f => f.column !== columnKey));
  }, []);

  // Reset list scroll when data changes
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(0);
    }
  }, [processedData]);

  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);

  return (
    <div className={`virtual-table ${className}`}>
      {/* Search and Filter Controls */}
      {(searchable || filterable) && (
        <div className="mb-4 space-y-2">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          )}

          {filterable && filters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {filters.map(filter => {
                const column = columns.find(col => col.key === filter.column);
                return (
                  <Badge
                    key={filter.column}
                    variant="secondary"
                    className="px-2 py-1"
                  >
                    {column?.header}: {filter.value}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-auto p-0 ml-1"
                      onClick={() => handleRemoveFilter(filter.column)}
                    >
                      ×
                    </Button>
                  </Badge>
                );
              })}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setFilters([])}
                className="h-6 px-2 text-xs"
              >
                Clear All
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Table Header */}
      <div
        className="border-b border-gray-200 bg-gray-50"
        style={{ width: totalWidth }}
      >
        <div className="flex">
          {columns.map(column => (
            <div
              key={column.key}
              className="flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-900"
              style={{
                width: column.width,
                minWidth: column.width,
                maxWidth: column.width,
              }}
            >
              <div className="flex items-center space-x-2">
                <span>{column.header}</span>
                {column.sortable && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-auto p-1"
                    onClick={() => handleSort(column.key)}
                  >
                    {sortState.column === column.key ? (
                      sortState.direction === 'asc' ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )
                    ) : (
                      <Filter className="h-3 w-3 opacity-50" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Virtualized Table Body */}
      <div className="border border-gray-200">
        {processedData.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            {emptyMessage}
          </div>
        ) : (
          <List
            ref={listRef}
            height={height}
            width={totalWidth}
            itemCount={processedData.length}
            itemSize={itemSize}
            overscanCount={overscan}
            itemData={{
              items: processedData,
              columns,
              onRowClick,
            }}
          >
            {VirtualTableRow}
          </List>
        )}
      </div>

      {/* Performance Stats */}
      {processedData.length > 0 && (
        <div className="mt-2 text-xs text-gray-500 flex justify-between">
          <span>
            Showing {processedData.length} of {data.length} items
          </span>
          <span>Virtual scrolling enabled</span>
        </div>
      )}
    </div>
  );
}
