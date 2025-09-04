'use client';

import { useState, useEffect, useCallback, useTransition, useMemo, useRef } from 'react';
import { getAllProducts, getProductById, Product } from '@/lib/products';
import { Header } from '@/components/header';
import { AddToCart } from '@/components/add-to-cart';
import { ProductImage } from '@/components/product-image';
import { VideoProduct } from '@/components/video-product';
import { VideoProductDetails } from '@/components/video-product-details';
import { FooterMenu } from '@/components/footer-menu';
import { OnboardingPrompt } from '@/components/onboarding-prompt';
import { usePerformanceSettings, getAnimationDuration } from '@/lib/performance';
import { JsonLd } from '@/components/json-ld';
import { generateProductJsonLd } from '@/lib/seo';
import { isSlowConnection, debounce } from '@/lib/performance-optimization';

// Performance detection helper (moved to performance.ts lib)

export default function Page() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const performanceSettings = usePerformanceSettings();
  
  // Performance detection
  const [isMobile, setIsMobile] = useState(false);
  const [isSlowConn, setIsSlowConn] = useState(false);
  
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    setIsSlowConn(isSlowConnection());
    
    // Only preload critical images on fast connections
    if (!isSlowConnection()) {
      const criticalImages = [
        'https://6gy9systudbmcbju.public.blob.vercel-storage.com/ts-white-P2VTrySg3IQ4gdu17JGSrQ8RdLDgTm.png',
        'https://6gy9systudbmcbju.public.blob.vercel-storage.com/hd-white-K3qh4s0wfcmCCSIwTgtscr02jPSsg0.png',
        'https://6gy9systudbmcbju.public.blob.vercel-storage.com/wb-white-82bTXBV4TGM8XGOfuiI3IYcsJudeAt.png'
      ];
      
      criticalImages.forEach(src => {
        const img = new Image();
        img.src = src;
      });
    }
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleProductClick = useCallback((product: Product) => {
    // Create a beautiful URL with vendor and handle
    const vendor = product.vendor ? product.vendor.toLowerCase().replace(/\s+/g, '-') : 'shop';
    const handle = product.handle || product.id;
    const beautifulUrl = `/${vendor}/${handle}`;
    
    if (isMobile || performanceSettings.isLowPowerMode) {
      // Instant expansion on mobile/low-perf - no transition
      setExpandedProductId(product.id);
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', beautifulUrl);
      }
    } else {
      // Use transition on desktop for smooth animation
      startTransition(() => {
        setExpandedProductId(product.id);
        if (typeof window !== 'undefined') {
          window.history.pushState(null, '', beautifulUrl);
        }
      });
    }
  }, [startTransition, isMobile, performanceSettings.isLowPowerMode]);



  const handleBack = useCallback(() => {
    startTransition(() => {
      setExpandedProductId(null);
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', '/');
      }
    });
  }, []);

  const handleVendorSelect = useCallback((vendor: string | null) => {
    setSelectedVendor(vendor);
    setSelectedCollection(null); // Clear collection when vendor changes
  }, []);

  const handleCollectionSelect = useCallback((collectionId: string | null) => {
    setSelectedCollection(collectionId);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (expandedProductId) {
        if (event.key === 'Escape') {
          handleBack();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [expandedProductId, handleBack]);

  // Load products on component mount with caching optimization
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        // Check if we have cached products in sessionStorage
        const cached = sessionStorage.getItem('products-cache');
        const cacheTime = sessionStorage.getItem('products-cache-time');
        const cacheExpiry = 5 * 60 * 1000; // 5 minutes
        
        if (cached && cacheTime && (Date.now() - parseInt(cacheTime) < cacheExpiry)) {
          // Use cached data for instant loading
          const productData = JSON.parse(cached);
          setProducts(productData);
          setFilteredProducts(productData);
          setIsLoading(false);
          
          // Still fetch fresh data in background
          getAllProducts().then((freshData) => {
            setProducts(freshData);
            setFilteredProducts(freshData);
            sessionStorage.setItem('products-cache', JSON.stringify(freshData));
            sessionStorage.setItem('products-cache-time', Date.now().toString());
          }).catch(console.error);
        } else {
          // Fresh fetch
          const productData = await getAllProducts();
          setProducts(productData);
          setFilteredProducts(productData);
          
          // Cache for next time
          sessionStorage.setItem('products-cache', JSON.stringify(productData));
          sessionStorage.setItem('products-cache-time', Date.now().toString());
        }
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Filter products by vendor and collection (memoized)
  const filteredProductsMemo = useMemo(() => {
    let filtered = products;
    
    if (selectedVendor) {
      filtered = filtered.filter(product => product.vendor === selectedVendor);
    }
    
    if (selectedCollection) {
      filtered = filtered.filter(product => 
        product.collections?.some(collection => collection.id === selectedCollection)
      );
    }
    
    return filtered;
  }, [products, selectedVendor, selectedCollection]);

  // Get collection handle from collection ID
  const getCollectionHandle = useCallback((collectionId: string) => {
    const product = products.find(p => 
      p.collections?.some(c => c.id === collectionId)
    );
    return product?.collections?.find(c => c.id === collectionId)?.handle || collectionId;
  }, [products]);

  // Update filtered products when memo changes
  useEffect(() => {
    setFilteredProducts(filteredProductsMemo);
  }, [filteredProductsMemo]);

  // Get breadcrumb data for expanded product
  const breadcrumbData = useMemo(() => {
    if (expandedProductId) {
      const expandedProduct = filteredProducts.find(p => p.id === expandedProductId);
      if (expandedProduct) {
        // Use vendor name as-is (already good for display), and product handle for clean URL-style display
        const vendorHandle = expandedProduct.vendor ? expandedProduct.vendor.toLowerCase().replace(/\s+/g, '-') : 'shop';
        const productHandle = expandedProduct.handle || expandedProduct.id;
        
        return {
          vendor: expandedProduct.vendor || 'shop',
          vendorHandle: vendorHandle,
          collections: expandedProduct.collections,
          productName: productHandle,
          productId: expandedProduct.id
        };
      }
    }
    return null;
  }, [expandedProductId, filteredProducts]);

  // Handle initial URL and popstate events
  useEffect(() => {
    const parseUrlForProduct = async () => {
      if (typeof window === 'undefined') return;
      const path = window.location.pathname;
      const urlParams = new URLSearchParams(window.location.search);
      const productParam = urlParams.get('product');
      
      // Handle legacy ?product= URLs
      if (productParam) {
        const product = await getProductById(productParam);
        if (product) {
          setExpandedProductId(product.id);
        } else {
          setExpandedProductId(null);
        }
        return;
      }
      
      // Handle new beautiful URLs: /vendor/handle
      const pathSegments = path.split('/').filter(segment => segment !== '');
      if (pathSegments.length === 2) {
        const [vendor, handle] = pathSegments;
        
        // Find product by handle (since handle is more specific than vendor)
        const product = await getProductById(handle);
        if (product) {
          setExpandedProductId(product.id);
        } else {
          setExpandedProductId(null);
        }
      } else {
        setExpandedProductId(null);
      }
    };

    const handlePopState = async () => {
      await parseUrlForProduct();
    };

    // Check initial state on mount
    parseUrlForProduct();
    
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Get expanded product for JSON-LD - must be before conditional returns
  const expandedProduct = useMemo(() => {
    if (expandedProductId) {
      return filteredProducts.find(p => p.id === expandedProductId);
    }
    return null;
  }, [expandedProductId, filteredProducts]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header 
          isBackVisible={false} 
          onBack={handleBack}
          selectedVendor={selectedVendor}
          onVendorSelect={handleVendorSelect}
        />
        <main className="flex-grow relative pt-12">
          {/* Loading skeleton that mimics the actual grid */}
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-x-5 gap-y-12 pb-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="group">
                <div className="aspect-[4/5] bg-gray-100 animate-pulse rounded-sm mb-2"></div>
                <div className="text-center">
                  <div className="h-4 bg-gray-100 animate-pulse rounded mb-1"></div>
                  <div className="h-3 bg-gray-100 animate-pulse rounded w-16 mx-auto"></div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Add product structured data when viewing a product */}
      {expandedProduct && (
        <JsonLd data={generateProductJsonLd(expandedProduct)} />
      )}
      
      <Header 
        isBackVisible={!!expandedProductId} 
        onBack={handleBack}
        selectedVendor={selectedVendor}
        selectedCollection={selectedCollection}
        onVendorSelect={handleVendorSelect}
        onCollectionSelect={handleCollectionSelect}
        breadcrumbData={breadcrumbData}
        getCollectionHandle={getCollectionHandle}
      />
      <main className="flex-grow relative pt-12 px-3 sm:px-4 lg:px-6">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-x-3 sm:gap-x-4 lg:gap-x-5 gap-y-8 sm:gap-y-10 lg:gap-y-12 pb-8">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 sm:py-16">
              <div className="bg-gray-50 rounded-lg p-6 sm:p-8 text-center max-w-md mx-auto">
                <div className="size-12 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="size-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="font-mono text-sm text-gray-600 mb-2 font-medium">
                  No products found
                </p>
                <p className="font-mono text-xs text-gray-500 leading-relaxed">
                  Try clearing your filters or check back later for new arrivals
                </p>
              </div>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <ProductGridItem
                key={product.id}
                product={product}
                isExpanded={expandedProductId === product.id}
                onProductClick={handleProductClick}
                isLowPerf={performanceSettings.isLowPowerMode || isMobile}
              />
            ))
          )}
        </div>
      </main>
      
      {/* Footer Menu - only show when not on product page */}
      {!expandedProductId && (
        <div className="fixed bottom-5 left-5 z-10">
          <FooterMenu />
        </div>
      )}
      
      {/* Onboarding Prompt for new visitors 
      {!expandedProductId && <OnboardingPrompt />}*/}
    </div>
  );
}



