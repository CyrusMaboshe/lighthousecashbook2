import React from 'react';

interface AnimatedNumberProps {
  value?: number;
  amount?: number;
  currency?: string;
  decimals?: number;
  className?: string;
}

export function AnimatedNumber({ value, amount, currency = '', decimals = 2, className = '' }: AnimatedNumberProps) {
  const safeAmount = value ?? amount ?? 0;
  const formattedAmount = typeof safeAmount === 'number' ?
    safeAmount.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }) :
    '0.00';

  return (
    <span className={className}>
      {currency && `${currency} `}{formattedAmount}
    </span>
  );
}