// Animated Number Component - Provides smooth transition effects for changing numbers
// Creates a filter/transition effect when numbers change in real-time

import React, { useState, useEffect } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
  formatFunction?: (value: number) => string;
  prefix?: string;
  suffix?: string;
}

export function AnimatedNumber({ 
  value, 
  duration = 1000, 
  className = '', 
  formatFunction,
  prefix = '',
  suffix = ''
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (displayValue !== value) {
      setIsAnimating(true);
      
      const startValue = displayValue;
      const endValue = value;
      const startTime = Date.now();
      
      const animate = () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
        const easedProgress = easeOutCubic(progress);
        
        const currentValue = startValue + (endValue - startValue) * easedProgress;
        setDisplayValue(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayValue(endValue);
          setIsAnimating(false);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [value, duration, displayValue]);

  const formatValue = (val: number) => {
    if (formatFunction) {
      return formatFunction(val);
    }
    return val.toFixed(2);
  };

  return (
    <span 
      className={`${className} ${isAnimating ? 'animate-pulse' : ''} transition-all duration-300`}
      style={{
        filter: isAnimating ? 'brightness(1.2) saturate(1.3)' : 'brightness(1) saturate(1)',
        textShadow: isAnimating ? '0 0 8px rgba(59, 130, 246, 0.5)' : 'none'
      }}
    >
      {prefix}{formatValue(displayValue)}{suffix}
    </span>
  );
}

// Hook for managing animated stats
export function useAnimatedStats<T extends Record<string, number>>(initialStats: T) {
  const [stats, setStats] = useState<T>(initialStats);
  const [previousStats, setPreviousStats] = useState<T>(initialStats);

  const updateStats = (newStats: T) => {
    setPreviousStats(stats);
    setStats(newStats);
  };

  const hasChanged = (key: keyof T) => {
    return previousStats[key] !== stats[key];
  };

  return {
    stats,
    updateStats,
    hasChanged
  };
}
