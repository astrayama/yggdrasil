'use client';

import React from 'react';
import { SacredGeometry } from '@/components/onboarding/SacredGeometry';

interface YggiFabProps {
  onClick: () => void;
  isOpen: boolean;
}

export function YggiFab({ onClick, isOpen }: YggiFabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isOpen ? 'Close Yggi' : 'Open Yggi'}
      aria-expanded={isOpen}
      className={`fixed bottom-[calc(4rem+16px+env(safe-area-inset-bottom))] md:bottom-6 right-6 z-40
        flex items-center justify-center w-14 h-14 rounded-full
        bg-gold/95 border border-surface-2/30 shadow-lg shadow-surface-2/10 backdrop-blur-md
        transition-all duration-500 ease-in-out
        hover:scale-105 hover:border-surface-2/60 hover:shadow-surface-2/20 hover:shadow-xl
        focus:outline-none focus:ring-2 focus:ring-surface-2/50 focus:ring-offset-2 focus:ring-offset-background
        ${isOpen ? 'rotate-90 border-surface-2/50 bg-gold' : ''}`}
    >
      <SacredGeometry size={32} strokeWidth={3.5} breathe={!isOpen} color="var(--surface-2)" className="transition-transform duration-500" />
    </button>
  );
}
