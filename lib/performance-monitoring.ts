// Performance monitoring and optimization utilities

interface PerformanceMetrics {
  lcp?: number;      // Largest Contentful Paint
  fid?: number;      // First Input Delay  
  cls?: number;      // Cumulative Layout Shift
  fcp?: number;      // First Contentful Paint
  ttfb?: number;     // Time to First Byte
}

interface ConnectionInfo {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observers: Map<string, PerformanceObserver> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
      this.monitorPageLoad();
    }
  }

  private initializeObservers() {
    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.lcp = lastEntry.startTime;
          this.reportMetric('lcp', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);
      } catch (error) {
        console.warn('LCP observer not supported:', error);
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const perfEntry = entry as any;
            if (perfEntry.processingStart) {
              const fid = perfEntry.processingStart - entry.startTime;
              this.metrics.fid = fid;
              this.reportMetric('fid', fid);
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);
      } catch (error) {
        console.warn('FID observer not supported:', error);
      }

      // Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const perfEntry = entry as any;
            if (!perfEntry.hadRecentInput) {
              const newCls = (this.metrics.cls || 0) + perfEntry.value;
              this.metrics.cls = newCls;
              this.reportMetric('cls', newCls);
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('cls', clsObserver);
      } catch (error) {
        console.warn('CLS observer not supported:', error);
      }
    }
  }

  private monitorPageLoad() {
    // Monitor page load performance
    window.addEventListener('load', () => {
      // Get navigation timing
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
        this.metrics.fcp = navigation.domContentLoadedEventEnd - navigation.fetchStart;
        
        this.reportMetric('ttfb', this.metrics.ttfb);
        this.reportMetric('fcp', this.metrics.fcp);
      }

      // Report initial metrics
      this.reportInitialMetrics();
    });
  }

  private reportMetric(name: string, value: number) {
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      const status = this.getMetricStatus(name, value);
      console.log(`Performance: ${name.toUpperCase()} = ${value.toFixed(2)}ms [${status}]`);
    }

    // In production, you might send to analytics
    // analytics.track('performance_metric', { metric: name, value, url: window.location.pathname });
  }

  private getMetricStatus(name: string, value: number): string {
    const thresholds: Record<string, { good: number; poor: number }> = {
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      fcp: { good: 1800, poor: 3000 },
      ttfb: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[name];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs improvement';
    return 'poor';
  }

  private reportInitialMetrics() {
    console.log('Performance Metrics:', this.metrics);
    
    // Report connection info
    const connection = this.getConnectionInfo();
    if (connection) {
      console.log('Connection:', connection);
      
      // Apply optimizations based on connection
      this.applyConnectionOptimizations(connection);
    }
  }

  private getConnectionInfo(): ConnectionInfo | null {
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

  private applyConnectionOptimizations(connection: ConnectionInfo) {
    const isSlowConnection = 
      connection.effectiveType === 'slow-2g' ||
      connection.effectiveType === '2g' ||
      connection.downlink < 1.5 ||
      connection.saveData;

    if (isSlowConnection) {
      document.documentElement.classList.add('slow-connection');
      
      // Reduce animation quality
      document.documentElement.style.setProperty('--animation-duration', '0.1s');
      
      // Preload fewer resources
      this.optimizeResourceLoading();
    }
  }

  private optimizeResourceLoading() {
    // Disable expensive preloads on slow connections
    const preloadLinks = document.querySelectorAll('link[rel="preload"]');
    preloadLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (href && (href.includes('.jpg') || href.includes('.png') || href.includes('.webp'))) {
        link.remove();
      }
    });
  }

  // Public methods for manual tracking
  public markStart(name: string) {
    performance.mark(`${name}-start`);
  }

  public markEnd(name: string) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name)[0];
    this.reportMetric(name, measure.duration);
  }

  public trackInteraction<T>(name: string, callback: () => T): T {
    this.markStart(name);
    const result = callback();
    this.markEnd(name);
    return result;
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public disconnect() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export function initializePerformanceMonitoring() {
  if (typeof window !== 'undefined' && !performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
}

export function getPerformanceMonitor(): PerformanceMonitor | null {
  return performanceMonitor;
}

// React hook for component-level performance tracking
export function usePerformanceTracking(componentName: string) {
  const monitor = getPerformanceMonitor();
  
  return {
    trackStart: () => monitor?.markStart(componentName),
    trackEnd: () => monitor?.markEnd(componentName),
    trackOperation: (operationName: string, operation: () => void) => {
      const fullName = `${componentName}-${operationName}`;
      return monitor?.trackInteraction(fullName, operation);
    }
  };
}

// Utility for measuring custom metrics
export function measurePerformance<T>(name: string, fn: () => T): T {
  const monitor = getPerformanceMonitor();
  if (monitor) {
    return monitor.trackInteraction(name, fn);
  }
  return fn();
}

// Bundle size tracking (for development)
export function trackBundleSize() {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      let totalSize = 0;
      
      scripts.forEach(async (script) => {
        const src = script.getAttribute('src');
        if (src && src.startsWith('/_next/')) {
          try {
            const response = await fetch(src, { method: 'HEAD' });
            const size = parseInt(response.headers.get('content-length') || '0');
            totalSize += size;
            console.log(`Bundle: ${src} = ${(size / 1024).toFixed(2)}KB`);
          } catch (error) {
            console.warn('Could not measure bundle size for:', src);
          }
        }
      });
      
      setTimeout(() => {
        console.log(`Total Bundle Size: ${(totalSize / 1024).toFixed(2)}KB`);
      }, 1000);
    });
  }
}

const performanceMonitoringExports = {
  initializePerformanceMonitoring,
  getPerformanceMonitor,
  usePerformanceTracking,
  measurePerformance,
  trackBundleSize,
};

export default performanceMonitoringExports;