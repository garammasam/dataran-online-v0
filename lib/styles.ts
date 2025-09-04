// Common style patterns to reduce duplication

// Typography patterns
export const typography = {
  // Mono font patterns
  mono: {
    heading: 'font-mono uppercase tracking-wide font-semibold',
    body: 'font-mono text-sm',
    small: 'font-mono text-xs uppercase tracking-wider',
    button: 'font-mono text-sm uppercase font-semibold',
  },
  
  // Text hierarchy from globals.css
  heading: {
    primary: 'text-heading-primary',
    secondary: 'text-heading-secondary',
  },
  
  body: {
    primary: 'text-body-primary',
    secondary: 'text-body-secondary',
    muted: 'text-muted',
    interactive: 'text-interactive',
  }
};

// Interactive element patterns
export const interactive = {
  // Focus states
  focus: {
    ring: 'focus-ring',
    interactive: 'focus-interactive',
  },
  
  // Hover patterns
  hover: {
    scale: 'transition-transform duration-200 ease-out hover:scale-105 active:scale-95',
    scaleSubtle: 'transition-transform duration-200 ease-out hover:scale-[1.02] active:scale-95',
    background: 'transition-colors duration-200 hover:bg-gray-100',
    backgroundDark: 'transition-colors duration-200 hover:bg-black hover:text-white',
  },
  
  // Button patterns
  button: {
    base: 'inline-flex items-center justify-center transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95',
    primary: 'bg-black text-white hover:bg-gray-800 focus:ring-black',
    secondary: 'bg-transparent text-black border border-gray-300 hover:bg-black hover:text-white focus:ring-gray-500',
    ghost: 'bg-transparent text-black hover:bg-gray-100 focus:ring-gray-300',
  }
};

// Layout patterns
export const layout = {
  // Flex patterns
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-center justify-start',
    col: 'flex flex-col',
    colCenter: 'flex flex-col items-center justify-center',
  },
  
  // Dropdown/overlay patterns
  dropdown: {
    container: 'relative inline-block',
    content: 'absolute z-50 bg-white border border-gray-200 shadow-lg overflow-hidden',
    item: 'w-full text-left px-3 py-2 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed',
  },
  
  // Card patterns
  card: {
    base: 'bg-white border border-gray-200 shadow-sm',
    interactive: 'bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200',
  }
};

// Animation patterns from lib/animations.ts
export const animations = {
  // Entrance animations
  enter: {
    fadeUp: 'opacity-0 translate-y-5 animate-[fadeInUp_300ms_ease-out_forwards]',
    fade: 'opacity-0 animate-[fadeIn_200ms_ease-out_forwards]',
    scale: 'opacity-0 scale-95 animate-[scaleIn_200ms_ease-out_forwards]',
    slideLeft: 'opacity-0 -translate-x-5 animate-[slideInLeft_250ms_ease-out_forwards]',
  },
  
  // Transition patterns
  transition: {
    smooth: 'transition-all duration-200 ease-out',
    fast: 'transition-all duration-100 ease-out',
    slow: 'transition-all duration-300 ease-out',
  },
  
  // Performance optimized
  performance: {
    slowConnection: 'slow-connection', // Added to html element
    reducedMotion: 'motion-safe:animate-pulse motion-reduce:animate-none',
  }
};

// Spacing patterns
export const spacing = {
  section: 'py-8 px-4 sm:px-6 lg:px-8',
  container: 'max-w-7xl mx-auto',
  containerSm: 'max-w-md mx-auto',
  containerMd: 'max-w-2xl mx-auto',
  containerLg: 'max-w-4xl mx-auto',
};

// Helper function to combine common patterns
export const patterns = {
  // Common button patterns
  buttonPrimary: `${interactive.button.base} ${interactive.button.primary} ${typography.mono.button}`,
  buttonSecondary: `${interactive.button.base} ${interactive.button.secondary} ${typography.mono.button}`,
  buttonGhost: `${interactive.button.base} ${interactive.button.ghost} ${typography.mono.button}`,
  
  // Common dropdown patterns  
  dropdownTrigger: `${layout.flex.center} gap-2 px-3 py-1 bg-white ${typography.mono.button} ${interactive.hover.background} min-w-[120px] cursor-pointer`,
  dropdownItem: `${layout.dropdown.item} ${typography.mono.small}`,
  
  // Common card patterns
  productCard: `${layout.card.interactive} p-4 ${animations.transition.smooth}`,
  
  // Layout patterns
  pageContainer: `${layout.flex.col} min-h-screen ${spacing.section}`,
  centerContent: `${layout.flex.colCenter} ${spacing.containerSm}`,
};

// Utility to combine classes safely
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Theme-aware utilities
export const theme = {
  colors: {
    primary: 'var(--primary)',
    background: 'var(--background)',
    foreground: 'var(--foreground)',
    muted: 'var(--muted)',
    border: 'var(--border)',
  },
  
  // CSS custom property helpers
  customProperty: (name: string, value: string) => ({
    [`--${name}`]: value,
  } as React.CSSProperties),
  
  // Responsive helpers
  responsive: {
    mobile: 'max-width: 640px',
    tablet: 'max-width: 1024px',
    desktop: 'min-width: 1025px',
  }
};

const stylesExports = {
  typography,
  interactive,
  layout,
  animations,
  spacing,
  patterns,
  theme,
  cn,
};

export default stylesExports;