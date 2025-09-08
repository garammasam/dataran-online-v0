'use client';

import { useState, useEffect } from 'react';

export enum MorphingIconState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN', 
  BACK = 'BACK',
  EXITING = 'EXITING',
}

interface MorphingIconProps {
  state: MorphingIconState;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

// CSS animation class mappings for morphing icon states
const getMorphingIconAnimationClasses = (currentState: MorphingIconState, isTopBar: boolean, size: string) => {
  const sizeClasses = {
    sm: 'h-[1px] w-3',
    md: 'h-[2px] w-4', 
    lg: 'h-[3px] w-5'
  };
  
  const baseClasses = `absolute left-0 ${sizeClasses[size as keyof typeof sizeClasses]} bg-current origin-center transition-all duration-300 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]`;
  
  if (isTopBar) {
    switch (currentState) {
      case MorphingIconState.OPEN:
        return `${baseClasses} top-[4px] rotate-45 translate-y-1`;
      case MorphingIconState.BACK:
        return `${baseClasses} top-[4px] w-[10px] rotate-45 translate-y-[7px]`;
      case MorphingIconState.EXITING:
        return `${baseClasses} top-[4px] rotate-0 translate-y-0`;
      default:
        return `${baseClasses} top-[4px] rotate-0 translate-y-0`;
    }
  } else {
    switch (currentState) {
      case MorphingIconState.OPEN:
        return `${baseClasses} top-[12px] -rotate-45 -translate-y-1`;
      case MorphingIconState.BACK:
        return `${baseClasses} top-[12px] w-[10px] -rotate-45 -translate-y-[7px]`;
      case MorphingIconState.EXITING:
        return `${baseClasses} top-[12px] rotate-0 translate-y-0`;
      default:
        return `${baseClasses} top-[12px] rotate-0 translate-y-0`;
    }
  }
};

export function MorphingIcon({ 
  state, 
  className = '', 
  size = 'md',
  color = 'currentColor'
}: MorphingIconProps) {
  const [displayState, setDisplayState] = useState(state);

  useEffect(() => {
    setDisplayState(state);
  }, [state]);

  const sizeClasses = {
    sm: 'size-3',
    md: 'size-4',
    lg: 'size-5'
  };

  return (
    <div className={`${sizeClasses[size]} relative flex items-center justify-center ${className}`} style={{ color }}>
      {/* Morphing icon container */}
      <div className="relative w-full h-full">
        {/* Hamburger/X/Back lines - morphs between states */}
        <div className="absolute inset-0">
          {/* Top line */}
          <span className={getMorphingIconAnimationClasses(displayState, true, size)} />
          {/* Bottom line */}
          <span className={getMorphingIconAnimationClasses(displayState, false, size)} />
        </div>
      </div>
    </div>
  );
}

// Specific icon variants for common use cases
export function ChevronRightIcon({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'size-3',
    md: 'size-4',
    lg: 'size-5'
  };

  return (
    <svg 
      className={`${sizeClasses[size]} ${className}`}
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M9 5l7 7-7 7" 
      />
    </svg>
  );
}

export function ChevronLeftIcon({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'size-3',
    md: 'size-4',
    lg: 'size-5'
  };

  return (
    <svg 
      className={`${sizeClasses[size]} ${className}`}
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M15 19l-7-7 7-7" 
      />
    </svg>
  );
}

export function HamburgerIcon({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <MorphingIcon 
      state={MorphingIconState.CLOSED} 
      className={className}
      size={size}
    />
  );
}

export function XIcon({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <MorphingIcon 
      state={MorphingIconState.OPEN} 
      className={className}
      size={size}
    />
  );
}
