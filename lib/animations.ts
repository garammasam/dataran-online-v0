// Animation utilities to replace framer-motion with lighter CSS-based animations

export interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  distance?: number;
}

// Common animation presets
export const animations = {
  // Entrance animations
  fadeInUp: (config?: AnimationConfig) => ({
    '--animation-duration': `${config?.duration || 300}ms`,
    '--animation-delay': `${config?.delay || 0}ms`,
    '--animation-distance': `${config?.distance || 20}px`,
    '--animation-easing': config?.easing || 'ease-out',
    animation: 'fadeInUp var(--animation-duration) var(--animation-easing) var(--animation-delay) forwards',
    opacity: 0,
    transform: 'translateY(var(--animation-distance))',
  } as React.CSSProperties),

  fadeIn: (config?: AnimationConfig) => ({
    '--animation-duration': `${config?.duration || 200}ms`,
    '--animation-delay': `${config?.delay || 0}ms`,
    '--animation-easing': config?.easing || 'ease-out',
    animation: 'fadeIn var(--animation-duration) var(--animation-easing) var(--animation-delay) forwards',
    opacity: 0,
  } as React.CSSProperties),

  scaleIn: (config?: AnimationConfig) => ({
    '--animation-duration': `${config?.duration || 200}ms`,
    '--animation-delay': `${config?.delay || 0}ms`,
    '--animation-easing': config?.easing || 'ease-out',
    animation: 'scaleIn var(--animation-duration) var(--animation-easing) var(--animation-delay) forwards',
    opacity: 0,
    transform: 'scale(0.95)',
  } as React.CSSProperties),

  slideInLeft: (config?: AnimationConfig) => ({
    '--animation-duration': `${config?.duration || 250}ms`,
    '--animation-delay': `${config?.delay || 0}ms`,
    '--animation-distance': `${config?.distance || 20}px`,
    '--animation-easing': config?.easing || 'ease-out',
    animation: 'slideInLeft var(--animation-duration) var(--animation-easing) var(--animation-delay) forwards',
    opacity: 0,
    transform: 'translateX(calc(-1 * var(--animation-distance)))',
  } as React.CSSProperties),

  // Exit animations
  slideOutLeft: (config?: AnimationConfig) => ({
    '--animation-duration': `${config?.duration || 150}ms`,
    '--animation-delay': `${config?.delay || 0}ms`,
    '--animation-distance': `${config?.distance || 20}px`,
    '--animation-easing': config?.easing || 'ease-in',
    animation: 'slideOutLeft var(--animation-duration) var(--animation-easing) var(--animation-delay) forwards',
  } as React.CSSProperties),

  // Hover animations
  scaleOnHover: 'transition-transform duration-200 ease-out hover:scale-105 active:scale-95',
  scaleOnHoverSubtle: 'transition-transform duration-200 ease-out hover:scale-[1.02] active:scale-95',
  
  // State transitions
  smooth: 'transition-all duration-200 ease-out',
  fast: 'transition-all duration-100 ease-out',
  slow: 'transition-all duration-300 ease-out',
};

// Animation hooks for React components
export function useStaggeredAnimation(items: any[], baseDelay = 0, staggerDelay = 50) {
  return items.map((_, index) => ({
    animationDelay: `${baseDelay + (index * staggerDelay)}ms`,
  }));
}

// Utility for conditional animations based on performance
export function getOptimizedAnimation(config?: AnimationConfig) {
  // Check for reduced motion preference
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return { opacity: 1 }; // Just show without animation
  }

  // Check for slow connection
  const isSlowConnection = typeof window !== 'undefined' && 
    document.documentElement.classList.contains('slow-connection');
  
  if (isSlowConnection) {
    return animations.fadeIn({ duration: 100, ...config });
  }

  return config;
}

// Animation presence utility (simplified AnimatePresence replacement)
export class AnimationPresence {
  private static instances = new Map<string, HTMLElement>();
  
  static enter(element: HTMLElement, id: string, animation?: React.CSSProperties) {
    this.instances.set(id, element);
    if (animation) {
      Object.assign(element.style, animation);
    }
  }
  
  static exit(id: string, onComplete?: () => void) {
    const element = this.instances.get(id);
    if (element) {
      element.style.animation = 'fadeOut 150ms ease-in forwards';
      setTimeout(() => {
        this.instances.delete(id);
        onComplete?.();
      }, 150);
    }
  }
}

// Performance-aware marquee animation
export function createMarqueeAnimation(duration = 15000) {
  return {
    '--marquee-duration': `${duration}ms`,
    animation: 'marquee-infinite var(--marquee-duration) linear infinite',
  } as React.CSSProperties;
}

// Utility class names for common animations
export const animationClasses = {
  // Entrance
  fadeInUp: 'opacity-0 translate-y-5 animate-[fadeInUp_300ms_ease-out_forwards]',
  fadeIn: 'opacity-0 animate-[fadeIn_200ms_ease-out_forwards]',
  scaleIn: 'opacity-0 scale-95 animate-[scaleIn_200ms_ease-out_forwards]',
  slideInLeft: 'opacity-0 -translate-x-5 animate-[slideInLeft_250ms_ease-out_forwards]',
  
  // Transitions
  smooth: 'transition-all duration-200 ease-out',
  fast: 'transition-all duration-100 ease-out',
  
  // Hover effects
  hover: 'transition-transform duration-200 ease-out hover:scale-105 active:scale-95',
  hoverSubtle: 'transition-transform duration-200 ease-out hover:scale-[1.02] active:scale-95',
  
  // Loading
  pulse: 'animate-pulse',
  spin: 'animate-spin',
};

// Performance monitoring for animations
export function trackAnimationPerformance(animationName: string, startTime: number) {
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  if (duration > 16.67) { // Slower than 60fps
    console.warn(`Animation "${animationName}" took ${duration.toFixed(2)}ms (>16.67ms)`);
  }
}

export default animations;