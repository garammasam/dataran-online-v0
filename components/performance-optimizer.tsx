'use client';

import { useEffect } from 'react';
import { 
  initializePerformanceOptimizations,
  isSlowConnection,
  getImageQuality
} from '@/lib/performance-optimization';
import { initializePerformanceMonitoring, trackBundleSize } from '@/lib/performance-monitoring';

export function PerformanceOptimizer() {
  useEffect(() => {
    // Initialize performance optimizations on mount
    initializePerformanceOptimizations();
    
    // Initialize performance monitoring
    initializePerformanceMonitoring();
    
    // Track bundle size in development
    trackBundleSize();
    
    // Add slow connection class for CSS optimizations
    if (isSlowConnection()) {
      document.documentElement.classList.add('slow-connection');
      
      // Reduce animation duration for slow connections
      document.documentElement.style.setProperty('--animation-duration', '0.1s');
    }
    
    // Set image quality class
    const quality = getImageQuality();
    document.documentElement.classList.add(`image-quality-${quality}`);
    
    // Optimize scroll performance
    const optimizeScroll = () => {
      if (isSlowConnection()) {
        // Disable smooth scrolling on slow connections
        document.documentElement.style.scrollBehavior = 'auto';
      }
    };
    
    optimizeScroll();
    
    // Handle visibility change for battery optimization
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause non-critical operations when tab is hidden
        console.log('Tab hidden - pausing non-critical operations');
      } else {
        // Resume operations when tab is visible
        console.log('Tab visible - resuming operations');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null; // This component doesn't render anything
}