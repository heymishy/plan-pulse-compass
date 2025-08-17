import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
} from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

interface OfflineData {
  lastSync: Date;
  pendingChanges: number;
  cachedPages: string[];
  dataSize: number;
}

const OfflineIndicator: React.FC = () => {
  const { isOffline, isSupported } = usePWA();
  const [offlineData, setOfflineData] = useState<OfflineData>({
    lastSync: new Date(),
    pendingChanges: 0,
    cachedPages: [],
    dataSize: 0,
  });
  const [isRetrying, setIsRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check offline data status
    const checkOfflineData = async () => {
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          const totalSize = await Promise.all(
            cacheNames.map(async cacheName => {
              const cache = await caches.open(cacheName);
              const requests = await cache.keys();
              return requests.length;
            })
          );

          setOfflineData(prev => ({
            ...prev,
            cachedPages: cacheNames,
            dataSize: totalSize.reduce((a, b) => a + b, 0),
          }));
        } catch (error) {
          console.error('Failed to check offline data:', error);
        }
      }

      // Check for pending changes in localStorage
      const pendingData = localStorage.getItem('pendingSync');
      if (pendingData) {
        try {
          const pending = JSON.parse(pendingData);
          setOfflineData(prev => ({
            ...prev,
            pendingChanges: Array.isArray(pending) ? pending.length : 0,
          }));
        } catch (error) {
          console.error('Failed to parse pending sync data:', error);
        }
      }
    };

    checkOfflineData();

    // Update check every 30 seconds when offline
    const interval = isOffline ? setInterval(checkOfflineData, 30000) : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOffline]);

  const handleRetryConnection = async () => {
    setIsRetrying(true);

    try {
      // Try to fetch a small resource to test connection
      const response = await fetch('/favicon.ico', {
        cache: 'no-cache',
        mode: 'no-cors',
      });

      if (response) {
        // Connection restored, sync pending data
        await syncPendingData();
        setOfflineData(prev => ({
          ...prev,
          lastSync: new Date(),
          pendingChanges: 0,
        }));
      }
    } catch (error) {
      console.log('Still offline:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const syncPendingData = async () => {
    const pendingData = localStorage.getItem('pendingSync');
    if (pendingData) {
      try {
        const pending = JSON.parse(pendingData);
        console.log('Syncing pending data:', pending);
        // Implement actual sync logic here
        localStorage.removeItem('pendingSync');
      } catch (error) {
        console.error('Failed to sync pending data:', error);
      }
    }
  };

  const formatDataSize = (size: number) => {
    if (size < 1024) return `${size} items`;
    return `${Math.round(size / 1024)} KB`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isSupported && !isOffline) return null;

  return (
    <div className="space-y-2">
      {/* Connection Status Bar */}
      <div
        className={`flex items-center justify-between p-2 rounded-lg ${
          isOffline
            ? 'bg-orange-50 border border-orange-200'
            : 'bg-green-50 border border-green-200'
        }`}
      >
        <div className="flex items-center gap-2">
          {isOffline ? (
            <WifiOff className="h-4 w-4 text-orange-600" />
          ) : (
            <Wifi className="h-4 w-4 text-green-600" />
          )}
          <span
            className={`text-sm font-medium ${
              isOffline ? 'text-orange-800' : 'text-green-800'
            }`}
          >
            {isOffline ? 'Offline Mode' : 'Online'}
          </span>

          {offlineData.pendingChanges > 0 && (
            <Badge variant="secondary" className="text-xs">
              {offlineData.pendingChanges} pending
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isOffline && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetryConnection}
              disabled={isRetrying}
              className="h-6 px-2 text-xs border-orange-300"
            >
              {isRetrying ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                'Retry'
              )}
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowDetails(!showDetails)}
            className="h-6 px-2 text-xs"
          >
            {showDetails ? 'Hide' : 'Details'}
          </Button>
        </div>
      </div>

      {/* Detailed Offline Status */}
      {showDetails && (
        <Card className="text-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Offline Capabilities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Last sync</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span>{formatTime(offlineData.lastSync)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Cached data</span>
              <div className="flex items-center gap-1">
                <Download className="h-3 w-3 text-muted-foreground" />
                <span>{formatDataSize(offlineData.dataSize)}</span>
              </div>
            </div>

            {offlineData.pendingChanges > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Pending changes</span>
                <Badge variant="outline" className="text-xs">
                  {offlineData.pendingChanges}
                </Badge>
              </div>
            )}

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                {isOffline
                  ? 'You can continue working. Changes will sync when back online.'
                  : 'All data is synced and up to date.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Offline Alert */}
      {isOffline && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You're working offline. Some features may be limited, but your
            changes are being saved locally.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default OfflineIndicator;
