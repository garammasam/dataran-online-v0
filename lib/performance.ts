import { useState, useEffect } from 'react';

export interface PerformanceSettings {
  shouldAnimate: boolean;
  isLowPowerMode: boolean;
  prefersReducedMotion: boolean;
}

// Centralized performance detection logic
export function isLowPowerDevice(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  
  // Check for low-end devices
  if ('hardwareConcurrency' in navigator && navigator.hardwareConcurrency <= 2) return true;
  
  // Check for mobile with throttling indicators
  if ('connection' in navigator && (navigator as any).connection) {
    const conn = (navigator as any).connection;
    if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') return true;
  }
  
  return false;
}

export function usePerformanceSettings(): PerformanceSettings {
  const [settings, setSettings] = useState<PerformanceSettings>({
    shouldAnimate: true,
    isLowPowerMode: false,
    prefersReducedMotion: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkPerformance = () => {
      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // Use centralized low power detection
      const isLowPowerMode = isLowPowerDevice();

      const shouldAnimate = !prefersReducedMotion && !isLowPowerMode;

      setSettings({
        shouldAnimate,
        isLowPowerMode,
        prefersReducedMotion,
      });
    };

    // Initial check
    checkPerformance();

    // Listen for changes
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', checkPerformance);

    return () => {
      mediaQuery.removeEventListener('change', checkPerformance);
    };
  }, []);

  return settings;
}

export function getAnimationDuration(baseDuration: number, settings: PerformanceSettings): number {
  if (!settings.shouldAnimate) return 0;
  if (settings.isLowPowerMode) return baseDuration * 0.5; // 50% faster
  return baseDuration;
}

export function getAnimationEasing(settings: PerformanceSettings): string {
  if (!settings.shouldAnimate) return 'linear';
  if (settings.isLowPowerMode) return 'ease-out'; // Simpler easing
  return 'easeInOut';
}