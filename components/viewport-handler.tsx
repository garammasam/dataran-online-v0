'use client';

import { useEffect } from 'react';

export function ViewportHandler() {
  useEffect(() => {
    // Mobile viewport handler for URL bar awareness
    const updateViewport = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      document.documentElement.style.setProperty('--viewport-height-px', `${vh}px`);
      document.documentElement.style.setProperty('--viewport-width-px', `${vw}px`);
      document.documentElement.style.setProperty('--mobile-vh', `${vh / 100}px`);
      
      // Set safe viewport height for gallery images
      const safeTop = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('env(safe-area-inset-top)').replace('px', '') || '0');
      const safeBottom = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('env(safe-area-inset-bottom)').replace('px', '') || '0');
      const safeHeight = vh - safeTop - safeBottom;
      document.documentElement.style.setProperty('--safe-viewport-height', `${safeHeight}px`);
      document.documentElement.style.setProperty('--image-max-height-offset', '200px'); // Space for controls
    };
    
    // Initial update
    updateViewport();
    
    // Event listeners
    window.addEventListener('resize', updateViewport, { passive: true });
    window.addEventListener('orientationchange', () => {
      setTimeout(updateViewport, 100);
    }, { passive: true });
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewport, { passive: true });
    }
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewport);
      }
    };
  }, []);

  return null; // This component doesn't render anything
}