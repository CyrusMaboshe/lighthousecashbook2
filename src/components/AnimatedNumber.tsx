
import React, { useEffect, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function AnimatedNumber({ 
  value, 
  className = '', 
  prefix = '', 
  suffix = '', 
  decimals = 0 
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value || 0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const safeValue = value || 0;
    if (displayValue !== safeValue) {
      setIsAnimating(true);
      
      const startValue = displayValue;
      const endValue = safeValue;
      const duration = 800; // Animation duration in ms
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        const currentValue = startValue + (endValue - startValue) * easeOut;
        setDisplayValue(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [value, displayValue]);

  const formatNumber = (num: number) => {
    const safeNum = num || 0;
    return safeNum.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  return (
    <span 
      className={`
        inline-block transition-all duration-500 
        ${isAnimating ? 'text-primary' : ''} 
        ${className}
      `}
    >
      {prefix}{formatNumber(displayValue)}{suffix}
    </span>
  );
}
