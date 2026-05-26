
import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Skull } from 'lucide-react';
import { getShuffledQuotes } from '@/data/ancientWisdom';

interface AncientWisdomFullscreenProps {
  onClose: () => void;
}

export function AncientWisdomFullscreen({ onClose }: AncientWisdomFullscreenProps) {
  const [currentQuote, setCurrentQuote] = useState('');
  const [quotesPool, setQuotesPool] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentBackground, setCurrentBackground] = useState(0);

  // Dark, edgy gradient backgrounds
  const backgrounds = [
    'bg-gradient-to-br from-gray-900 via-red-900 to-black',
    'bg-gradient-to-br from-black via-purple-900 to-gray-900',
    'bg-gradient-to-br from-red-900 via-black to-gray-900',
    'bg-gradient-to-br from-purple-900 via-gray-900 to-black',
    'bg-gradient-to-br from-gray-900 via-orange-900 to-black',
    'bg-gradient-to-br from-black via-gray-800 to-red-900',
  ];

  // Initialize quotes pool
  useEffect(() => {
    const shuffled = getShuffledQuotes();
    setQuotesPool(shuffled);
    setCurrentQuote(shuffled[0] || '');
    setCurrentIndex(0);
  }, []);

  // Auto-change background every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBackground((prev) => (prev + 1) % backgrounds.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [backgrounds.length]);

  const nextQuote = () => {
    if (quotesPool.length > 0) {
      const nextIndex = (currentIndex + 1) % quotesPool.length;
      setCurrentQuote(quotesPool[nextIndex]);
      setCurrentIndex(nextIndex);
    }
  };

  const prevQuote = () => {
    if (quotesPool.length > 0) {
      const prevIndex = currentIndex === 0 ? quotesPool.length - 1 : currentIndex - 1;
      setCurrentQuote(quotesPool[prevIndex]);
      setCurrentIndex(prevIndex);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Animated Dark Background */}
      <div className={`absolute inset-0 transition-all duration-[8000ms] ease-in-out ${backgrounds[currentBackground]}`}>
        {/* Floating dark particles effect */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-red-500/20 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 6 + 3}px`,
                height: `${Math.random() * 6 + 3}px`,
                animationDelay: `${Math.random() * 4}s`,
                animationDuration: `${Math.random() * 4 + 3}s`,
              }}
            />
          ))}
        </div>
        
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-black rounded-full flex items-center justify-center shadow-lg border border-red-500/30">
              <Skull className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold tracking-wide">Ancient Darkness</h1>
              <p className="text-red-300/70 text-sm">Wisdom from the Shadows</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-3 bg-red-900/20 backdrop-blur-sm rounded-full hover:bg-red-800/30 transition-all duration-300 group border border-red-500/30"
          >
            <X className="w-6 h-6 text-red-300 group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-5xl mx-auto text-center">
            {/* Quote Counter */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-sm px-6 py-3 rounded-full border border-red-500/30">
                <span className="text-red-300/70 text-sm font-medium">Dark Wisdom</span>
                <span className="text-red-300 font-bold text-lg">{currentIndex + 1}</span>
                <span className="text-red-300/70 text-sm">of</span>
                <span className="text-red-300 font-bold text-lg">{quotesPool.length}</span>
              </div>
            </div>

            {/* Quote Content */}
            <div className="mb-12">
              <div className="bg-black/40 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-2xl border border-red-500/20">
                <div className="mb-6">
                  <span className="text-red-400 text-6xl font-serif">"</span>
                </div>
                <p className="text-red-100 text-xl md:text-3xl leading-relaxed font-light tracking-wide mb-6">
                  {currentQuote}
                </p>
                <div className="flex justify-end">
                  <span className="text-red-400 text-6xl font-serif rotate-180">"</span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={prevQuote}
                className="p-4 bg-red-900/20 backdrop-blur-sm rounded-full hover:bg-red-800/30 transition-all duration-300 group border border-red-500/30"
              >
                <ChevronLeft className="w-6 h-6 text-red-300 group-hover:scale-110 transition-transform" />
              </button>
              
              <div className="flex gap-2">
                {[...Array(Math.min(7, quotesPool.length))].map((_, i) => {
                  const dotIndex = Math.floor((currentIndex / quotesPool.length) * 7);
                  return (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        i === dotIndex ? 'bg-red-400 shadow-lg shadow-red-400/50' : 'bg-red-800/40'
                      }`}
                    />
                  );
                })}
              </div>
              
              <button
                onClick={nextQuote}
                className="p-4 bg-red-900/20 backdrop-blur-sm rounded-full hover:bg-red-800/30 transition-all duration-300 group border border-red-500/30"
              >
                <ChevronRight className="w-6 h-6 text-red-300 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center">
          <p className="text-red-400/50 text-sm">
            Press ESC to escape the darkness • Wisdom updates every 15 minutes
          </p>
        </div>
      </div>
    </div>
  );
}
