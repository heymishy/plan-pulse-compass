import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info, GitBranch, Calendar, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VersionInfo {
  version: string;
  buildNumber: string;
  commitHash: string;
  commitHashShort: string;
  buildDate: string;
  branch: string;
  environment: string;
}

interface VersionInfoProps {
  variant?: 'compact' | 'detailed' | 'footer';
  className?: string;
  showTooltip?: boolean;
}

// This will be injected by the build process
declare global {
  interface Window {
    __VERSION_INFO__?: VersionInfo;
  }
}

const getVersionInfo = (): VersionInfo => {
  // In production, this comes from the build process
  if (typeof window !== 'undefined' && window.__VERSION_INFO__) {
    return window.__VERSION_INFO__;
  }

  // Fallback for development
  return {
    version: process.env.npm_package_version || '0.0.0',
    buildNumber: process.env.BUILD_NUMBER || 'dev',
    commitHash: process.env.COMMIT_HASH || 'dev',
    commitHashShort: process.env.COMMIT_HASH_SHORT || 'dev',
    buildDate: process.env.BUILD_DATE || new Date().toISOString(),
    branch: process.env.BRANCH || 'dev',
    environment: process.env.NODE_ENV || 'development',
  };
};

export const VersionInfo: React.FC<VersionInfoProps> = ({
  variant = 'compact',
  className,
  showTooltip = true,
}) => {
  const versionInfo = getVersionInfo();
  const isProduction = versionInfo.environment === 'production';

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getCommitUrl = (hash: string) => {
    // You can customize this URL based on your repository
    return `https://github.com/heymishy/plan-pulse-compass/commit/${hash}`;
  };

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'text-xs text-muted-foreground hover:text-foreground',
                className
              )}
            >
              <Info className="h-3 w-3 mr-1" />v{versionInfo.version}
              {isProduction && (
                <Badge variant="outline" className="ml-1 text-xs">
                  #{versionInfo.buildNumber}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 text-xs">
              <div>
                <strong>Version:</strong> {versionInfo.version}
              </div>
              <div>
                <strong>Build:</strong> #{versionInfo.buildNumber}
              </div>
              <div>
                <strong>Commit:</strong> {versionInfo.commitHashShort}
              </div>
              <div>
                <strong>Built:</strong> {formatDate(versionInfo.buildDate)}
              </div>
              <div>
                <strong>Branch:</strong> {versionInfo.branch}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === 'footer') {
    return (
      <div
        className={cn(
          'flex items-center justify-between text-xs text-muted-foreground',
          className
        )}
      >
        <div className="flex items-center space-x-4">
          <span>v{versionInfo.version}</span>
          <span>Build #{versionInfo.buildNumber}</span>
          <span className="flex items-center">
            <Hash className="h-3 w-3 mr-1" />
            {versionInfo.commitHashShort}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <GitBranch className="h-3 w-3 mr-1" />
            {versionInfo.branch}
          </span>
          <span className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(versionInfo.buildDate)}
          </span>
        </div>
      </div>
    );
  }

  // Detailed variant
  return (
    <div className={cn('space-y-3 p-4 border rounded-lg bg-card', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Build Information</h3>
        <Badge variant={isProduction ? 'default' : 'secondary'}>
          {versionInfo.environment}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground">Version</div>
          <div className="font-mono">{versionInfo.version}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Build Number</div>
          <div className="font-mono">#{versionInfo.buildNumber}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Commit Hash</div>
          <div className="font-mono">
            {isProduction ? (
              <a
                href={getCommitUrl(versionInfo.commitHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {versionInfo.commitHashShort}
              </a>
            ) : (
              versionInfo.commitHashShort
            )}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">Branch</div>
          <div className="font-mono">{versionInfo.branch}</div>
        </div>
        <div className="col-span-2">
          <div className="text-muted-foreground">Build Date</div>
          <div className="font-mono">{formatDate(versionInfo.buildDate)}</div>
        </div>
      </div>
    </div>
  );
};

export const VersionBadge: React.FC<{ className?: string }> = ({
  className,
}) => {
  const versionInfo = getVersionInfo();

  return (
    <Badge variant="outline" className={cn('text-xs font-mono', className)}>
      v{versionInfo.version}-{versionInfo.buildNumber}
    </Badge>
  );
};
