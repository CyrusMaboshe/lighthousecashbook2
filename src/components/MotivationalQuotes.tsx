
import React, { useState, useEffect } from 'react';
import { getRandomQuote, getShuffledQuotes } from '@/data/ancientWisdom';
import { AncientWisdomFullscreen } from '@/components/AncientWisdomFullscreen';

interface MotivationalQuotesProps {
  isMobile?: boolean;
}

export function MotivationalQuotes({ isMobile = false }: MotivationalQuotesProps) {
  const [currentQuote, setCurrentQuote] = useState('');
  const [quotesPool, setQuotesPool] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);

  // Initialize quotes pool and first quote
  useEffect(() => {
    const shuffled = getShuffledQuotes();
    setQuotesPool(shuffled);
    setCurrentQuote(shuffled[0] || getRandomQuote());
    setCurrentIndex(0);
  }, []);

  // Set up 15-minute interval for quote changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (quotesPool.length > 0) {
        const nextIndex = (currentIndex + 1) % quotesPool.length;
        
        // If we've gone through all quotes, reshuffle
        if (nextIndex === 0) {
          const newShuffled = getShuffledQuotes();
          setQuotesPool(newShuffled);
          setCurrentQuote(newShuffled[0]);
          setCurrentIndex(0);
        } else {
          setCurrentQuote(quotesPool[nextIndex]);
          setCurrentIndex(nextIndex);
        }
      }
    }, 15 * 60 * 1000); // 15 minutes in milliseconds

    return () => clearInterval(interval);
  }, [quotesPool, currentIndex]);

  const handleQuoteClick = () => {
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
    return <AncientWisdomFullscreen onClose={handleCloseFullscreen} />;
  }

  if (isMobile) {
    return (
      <div className="mobile-stats-card cursor-pointer transition-all duration-300 hover:scale-105" onClick={handleQuoteClick}>
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-3 bg-gradient-to-br from-red-600 to-black rounded-full flex items-center justify-center border border-red-500/30">
            <span className="text-red-300 text-lg font-bold">⚡</span>
          </div>
          <p className="text-slate-600 text-xs font-medium mb-2 uppercase tracking-wide">
            Ancient Darkness
          </p>
          <div className="text-slate-800 text-sm leading-relaxed font-medium px-2">
            {currentQuote && (
              <span>{currentQuote}</span>
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
        className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-4 border border-red-200 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
        onClick={handleQuoteClick}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-gradient-to-br from-red-600 to-black rounded-full flex items-center justify-center border border-red-500/30">
            <span className="text-red-300 text-sm font-bold">⚡</span>
          </div>
          <h3 className="text-slate-700 text-sm font-semibold uppercase tracking-wide">
            Ancient Darkness
          </h3>
        </div>
        
        <div className="text-slate-800 text-sm leading-relaxed mb-3">
          {currentQuote && (
            <span>{currentQuote}</span>
          )}
        </div>
        
        <div className="text-xs text-slate-500 text-center">
          Updates every 15 minutes • Click to expand
        </div>
      </div>
    </div>
  );
}
