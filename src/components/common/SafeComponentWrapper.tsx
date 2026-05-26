// Safe Component Wrapper - Prevents white pages with comprehensive error handling
// This wrapper provides multiple layers of protection against rendering failures

import React, { Suspense, ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

interface SafeComponentWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  loadingComponent?: ReactNode;
  name?: string;
}

// Default loading component
const DefaultLoadingComponent = ({ name }: { name?: string }) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
      <p className="text-gray-600">Loading {name || 'component'}...</p>
    </div>
  </div>
);

// Default error fallback
const DefaultErrorFallback = ({ name }: { name?: string }) => (
  <Card className="max-w-md mx-auto mt-8">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-red-600">
        <AlertCircle className="h-5 w-5" />
        Component Error
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-gray-600 mb-4">
        The {name || 'component'} failed to load. This has been logged for investigation.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Reload Page
      </button>
    </CardContent>
  </Card>
);

export function SafeComponentWrapper({
  children,
  fallback,
  loadingComponent,
  name = 'component'
}: SafeComponentWrapperProps) {
  const errorFallback = fallback || <DefaultErrorFallback name={name} />;
  const loading = loadingComponent || <DefaultLoadingComponent name={name} />;

  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={loading}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

// Higher-order component version
export function withSafeWrapper<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    name?: string;
    fallback?: ReactNode;
    loadingComponent?: ReactNode;
  }
) {
  return function SafeWrappedComponent(props: P) {
    return (
      <SafeComponentWrapper
        name={options?.name}
        fallback={options?.fallback}
        loadingComponent={options?.loadingComponent}
      >
        <Component {...props} />
      </SafeComponentWrapper>
    );
  };
}

// Hook for safe async operations
export function useSafeAsync<T>(
  asyncFn: () => Promise<T>,
  deps: React.DependencyList = []
) {
  const [state, setState] = React.useState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: true,
    error: null
  });

  React.useEffect(() => {
    let cancelled = false;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    asyncFn()
      .then(data => {
        if (!cancelled) {
          setState({ data, loading: false, error: null });
        }
      })
      .catch(error => {
        if (!cancelled) {
          console.error('Safe async operation failed:', error);
          setState({ data: null, loading: false, error });
        }
      });

    return () => {
      cancelled = true;
    };
  }, deps);

  return state;
}
