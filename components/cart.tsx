'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { ChevronRight, Minus, Plus, X, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from './cart-context';
import { viewport } from '@/lib/viewport';
import { mobileViewport } from '@/lib/mobile-viewport-simple';

// SwipeToRemove component for mobile-friendly item removal
function SwipeToRemove({ 
  children, 
  onRemove, 
  disabled = false 
}: { 
  children: React.ReactNode; 
  onRemove: () => void; 
  disabled?: boolean; 
}) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const SWIPE_THRESHOLD = 80; // Minimum swipe distance to trigger removal
  const MAX_SWIPE = 120; // Maximum swipe distance
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  }, [disabled]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || disabled) return;
    
    const currentX = e.touches[0].clientX;
    const diff = startX - currentX; // Left swipe = positive value
    
    if (diff > 0) { // Only allow left swipe
      const newTranslateX = Math.min(diff, MAX_SWIPE);
      setTranslateX(newTranslateX);
    }
  }, [isDragging, startX, disabled]);
  
  const handleTouchEnd = useCallback(() => {
    if (!isDragging || disabled) return;
    
    setIsDragging(false);
    
    if (translateX >= SWIPE_THRESHOLD) {
      // Trigger removal
      onRemove();
    } else {
      // Snap back
      setTranslateX(0);
    }
  }, [isDragging, translateX, onRemove, disabled]);
  
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    setStartX(e.clientX);
    setIsDragging(true);
  }, [disabled]);
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || disabled) return;
    
    const diff = startX - e.clientX;
    if (diff > 0) {
      const newTranslateX = Math.min(diff, MAX_SWIPE);
      setTranslateX(newTranslateX);
    }
  }, [isDragging, startX, disabled]);
  
  const handleMouseUp = useCallback(() => {
    if (!isDragging || disabled) return;
    
    setIsDragging(false);
    
    if (translateX >= SWIPE_THRESHOLD) {
      onRemove();
    } else {
      setTranslateX(0);
    }
  }, [isDragging, translateX, onRemove, disabled]);
  
  return (
    <div className="relative overflow-hidden" ref={containerRef}>
      {/* Remove background - revealed when swiping */}
      <div 
        className="absolute inset-0 bg-red-500 flex items-center justify-end pr-6 z-0"
        style={{
          opacity: Math.min(translateX / SWIPE_THRESHOLD, 1)
        }}
      >
        <div className="flex items-center space-x-2 text-brutalist-white">
          <Trash2 className="size-5" />
          <span className="font-mono text-sm font-semibold uppercase">Remove</span>
        </div>
      </div>
      
      {/* Item content */}
      <div
        className="relative z-10 bg-brutalist-white transition-transform duration-200 ease-out"
        style={{
          transform: `translateX(-${translateX}px)`,
          transitionDuration: isDragging ? '0ms' : '200ms'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {children}
      </div>
    </div>
  );
}

export function Cart({ isOpen, onClose }: { isOpen: boolean; onClose: any }) {
  const { items, updateQuantity, removeItem, totalFormatted, createShopifyCheckout, inventoryCheck, isCheckingInventory, getItemStockInfo } = useCart();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Check cart composition (memoized)
  const { hasShopifyVariants, hasLegacyItems, isMixedCart } = useMemo(() => {
    const hasShopifyVariants = items.some(item => item.selectedVariant);
    const hasLegacyItems = items.some(item => !item.selectedVariant);
    return {
      hasShopifyVariants,
      hasLegacyItems,
      isMixedCart: hasShopifyVariants && hasLegacyItems
    };
  }, [items]);

  const handleCheckout = useCallback(async () => {
    // Check for inventory errors before proceeding
    if (inventoryCheck?.hasErrors) {
      console.log('Cannot checkout: inventory issues detected');
      return;
    }
    
    setIsProcessing(true);
    try {
      // Close the cart with a small delay to prevent jarring transitions
      setTimeout(() => onClose(), 50);
      
      if (hasShopifyVariants) {
        // Try Shopify checkout first
        const checkoutUrl = await createShopifyCheckout();
        if (checkoutUrl) {
          if (typeof window !== 'undefined') {
            window.location.href = checkoutUrl;
          }
          return;
        }
      }
      
      // Fallback to checkout page for mixed carts or when Shopify checkout fails
      router.push('/checkout');
    } catch (err) {
      console.error('Checkout failed:', err);
      // Fallback to old checkout page
      router.push('/checkout');
    } finally {
      setIsProcessing(false);
    }
  }, [inventoryCheck?.hasErrors, hasShopifyVariants, createShopifyCheckout, onClose, router]);

  // Empty cart state
  if (items.length === 0) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-sm border-l-0 p-0 [&_button[aria-label=Close]]:hidden fixed right-0 top-0 h-[100dvh] max-h-[100dvh] overflow-hidden">
          <SheetTitle className="sr-only">Cart</SheetTitle>
          <div className="flex flex-col h-full justify-center items-center px-6 text-center">
            {/* Custom close button for empty state */}
            <button
              onClick={onClose}
              className="absolute right-4 top-4 size-12 flex justify-center items-center rounded-none opacity-70 ring-offset-background transition-all hover:opacity-100 focus-interactive"
              aria-label="Close cart"
            >
              <X className="size-5" />
            </button>
            
            <div className="flex flex-col items-center space-y-6">
              <div className="size-16 bg-brutalist-grey bg-opacity-10 rounded-none flex items-center justify-center">
             
              </div>
              <div className="space-y-2">
                <h3 className="font-mono font-semibold text-lg uppercase tracking-wide text-brutalist-black">Cart Empty</h3>
                
              </div>
              <button
                onClick={onClose}
                className="font-mono font-semibold text-sm uppercase rounded-none bg-brutalist-black text-brutalist-white px-6 py-3 transition-all duration-200 hover:bg-brutalist-grey focus-ring"
              >
                BROWSE
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-sm border-l-0 p-0 [&_button[aria-label=Close]]:hidden fixed right-0 top-0 h-[100dvh] max-h-[100dvh] overflow-hidden">
        <SheetTitle className="sr-only">Cart ({items.length} items)</SheetTitle>
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b bg-brutalist-white">
                      <div className="flex items-center space-x-3">
              <div className="size-8 bg-[#00b140] rounded-none flex items-center justify-center">
              
              </div>
            <div>
              <h2 className="font-mono font-semibold text-sm uppercase tracking-wide">Cart</h2>
              <p className="font-mono text-xs text-brutalist-grey uppercase">
                {items.length} item{items.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-10 flex justify-center items-center rounded-none opacity-70 ring-offset-background transition-all hover:opacity-100 hover:bg-brutalist-grey hover:bg-opacity-10 focus-interactive"
            aria-label="Close cart"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex flex-col h-full">
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{maxHeight: 'calc(100vh - 300px)'}}>
            <div className="divide-y divide-brutalist-grey divide-opacity-20">
              {items.map((item) => {
                const stockInfo = getItemStockInfo(item);
                const hasStockIssue = stockInfo?.hasError;
                
                return (
                  <SwipeToRemove
                    key={item.cartItemId}
                    onRemove={() => removeItem(item.cartItemId)}
                    disabled={hasStockIssue}
                  >
                    <div
                      className={`p-5 transition-all duration-200 ${
                        hasStockIssue ? 'opacity-60' : 'opacity-100 hover:bg-brutalist-grey hover:bg-opacity-5'
                      }`}
                    >
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="relative aspect-square h-[90px] bg-brutalist-white flex-shrink-0 overflow-hidden">
                        <Image
                          src={item.selectedVariant?.image?.url || item.image}
                          alt={item.selectedVariant?.title || item.name}
                          fill
                          className="object-contain p-2"
                          loading="eager"
                          decoding="sync"
                        />
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1 min-w-0 space-y-3">
                        {/* Product Title */}
                        <div>
                          <h3 className="font-mono font-semibold text-sm uppercase tracking-wide leading-tight">
                            {item.title || item.name || item.id.split('-').slice(0, -1).join('-')}
                          </h3>
                        </div>
                        
                        {/* Price Section */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs uppercase text-brutalist-grey tracking-wider">Price</span>
                            <div className="text-right">
                              <p className="font-mono font-semibold text-sm">
                                {item.selectedVariant 
                                  ? `${item.selectedVariant.price.currencyCode} ${parseFloat(item.selectedVariant.price.amount).toFixed(2)}`
                                  : item.price 
                                  ? `${item.price.currencyCode} ${parseFloat(item.price.amount).toFixed(2)}`
                                  : `$${item.id.startsWith('sk') ? (item.id.includes('gray') ? '40' : '20') : '20'}`
                                }
                              </p>
                              {/* Compare at price */}
                              {item.selectedVariant?.compareAtPrice && 
                               parseFloat(item.selectedVariant.compareAtPrice.amount) > parseFloat(item.selectedVariant.price.amount) && (
                                <p className="font-mono text-xs text-brutalist-grey line-through">
                                  {item.selectedVariant.compareAtPrice.currencyCode} {parseFloat(item.selectedVariant.compareAtPrice.amount).toFixed(2)}
                                </p>
                              )}
                              {/* Legacy compare at price */}
                              {(item as any).compareAtPrice && 
                               parseFloat((item as any).compareAtPrice.amount) > parseFloat(item.price?.amount || '0') && (
                                <p className="font-mono text-xs text-brutalist-grey line-through">
                                  {(item as any).compareAtPrice.currencyCode} {parseFloat((item as any).compareAtPrice.amount).toFixed(2)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Variant Options */}
                        {item.selectedVariant && item.selectedVariant.selectedOptions && item.selectedVariant.selectedOptions.length > 0 && (
                          <div className="space-y-1">
                            {item.selectedVariant.selectedOptions.map((option, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <span className="font-mono text-xs uppercase text-brutalist-grey tracking-wider">{option.name}</span>
                                <span className="font-mono text-xs font-medium">{option.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Stock status - subtle and integrated */}
                        {hasStockIssue && stockInfo && (
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs uppercase text-brutalist-grey tracking-wider">Status</span>
                            <div className="text-right">
                              <p className="font-mono text-xs text-red-600 uppercase tracking-wider">
                                {stockInfo.availableForSale 
                                  ? `Only ${stockInfo.availableQuantity} left`
                                  : 'Out of stock'
                                }
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* Low stock warning for available items (no issues) */}
                        {!hasStockIssue && item.selectedVariant && item.selectedVariant.quantityAvailable !== undefined && item.selectedVariant.quantityAvailable <= 5 && (
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs uppercase text-brutalist-grey tracking-wider">Status</span>
                            <div className="text-right">
                              <p className="font-mono text-xs text-orange-600 uppercase tracking-wider">
                                Only {item.selectedVariant.quantityAvailable} left
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between pt-2">
                          <span className="font-mono text-xs uppercase text-brutalist-grey tracking-wider">Quantity</span>
                          <div className="flex items-center border border-brutalist-grey rounded-none bg-brutalist-white">
                            <button
                              className="p-2 hover:bg-brutalist-grey hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-interactive border-r border-brutalist-grey"
                              onClick={() => updateQuantity(item.cartItemId, 1)}
                              disabled={
                                hasStockIssue ||
                                (item.selectedVariant && 
                                 item.selectedVariant.quantityAvailable !== undefined && 
                                 item.quantity >= item.selectedVariant.quantityAvailable)
                              }
                              title={
                                hasStockIssue 
                                  ? 'Stock issue - adjust quantity below'
                                  : (item.selectedVariant && 
                                     item.selectedVariant.quantityAvailable !== undefined
                                      ? `Max available: ${item.selectedVariant.quantityAvailable}`
                                      : undefined)
                              }
                              aria-label={`Increase quantity for ${item.title || item.name}`}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                            <span className="font-mono font-semibold text-sm px-4 py-2 min-w-[50px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              className="p-2 hover:bg-brutalist-grey hover:bg-opacity-10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-interactive border-l border-brutalist-grey"
                              onClick={() => updateQuantity(item.cartItemId, -1)}
                              aria-label={`Decrease quantity for ${item.title || item.name}`}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Stock issue actions - subtle */}
                        {hasStockIssue && stockInfo && (
                          <div className="flex items-center justify-between pt-1">
                            <span className="font-mono text-xs uppercase text-brutalist-grey tracking-wider">Actions</span>
                            <div className="flex gap-2">
                              {stockInfo.availableForSale && stockInfo.availableQuantity && stockInfo.availableQuantity > 0 ? (
                                <button
                                  onClick={() => updateQuantity(item.cartItemId, -(item.quantity - (stockInfo.availableQuantity || 0)))}
                                  className="font-mono text-xs uppercase text-blue-600 hover:text-blue-800 transition-colors tracking-wider"
                                >
                                  Fix ({stockInfo.availableQuantity})
                                </button>
                              ) : (
                                <button
                                  onClick={() => removeItem(item.cartItemId)}
                                  className="font-mono text-xs uppercase text-red-600 hover:text-red-800 transition-colors tracking-wider"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        
                      </div>
                    </div>
                  </div>
                  </SwipeToRemove>
                );
              })}
            </div>
          </div>
          
          {/* Footer - Total & Checkout */}
          <div className="border-t bg-brutalist-white flex-shrink-0" style={{minHeight: '250px', maxHeight: '300px'}}>
            <div className="p-5 space-y-3">
              {/* Subtotal */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-xs uppercase text-brutalist-grey tracking-wider">Subtotal</span>
                  <span className="font-mono font-semibold text-lg">{totalFormatted}</span>
                </div>
                <p className="font-mono text-xs uppercase tracking-wide text-brutalist-grey text-center">
                  Excluding taxes & shipping
                </p>
              </div>
              

              
              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={items.length === 0 || isProcessing || inventoryCheck?.hasErrors || isCheckingInventory}
                className="w-full bg-brutalist-black text-brutalist-white py-3 px-4 font-mono rounded-none font-semibold uppercase text-sm tracking-wide transition-all duration-200 hover:bg-brutalist-grey disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brutalist-black focus-ring flex items-center justify-between group"
                aria-label="Proceed to checkout"
              >
                <span>
                  {isProcessing ? 'Processing...' : 
                   isCheckingInventory ? 'Checking Stock...' : 
                   inventoryCheck?.hasErrors ? 'Stock Issues' : 
                   'Checkout'}
                </span>
                
                {isProcessing || isCheckingInventory ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : inventoryCheck?.hasErrors ? (
                  <X className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                )}
              </button>
              
              {/* Back to browsing - Always visible */}
              <button
                onClick={onClose}
                className="w-full font-mono text-xs uppercase text-brutalist-grey hover:text-brutalist-black transition-colors tracking-wider py-2 mt-2"
              >
                CONTINUE BROWSING
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}