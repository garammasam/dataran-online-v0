// In-memory cache implementation with Redis-like interface
// This provides a foundation that can be easily swapped with Redis in production

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly maxSize: number;
  private readonly defaultTTL: number;

  constructor(maxSize = 1000, defaultTTL = 5 * 60 * 1000) { // 5 minutes default
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    // Clean up expired entries if cache is getting full
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    // If still at max size, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Clean up expired entries
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

// Create global cache instance
const cache = new MemoryCache();

// Cache utilities with different TTL strategies
export const cacheUtils = {
  // Products cache - longer TTL since products don't change frequently
  products: {
    get: <T>(key: string) => cache.get<T>(`products:${key}`),
    set: <T>(key: string, data: T) => cache.set(`products:${key}`, data, 10 * 60 * 1000), // 10 minutes
    delete: (key: string) => cache.delete(`products:${key}`),
  },

  // Inventory cache - shorter TTL since stock changes frequently
  inventory: {
    get: <T>(key: string) => cache.get<T>(`inventory:${key}`),
    set: <T>(key: string, data: T) => cache.set(`inventory:${key}`, data, 2 * 60 * 1000), // 2 minutes
    delete: (key: string) => cache.delete(`inventory:${key}`),
  },

  // Checkout cache - very short TTL for security
  checkout: {
    get: <T>(key: string) => cache.get<T>(`checkout:${key}`),
    set: <T>(key: string, data: T) => cache.set(`checkout:${key}`, data, 30 * 1000), // 30 seconds
    delete: (key: string) => cache.delete(`checkout:${key}`),
  },

  // Events cache - medium TTL
  events: {
    get: <T>(key: string) => cache.get<T>(`events:${key}`),
    set: <T>(key: string, data: T) => cache.set(`events:${key}`, data, 5 * 60 * 1000), // 5 minutes
    delete: (key: string) => cache.delete(`events:${key}`),
  },

  // Generic cache operations
  clear: () => cache.clear(),
  getStats: () => cache.getStats(),
};

// Hash function for creating consistent cache keys
export function createCacheKey(...parts: (string | number | object)[]): string {
  return parts
    .map(part => 
      typeof part === 'object' 
        ? JSON.stringify(part)
        : String(part)
    )
    .join(':')
    .replace(/[^a-zA-Z0-9:_-]/g, '_'); // Sanitize key
}

// Cache warming utilities
export async function warmCache() {
  try {
    // Pre-load frequently accessed data
    console.log('Warming cache...');
    
    // This could be expanded to pre-load common product queries
    // const popularProducts = await getAllProducts();
    // cacheUtils.products.set('all', popularProducts);
    
    console.log('Cache warmed successfully');
  } catch (error) {
    console.warn('Cache warming failed:', error);
  }
}

export default cache;