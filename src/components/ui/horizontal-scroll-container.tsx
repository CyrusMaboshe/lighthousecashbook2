import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HorizontalScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  showButtons?: boolean;
  buttonSize?: 'sm' | 'md' | 'lg';
  scrollAmount?: number;
}

export function HorizontalScrollContainer({
  children,
  className,
  showButtons = true,
  buttonSize = 'md',
  scrollAmount = 200
}: HorizontalScrollContainerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const checkScrollability = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollability();
    const handleResize = () => checkScrollability();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollLeft = () => {
    if (scrollRef.current && !isScrolling) {
      setIsScrolling(true);
      scrollRef.current.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(() => setIsScrolling(false), 300);
    }
  };

  const scrollRight = () => {
    if (scrollRef.current && !isScrolling) {
      setIsScrolling(true);
      scrollRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(() => setIsScrolling(false), 300);
    }
  };

  const handleScroll = () => {
    checkScrollability();
  };

  const buttonSizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <div className="relative group">
      {/* Left Scroll Button */}
      {showButtons && canScrollLeft && (
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 opacity-0 group-hover:opacity-100",
            buttonSizeClasses[buttonSize]
          )}
          onClick={scrollLeft}
          disabled={isScrolling}
        >
          <ChevronLeft className={iconSizeClasses[buttonSize]} />
        </Button>
      )}

      {/* Right Scroll Button */}
      {showButtons && canScrollRight && (
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border-slate-200 shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 opacity-0 group-hover:opacity-100",
            buttonSizeClasses[buttonSize]
          )}
          onClick={scrollRight}
          disabled={isScrolling}
        >
          <ChevronRight className={iconSizeClasses[buttonSize]} />
        </Button>
      )}

      {/* Scrollable Content */}
      <div
        ref={scrollRef}
        className={cn(
          "overflow-x-auto overflow-y-hidden scrollbar-hide",
          className
        )}
        onScroll={handleScroll}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {children}
      </div>

      {/* Scroll Indicators */}
      {showButtons && (
        <>
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white/80 to-transparent pointer-events-none z-5" />
          )}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/80 to-transparent pointer-events-none z-5" />
          )}
        </>
      )}
    </div>
  );
}
