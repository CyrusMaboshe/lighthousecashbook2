import React, { useState, useEffect } from 'react';
import { LogOut, Bell, Clock } from 'lucide-react';

interface GlassHeaderProps {
  username?: string;
  profilePictureUrl?: string | null;
  onLogout: () => void;
  onProfileClick?: () => void;
  showWelcome?: boolean;
  companyName?: string;
}

export function GlassHeader({
  username = 'User',
  profilePictureUrl,
  onLogout,
  onProfileClick,
  showWelcome = false,
  companyName = 'Lighthouse'
}: GlassHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = () => {
    return currentTime.toLocaleString("en-US", {
      timeZone: "Africa/Lusaka",
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const getDay = () => {
    return currentTime.toLocaleString("en-US", {
      timeZone: "Africa/Lusaka",
      weekday: 'short'
    }).toUpperCase();
  };

  const formatDate = () => {
    return currentTime.toLocaleString("en-GB", {
      timeZone: "Africa/Lusaka",
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <header className="glass-header">
      <div className="flex items-center justify-between max-w-[1400px] mx-auto">
        {/* Left: Logo & App Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0f172a] shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center justify-center border border-blue-500/20 group relative">
            <div className="w-5 h-5 rounded-full bg-blue-500 blur-sm opacity-50 group-hover:opacity-100 transition-opacity" />
            <span className="text-white text-lg font-bold absolute">L</span>
          </div>
          <div>
            <h1 className="text-[17px] font-bold tracking-tight text-white/90 truncate max-w-[160px]">{companyName}</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.15em] font-bold">Finance Pro</p>
          </div>
        </div>

        {/* Center: Real-time Clock (visible on all screens including mobile) */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 px-1.5 sm:px-2.5 lg:px-4 py-0.5 sm:py-1 lg:py-1.5 rounded-full bg-white/[0.03] border border-white/5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-[9px] sm:text-[11px] font-bold text-slate-500 tracking-wider">{getDay()}</span>
            <span className="hidden sm:inline text-[11px] font-semibold text-slate-400">{formatDate()}</span>
            <span className="sm:hidden text-[9px] font-semibold text-slate-400">
              {currentTime.toLocaleString("en-GB", { timeZone: "Africa/Lusaka", day: '2-digit', month: 'short' })}
            </span>
            <div className="w-[1px] h-3 bg-white/10" />
            <span className="text-[10px] sm:text-xs font-semibold text-white/80 tabular-nums">{formatTime()}</span>
          </div>
        </div>

        {/* Right: User Actions */}
        <div className="flex items-center gap-1.5">
          <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/5 transition-all text-slate-400 hover:text-white relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
          </button>

          <div className="h-6 w-[1px] bg-white/5 mx-1" />

          <button
            onClick={onProfileClick}
            className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-all group"
          >
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt={username}
                className="w-8 h-8 rounded-full object-cover border border-white/10"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#0f172a] flex items-center justify-center border border-blue-500/20 text-white text-xs font-bold">
                {username?.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">
              {username}
            </span>
          </button>

          <button
            onClick={onLogout}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-rose-500/10 transition-all text-slate-500 hover:text-rose-400"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

    </header>
  );
}
