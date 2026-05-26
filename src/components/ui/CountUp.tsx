import React, { useState, useEffect, useRef } from 'react';

interface CountUpProps {
    end: number;
    duration?: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
}

export const CountUp = ({
    end,
    duration = 1500,
    decimals = 2,
    prefix = '',
    suffix = ''
}: CountUpProps) => {
    const [count, setCount] = useState(end);
    const startValueRef = useRef(end);
    const startTimeRef = useRef<number | null>(null);
    const requestRef = useRef<number>();

    useEffect(() => {
        // Only animate if value changes significantly or on mount
        startValueRef.current = count;
        startTimeRef.current = null;

        const animate = (timestamp: number) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);

            // Ease Out Expo: 1 - Math.pow(2, -10 * x)
            const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

            const nextCount = startValueRef.current + (end - startValueRef.current) * ease;
            setCount(nextCount);

            if (progress < 1) {
                requestRef.current = requestAnimationFrame(animate);
            } else {
                setCount(end);
            }
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [end, duration]);

    const formattedNumber = count.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });

    return <>{prefix}{formattedNumber}{suffix}</>;
};
