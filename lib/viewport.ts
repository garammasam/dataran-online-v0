/**
 * Centralized viewport configuration and responsive utilities
 * Single source of truth for all viewport-related constants and calculations
 */

// Core viewport constants
export const VIEWPORT_CONFIG = {
  // Next.js viewport export values
  meta: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
    themeColor: '#00b140',
  },
  
  // Mobile-first viewport units that respect URL bar behavior
  height: {
    // Use dvh (dynamic viewport height) for modern mobile browsers - respects URL bar
    dynamic: '100dvh',
    // Fallback to vh for older browsers
    fallback: '100vh',
    // Small viewport height (minimum when URL bar is visible)
    small: '100svh',
    // Large viewport height (maximum when URL bar is hidden)
    large: '100lvh',
    // Safe mobile height that accounts for URL bar
    mobile: 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
  },
  
  // Safe area constants for modern devices
  safeArea: {
    top: 'env(safe-area-inset-top)',
    bottom: 'env(safe-area-inset-bottom)',
    left: 'env(safe-area-inset-left)',
    right: 'env(safe-area-inset-right)',
  },
  
  // Breakpoints aligned with Tailwind CSS
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

// Responsive utilities
export const responsive = {
  // Standard responsive image sizes
  imageSizes: '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw',
  
  // Container max heights with mobile URL bar support
  containerHeights: {
    // Full height that respects mobile URL bar
    full: VIEWPORT_CONFIG.height.dynamic,
    // Mobile-safe height that works with URL bar changes
    mobileSafe: VIEWPORT_CONFIG.height.mobile,
    // With custom offset
    withOffset: (offset: string) => 
      `calc(${VIEWPORT_CONFIG.height.dynamic} - ${offset} - ${VIEWPORT_CONFIG.safeArea.top} - ${VIEWPORT_CONFIG.safeArea.bottom})`,
    // Dialog heights - use dynamic for mobile URL bar support
    dialog: VIEWPORT_CONFIG.height.dynamic,
    cart: VIEWPORT_CONFIG.height.dynamic,
    // Fallback for older browsers
    fallback: VIEWPORT_CONFIG.height.fallback,
  },
  
  // Standard aspect ratios
  aspectRatios: {
    product: '4/5',
    video: '16/9',
    square: '1/1',
    wide: '3/2',
  },
  
  // Animation scaling values
  scales: {
    hover: {
      normal: 'hover:scale-105',
      subtle: 'hover:scale-[1.02]',
      active: 'active:scale-95',
    },
    transitions: {
      default: 'transition-transform duration-200 ease-out',
      slow: 'transition-transform duration-300 ease-out',
      fast: 'transition-transform duration-150 ease-out',
    },
  },
} as const;

// CSS custom properties for dynamic viewport calculations
export const CSS_VARIABLES = {
  // Image max height offset variable
  imageMaxHeightOffset: '--image-max-height-offset',
  
  // Viewport height variables
  viewportHeight: '--vh',
  safeViewportHeight: '--safe-vh',
  
  // Container height variables
  containerHeight: '--container-height',
  dialogHeight: '--dialog-height',
} as const;

// Utility functions
export const viewport = {
  /**
   * Generate responsive class names for common patterns
   */
  responsive: {
    width: 'w-full max-w-full',
    // Use dynamic height for mobile URL bar support
    height: `h-[${VIEWPORT_CONFIG.height.dynamic}]`,
    maxHeight: `max-h-[${VIEWPORT_CONFIG.height.dynamic}]`,
    // Container respects mobile URL bar
    container: 'min-h-[100dvh] h-[100dvh]',
    // Dialog uses dynamic height
    dialog: `max-h-[${VIEWPORT_CONFIG.height.dynamic}] overflow-hidden`,
    image: 'w-full h-auto object-cover',
    // Mobile-specific utilities
    mobileContainer: 'min-h-[calc(100vh-env(safe-area-inset-top)-env(safe-area-inset-bottom))]',
    mobileDialog: 'max-h-[100dvh]',
  },
  
  /**
   * Calculate safe viewport height with offset - mobile URL bar aware
   */
  safeHeight: (offset = '0px') => 
    `calc(${VIEWPORT_CONFIG.height.dynamic} - ${offset} - ${VIEWPORT_CONFIG.safeArea.top} - ${VIEWPORT_CONFIG.safeArea.bottom})`,
  
  /**
   * Mobile-specific height calculation that works with URL bar
   */
  mobileHeight: (offset = '0px') => 
    `calc(100vh - ${offset} - env(safe-area-inset-top) - env(safe-area-inset-bottom))`,
  
  /**
   * Get media query for breakpoint
   */
  mediaQuery: (breakpoint: keyof typeof VIEWPORT_CONFIG.breakpoints) =>
    `(min-width: ${VIEWPORT_CONFIG.breakpoints[breakpoint]})`,
  
  /**
   * Get scale utility classes
   */
  scale: (type: 'hover' | 'active' | 'transition' = 'hover') => {
    switch (type) {
      case 'hover':
        return `${responsive.scales.transitions.default} ${responsive.scales.hover.normal} ${responsive.scales.hover.active}`;
      case 'active':
        return responsive.scales.hover.active;
      case 'transition':
        return responsive.scales.transitions.default;
      default:
        return '';
    }
  },
} as const;

// Export individual utilities for convenience
export const {
  imageSizes,
  containerHeights,
  aspectRatios,
  scales,
} = responsive;

export const {
  height: viewportHeights,
  safeArea,
  breakpoints,
} = VIEWPORT_CONFIG;

// Type exports for better TypeScript support
export type ViewportConfig = typeof VIEWPORT_CONFIG;
export type ResponsiveUtilities = typeof responsive;
export type BreakpointKey = keyof typeof VIEWPORT_CONFIG.breakpoints;