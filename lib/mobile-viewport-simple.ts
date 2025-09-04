/**
 * Simple mobile viewport utility that handles URL bar behavior
 * Sets CSS custom properties for mobile-aware viewport heights
 */

'use client';

class SimpleViewportManager {
  private initialized = false;
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }
  
  private init() {
    if (this.initialized) return;
    this.initialized = true;
    
    this.updateViewportVars();
    
    // Listen for viewport changes
    window.addEventListener('resize', this.updateViewportVars);
    window.addEventListener('orientationchange', () => {
      // Wait for orientation change to complete
      setTimeout(this.updateViewportVars, 100);
    });
    
    // Visual viewport API for better mobile support
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this.updateViewportVars);
    }
  }
  
  private updateViewportVars = () => {
    if (typeof window === 'undefined') return;
    
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    
    // Set CSS custom properties
    document.documentElement.style.setProperty('--viewport-height-px', `${vh}px`);
    document.documentElement.style.setProperty('--viewport-width-px', `${vw}px`);
    document.documentElement.style.setProperty('--mobile-vh', `${vh / 100}px`);
    
    // Calculate safe area height
    const safeTop = this.getSafeAreaInset('top');
    const safeBottom = this.getSafeAreaInset('bottom');
    const safeHeight = vh - safeTop - safeBottom;
    document.documentElement.style.setProperty('--safe-viewport-height-px', `${safeHeight}px`);
  };
  
  private getSafeAreaInset(side: 'top' | 'bottom' | 'left' | 'right'): number {
    if (typeof window === 'undefined') return 0;
    
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue(`env(safe-area-inset-${side})`)
      .replace('px', '');
    
    return parseFloat(value) || 0;
  }
  
  public destroy() {
    if (typeof window === 'undefined') return;
    
    window.removeEventListener('resize', this.updateViewportVars);
    window.removeEventListener('orientationchange', this.updateViewportVars);
    
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.updateViewportVars);
    }
  }
}

// Singleton instance
let viewportManager: SimpleViewportManager | null = null;

export function initMobileViewport(): SimpleViewportManager {
  if (!viewportManager && typeof window !== 'undefined') {
    viewportManager = new SimpleViewportManager();
  }
  return viewportManager!;
}

// Utility functions for mobile viewport
export const mobileViewport = {
  /**
   * Get CSS value for full height that respects URL bar
   */
  getFullHeight: () => 'var(--viewport-height-px, 100dvh)',
  
  /**
   * Get CSS value for safe height (excluding safe areas)
   */
  getSafeHeight: () => 'var(--safe-viewport-height-px, calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom)))',
  
  /**
   * Get CSS value for height with custom offset
   */
  getHeightWithOffset: (offset: string) => 
    `calc(var(--viewport-height-px, 100dvh) - ${offset})`,
  
  /**
   * Check if device is likely mobile
   */
  isMobileDevice: () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },
};

// Auto-initialize on import (only in browser)
if (typeof window !== 'undefined') {
  initMobileViewport();
}