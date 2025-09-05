import Image from 'next/image';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Product } from '@/lib/products';
import { usePerformanceSettings, getAnimationDuration } from '@/lib/performance';
import { viewport, responsive, VIEWPORT_CONFIG } from '@/lib/viewport';
import { isSlowConnection, getImageQuality } from '@/lib/performance-optimization';

interface ProductImageProps {
  product: Product;
  priority?: boolean;
  maxWidth?: string;
  maxHeight?: string;
  className?: string;
  layoutId?: string;
  enableSlider?: boolean;
}

export function ProductImage({
  product,
  maxWidth = '100%',
  maxHeight = 'none',
  className = '',
  layoutId,
  enableSlider = false,
}: ProductImageProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const isDragging = useRef(false);
  const originalScrollPosition = useRef<{ top: number; left: number } | null>(null);
  const performanceSettings = usePerformanceSettings();
  const isSlowConn = isSlowConnection();
  const imageQuality = getImageQuality();

  // Get all available images - memoized for performance
  const images = useMemo(() => {
    return (product as any).images && (product as any).images.length > 0 
      ? (product as any).images 
      : [{ url: product.image, altText: product.name || product.title || '' }];
  }, [product]);

  const currentImage = images[currentImageIndex];

  // Calculate container aspect ratio - consistent 4:5 ratio
  const containerAspectRatio = 4/5;

  // Determine if image needs zooming based on context
  const needsZoom = useMemo(() => {
    // In expanded view (enableSlider), show full image without cropping
    if (enableSlider) return false;
    // In grid view, maintain consistency with slight tolerance
    if (!imageAspectRatio) return false;
    const aspectRatioDifference = Math.abs(imageAspectRatio - (4/5));
    return aspectRatioDifference > 0.15; // Tighter tolerance for more consistent layout
  }, [imageAspectRatio, enableSlider]);

  // Handle image load to detect aspect ratio
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    setImageAspectRatio(aspectRatio);
  }, []);

  // Preload adjacent images for snappy navigation
  useEffect(() => {
    if (!enableSlider || images.length <= 1) return;
    
    const preloadAdjacentImages = () => {
      const nextIndex = (currentImageIndex + 1) % images.length;
      const prevIndex = (currentImageIndex - 1 + images.length) % images.length;
      
      [nextIndex, prevIndex].forEach(index => {
        if (index !== currentImageIndex) {
          const img = document.createElement('img');
          img.src = images[index].url;
          img.decoding = 'async';
          // Lower priority on slow connections
          if (isSlowConn) {
            (img as any).fetchPriority = 'low';
          }
        }
      });
    };
    
    // Delay based on connection speed
    const delay = isSlowConn ? 200 : 50;
    const timeoutId = setTimeout(preloadAdjacentImages, delay);
    return () => clearTimeout(timeoutId);
  }, [currentImageIndex, enableSlider, images, isSlowConn]);


  // Keyboard navigation for image slider
  useEffect(() => {
    if (!enableSlider || images.length <= 1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableSlider, images.length]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enableSlider || images.length <= 1) return;
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
    
    // Add haptic feedback on supported devices - lighter for mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(5); // Lighter haptic for mobile
    }
    
    // Prevent default touch behavior immediately on mobile for smoother scrolling
    e.preventDefault();
  }, [enableSlider, images.length]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enableSlider || !isDragging.current || images.length <= 1) return;
    
    const currentX = e.touches[0].clientX;
    const diffX = Math.abs(startX.current - currentX);
    
    // Mobile-optimized: prevent default earlier for smoother scrolling
    if (diffX > 3) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [enableSlider, images.length]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!enableSlider || !isDragging.current || images.length <= 1) return;
    
    const endX = e.changedTouches[0].clientX;
    const diffX = startX.current - endX;
    const threshold = 12; // Mobile-optimized threshold for easier swiping

    if (Math.abs(diffX) > threshold) {
      e.stopPropagation(); // Only stop propagation if we're handling the swipe
      
      // Add haptic feedback for successful swipe
      if ('vibrate' in navigator) {
        navigator.vibrate(15);
      }
      
      if (diffX > 0) {
        // Swipe left - next image
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      } else {
        // Swipe right - previous image
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    }
    
    isDragging.current = false;
  }, [enableSlider, images.length]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!enableSlider || images.length <= 1) return;
    startX.current = e.clientX;
    isDragging.current = true;
    // Don't stop propagation for mouse events either
  }, [enableSlider, images.length]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!enableSlider || !isDragging.current || images.length <= 1) return;
    
    const currentX = e.clientX;
    const diffX = Math.abs(startX.current - currentX);
    
    // Only prevent default if it's clearly a horizontal drag
    if (diffX > 5) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [enableSlider, images.length]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!enableSlider || !isDragging.current || images.length <= 1) return;
    
    const endX = e.clientX;
    const diffX = startX.current - endX;
    const threshold = 20; // More responsive mouse dragging

    if (Math.abs(diffX) > threshold) {
      e.stopPropagation(); // Only stop propagation if we're handling the drag
      if (diffX > 0) {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      } else {
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    }
    
    isDragging.current = false;
  }, [enableSlider, images.length]);

  return (
    <>
      <div
        ref={containerRef}
        className={`relative mb-1 ${className} ${enableSlider && images.length > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
        style={{
          width: '100%',
          maxWidth: '100%',
          minHeight: enableSlider ? '300px' : 'auto',
          maxHeight: enableSlider ? 'calc(var(--safe-viewport-height) - var(--image-max-height-offset))' : 'none',
          aspectRatio: enableSlider ? (imageAspectRatio || '4 / 5') : '4 / 5',
          overflow: 'hidden',
          contain: 'layout style paint', // Optimize rendering
          willChange: enableSlider ? 'transform' : 'auto', // Hint for GPU acceleration
          // Mobile-specific optimizations
          touchAction: enableSlider ? 'pan-x' : 'auto', // Allow horizontal panning only
          WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          isDragging.current = false;
        }}
      >
        <div
          key={currentImageIndex}
          className="absolute inset-0 opacity-100"
          style={{ 
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden'
          }}
        >
        <Image
          src={currentImage.url}
          alt={currentImage.altText || product.name || product.title || ''}
          fill
          sizes={enableSlider ? '(max-width: 1024px) 100vw, 896px' : responsive.imageSizes}
          className={`${needsZoom ? 'object-cover' : (enableSlider ? 'object-contain' : 'object-cover')}`}
          loading={currentImageIndex === 0 && enableSlider ? 'eager' : 'lazy'}
          decoding="async"
          priority={currentImageIndex === 0 && enableSlider}
          quality={enableSlider ? (isSlowConn ? 60 : 75) : (isSlowConn ? 50 : 65)} // Adaptive quality based on connection
          fetchPriority={currentImageIndex === 0 && enableSlider ? 'high' : 'low'}
          onLoad={handleImageLoad}
          style={{
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            imageRendering: 'auto' // Better quality scaling
          }}
        />
        </div>
      
             {/* Click areas for navigation */}
       {enableSlider && images.length > 1 && (
         <>
           {/* Left click area - with accessibility */}
           <div 
            className="absolute left-0 top-0 w-1/2 h-full cursor-pointer z-10 focus:outline-none"
            role="button"
            aria-label={`Previous image (${currentImageIndex + 1} of ${images.length})`}
            aria-describedby="image-navigation-hint"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
              }
            }}
          />
           {/* Right click area - with accessibility */}
           <div 
            className="absolute right-0 top-0 w-1/2 h-full cursor-pointer z-10 focus:outline-none"
            role="button"
            aria-label={`Next image (${currentImageIndex + 1} of ${images.length})`}
            aria-describedby="image-navigation-hint"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              setCurrentImageIndex((prev) => (prev + 1) % images.length);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev + 1) % images.length);
              }
            }}
          />
         </>
       )}

      </div>
      
      {/* Picture count display - centered and constrained */}
      {enableSlider && images.length > 1 && (
        <div className="flex justify-center items-center w-full text-sm font-medium text-black mt-2">
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs sm:text-sm">{currentImageIndex + 1}</span>
            <span className="text-xs sm:text-sm text-gray-500">/</span>
            <span className="text-xs sm:text-sm">{images.length}</span>
          </div>
        </div>
      )}
      
    </>
  );
}