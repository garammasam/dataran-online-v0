import Image from 'next/image';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Product } from '@/lib/products';
import { usePerformanceSettings, getAnimationDuration } from '@/lib/performance';
import { viewport, responsive, VIEWPORT_CONFIG } from '@/lib/viewport';

interface ProductImageProps {
  product: Product;
  priority?: boolean;
  maxWidth?: string;
  maxHeight?: string;
  className?: string;
  layoutId?: string;
  enableSlider?: boolean;
  showDropdown?: boolean;
}

export function ProductImage({
  product,
  maxWidth = '100%',
  maxHeight = 'none',
  className = '',
  layoutId,
  enableSlider = false,
  showDropdown = false,
}: ProductImageProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDetailsElement>(null);
  const startX = useRef(0);
  const isDragging = useRef(false);
  const originalScrollPosition = useRef<{ top: number; left: number } | null>(null);
  const performanceSettings = usePerformanceSettings();

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
    return aspectRatioDifference > 0.2; // Only crop if significantly different
  }, [imageAspectRatio, enableSlider]);

  // Handle image load to detect aspect ratio
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    setImageAspectRatio(aspectRatio);
  }, []);

  // Auto-scroll to focus on add-to-cart when dropdown is expanded, revert when closed
  useEffect(() => {
    if (enableSlider) {
      const scrollToAddToCart = () => {
        if (isDropdownOpen) {
          // Store original scroll position when first opening
          if (!originalScrollPosition.current) {
            originalScrollPosition.current = {
              top: window.scrollY,
              left: window.scrollX
            };
          }
          
          // Find the add-to-cart component (it's typically in the parent container)
          const addToCartElement = document.querySelector('[data-testid="add-to-cart"], .add-to-cart, button[type="submit"]');
          if (addToCartElement) {
            addToCartElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            });
          } else {
            // Fallback: scroll the dropdown into view
            dropdownRef.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            });
          }
        } else {
          // When closing, revert to original scroll position
          if (originalScrollPosition.current) {
            window.scrollTo({
              top: originalScrollPosition.current.top,
              left: originalScrollPosition.current.left,
              behavior: 'smooth'
            });
            // Reset the stored position
            originalScrollPosition.current = null;
          }
        }
      };
      
      // Delay scroll to allow for dropdown animation
      const timeoutId = setTimeout(scrollToAddToCart, 150);
      return () => {
        clearTimeout(timeoutId);
        // Cleanup: ensure scroll position is reset if component unmounts
        if (originalScrollPosition.current) {
          originalScrollPosition.current = null;
        }
      };
    }
  }, [isDropdownOpen, enableSlider]);

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
    
    // Add haptic feedback on supported devices
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [enableSlider, images.length]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enableSlider || !isDragging.current || images.length <= 1) return;
    
    const currentX = e.touches[0].clientX;
    const diffX = Math.abs(startX.current - currentX);
    
    // Only prevent default and stop propagation if it's clearly a horizontal swipe
    if (diffX > 10) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [enableSlider, images.length]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!enableSlider || !isDragging.current || images.length <= 1) return;
    
    const endX = e.changedTouches[0].clientX;
    const diffX = startX.current - endX;
    const threshold = 20; // Reduced threshold for easier swiping on mobile

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
    if (diffX > 10) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [enableSlider, images.length]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!enableSlider || !isDragging.current || images.length <= 1) return;
    
    const endX = e.clientX;
    const diffX = startX.current - endX;
    const threshold = 30; // Reduced threshold for easier dragging

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
          className="absolute inset-0 opacity-0 animate-[fadeIn_150ms_ease-out_forwards]"
          style={{ 
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden'
          }}
        >
        <Image
          src={currentImage.url}
          alt={currentImage.altText || product.name || product.title || ''}
          fill
          sizes={responsive.imageSizes}
          className={`${needsZoom ? 'object-cover' : (enableSlider ? 'object-contain' : 'object-cover')}`}
          loading="eager"
          decoding="async"
          priority={currentImageIndex === 0}
          onLoad={handleImageLoad}
          style={{
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden'
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
      
      {/* Product details dropdown - only when expanded and showDropdown is true */}
      {enableSlider && showDropdown && (
        <details 
          ref={dropdownRef}
          className="w-full mt-1"
          open
          onToggle={(e) => setIsDropdownOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary className="cursor-pointer text-sm font-mono text-gray-500 hover:text-black transition-colors list-none">
            <div className="flex items-center justify-between">
              <span>INFO</span>
              <span className={`text-sm transition-transform duration-300 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] ${
                isDropdownOpen ? 'rotate-45' : 'rotate-0'
              }`}>
                +
              </span>
            </div>
          </summary>
          <div className="mt-1 pt-1">
            {product.description && (
              <div className="mb-2">
                <p className="text-sm text-gray-400 leading-relaxed uppercase">{product.description}</p>
              </div>
            )}
            {/*{product.variants && product.variants.length > 0 && (
              <div className="space-y-1 text-sm">
                {product.variants.map((variant, index) => (
                  <div key={variant.id || index} className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">
                      {variant.selectedOptions?.map(opt => opt.value).join(', ') || variant.title}
                    </span>
                    <span className={`font-mono ${
                      variant.quantityAvailable === 0 ? 'text-red-500' : 
                      variant.quantityAvailable && variant.quantityAvailable < 5 ? 'text-orange-500' : 
                      'text-gray-500'
                    }`}>
                      {variant.quantityAvailable === null ? '∞' : 
                       variant.quantityAvailable === 0 ? '0' : 
                       variant.quantityAvailable}
                    </span>
                  </div>
                ))}
              </div>
            )}*/}
          </div>
        </details>
      )}
    </>
  );
}