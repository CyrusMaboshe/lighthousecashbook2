import React, { useEffect, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  decimals?: number;
  separator?: string;
  onComplete?: () => void;
}

export function AnimatedCounter({
  value,
  duration = 2000,
  prefix = '',
  suffix = '',
  className = '',
  decimals = 0,
  separator = ',',
  onComplete
}: AnimatedCounterProps) {
  const [currentValue, setCurrentValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value === currentValue) return;

    setIsAnimating(true);
    const startValue = currentValue;
    const endValue = value;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      const newValue = startValue + (endValue - startValue) * easeOutQuart;
      setCurrentValue(newValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCurrentValue(endValue);
        setIsAnimating(false);
        onComplete?.();
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration, currentValue, onComplete]);

  const formatNumber = (num: number) => {
    const rounded = Number(num.toFixed(decimals));
    return rounded.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  return (
    <span className={`${className} ${isAnimating ? 'animate-pulse' : ''}`}>
      {prefix}{formatNumber(currentValue)}{suffix}
    </span>
  );
}

// Enhanced version with more visual effects
interface EnhancedAnimatedCounterProps extends AnimatedCounterProps {
  showPlusSign?: boolean;
  colorChange?: boolean;
  glowEffect?: boolean;
  bounceEffect?: boolean;
}

export function EnhancedAnimatedCounter({
  value,
  duration = 2000,
  prefix = '',
  suffix = '',
  className = '',
  decimals = 0,
  separator = ',',
  onComplete,
  showPlusSign = false,
  colorChange = false,
  glowEffect = false,
  bounceEffect = false
}: EnhancedAnimatedCounterProps) {
  const [currentValue, setCurrentValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    if (value === currentValue) return;

    setIsAnimating(true);
    setJustCompleted(false);
    const startValue = currentValue;
    const endValue = value;
    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      const newValue = startValue + (endValue - startValue) * easeOutQuart;
      setCurrentValue(newValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCurrentValue(endValue);
        setIsAnimating(false);
        setJustCompleted(true);
        
        // Remove the completion effect after a short delay
        setTimeout(() => setJustCompleted(false), 1000);
        
        onComplete?.();
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration, currentValue, onComplete]);

  const formatNumber = (num: number) => {
    const rounded = Number(num.toFixed(decimals));
    return rounded.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const getAnimationClasses = () => {
    let classes = className;
    
    if (isAnimating) {
      classes += ' transition-all duration-300';
      if (glowEffect) {
        classes += ' drop-shadow-lg';
      }
    }
    
    if (justCompleted) {
      if (bounceEffect) {
        classes += ' animate-bounce';
      }
      if (colorChange) {
        classes += ' text-green-600';
      }
      if (glowEffect) {
        classes += ' drop-shadow-2xl';
      }
    }
    
    return classes;
  };

  const displayPrefix = showPlusSign && value > 0 ? '+' + prefix : prefix;

  return (
    <span className={getAnimationClasses()}>
      {displayPrefix}{formatNumber(currentValue)}{suffix}
    </span>
  );
}

// Cash-in specific animated counter with money styling
interface CashInCounterProps {
  amount: number;
  currency?: string;
  onAnimationComplete?: () => void;
  showCelebration?: boolean;
  className?: string;
}

export function CashInCounter({
  amount,
  currency = 'ZMW',
  onAnimationComplete,
  showCelebration = true,
  className = "text-2xl font-bold text-green-600"
}: CashInCounterProps) {
  const [showEffect, setShowEffect] = useState(false);

  const handleComplete = () => {
    if (showCelebration) {
      setShowEffect(true);
      setTimeout(() => setShowEffect(false), 2000);
    }
    onAnimationComplete?.();
  };

  return (
    <div className="relative">
      <EnhancedAnimatedCounter
        value={amount}
        prefix={`${currency} `}
        decimals={2}
        duration={1500}
        className={className}
        colorChange={true}
        glowEffect={true}
        bounceEffect={true}
        onComplete={handleComplete}
      />

      {showEffect && (
        <div className="absolute -top-2 -right-2 animate-ping">
          <div className="w-4 h-4 bg-green-400 rounded-full opacity-75"></div>
        </div>
      )}

      {showEffect && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full">
            <span className="text-green-500 text-sm font-medium animate-bounce">
              💰 Cash In!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Cash-out specific animated counter
interface CashOutCounterProps {
  amount: number;
  currency?: string;
  onAnimationComplete?: () => void;
  className?: string;
}

export function CashOutCounter({
  amount,
  currency = 'ZMW',
  onAnimationComplete,
  className = "text-2xl font-bold text-red-600"
}: CashOutCounterProps) {
  return (
    <EnhancedAnimatedCounter
      value={amount}
      prefix={`${currency} `}
      decimals={2}
      duration={1500}
      className={className}
      colorChange={true}
      glowEffect={true}
      onComplete={onAnimationComplete}
    />
  );
}

// Balance counter with dynamic color based on positive/negative
interface BalanceCounterProps {
  balance: number;
  currency?: string;
  onAnimationComplete?: () => void;
  className?: string;
}

export function BalanceCounter({
  balance,
  currency = 'ZMW',
  onAnimationComplete,
  className
}: BalanceCounterProps) {
  const isPositive = balance >= 0;

  // Use provided className or default color-based styling
  const finalClassName = className || `text-3xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`;

  return (
    <EnhancedAnimatedCounter
      value={balance}
      prefix={`${currency} `}
      decimals={2}
      duration={2000}
      className={finalClassName}
      showPlusSign={isPositive}
      colorChange={true}
      glowEffect={true}
      bounceEffect={true}
      onComplete={onAnimationComplete}
    />
  );
}

// Simple Counter - No fancy effects, just clean counting animation
interface SimpleCounterProps {
  amount: number;
  currency?: string;
  className?: string;
  decimals?: number;
}

export function SimpleCounter({
  amount,
  currency = 'ZMW',
  className = "text-2xl font-bold",
  decimals = 2
}: SimpleCounterProps) {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    const startValue = currentValue;
    const endValue = amount;
    const duration = 1000; // 1 second animation
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const value = startValue + (endValue - startValue) * easeOutQuart;

      setCurrentValue(value);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [amount]);

  const formatNumber = (num: number) => {
    return num.toFixed(decimals);
  };

  return (
    <span className={className}>
      {currency} {formatNumber(currentValue)}
    </span>
  );
}
