import React from 'react';
import { User } from 'lucide-react';

interface AnimatedProfilePictureProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  showZappingEffect?: boolean;
  className?: string;
  onClick?: () => void;
}

export function AnimatedProfilePicture({
  src,
  alt = 'Profile Picture',
  size = 'md',
  isLoading = false,
  showZappingEffect = false,
  className = '',
  onClick
}: AnimatedProfilePictureProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div 
      className={`relative ${sizeClasses[size]} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Zapping Razor Light Animation */}
      {(isLoading || showZappingEffect) && (
        <>
          {/* Outer rotating ring with zapping effect */}
          <div className="absolute inset-0 rounded-full animate-spin">
            <div className="w-full h-full rounded-full border-2 border-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse">
              <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 m-0.5"></div>
            </div>
          </div>
          
          {/* Inner pulsing glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 opacity-30 animate-ping"></div>
          
          {/* Razor light streaks */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gradient-to-b from-transparent via-white to-transparent transform -translate-x-1/2 animate-pulse opacity-80"></div>
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent transform -translate-y-1/2 animate-pulse opacity-80 animation-delay-150"></div>
            <div className="absolute top-1/4 right-1/4 w-0.5 h-1/2 bg-gradient-to-b from-transparent via-blue-300 to-transparent transform rotate-45 animate-pulse opacity-60 animation-delay-300"></div>
            <div className="absolute bottom-1/4 left-1/4 w-0.5 h-1/2 bg-gradient-to-b from-transparent via-purple-300 to-transparent transform rotate-45 animate-pulse opacity-60 animation-delay-450"></div>
          </div>
        </>
      )}
      
      {/* Profile Picture or Default Avatar */}
      <div className={`relative z-10 ${sizeClasses[size]} rounded-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-white shadow-lg`}>
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to default avatar if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const defaultAvatar = target.parentElement?.querySelector('.default-avatar');
              if (defaultAvatar) {
                defaultAvatar.classList.remove('hidden');
              }
            }}
          />
        ) : null}

        {/* Default Avatar Icon */}
        <div className={`default-avatar ${src ? 'hidden' : 'flex'} w-full h-full items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100`}>
          <User className={`${iconSizes[size]} text-slate-600`} />
        </div>
      </div>
      
      {/* Loading text for transaction loading */}
      {isLoading && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <span className="text-xs text-slate-600 animate-pulse">Loading...</span>
        </div>
      )}
    </div>
  );
}

// CSS for animation delays (to be added to global CSS)
export const profilePictureAnimationCSS = `
  .animation-delay-150 {
    animation-delay: 150ms;
  }
  .animation-delay-300 {
    animation-delay: 300ms;
  }
  .animation-delay-450 {
    animation-delay: 450ms;
  }
`;