// Optimized Product Grid Item Component
interface ProductGridItemProps {
  product: Product;
  isExpanded: boolean;
  onProductClick: (product: Product) => void;
  isLowPerf?: boolean;
}

const ProductGridItem = ({ product, isExpanded, onProductClick, isLowPerf = false }: ProductGridItemProps) => {
  const expandedContainerRef = useRef<HTMLDivElement>(null);
  const addToCartRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const hasPrewarmedRef = useRef(false);
  
  // Auto-scroll to prioritize add-to-cart on desktop, center on mobile
  useEffect(() => {
    if (isExpanded && expandedContainerRef.current) {
      const scrollToOptimalPosition = () => {
        const isDesktop = window.innerWidth >= 1024; // lg breakpoint
        
        if (isDesktop) {
          // Desktop: Try to find and scroll to add-to-cart button
          const addToCartElement = addToCartRef.current ||
                                   document.querySelector('button[type="submit"]') ||
                                   document.querySelector('[data-testid="add-to-cart"]') ||
                                   document.querySelector('.add-to-cart');
          
          if (addToCartElement) {
            // Scroll to add-to-cart with some offset to show image above
            addToCartElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            });
          } else {
            // Fallback: Use container with calculated position to show add-to-cart area
            const container = expandedContainerRef.current;
            if (container) {
              const containerRect = container.getBoundingClientRect();
              const viewportHeight = window.innerHeight;
              
              // Position so add-to-cart area is in lower 1/3 of viewport
              const targetScrollTop = window.scrollY + containerRect.top - (viewportHeight * 0.3);
              
              window.scrollTo({
                top: Math.max(0, targetScrollTop),
                behavior: 'smooth'
              });
            }
          }
        } else {
          // Mobile: Center the expanded view
          expandedContainerRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      };
      
      // Delay scroll to allow for layout changes and animations
      const timeoutId = setTimeout(scrollToOptimalPosition, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [isExpanded]);
  
  // Memoize expensive calculations
  const productDisplay = useMemo(() => {
    // Check if this product has default variants only (no meaningful variants)
    const hasShopifyVariants = product.variants && product.variants.length > 1 && product.options && product.options.length > 0;
    const isShopifyProduct = product.variants && product.variants.length > 0;
    
    // For products with default variants only, show first category from metafield
    if (!hasShopifyVariants && isShopifyProduct && product.metafields) {
      const categoryMetafield = product.metafields.find(meta => meta && meta.key === 'category');
      if (categoryMetafield && categoryMetafield.value) {
        // Parse the category value and get the first category
        try {
          const categories = JSON.parse(categoryMetafield.value);
          if (Array.isArray(categories) && categories.length > 0) {
            return categories[0];
          } else if (typeof categories === 'string') {
            return categories.split(',')[0].trim();
          }
        } catch {
          // If JSON parsing fails, treat as comma-separated string
          return categoryMetafield.value.split(',')[0].trim();
        }
      }
    }
    
    // Default to handle or id
    return product.handle || product.id;
  }, [product]);

  const handleClick = useCallback(() => {
    if (!isExpanded) {
      onProductClick(product);
    }
  }, [product, onProductClick, isExpanded]);

  // Prewarm PDP-sized optimized image on intent (hover/touch) to avoid cold _next/image miss
  const prewarmImage = useCallback(() => {
    if (hasPrewarmedRef.current) return;
    const src = (product as any).images && (product as any).images[0]?.url ? (product as any).images[0].url : product.image;
    if (!src) return;
    try {
      // Match PDP sizes: max-w-3xl ~ 768px (or your PDP container); q matches ProductImage
      const w = 896; // aligns with PDP desktop cap we use in sizes
      const q = 65;
      const optimized = `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=${q}`;
      const img = new Image();
      // Low priority hint; just warm the cache silently
      (img as any).fetchPriority = 'low';
      img.decoding = 'async';
      img.src = optimized;
      hasPrewarmedRef.current = true;
    } catch {}
  }, [product]);

  if (isExpanded) {
    // Expanded view - full width product details
    return (
      <div ref={expandedContainerRef} className="col-span-full">
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center justify-center p-2 sm:p-4 lg:p-6">
          <div className="w-full flex flex-col items-center justify-center p-1 sm:p-3">
            {product.isVideoProduct ? (
              <VideoProduct
                product={product}
                maxWidth="100%"
                maxHeight="calc(var(--safe-viewport-height) - var(--image-max-height-offset))"
                className="w-full max-w-3xl"
                layoutId={`product-image-${product.id}`}
                enableSlider={true}
              />
            ) : (
              <ProductImage
                product={product}
                maxWidth="100%"
                maxHeight="calc(var(--safe-viewport-height) - var(--image-max-height-offset))"
                className="w-full max-w-3xl"
                layoutId={`product-image-${product.id}`}
                enableSlider={true}
                showDropdown={showDropdown}
              />
            )}
          </div>
          
          <div ref={addToCartRef} className="w-full max-w-md mx-auto p-1 sm:p-2 lg:p-3">
            {product.isVideoProduct ? (
              <VideoProductDetails product={product} />
            ) : (
              <AddToCart 
                product={product} 
                showDropdown={showDropdown}
                setShowDropdown={setShowDropdown}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Normal grid view
  return (
    <div
      className="group cursor-pointer transition-all duration-200 ease-out hover:scale-105"
      onClick={handleClick}
      onMouseEnter={prewarmImage}
      onTouchStart={prewarmImage}
    >
      {product.isVideoProduct ? (
        <VideoProduct 
          product={product} 
          layoutId={`product-image-${product.id}`}
        />
      ) : (
        <ProductImage
          product={product}
          layoutId={`product-image-${product.id}`}
        />
      )}
      <div className="text-center">
        <p className="font-medium font-mono uppercase text-sm transition-colors duration-200 group-hover:text-[#00b140]">
          {productDisplay}
        </p>
        {product.price && (
          <p className="font-mono text-xs mt-1 opacity-70 transition-colors duration-200 group-hover:text-[#00b140]">
            {product.price.currencyCode} {parseFloat(product.price.amount).toFixed(2)}
          </p>
        )}
      </div>
    </div>
  );
};
