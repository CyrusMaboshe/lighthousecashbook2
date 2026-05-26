
import React, { useState, useEffect } from 'react';

interface DigitalClockProps {
  onClick?: () => void;
}

export function DigitalClock({ onClick }: DigitalClockProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = () => {
    return new Date().toLocaleString("en-US", {
      timeZone: "Africa/Lusaka",
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const getDay = () => {
    return new Date().toLocaleString("en-US", {
      timeZone: "Africa/Lusaka",
      weekday: 'short'
    }).toUpperCase();
  };

  const getTimeZone = () => {
    return "CAT";
  };

  return (
    <div 
      className="relative bg-white/80 backdrop-blur-sm rounded-lg p-4 w-fit border border-slate-200 shadow-sm cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
      onClick={onClick}
    >
      {/* Day indicator */}
      <div className="absolute top-2 left-3 text-slate-600 text-xs font-bold">
        {getDay()}
      </div>
      
      {/* Timezone indicator */}
      <div className="absolute top-2 right-3 text-slate-600 text-xs font-bold">
        {getTimeZone()}
      </div>
      
      {/* Main time display */}
      <div className="text-center mt-4">
        <div className="text-slate-800 text-4xl font-mono font-bold tracking-wider leading-none">
          {formatTime()}
        </div>
      </div>
      
      {/* Click indicator */}
      <div className="text-center mt-2">
        <div className="text-xs text-slate-500">
          Click to expand
        </div>
      </div>
    </div>
  );
}
