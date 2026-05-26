
import React, { useState, useEffect } from 'react';
import { X, Clock } from 'lucide-react';

interface DigitalClockFullscreenProps {
  onClose: () => void;
}

export function DigitalClockFullscreen({ onClose }: DigitalClockFullscreenProps) {
  const [time, setTime] = useState(new Date());
  const [prevTime, setPrevTime] = useState(new Date());
  const [flippingDigits, setFlippingDigits] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = new Date();
      setPrevTime(time);
      setTime(newTime);
      
      // Check which digits changed to trigger flip animation
      const oldTimeStr = time.toLocaleString("en-US", {
        timeZone: "Africa/Lusaka",
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/:/g, '');
      
      const newTimeStr = newTime.toLocaleString("en-US", {
        timeZone: "Africa/Lusaka",
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/:/g, '');
      
      const newFlipping: {[key: string]: boolean} = {};
      for (let i = 0; i < 6; i++) {
        if (oldTimeStr[i] !== newTimeStr[i]) {
          newFlipping[i.toString()] = true;
        }
      }
      setFlippingDigits(newFlipping);
      
      // Clear flipping state after animation
      setTimeout(() => {
        setFlippingDigits({});
      }, 600);
    }, 1000);

    return () => clearInterval(timer);
  }, [time]);

  const formatTime = () => {
    return time.toLocaleString("en-US", {
      timeZone: "Africa/Lusaka",
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const getDate = () => {
    return time.toLocaleString("en-US", {
      timeZone: "Africa/Lusaka",
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderFlipDigit = (digit: string, index: number, isColon = false) => {
    const isFlipping = flippingDigits[index.toString()];
    
    if (isColon) {
      return (
        <div key={`colon-${index}`} className="flex items-center justify-center mx-4">
          <div className="text-white text-8xl md:text-9xl font-mono font-bold animate-pulse">:</div>
        </div>
      );
    }

    return (
      <div key={index} className="relative mx-2">
        <div className="relative w-24 h-32 md:w-32 md:h-40 perspective-1000">
          <div className={`flip-card ${isFlipping ? 'flipping' : ''}`}>
            <div className="flip-card-inner">
              {/* Front */}
              <div className="flip-card-front">
                <div className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl shadow-2xl border border-slate-600 flex items-center justify-center">
                  <span className="text-white text-6xl md:text-7xl font-mono font-bold">
                    {digit}
                  </span>
                </div>
              </div>
              {/* Back */}
              <div className="flip-card-back">
                <div className="w-full h-full bg-gradient-to-b from-slate-700 to-slate-800 rounded-xl shadow-2xl border border-slate-500 flex items-center justify-center">
                  <span className="text-white text-6xl md:text-7xl font-mono font-bold">
                    {digit}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const timeString = formatTime();
  const timeDigits = timeString.split('');

  return (
    <>
      <style>
        {`
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .flip-card {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.6s;
        }
        
        .flip-card.flipping {
          transform: rotateX(180deg);
        }
        
        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
        }
        
        .flip-card-front,
        .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          backface-visibility: hidden;
        }
        
        .flip-card-back {
          transform: rotateX(180deg);
        }
        `}
      </style>
      
      <div className="fixed inset-0 z-[100] overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Animated Background */}
        <div className="absolute inset-0">
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="grid grid-cols-12 grid-rows-8 h-full">
              {[...Array(96)].map((_, i) => (
                <div
                  key={i}
                  className="border border-slate-600 animate-pulse"
                  style={{
                    animationDelay: `${Math.random() * 3}s`,
                    animationDuration: `${Math.random() * 2 + 2}s`,
                  }}
                />
              ))}
            </div>
          </div>
          
          {/* Floating digital elements */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute text-slate-600 text-xs font-mono animate-pulse opacity-30"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${Math.random() * 3 + 2}s`,
                }}
              >
                {Math.random() > 0.5 ? '01' : '10'}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-white text-2xl font-bold tracking-wide">Central Africa Time</h1>
                <p className="text-slate-400 text-sm">Lusaka, Zambia</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all duration-300 group"
            >
              <X className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
            </button>
          </div>

          {/* Main Time Display */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              {/* Date */}
              <div className="mb-8">
                <p className="text-slate-300 text-xl md:text-2xl font-light tracking-wide">
                  {getDate()}
                </p>
              </div>

              {/* Time with Flip Effect */}
              <div className="flex items-center justify-center mb-8">
                {timeDigits.map((char, index) => {
                  if (char === ':') {
                    return renderFlipDigit(char, index, true);
                  }
                  return renderFlipDigit(char, index);
                })}
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-3 gap-8 mt-12">
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <h3 className="text-slate-400 text-sm uppercase tracking-wide mb-2">Timezone</h3>
                  <p className="text-white text-lg font-semibold">CAT (UTC+2)</p>
                </div>
                
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <h3 className="text-slate-400 text-sm uppercase tracking-wide mb-2">Location</h3>
                  <p className="text-white text-lg font-semibold">Lusaka</p>
                </div>
                
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <h3 className="text-slate-400 text-sm uppercase tracking-wide mb-2">Format</h3>
                  <p className="text-white text-lg font-semibold">24 Hour</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 text-center">
            <p className="text-slate-500 text-sm">
              Press ESC to close • Live time updates every second
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
