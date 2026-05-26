import React from 'react';
import { Plus } from 'lucide-react';

interface GlassFloatingActionButtonProps {
  onClick: () => void;
}

export function GlassFloatingActionButton({ onClick }: GlassFloatingActionButtonProps) {
  return (
    <button 
      onClick={onClick}
      className="glass-fab glass-animate-pulse-glow"
      aria-label="Add new transaction"
    >
      <Plus className="w-8 h-8 text-white" strokeWidth={2.5} />
    </button>
  );
}
