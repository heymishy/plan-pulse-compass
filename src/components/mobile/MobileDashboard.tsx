import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePWA } from '@/hooks/usePWA';
import {
  TrendingUp,
  Users,
  FolderOpen,
  Calendar,
  AlertTriangle,
  Download,
  Wifi,
  WifiOff,
  Target,
} from 'lucide-react';

interface MobileDashboardProps {
  stats: {
    totalPeople: number;
    totalTeams: number;
    totalProjects: number;
    currentIteration: string;
    attentionItemsCount: number;
    quarterProgress: number;
  };
  quickActions: Array<{
    label: string;
    href: string;
    icon: React.ReactNode;
    variant?: 'default' | 'secondary' | 'destructive';
  }>;
}

const MobileDashboard: React.FC<MobileDashboardProps> = ({
  stats,
  quickActions,
}) => {
  const isMobile = useIsMobile();
  const { isInstallable, isOffline, install, isSupported } = usePWA();

  if (!isMobile) return null;

  return (
    <div className="space-y-4 p-4">
      {/* PWA Install Banner */}
      {isInstallable && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Install App</p>
                  <p className="text-sm text-blue-700">
                    Get faster access and offline support
                  </p>
                </div>
              </div>
              <Button
                onClick={install}
                size="sm"
                variant="outline"
                className="border-blue-300"
              >
                Install
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Offline Status Banner */}
      {isOffline && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <WifiOff className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900">You're offline</p>
                <p className="text-sm text-orange-700">
                  Some features may be limited
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.totalPeople}</p>
              <p className="text-sm text-muted-foreground">People</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.totalTeams}</p>
              <p className="text-sm text-muted-foreground">Teams</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{stats.totalProjects}</p>
              <p className="text-sm text-muted-foreground">Projects</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{stats.quarterProgress}%</p>
              <p className="text-sm text-muted-foreground">Quarter</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Current Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Iteration</span>
            <Badge variant="outline">{stats.currentIteration}</Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Quarter Progress</span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${stats.quarterProgress}%` }}
                />
              </div>
              <span className="text-sm font-medium">
                {stats.quarterProgress}%
              </span>
            </div>
          </div>

          {stats.attentionItemsCount > 0 && (
            <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">
                  Attention Needed
                </span>
              </div>
              <Badge variant="destructive" className="text-xs">
                {stats.attentionItemsCount}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                className="h-16 flex flex-col gap-1 p-2"
                asChild
              >
                <a href={action.href}>
                  {action.icon}
                  <span className="text-xs text-center">{action.label}</span>
                </a>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <div className="flex items-center justify-center gap-2 py-2">
        {isOffline ? (
          <WifiOff className="h-4 w-4 text-red-500" />
        ) : (
          <Wifi className="h-4 w-4 text-green-500" />
        )}
        <span className="text-xs text-muted-foreground">
          {isOffline ? 'Offline Mode' : 'Connected'}
        </span>
        {isSupported && (
          <Badge variant="secondary" className="text-xs">
            PWA Ready
          </Badge>
        )}
      </div>
    </div>
  );
};

export default MobileDashboard;
