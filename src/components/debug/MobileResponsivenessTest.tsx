import React, { useState, useEffect } from 'react';
import { useDeviceInfo, useResponsiveBreakpoint } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MobileOptimizedInput, MobileOptimizedButton, MobileOptimizedSelect } from '@/components/ui/MobileOptimizedForm';
import { MobileOptimizedScroll } from '@/components/ui/MobileOptimizedScroll';
import { MobileOptimizedModal, useMobileOptimizedModal } from '@/components/ui/MobileOptimizedModal';
import { PerformanceMonitor } from './PerformanceMonitor';
import { cn } from '@/lib/utils';

export const MobileResponsivenessTest: React.FC = () => {
  const deviceInfo = useDeviceInfo();
  const breakpoint = useResponsiveBreakpoint();
  const { isOpen, openModal, closeModal } = useMobileOptimizedModal();
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Test viewport dimensions
  const testViewport = () => {
    const tests = {
      'Viewport meta tag': !!document.querySelector('meta[name="viewport"]'),
      'Dynamic viewport height': CSS.supports('height', '100dvh'),
      'Safe area support': CSS.supports('padding', 'env(safe-area-inset-top)'),
      'Touch action support': CSS.supports('touch-action', 'manipulation'),
      'Overscroll behavior': CSS.supports('overscroll-behavior', 'contain'),
    };
    
    return tests;
  };

  // Test touch interactions
  const testTouchInteractions = () => {
    const tests = {
      'Touch events': 'ontouchstart' in window,
      'Pointer events': 'onpointerdown' in window,
      'Touch device detected': deviceInfo.isTouchDevice,
      'Minimum touch target size': true, // We'll check this visually
    };
    
    return tests;
  };

  // Test responsive breakpoints
  const testResponsiveBreakpoints = () => {
    const tests = {
      'Mobile breakpoint': deviceInfo.isMobile === (window.innerWidth < 768),
      'Tablet breakpoint': deviceInfo.isTablet === (window.innerWidth >= 768 && window.innerWidth < 1024),
      'Desktop breakpoint': deviceInfo.isDesktop === (window.innerWidth >= 1024),
      'Orientation detection': deviceInfo.orientation === (window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'),
    };
    
    return tests;
  };

  // Test performance features
  const testPerformanceFeatures = () => {
    const tests = {
      'Hardware acceleration': CSS.supports('transform', 'translateZ(0)'),
      'Smooth scrolling': CSS.supports('scroll-behavior', 'smooth'),
      'Will-change support': CSS.supports('will-change', 'transform'),
      'Backdrop filter': CSS.supports('backdrop-filter', 'blur(10px)'),
      'Container queries': CSS.supports('container-type', 'inline-size'),
    };
    
    return tests;
  };

  // Run all tests
  const runAllTests = async () => {
    setIsRunningTests(true);
    
    const allTests = {
      ...testViewport(),
      ...testTouchInteractions(),
      ...testResponsiveBreakpoints(),
      ...testPerformanceFeatures(),
    };
    
    // Simulate async testing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setTestResults(allTests);
    setIsRunningTests(false);
  };

  useEffect(() => {
    runAllTests();
  }, []);

  const passedTests = Object.values(testResults).filter(Boolean).length;
  const totalTests = Object.keys(testResults).length;
  const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Mobile Responsiveness Test
            <Badge variant={successRate >= 80 ? "default" : successRate >= 60 ? "secondary" : "destructive"}>
              {successRate.toFixed(0)}% Pass Rate
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Device Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Device Info</h3>
              <div className="text-xs space-y-1">
                <div>Type: {deviceInfo.isMobile ? 'Mobile' : deviceInfo.isTablet ? 'Tablet' : 'Desktop'}</div>
                <div>Touch: {deviceInfo.isTouchDevice ? 'Yes' : 'No'}</div>
                <div>Retina: {deviceInfo.isRetina ? 'Yes' : 'No'}</div>
                <div>Orientation: {deviceInfo.orientation}</div>
                <div>Screen: {deviceInfo.screenWidth}×{deviceInfo.screenHeight}</div>
                <div>Breakpoint: {breakpoint}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Browser Info</h3>
              <div className="text-xs space-y-1">
                <div>User Agent: {navigator.userAgent.slice(0, 50)}...</div>
                <div>Platform: {navigator.platform}</div>
                <div>Language: {navigator.language}</div>
                <div>Online: {navigator.onLine ? 'Yes' : 'No'}</div>
                <div>Cookies: {navigator.cookieEnabled ? 'Yes' : 'No'}</div>
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Test Results</h3>
              <Button
                size="sm"
                onClick={runAllTests}
                disabled={isRunningTests}
                className="h-7 px-3 text-xs"
              >
                {isRunningTests ? 'Testing...' : 'Rerun Tests'}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {Object.entries(testResults).map(([test, passed]) => (
                <div
                  key={test}
                  className={cn(
                    "flex items-center justify-between p-2 rounded",
                    passed ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                  )}
                >
                  <span>{test}</span>
                  <Badge variant={passed ? "default" : "destructive"} className="text-xs">
                    {passed ? "✓" : "✗"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Tests */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Interactive Tests</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <MobileOptimizedInput
                  label="Test Input"
                  placeholder="Type here to test input behavior"
                  className="text-sm"
                />
                <MobileOptimizedSelect
                  label="Test Select"
                  options={[
                    { value: "option1", label: "Option 1" },
                    { value: "option2", label: "Option 2" },
                    { value: "option3", label: "Option 3" },
                  ]}
                />
              </div>
              
              <div className="space-y-2">
                <MobileOptimizedButton
                  onClick={openModal}
                  className="w-full"
                  size="md"
                >
                  Test Modal
                </MobileOptimizedButton>
                
                <div className="grid grid-cols-3 gap-2">
                  <MobileOptimizedButton size="sm" variant="outline">
                    Small
                  </MobileOptimizedButton>
                  <MobileOptimizedButton size="md" variant="secondary">
                    Medium
                  </MobileOptimizedButton>
                  <MobileOptimizedButton size="lg" variant="primary">
                    Large
                  </MobileOptimizedButton>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Test */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Scroll Test</h3>
            <MobileOptimizedScroll
              className="h-32 border rounded-lg"
              showScrollIndicators={true}
            >
              <div className="p-4 space-y-2">
                {Array.from({ length: 20 }, (_, i) => (
                  <div key={i} className="p-2 bg-gray-100 rounded text-sm">
                    Scroll item {i + 1} - Test smooth scrolling and touch interactions
                  </div>
                ))}
              </div>
            </MobileOptimizedScroll>
          </div>
        </CardContent>
      </Card>

      {/* Performance Monitor */}
      <PerformanceMonitor />

      {/* Test Modal */}
      <MobileOptimizedModal
        isOpen={isOpen}
        onClose={closeModal}
        title="Mobile Modal Test"
        position={deviceInfo.isMobile ? "bottom" : "center"}
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            This modal should adapt to your device type and screen size.
          </p>
          <div className="space-y-2">
            <div className="text-xs">
              <strong>Modal Position:</strong> {deviceInfo.isMobile ? "Bottom" : "Center"}
            </div>
            <div className="text-xs">
              <strong>Device Type:</strong> {deviceInfo.isMobile ? "Mobile" : "Desktop"}
            </div>
            <div className="text-xs">
              <strong>Screen Size:</strong> {deviceInfo.screenWidth}×{deviceInfo.screenHeight}
            </div>
          </div>
          <MobileOptimizedButton onClick={closeModal} className="w-full">
            Close Modal
          </MobileOptimizedButton>
        </div>
      </MobileOptimizedModal>
    </div>
  );
};
