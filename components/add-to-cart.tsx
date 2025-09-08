'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { type Product, type ProductVariant } from '@/lib/products';
import { useCart } from './cart-context';
import { CloseIcon, HelpIcon, AddIcon } from '@/components/ui/icon';
import { patterns } from '@/lib/styles';

export const SIZES = [
  { label: 'S-M', value: 0 },
  { label: 'M-L', value: 1 },
  { label: 'XL-XXL', value: 2 },
];

export function AddToCart({ product, showDropdown, setShowDropdown }: { 
  product: Product; 
  showDropdown?: boolean; 
  setShowDropdown?: (show: boolean) => void; 
}) {
  const [isSelectingVariant, setIsSelectingVariant] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [showMarquee, setShowMarquee] = useState(false);
  const [marqueePosition, setMarqueePosition] = useState(0);
  const [isMarqueeSlowed, setIsMarqueeSlowed] = useState(false);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [currentOptionIndex, setCurrentOptionIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const [showAddedToCart, setShowAddedToCart] = useState(false);
  const [showDescriptionForNonVariant, setShowDescriptionForNonVariant] = useState(false);
  const [addingText, setAddingText] = useState('');
  const [isDeletingAdding, setIsDeletingAdding] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const { addToCart } = useCart();

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check if this is a Shopify product with meaningful variants (memoized)
  const hasShopifyVariants = useMemo(() => 
    product.variants && product.variants.length > 1 && product.options && product.options.length > 0,
    [product.variants, product.options]
  );
  
  // Check if this is any Shopify product (memoized)
  const isShopifyProduct = useMemo(() => 
    product.variants && product.variants.length > 0,
    [product.variants]
  );



  // Marquee animation effect
  useEffect(() => {
    if ((!showMarquee && !showDescriptionForNonVariant) || !marqueeRef.current) return;

    const marqueeElement = marqueeRef.current;
    const textWidth = marqueeElement.scrollWidth / 2; // Divide by 2 since we duplicate content
    let animationId: number;
    let startTime: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      
      const elapsed = timestamp - startTime;
      
      // Adjust speed based on interaction: normal = 15s, slowed = 45s (3x slower)
      const cycleDuration = isMarqueeSlowed ? 45000 : 15000;
      const progress = (elapsed % cycleDuration) / cycleDuration;
      const position = progress * textWidth;
      
      setMarqueePosition(-position);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [showMarquee, showDescriptionForNonVariant, isMarqueeSlowed]);

  // Typewriter effect for "ADDING..." text
  useEffect(() => {
    if (!showAddedToCart) {
      setAddingText('');
      setIsDeletingAdding(false);
      return;
    }

    const fullText = 'ADDING...';
    const typeSpeed = 15; // ms per character (much faster)
    const deleteSpeed = 15; // ms per character (much faster)
    const pauseTime = 900; // pause before deleting (shorter)

    const timer = setTimeout(() => {
      if (!isDeletingAdding) {
        // Typing phase
        if (addingText.length < fullText.length) {
          setAddingText(fullText.slice(0, addingText.length + 1));
        } else {
          // Finished typing, wait then start deleting
          setTimeout(() => {
            setIsDeletingAdding(true);
          }, pauseTime);
        }
      } else {
        // Deleting phase
        if (addingText.length > 0) {
          setAddingText(addingText.slice(0, -1));
        } else {
          // Finished deleting, start blinking effect
          setIsDeletingAdding(false);
          setIsBlinking(true);
          
          // Blip twice like old computer (quick on/off)
          setTimeout(() => {
            setIsBlinking(false);
            setShowAddedToCart(false);
          }, 400); // 4 * 100ms = 400ms total
        }
      }
    }, isDeletingAdding ? deleteSpeed : typeSpeed);

    return () => clearTimeout(timer);
  }, [addingText, isDeletingAdding, showAddedToCart]);

  const handleAddToCartWithVariant = useCallback(
    (variant: ProductVariant) => {
      // Add to cart with the specific variant
      addToCart(product, 0, variant);
      setIsSelectingVariant(false);
      // Reset marquee state when adding to cart
      setShowMarquee(false);
      setMarqueePosition(0);
      setIsMarqueeSlowed(false);
      // Close dropdown when adding to cart
      setShowDropdown?.(false);
      // Show visual feedback
      setShowAddedToCart(true);
    },
    [addToCart, product, setShowDropdown],
  );

  const handleAddToCart = useCallback(
    (legacySize?: number) => {
      // For Shopify products with variants, use selected variant
      if (selectedVariant && product.variants && product.variants.length > 0) {
        return handleAddToCartWithVariant(selectedVariant);
      }

      // For Shopify products without meaningful variants, use the first (default) variant
      if (isShopifyProduct && !hasShopifyVariants && product.variants && product.variants.length > 0) {
        const defaultVariant = product.variants[0];
        return handleAddToCartWithVariant(defaultVariant);
      }

      // Fallback to local cart (for legacy products or when Shopify fails)
      addToCart(product, legacySize || 0, selectedVariant || undefined);
      setIsSelectingVariant(false);
      // Reset marquee state when adding to cart
      setShowMarquee(false);
      setMarqueePosition(0);
      setIsMarqueeSlowed(false);
      // Close dropdown when adding to cart
      setShowDropdown?.(false);
      // Show visual feedback
      setShowAddedToCart(true);
    },
    [addToCart, product, selectedVariant, handleAddToCartWithVariant, isShopifyProduct, hasShopifyVariants, setShowDropdown],
  );

  const productName = useMemo(() => 
    (product.title || product.name || product.id
      .split('-')
      .slice(0, -1)
      .join('-')).toUpperCase(),
    [product.title, product.name, product.id]
  );

  // Get product price (memoized)
  const productPrice = useMemo(() => {
    if (selectedVariant && selectedVariant.price) {
      return `${selectedVariant.price.currencyCode} ${parseFloat(selectedVariant.price.amount).toFixed(2)}`;
    }
    if (product.price) {
      return `${product.price.currencyCode} ${parseFloat(product.price.amount).toFixed(2)}`;
    }
    if (product.priceRange) {
      return `${product.priceRange.minVariantPrice.currencyCode} ${parseFloat(product.priceRange.minVariantPrice.amount).toFixed(2)}`;
    }
    return '25.00'; // fallback
  }, [selectedVariant, product.price, product.priceRange]);

  // Helper functions for progressive option selection (memoized)
  const getCurrentOption = useCallback(() => {
    if (!hasShopifyVariants || !product.options) return null;
    return product.options[currentOptionIndex] || null;
  }, [hasShopifyVariants, product.options, currentOptionIndex]);

  const getAvailableValuesForCurrentOption = useMemo(() => {
    const currentOption = getCurrentOption();
    if (!currentOption || !product.variants) return [];

    // Get all values for current option that have available variants
    const availableValues = new Set<string>();
    
    product.variants.forEach(variant => {
      if (variant.availableForSale) {
        // Check if this variant matches already selected options
        const matchesPreviousSelections = Object.entries(selectedOptions).every(([optionName, value]) => {
          return variant.selectedOptions.some(opt => opt.name === optionName && opt.value === value);
        });

        if (matchesPreviousSelections) {
          const currentOptionValue = variant.selectedOptions.find(opt => opt.name === currentOption.name);
          if (currentOptionValue) {
            availableValues.add(currentOptionValue.value);
          }
        }
      }
    });

    return Array.from(availableValues);
  }, [getCurrentOption, product.variants, selectedOptions]);

  const handleOptionSelect = (optionValue: string) => {
    const currentOption = getCurrentOption();
    if (!currentOption) return;

    // Add haptic feedback for mobile
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }

    const newSelectedOptions = {
      ...selectedOptions,
      [currentOption.name]: optionValue,
    };
    setSelectedOptions(newSelectedOptions);

    // Check if we have all options selected
    if (currentOptionIndex + 1 >= (product.options?.length || 0)) {
      // All options selected, find matching variant
      const matchingVariant = product.variants?.find(variant => {
        return Object.entries(newSelectedOptions).every(([optionName, value]) => {
          return variant.selectedOptions.some(opt => opt.name === optionName && opt.value === value);
        });
      });

      if (matchingVariant) {
        setSelectedVariant(matchingVariant);
        // Call handleAddToCart with the specific variant to avoid state timing issues
        handleAddToCartWithVariant(matchingVariant);
      }
    } else {
      // Move to next option
      setCurrentOptionIndex(currentOptionIndex + 1);
    }
  };

  const resetSelection = () => {
    setSelectedOptions({});
    setCurrentOptionIndex(0);
    setSelectedVariant(null);
    setIsSelectingVariant(false);
    setShowDropdown?.(false); // Close dropdown when closing variant picker
  };

  const getSelectionLabel = () => {
    const currentOption = getCurrentOption();
    if (!currentOption) return 'SELECT SIZE';
    
    const selectedCount = Object.keys(selectedOptions).length;
    const totalOptions = product.options?.length || 0;
    
    if (selectedCount === 0) {
      return `SELECT ${currentOption.name.toUpperCase()}`;
    } else {
      return `SELECT ${currentOption.name.toUpperCase()}`;
    }
  };

  return (
    <div className="opacity-0 translate-y-5 animate-[fadeInUp_300ms_ease-out_forwards]">
      <div className="relative w-full max-w-[320px] sm:max-w-[400px] lg:max-w-[480px] mx-auto px-2 sm:px-4">
        <div className="flex flex-col items-center">
          {/* Product Name / Select Variant */}
          <div className="h-6 relative w-full flex justify-center items-center overflow-hidden">
            <p className={`font-medium font-mono uppercase absolute inset-0 flex items-center justify-center transition-transform duration-100 ease-in-out text-heading-secondary ${
              isSelectingVariant ? '-translate-y-full' : 'translate-y-0'
            }`}>
              {productName}
            </p>
            <div className={`flex items-center justify-between w-full absolute inset-0 px-2 transition-transform duration-100 ease-in-out ${
              isSelectingVariant ? 'translate-y-0' : 'translate-y-full'
            }`}>
              {/* Empty space for symmetry */}
              <div className="size-8 flex-shrink-0" />
              <p className="font-medium font-mono uppercase text-center flex-1 px-2">
                {hasShopifyVariants ? getSelectionLabel() : productName}
              </p>
              {/* X Button */}
              <div className={`size-8 flex-shrink-0 transition-all duration-200 ease-out opacity-0`}>
                <button
                  onClick={() => {
                    // Reset the full selection for all products
                    resetSelection();
                  }}
                  className="w-full h-full flex items-center justify-center"
                  aria-label="Close variant selector"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>
          </div>

                      {/* Product Price / Marquee Description / Added to Cart */}
            <div className={`mt-4 h-8 relative w-full flex justify-center items-center overflow-hidden transition-opacity duration-200 ${
              isSelectingVariant ? 'opacity-50' : 'opacity-100'
            }`}>
              {/* Price */}
              <p className={`font-medium font-mono uppercase text-sm absolute inset-0 flex items-center justify-center transition-transform duration-100 ease-in-out text-brutalist-black ${
                showMarquee ? '-translate-y-full' : 'translate-y-0'
              }`}>
                {productPrice}
              </p>


            </div>

            {/* Product Description - Always visible if available */}
            {product.description && (
              <div className="mt-3 w-full max-w-[320px] sm:max-w-[400px] lg:max-w-[480px]">
                <p className="text-xs text-brutalist-grey leading-relaxed uppercase font-mono text-center">
                  {product.description}
                </p>
              </div>
            )}

          {/* Plus Button / Add to Cart Button */}
          <div className="mt-6 relative w-full h-12">
            <button
              onClick={() => {
                if (!hasShopifyVariants) {
                  // No meaningful variants - directly add to cart
                  handleAddToCart();
                } else {
                  // Has meaningful variants - show variant selection
                  setCurrentOptionIndex(0);
                  setSelectedOptions({});
                  setSelectedVariant(null);
                  setIsSelectingVariant(true);
                }
              }}
              className={`size-12 h-12 flex items-center justify-center bg-brutalist-white absolute left-1/2 -translate-x-1/2 transition-all duration-200 focus-ring rounded-none ${
                isSelectingVariant ? 'opacity-0' : 'opacity-100'
              }`}
              aria-label={hasShopifyVariants ? "Select product options" : "Add to cart"}
              aria-expanded={isSelectingVariant}
            >
              {showAddedToCart ? (
                isBlinking ? (
                  <div className="w-6 h-6 bg-[#00b140] rounded-none animate-[blip_400ms_ease-in-out_forwards]"></div>
                ) : (
                  <span className="font-medium font-mono uppercase text-sm text-white bg-[#00b140] px-2 h-6 flex items-center justify-center rounded-none">
                    {addingText}
                    <span className="animate-pulse">|</span>
                  </span>
                )
              ) : (
                <div className="w-6 h-6 bg-[#00b140] rounded-tr-[3px] rounded-br-[3px]"></div>
              )}
            </button>

            {isSelectingVariant && (
              <div className="flex w-full absolute top-0 left-0 animate-[scaleIn_200ms_ease-out_forwards]">
                  {hasShopifyVariants && product.variants ? (
                    /* Progressive Shopify Option Selection */
                    (() => {
                      // Take up to 6 values to show
                      const valuesToShow = getAvailableValuesForCurrentOption.slice(0, 6);
                      const totalOptions = valuesToShow.length;
                      
                      // Determine layout based on number of options
                      let containerClass = '';
                      if (totalOptions === 1) {
                        containerClass = 'justify-center';
                      } else if (totalOptions === 2) {
                        containerClass = 'justify-center gap-8';
                      } else if (totalOptions === 3) {
                        containerClass = 'justify-between';
                      } else {
                        containerClass = 'justify-center gap-2';
                      }
                      
                      return (
                        <div className={`flex ${containerClass} w-full`}>
                          {valuesToShow.map((value, index) => (
                            <button
                              key={value}
                              onClick={() => handleOptionSelect(value)}
                              className={`${isMobile ? 'w-20 h-14' : 'w-16 h-12'} bg-transparent hover:bg-[#00b140] hover:text-brutalist-white transition-all duration-200 font-mono text-sm font-medium focus-ring rounded-none ${isMobile ? 'active:bg-brutalist-grey active:bg-opacity-10 active:scale-95' : ''}`}
                              style={{
                                animationDelay: `${index * 50}ms`,
                                minHeight: isMobile ? '56px' : '48px', // Larger touch targets on mobile
                                fontSize: isMobile ? '0.875rem' : '0.875rem'
                              }}
                              aria-label={`Select ${getCurrentOption()?.name}: ${value}`}
                            >
                              {value.length > 6 ? value.substring(0, 5) + '..' : value}
                            </button>
                          ))}
                        </div>
                      );
                    })()
                  ) : (
                    /* Add to Cart Button for Non-Variant Products */
                    <button
                      onClick={() => {
                        handleAddToCart();
                        setIsSelectingVariant(false);
                        setMarqueePosition(0); // Reset marquee position
                        setIsMarqueeSlowed(false); // Reset slow state
                      }}
                      className="w-full h-12 bg-transparent text-brutalist-black font-medium hover:bg-[#00b140] hover:text-brutalist-white transition-all duration-200 font-mono text-sm font-medium focus-ring rounded-none"
                      aria-label={`Add ${productName} to cart`}
                    >
                      ADD
                    </button>
                  )}
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

