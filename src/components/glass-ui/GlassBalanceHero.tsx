import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Eye, EyeOff, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

import { CountUp } from '@/components/ui/CountUp';

interface GlassBalanceHeroProps {
  netBalance: number;
  totalCashIn: number;
  totalCashOut: number;
  totalPictures?: number;
  currency?: string;
  hideBalance?: boolean;
  onToggleHide?: () => void;
  isAdmin?: boolean;
}

export function GlassBalanceHero({
  netBalance,
  totalCashIn,
  totalCashOut,
  totalPictures = 0,
  currency = 'ZMW',
  hideBalance = false,
  onToggleHide,
  isAdmin = false
}: GlassBalanceHeroProps) {

  const renderAmount = (amount: number, isCurrency: boolean = true) => {
    if (hideBalance) return '••••••';
    return isCurrency ? <CountUp end={amount} /> : <CountUp end={amount} prefix="" suffix="" />;
  };

  return (
    <div className="glass-balance-hero p-5 sm:p-7 md:p-9">
      {/* Net Balance Section */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6 sm:mb-8">
        <div className="space-y-1 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white/40">Total Net Balance</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleHide?.();
              }}
              className="p-2.5 -m-1 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 transition-all border border-white/20 touch-manipulation relative z-30 shadow-lg"
              aria-label={hideBalance ? "Reveal Activity" : "Hide Activity"}
              title={hideBalance ? "Reveal Activity" : "Hide Activity"}
            >
              {hideBalance ? (
                <EyeOff className="w-5 h-5 text-cyan-400 animate-pulse" />
              ) : (
                <Eye className="w-5 h-5 text-white/70" />
              )}
            </button>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tighter text-white">
              {renderAmount(netBalance)}
            </span>
            <span className="text-base sm:text-lg lg:text-xl font-medium text-white/30">{currency}</span>
          </div>
        </div>

        {/* Apple Style Performance Badge - Fixed for mobile */}
        <div className="flex items-center sm:block bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 backdrop-blur-md self-start sm:self-auto gap-3 sm:gap-0">
          <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mb-0 sm:mb-1" />
          <div className="flex flex-col">
            <div className="text-[9px] sm:text-[10px] uppercase font-bold text-white/40 leading-none">Live Status</div>
            <div className="text-[11px] sm:text-xs font-bold text-green-400 leading-tight">Active Pool</div>
          </div>
        </div>

      </div>

      {/* Cash In / Cash Out / Pictures - Grid Style */}
      {/* Cash In / Cash Out / Pictures - Grid Style */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Incoming Card - Full Green Theme */}
        <div className="p-3 sm:p-4 rounded-[1.25rem] sm:rounded-[1.5rem] bg-green-500/15 border border-green-500/20 shadow-[0_4px_20px_rgba(16,185,129,0.1),inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all group hover:bg-green-500/20">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-green-500/30 flex items-center justify-center border border-green-500/30 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-400" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-green-300/80">Incoming</span>
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-lg sm:text-2xl font-bold text-green-400">{renderAmount(totalCashIn)}</p>
            <span className="text-[10px] sm:text-xs text-green-400/50 font-bold">{currency}</span>
          </div>
        </div>


        {/* Outgoing Card - Full Red Theme */}
        <div className="p-3 sm:p-4 rounded-[1.25rem] sm:rounded-[1.5rem] bg-red-500/15 border border-red-500/20 shadow-[0_4px_20px_rgba(239,68,68,0.1),inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all group hover:bg-red-500/20">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-red-500/30 flex items-center justify-center border border-red-500/30 group-hover:scale-110 transition-transform">
              <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-red-300/80">Outgoing</span>
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-lg sm:text-2xl font-bold text-red-400">{renderAmount(totalCashOut)}</p>
            <span className="text-[10px] sm:text-xs text-red-400/50 font-bold">{currency}</span>
          </div>
        </div>


        {/* Pictures Card - Purple/Indigo Theme */}
        <div className="col-span-2 md:col-span-1 p-3 sm:p-4 rounded-[1.25rem] sm:rounded-[1.5rem] bg-indigo-500/15 border border-indigo-500/20 shadow-[0_4px_20px_rgba(99,102,241,0.1),inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all group hover:bg-indigo-500/20">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-500/30 flex items-center justify-center border border-indigo-500/30 group-hover:scale-110 transition-transform">
              <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-indigo-300/80">Pictures</span>
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-lg sm:text-2xl font-bold text-indigo-400">{renderAmount(totalPictures, false)}</p>
            <span className="text-[10px] sm:text-xs text-indigo-400/50 font-bold">SHOTS</span>
          </div>
        </div>
      </div>

      {/* Decorative Dark Blur Blob */}
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/[0.02] rounded-full blur-[80px] pointer-events-none" />
    </div>
  );
}
