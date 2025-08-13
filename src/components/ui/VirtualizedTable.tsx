import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';

interface VirtualizedTableProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => React.ReactElement;
  className?: string;
}

/**
 * High-performance virtualized table for large datasets
 * Renders only visible items to maintain <16ms frame times
 */
export const VirtualizedTable = <T,>({
  items,
  height,
  itemHeight,
  renderItem,
  className = '',
}: VirtualizedTableProps<T>) => {
  const itemCount = items.length;

  const ItemRenderer = useMemo(() => {
    return ({
      index,
      style,
    }: {
      index: number;
      style: React.CSSProperties;
    }) => {
      return renderItem({ index, style });
    };
  }, [renderItem]);

  return (
    <div className={`border rounded-lg ${className}`}>
      <List
        height={height}
        itemCount={itemCount}
        itemSize={itemHeight}
        width="100%"
      >
        {ItemRenderer}
      </List>
    </div>
  );
};

export default VirtualizedTable;
