
import React from 'react';
import './AppleControlList.css';
import { cn } from '@/lib/utils';

interface AppleControlItemProps {
    icon: React.ElementType;
    label: string;
    children: React.ReactNode;
    isOpen?: boolean;
    onToggle?: (isOpen: boolean) => void;
    className?: string;
    iconClassName?: string;
}

export function AppleControlItem({
    icon: Icon,
    label,
    children,
    isOpen,
    onToggle,
    className,
    iconClassName
}: AppleControlItemProps) {
    const detailsRef = React.useRef<HTMLDetailsElement>(null);

    const handleToggle = (e: React.SyntheticEvent<HTMLDetailsElement>) => {
        if (onToggle) {
            onToggle(detailsRef.current?.open || false);
        }
    };

    return (
        <details
            ref={detailsRef}
            className={cn("apple-control-item", className)}
            open={isOpen}
            onToggle={handleToggle}
        >
            <summary className="apple-control-label">
                <Icon className={cn("apple-control-icon", iconClassName)} />
                <span>{label}</span>
            </summary>
            <div className="apple-control-body">
                <div className="apple-control-text">
                    {children}
                </div>
            </div>
        </details>
    );
}

interface AppleControlListProps {
    children: React.ReactNode;
    className?: string;
}

export function AppleControlList({ children, className }: AppleControlListProps) {
    return (
        <div className={cn("apple-control-container", className)}>
            {children}
        </div>
    );
}
