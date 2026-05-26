import React, { useState, useEffect } from 'react';
import { performanceMonitor, cacheManager, networkMonitor } from '@/lib/queryClient';
import { useDeviceInfo } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PerformanceStats {
  totalQueries: number;
  averageDuration: number;
  maxDuration: number;
  minDuration: number;
  slowQueries: any[];
}

export const PerformanceMonitor: React.FC<{ className?: string }> = ({ className }) => {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [cacheSize, setCacheSize] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showDetails, setShowDetails] = useState(false);
  const { isMobile, screenWidth, screenHeight, orientation } = useDeviceInfo();

  useEffect(() => {
    const updateStats = () => {
      setStats(performanceMonitor.getStats());
      setCacheSize(cacheManager.getCacheSize());
      setIsOnline(navigator.onLine);
    };

    // Update stats every 5 seconds
    const interval = setInterval(updateStats, 5000);
    updateStats(); // Initial update

    // Setup network listeners
    const cleanup = networkMonitor.setupNetworkListeners();

    return () => {
      clearInterval(interval);
      cleanup();
    };
  }, []);

  const handleClearCache = () => {
    cacheManager.clearAll();
    setCacheSize(0);
  };

  const handleClearPerformanceData = () => {
    performanceMonitor.clear();
    setStats(null);
  };

  if (!stats && cacheSize === 0) {
    return null; // Don't show if no data
  }

  return (
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          Performance Monitor
          <div className="flex items-center space-x-2">
            <Badge variant={isOnline ? "default" : "destructive"} className="text-xs">
              {isOnline ? "Online" : "Offline"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="h-6 px-2 text-xs"
            >
              {showDetails ? "Hide" : "Show"}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Basic Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-50 p-2 rounded">
            <div className="font-medium text-gray-600">Cache Size</div>
            <div className="text-lg font-bold">{cacheSize}</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="font-medium text-gray-600">Queries</div>
            <div className="text-lg font-bold">{stats?.totalQueries || 0}</div>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-blue-50 p-2 rounded">
              <div className="font-medium text-blue-600">Avg Time</div>
              <div className="text-lg font-bold text-blue-800">
                {stats.averageDuration.toFixed(0)}ms
              </div>
            </div>
            <div className="bg-red-50 p-2 rounded">
              <div className="font-medium text-red-600">Slow Queries</div>
              <div className="text-lg font-bold text-red-800">
                {stats.slowQueries.length}
              </div>
            </div>
          </div>
        )}

        {/* Device Info */}
        {showDetails && (
          <div className="space-y-2 text-xs">
            <div className="border-t pt-2">
              <div className="font-medium text-gray-600 mb-1">Device Info</div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div>Type: {isMobile ? "Mobile" : "Desktop"}</div>
                <div>Orientation: {orientation}</div>
                <div>Screen: {screenWidth}×{screenHeight}</div>
                <div>DPR: {window.devicePixelRatio}</div>
              </div>
            </div>

            {stats && stats.slowQueries.length > 0 && (
              <div className="border-t pt-2">
                <div className="font-medium text-red-600 mb-1">Slow Queries</div>
                <div className="space-y-1 max-h-20 overflow-y-auto">
                  {stats.slowQueries.slice(0, 3).map((query, index) => (
                    <div key={index} className="text-xs bg-red-50 p-1 rounded">
                      <div className="font-mono text-red-800 truncate">
                        {query.queryKey}
                      </div>
                      <div className="text-red-600">
                        {query.duration.toFixed(0)}ms
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Memory Usage (if available) */}
            {(performance as any).memory && (
              <div className="border-t pt-2">
                <div className="font-medium text-gray-600 mb-1">Memory</div>
                <div className="text-xs">
                  Used: {((performance as any).memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCache}
            className="flex-1 text-xs h-7"
          >
            Clear Cache
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearPerformanceData}
            className="flex-1 text-xs h-7"
          >
            Clear Stats
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Hook for performance monitoring
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    componentMounts: 0,
    reRenders: 0,
  });

  const trackRender = React.useCallback((componentName: string) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > 16) { // Longer than one frame (60fps)
        console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
      
      setMetrics(prev => ({
        ...prev,
        renderTime: prev.renderTime + renderTime,
        reRenders: prev.reRenders + 1,
      }));
    };
  }, []);

  const trackMount = React.useCallback((componentName: string) => {
    setMetrics(prev => ({
      ...prev,
      componentMounts: prev.componentMounts + 1,
    }));
    
    console.log(`Component mounted: ${componentName}`);
  }, []);

  return {
    metrics,
    trackRender,
    trackMount,
  };
}

// HOC for automatic performance tracking
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  const TrackedComponent = React.forwardRef<any, P>((props, ref) => {
    const { trackRender, trackMount } = usePerformanceMonitoring();
    
    React.useEffect(() => {
      trackMount(componentName);
    }, [trackMount]);

    React.useEffect(() => {
      const cleanup = trackRender(componentName);
      return cleanup;
    });

    return <WrappedComponent {...props as any} ref={ref} />;
  });

  TrackedComponent.displayName = `withPerformanceTracking(${componentName})`;
  return TrackedComponent;
}

// Performance-aware component wrapper
export const PerformanceAware: React.FC<{
  children: React.ReactNode;
  name: string;
  threshold?: number;
}> = ({ children, name, threshold = 16 }) => {
  const renderStartTime = React.useRef(performance.now());
  
  React.useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    
    if (renderTime > threshold) {
      console.warn(`Performance warning: ${name} took ${renderTime.toFixed(2)}ms to render`);
    }
  });

  return <>{children}</>;
};
