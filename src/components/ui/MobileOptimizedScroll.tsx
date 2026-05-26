import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useDeviceInfo } from '@/hooks/use-mobile';

interface MobileOptimizedScrollProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'vertical' | 'horizontal' | 'both';
  showScrollIndicators?: boolean;
  pullToRefresh?: boolean;
  onRefresh?: () => Promise<void>;
  snapToItems?: boolean;
  itemWidth?: number;
}

export const MobileOptimizedScroll: React.FC<MobileOptimizedScrollProps> = ({
  children,
  className,
  direction = 'vertical',
  showScrollIndicators = true,
  pullToRefresh = false,
  onRefresh,
  snapToItems = false,
  itemWidth
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isMobile, isTouchDevice } = useDeviceInfo();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [showScrollbar, setShowScrollbar] = useState(false);

  // Touch handling for pull-to-refresh
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const isAtTop = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!pullToRefresh || !scrollRef.current) return;
    
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    isAtTop.current = scrollRef.current.scrollTop === 0;
  }, [pullToRefresh]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pullToRefresh || !scrollRef.current || !isAtTop.current) return;

    const touchY = e.touches[0].clientY;
    const touchX = e.touches[0].clientX;
    const deltaY = touchY - touchStartY.current;
    const deltaX = Math.abs(touchX - touchStartX.current);

    // Only handle vertical pulls when at top
    if (deltaY > 0 && deltaX < 50 && deltaY > deltaX) {
      e.preventDefault();
      const distance = Math.min(deltaY * 0.5, 100); // Damping effect
      setPullDistance(distance);
    }
  }, [pullToRefresh]);

  const handleTouchEnd = useCallback(async () => {
    if (!pullToRefresh || pullDistance < 60) {
      setPullDistance(0);
      return;
    }

    setIsRefreshing(true);
    setPullDistance(0);

    try {
      await onRefresh?.();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [pullToRefresh, pullDistance, onRefresh]);

  // Show/hide scrollbar on scroll
  const handleScroll = useCallback(() => {
    if (!showScrollIndicators) return;
    
    setShowScrollbar(true);
    
    // Hide scrollbar after scroll ends
    const timer = setTimeout(() => {
      setShowScrollbar(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [showScrollIndicators]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !isTouchDevice) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('scroll', handleScroll);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleScroll, isTouchDevice]);

  const scrollClasses = {
    vertical: 'overflow-y-auto overflow-x-hidden',
    horizontal: 'overflow-x-auto overflow-y-hidden',
    both: 'overflow-auto'
  };

  const snapClasses = snapToItems ? {
    vertical: 'snap-y snap-mandatory',
    horizontal: 'snap-x snap-mandatory',
    both: 'snap-both snap-mandatory'
  } : {};

  return (
    <div className="relative">
      {/* Pull to refresh indicator */}
      {pullToRefresh && (pullDistance > 0 || isRefreshing) && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-blue-50 border-b border-blue-200 transition-all duration-200 z-10"
          style={{ 
            height: isRefreshing ? '60px' : `${pullDistance}px`,
            transform: `translateY(${isRefreshing ? 0 : -60 + pullDistance}px)`
          }}
        >
          <div className="flex items-center space-x-2 text-blue-600">
            {isRefreshing ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium">Refreshing...</span>
              </>
            ) : pullDistance > 60 ? (
              <>
                <span className="text-lg">↓</span>
                <span className="text-sm font-medium">Release to refresh</span>
              </>
            ) : (
              <>
                <span className="text-lg">↓</span>
                <span className="text-sm font-medium">Pull to refresh</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Scroll container */}
      <div
        ref={scrollRef}
        className={cn(
          "relative",
          scrollClasses[direction],
          snapClasses[direction],
          isMobile && "scroll-smooth",
          isTouchDevice && "-webkit-overflow-scrolling: touch",
          "overscroll-behavior-contain", // Prevent overscroll
          className
        )}
        style={{
          scrollbarWidth: showScrollIndicators ? 'thin' : 'none',
          msOverflowStyle: showScrollIndicators ? 'auto' : 'none',
          WebkitOverflowScrolling: 'touch',
          ...(snapToItems && itemWidth && direction === 'horizontal' && {
            scrollSnapType: 'x mandatory',
            scrollPadding: '0 20px'
          })
        } as React.CSSProperties}
      >
        {/* Content wrapper for snap scrolling */}
        <div 
          className={cn(
            snapToItems && direction === 'horizontal' && "flex space-x-4",
            snapToItems && direction === 'vertical' && "space-y-4"
          )}
        >
          {React.Children.map(children, (child, index) => (
            snapToItems ? (
              <div 
                key={index}
                className={cn(
                  "snap-start flex-shrink-0",
                  direction === 'horizontal' && itemWidth && `w-[${itemWidth}px]`
                )}
              >
                {child}
              </div>
            ) : child
          ))}
        </div>
      </div>

      {/* Custom scrollbar indicator */}
      {showScrollIndicators && showScrollbar && isMobile && (
        <div className={cn(
          "absolute bg-gray-400 rounded-full opacity-60 transition-opacity duration-300 pointer-events-none",
          direction === 'vertical' ? "right-1 top-2 bottom-2 w-1" : "bottom-1 left-2 right-2 h-1"
        )} />
      )}
    </div>
  );
};

// Hook for managing scroll position and behavior
export function useMobileOptimizedScroll() {
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollTo = useCallback((options: { x?: number; y?: number; behavior?: 'smooth' | 'auto' }) => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollTo({
      left: options.x,
      top: options.y,
      behavior: options.behavior || 'smooth'
    });
  }, []);

  const scrollToTop = useCallback(() => {
    scrollTo({ y: 0, behavior: 'smooth' });
  }, [scrollTo]);

  const scrollToBottom = useCallback(() => {
    if (!scrollRef.current) return;
    scrollTo({ y: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [scrollTo]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;

    setScrollPosition({
      x: scrollRef.current.scrollLeft,
      y: scrollRef.current.scrollTop
    });

    setIsScrolling(true);
    
    // Debounce scroll end detection
    const timer = setTimeout(() => {
      setIsScrolling(false);
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    element.addEventListener('scroll', handleScroll, { passive: true });
    return () => element.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return {
    scrollRef,
    scrollPosition,
    isScrolling,
    scrollTo,
    scrollToTop,
    scrollToBottom
  };
}
