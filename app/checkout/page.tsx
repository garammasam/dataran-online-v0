'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
// Removed framer-motion to reduce bundle size
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/morphing-icon';
import { useCart } from '@/components/cart-context';
import { Header } from '@/components/header';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalFormatted, createShopifyCheckout } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleProceedToPayment = useCallback(async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const checkoutUrl = await createShopifyCheckout();
      if (checkoutUrl) {
        if (typeof window !== 'undefined') {
          window.location.href = checkoutUrl;
        }
      } else {
        throw new Error('Failed to create checkout');
      }
    } catch (err) {
      console.error('Checkout failed:', err);
      setError('Checkout failed. Try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [createShopifyCheckout]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // Memoize expensive cart item calculations
  const processedItems = useMemo(() => {
    return items.map(item => ({
      ...item,
      displayName: item.title || item.name || item.id.split('-').slice(0, -1).join('-'),
      totalPrice: item.selectedVariant 
        ? (parseFloat(item.selectedVariant.price.amount) * item.quantity).toFixed(2)
        : item.price 
        ? (parseFloat(item.price.amount) * item.quantity).toFixed(2)
        : `${(item.id.startsWith('sk') ? (item.id.includes('gray') ? 40 : 20) : 20) * item.quantity}`,
      compareAtTotal: item.selectedVariant?.compareAtPrice && 
                     parseFloat(item.selectedVariant.compareAtPrice.amount) > parseFloat(item.selectedVariant.price.amount)
        ? (parseFloat(item.selectedVariant.compareAtPrice.amount) * item.quantity).toFixed(2)
        : null
    }));
  }, [items]);

  // Check if cart is empty and redirect
  if (items.length === 0) {
    if (isClient) {
      router.push('/');
    }
    return null;
  }

  // Don't render until we're on the client
  if (!isClient) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header isBackVisible={true} onBack={handleBack} />
      
      <main className="flex-grow px-4 sm:px-6 lg:px-8 pt-20 pb-8 max-w-2xl mx-auto w-full">
        <div className="animate-[fadeInUp_300ms_ease-out_forwards]">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="font-mono uppercase text-xl mb-2">ORDER REVIEW</h1>
          
          </div>

          {/* Order Summary */}
          <div className="border border-gray-200 mb-8">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="font-mono uppercase text-sm">ITEMS</h2>
            </div>
            
            <div className="p-6 space-y-6">
              {processedItems.map((item) => (
                <div key={item.cartItemId} className="flex gap-4">
                    <div className="relative aspect-square h-20 bg-gray-50 flex-shrink-0">
                      <Image
                        src={item.selectedVariant?.image?.url || item.image}
                        alt={item.selectedVariant?.title || item.name}
                        fill
                        sizes="80px"
                        className="object-contain"
                        loading="eager"
                      />
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-mono uppercase text-sm">
                          {item.displayName}
                        </h3>
                      </div>
                    
                      {/* Variant Options */}
                      {item.selectedVariant ? (
                        <div className="space-y-1 mb-2">
                          {item.selectedVariant.selectedOptions.map((option, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <span className="font-mono text-xs text-gray-600">
                                {option.name.toUpperCase()}:
                              </span>
                              <span className="font-mono text-xs">
                                {option.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : item.size !== undefined ? (
                        <div className="mb-2">
                          <span className="font-mono text-xs text-gray-600">SIZE: </span>
                          <span className="font-mono text-xs">
                            {['S-M', 'M-L', 'XL-XXL'][item.size] || 'Unknown'}
                          </span>
                        </div>
                      ) : null}
                      
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-gray-600">
                          QTY: {item.quantity}
                        </span>
                                                  <div className="text-right">
                            <span className="font-mono text-sm">
                              {item.selectedVariant 
                                ? `${item.selectedVariant.price.currencyCode} ${item.totalPrice}`
                                : item.price 
                                ? `${item.price.currencyCode} ${item.totalPrice}`
                                : `$${item.totalPrice}`
                              }
                            </span>
                            {/* Compare at price (if discounted) */}
                            {item.compareAtTotal && (
                              <div className="font-mono text-xs text-gray-500 line-through">
                                {`${item.selectedVariant!.compareAtPrice!.currencyCode} ${item.compareAtTotal}`}
                              </div>
                            )}
                          </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
            
            {/* Total */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="font-mono uppercase text-sm">Total</span>
                <span className="font-mono text-lg">{totalFormatted}</span>
              </div>
              <p className="font-mono text-xs text-gray-600 mt-1">
                Excl. tax & shipping
              </p>
            </div>
          </div>



          {/* Security Info */}
          <div className="mb-8 p-6 bg-gray-50 border border-gray-200">
            <h3 className="font-mono uppercase text-sm mb-4">Secure Payment</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-mono text-xs">SSL Encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-mono text-xs">Secure Processing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-mono text-xs">Multiple Options</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 animate-[slideInUp_150ms_ease-out]">
              <p className="font-mono text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={handleProceedToPayment}
              disabled={isProcessing}
              className="w-full bg-black text-white p-4 font-mono uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between group"
            >
              {isProcessing ? (
                <>
                  Processing...
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </>
              ) : (
                <>
                  Proceed to Checkout
                  <ChevronRightIcon className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            
            <button
              onClick={handleBack}
              className="w-full border border-gray-300 text-black p-4 font-mono uppercase text-sm hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <ChevronLeftIcon />
              BACK TO BROWSE
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}