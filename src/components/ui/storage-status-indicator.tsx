import React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Database,
  Layers,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';

interface StorageStatusIndicatorProps {
  isLoading?: boolean;
  error?: string | null;
  stats?: {
    isChunked: boolean;
    chunkCount: number;
    totalSize: number;
    compressionRatio: number;
  };
  itemCount?: number;
  dataType?: string;
}

export const StorageStatusIndicator: React.FC<StorageStatusIndicatorProps> = ({
  isLoading = false,
  error = null,
  stats,
  itemCount = 0,
  dataType = 'items',
}) => {
  if (isLoading) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Loading {dataType}...
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Loading data from secure storage</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (error) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="destructive"
              className="text-red-700 border-red-300 bg-red-50"
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              Storage Error
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-red-600">Error: {error}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (!stats || itemCount === 0) {
    return (
      <Badge variant="outline" className="text-gray-600 border-gray-200">
        <Database className="h-3 w-3 mr-1" />
        No {dataType}
      </Badge>
    );
  }

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${Math.round(bytes / (1024 * 1024))}MB`;
  };

  const isLargeDataset = stats.isChunked || itemCount > 1000;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`${
              isLargeDataset
                ? 'text-purple-600 border-purple-200 bg-purple-50'
                : 'text-green-600 border-green-200 bg-green-50'
            }`}
          >
            {stats.isChunked ? (
              <>
                <Layers className="h-3 w-3 mr-1" />
                {itemCount.toLocaleString()} {dataType} (chunked)
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                {itemCount.toLocaleString()} {dataType}
              </>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium mb-1">Storage Information</p>
            <div className="space-y-1 text-xs">
              <p>• Items: {itemCount.toLocaleString()}</p>
              <p>• Size: {formatSize(stats.totalSize)}</p>
              {stats.isChunked && (
                <>
                  <p>• Chunks: {stats.chunkCount}</p>
                  <p>• Type: Optimized for large datasets</p>
                </>
              )}
              <p>• Storage: Encrypted local storage</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
