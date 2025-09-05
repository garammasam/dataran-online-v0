// Performance optimization utilities for slower connections

export interface ConnectionInfo {
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
  downlink: number;
  rtt: number;
  saveData: boolean;
}

// Detect connection speed and capabilities
export function getConnectionInfo(): ConnectionInfo | null {
  if (typeof window === 'undefined') return null;
  
  const nav = navigator as any;
  if ('connection' in nav) {
    return {
      effectiveType: nav.connection.effectiveType || '4g',
      downlink: nav.connection.downlink || 10,
      rtt: nav.connection.rtt || 50,
      saveData: nav.connection.saveData || false,
    };
  }
  
  return null;
}

// Determine if connection is slow
export function isSlowConnection(): boolean {
  const connection = getConnectionInfo();
  if (!connection) return false;
  
  return (
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g' ||
    connection.downlink < 1.5 ||
    connection.rtt > 300 ||
    connection.saveData
  );
}

// Get optimized image quality based on connection
export function getImageQuality(): 'low' | 'medium' | 'high' {
  const connection = getConnectionInfo();
  if (!connection) return 'high';
  
  if (connection.saveData || connection.effectiveType === 'slow-2g') {
    return 'low';
  }
  
  if (connection.effectiveType === '2g' || connection.downlink < 2) {
    return 'medium';
  }
  
  return 'high';
}

// Debounced resize handler for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
}

// Throttled scroll handler for performance
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Lazy loading with intersection observer
export function createLazyLoader(options?: IntersectionObserverInit) {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  };

  return new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const target = entry.target as HTMLElement;
        
        // Load images
        if (target.tagName === 'IMG') {
          const img = target as HTMLImageElement;
          const src = img.dataset.src;
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
          }
        }
        
        // Trigger custom load event
        target.dispatchEvent(new CustomEvent('lazyload'));
      }
    });
  }, defaultOptions);
}

// Preload critical resources
export function preloadCriticalResources() {
  if (typeof window === 'undefined') return;
  
  // Preload critical fonts
  const fontLinks = [
    '/fonts/geist-mono.woff2',
  ];
  
  fontLinks.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = href;
    document.head.appendChild(link);
  });
  
  // Preload critical images based on connection
  const quality = getImageQuality();
  if (quality === 'high') {
    // Only preload hero images on fast connections
    const criticalImages = [
      '/images/hero.webp',
      '/images/logo.svg',
    ];
    
    criticalImages.forEach(href => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = href;
      document.head.appendChild(link);
    });
  }
}

// Service worker registration for caching
export function registerServiceWorker() {
  if (typeof window === 'undefined') return;
  
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
}

// Resource hints for better loading
export function addResourceHints() {
  if (typeof window === 'undefined') return;
  
  // DNS prefetch for external domains
  const domains = [
    '//fonts.googleapis.com',
    '//cdn.shopify.com',
    '//static.wixstatic.com',
  ];
  
  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = domain;
    document.head.appendChild(link);
  });
  
  // Preconnect to critical domains
  const criticalDomains = [
    'https://cdn.shopify.com',
  ];
  
  criticalDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = domain;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

// Performance monitoring
export function measurePerformance() {
  if (typeof window === 'undefined') return;
  
  // Measure and log Core Web Vitals
  if ('PerformanceObserver' in window) {
    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const perfEntry = entry as any; // Type assertion for PerformanceEventTiming
        if (perfEntry.processingStart) {
          console.log('FID:', perfEntry.processingStart - entry.startTime);
        }
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!(entry as any).hadRecentInput) {
          console.log('CLS:', (entry as any).value);
        }
      });
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  }
}

// Initialize all performance optimizations
export function initializePerformanceOptimizations() {
  if (typeof window === 'undefined') return;
  
  // Add resource hints
  addResourceHints();
  
  // Preload critical resources
  preloadCriticalResources();
  
  // Register service worker
  registerServiceWorker();
  
  // Start performance monitoring
  measurePerformance();
  
  // Log connection info
  const connection = getConnectionInfo();
  if (connection) {
    console.log('Connection:', connection);
    console.log('Slow connection:', isSlowConnection());
    console.log('Image quality:', getImageQuality());
  }
}