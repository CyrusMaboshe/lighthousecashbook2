
import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { getShuffledTips } from '@/data/photographyTips';

interface PhotographyTipsFullscreenProps {
  onClose: () => void;
}

export function PhotographyTipsFullscreen({ onClose }: PhotographyTipsFullscreenProps) {
  const [currentTip, setCurrentTip] = useState('');
  const [tipsPool, setTipsPool] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentBackground, setCurrentBackground] = useState(0);

  // Video-like gradient backgrounds
  const backgrounds = [
    'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900',
    'bg-gradient-to-br from-orange-900 via-red-900 to-pink-900',
    'bg-gradient-to-br from-green-900 via-teal-900 to-blue-900',
    'bg-gradient-to-br from-yellow-900 via-orange-900 to-red-900',
    'bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900',
    'bg-gradient-to-br from-teal-900 via-green-900 to-emerald-900',
  ];

  // Initialize tips pool
  useEffect(() => {
    const shuffled = getShuffledTips();
    setTipsPool(shuffled);
    setCurrentTip(shuffled[0] || '');
    setCurrentIndex(0);
  }, []);

  // Auto-change background every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBackground((prev) => (prev + 1) % backgrounds.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [backgrounds.length]);

  const nextTip = () => {
    if (tipsPool.length > 0) {
      const nextIndex = (currentIndex + 1) % tipsPool.length;
      setCurrentTip(tipsPool[nextIndex]);
      setCurrentIndex(nextIndex);
    }
  };

  const prevTip = () => {
    if (tipsPool.length > 0) {
      const prevIndex = currentIndex === 0 ? tipsPool.length - 1 : currentIndex - 1;
      setCurrentTip(tipsPool[prevIndex]);
      setCurrentIndex(prevIndex);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Animated Background */}
      <div className={`absolute inset-0 transition-all duration-[10000ms] ease-in-out ${backgrounds[currentBackground]}`}>
        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/10 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${Math.random() * 3 + 2}s`,
              }}
            />
          ))}
        </div>
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl font-bold">📸</span>
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold tracking-wide">Photography Mastery</h1>
              <p className="text-white/70 text-sm">Professional Tips & Techniques</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all duration-300 group"
          >
            <X className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Tip Counter */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="text-white/70 text-sm">Tip</span>
                <span className="text-white font-bold">{currentIndex + 1}</span>
                <span className="text-white/70 text-sm">of</span>
                <span className="text-white font-bold">{tipsPool.length}</span>
              </div>
            </div>

            {/* Tip Content */}
            <div className="mb-12">
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-2xl border border-white/20">
                <p className="text-white text-xl md:text-3xl leading-relaxed font-light tracking-wide">
                  "{currentTip}"
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={prevTip}
                className="p-4 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all duration-300 group"
              >
                <ChevronLeft className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              </button>
              
              <div className="flex gap-2">
                {[...Array(Math.min(5, tipsPool.length))].map((_, i) => {
                  const dotIndex = Math.floor((currentIndex / tipsPool.length) * 5);
                  return (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        i === dotIndex ? 'bg-white' : 'bg-white/30'
                      }`}
                    />
                  );
                })}
              </div>
              
              <button
                onClick={nextTip}
                className="p-4 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all duration-300 group"
              >
                <ChevronRight className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center">
          <p className="text-white/50 text-sm">
            Press ESC to close • Tips update automatically every 15 minutes
          </p>
        </div>
      </div>
    </div>
  );
}
