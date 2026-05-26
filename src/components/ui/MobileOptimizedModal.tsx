import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDeviceInfo } from '@/hooks/use-mobile';

interface MobileOptimizedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'center' | 'bottom' | 'top';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

export const MobileOptimizedModal: React.FC<MobileOptimizedModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  position = 'center',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className
}) => {
  const { isMobile } = useDeviceInfo();
  const modalRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeOnEscape, isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    // Add safe area padding for mobile devices
    if (isMobile) {
      document.body.style.paddingBottom = 'env(safe-area-inset-bottom)';
    }

    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingBottom = '';
    };
  }, [isOpen, isMobile]);

  // Animation handling
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const sizeClasses = {
    sm: isMobile ? 'max-w-sm' : 'max-w-md',
    md: isMobile ? 'max-w-md' : 'max-w-lg',
    lg: isMobile ? 'max-w-lg' : 'max-w-2xl',
    xl: isMobile ? 'max-w-xl' : 'max-w-4xl',
    full: 'max-w-full'
  };

  const positionClasses = {
    center: 'items-center justify-center',
    bottom: isMobile ? 'items-end justify-center' : 'items-center justify-center',
    top: 'items-start justify-center pt-16'
  };

  const modalClasses = {
    center: 'rounded-lg',
    bottom: isMobile ? 'rounded-t-2xl rounded-b-none' : 'rounded-lg',
    top: 'rounded-lg'
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className={cn(
        "fixed inset-0 z-50 flex",
        positionClasses[position],
        "p-4",
        isMobile && position === 'bottom' && "p-0"
      )}
      onClick={handleOverlayClick}
    >
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-black transition-opacity duration-300",
          isAnimating ? "opacity-0" : "opacity-50"
        )}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          "relative bg-white shadow-xl w-full",
          sizeClasses[size],
          modalClasses[position],
          "transform transition-all duration-300 ease-out",
          isAnimating && position === 'center' && "scale-95 opacity-0",
          isAnimating && position === 'bottom' && "translate-y-full",
          isAnimating && position === 'top' && "-translate-y-full",
          !isAnimating && "scale-100 opacity-100 translate-y-0",
          isMobile && position === 'bottom' && "max-h-[90vh]",
          isMobile && "max-h-[95vh]",
          className
        )}
        style={{
          ...(isMobile && position === 'bottom' && {
            paddingBottom: 'env(safe-area-inset-bottom)'
          })
        }}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className={cn(
            "flex items-center justify-between p-4 border-b border-gray-200",
            isMobile && "p-6"
          )}>
            {title && (
              <h2 className={cn(
                "text-lg font-semibold text-gray-900",
                isMobile && "text-xl"
              )}>
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className={cn(
                  "p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors",
                  isMobile && "p-3 min-w-[44px] min-h-[44px]"
                )}
              >
                <X className={cn("w-5 h-5", isMobile && "w-6 h-6")} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className={cn(
          "overflow-y-auto",
          isMobile && "max-h-[calc(90vh-120px)]" // Account for header and safe areas
        )}>
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

// Hook for managing modal state
export function useMobileOptimizedModal() {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);
  const toggleModal = () => setIsOpen(prev => !prev);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal
  };
}

// Bottom sheet variant for mobile
interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: number[];
  initialSnapPoint?: number;
  showHandle?: boolean;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = [0.5, 0.9],
  initialSnapPoint = 0,
  showHandle = true
}) => {
  const { isMobile } = useDeviceInfo();
  const [currentSnapPoint, setCurrentSnapPoint] = useState(initialSnapPoint);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Only render on mobile devices
  if (!isMobile) {
    return (
      <MobileOptimizedModal
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        position="center"
      >
        {children}
      </MobileOptimizedModal>
    );
  }

  const height = `${snapPoints[currentSnapPoint] * 100}vh`;

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className="relative bg-white rounded-t-2xl w-full shadow-xl transform transition-transform duration-300 ease-out"
        style={{ 
          height,
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        {/* Handle */}
        {showHandle && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>
        )}

        {/* Header */}
        {title && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {title}
            </h2>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto h-full p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
