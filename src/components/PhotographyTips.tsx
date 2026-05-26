import React, { useState, useEffect } from 'react';
import { getRandomTip, getShuffledTips } from '@/data/photographyTips';
import { PhotographyTipsFullscreen } from '@/components/PhotographyTipsFullscreen';

interface PhotographyTipsProps {
  isMobile?: boolean;
}

export function PhotographyTips({ isMobile = false }: PhotographyTipsProps) {
  const [currentTip, setCurrentTip] = useState('');
  const [tipsPool, setTipsPool] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);

  // Initialize tips pool and first tip
  useEffect(() => {
    const shuffled = getShuffledTips();
    setTipsPool(shuffled);
    setCurrentTip(shuffled[0] || getRandomTip());
    setCurrentIndex(0);
  }, []);

  // Set up 15-minute interval for tip changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (tipsPool.length > 0) {
        const nextIndex = (currentIndex + 1) % tipsPool.length;
        
        // If we've gone through all tips, reshuffle
        if (nextIndex === 0) {
          const newShuffled = getShuffledTips();
          setTipsPool(newShuffled);
          setCurrentTip(newShuffled[0]);
          setCurrentIndex(0);
        } else {
          setCurrentTip(tipsPool[nextIndex]);
          setCurrentIndex(nextIndex);
        }
      }
    }, 15 * 60 * 1000); // 15 minutes in milliseconds

    return () => clearInterval(interval);
  }, [tipsPool, currentIndex]);

  const handleTipClick = () => {
    setShowFullscreen(true);
  };

  const handleCloseFullscreen = () => {
    setShowFullscreen(false);
  };

  // Handle ESC key to close fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showFullscreen) {
        setShowFullscreen(false);
      }
    };

    if (showFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [showFullscreen]);

  if (showFullscreen) {
    return <PhotographyTipsFullscreen onClose={handleCloseFullscreen} />;
  }

  if (isMobile) {
    return (
      <div className="mobile-stats-card cursor-pointer transition-all duration-300 hover:scale-105" onClick={handleTipClick}>
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
            <span className="text-white text-lg font-bold">📸</span>
          </div>
          <p className="text-slate-600 text-xs font-medium mb-2 uppercase tracking-wide">
            Photography Tips
          </p>
          <div className="text-slate-800 text-sm leading-relaxed font-medium px-2">
            {currentTip && (
              <span>{currentTip}</span>
            )}
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Updates every 15 minutes • Click to expand
          </div>
        </div>
      </div>
    );
  }

  // Desktop version
  return (
    <div className="border-t border-slate-200 pt-4">
      <div 
        className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
        onClick={handleTipClick}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">📸</span>
          </div>
          <h3 className="text-slate-700 text-sm font-semibold uppercase tracking-wide">
            Photography Tips
          </h3>
        </div>
        
        <div className="text-slate-800 text-sm leading-relaxed mb-3">
          {currentTip && (
            <span>{currentTip}</span>
          )}
        </div>
        
        <div className="text-xs text-slate-500 text-center">
          Updates every 15 minutes • Click to expand
        </div>
      </div>
    </div>
  );
}
