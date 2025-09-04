'use client';

import { useState, useCallback, useMemo } from 'react';
import { X } from 'lucide-react';
import { type Product } from '@/lib/products';

export function VideoProductDetails({ product }: { product: Product }) {
  // Persist description state across re-renders using product ID
  const [isShowingDescription, setIsShowingDescription] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedState = sessionStorage.getItem(`product-description-${product.id}`);
      return savedState === 'true';
    }
    return false;
  });

  // Extract vendor from tags or fallback (memoized)
  const vendorName = useMemo(() => {
    if (product.vendor) {
      return product.vendor.toUpperCase();
    }
    
    // Look for vendor: tags
    const vendorTag = product.tags?.find(tag => tag.startsWith('vendor:'));
    if (vendorTag) {
      return vendorTag.replace('vendor:', '').toUpperCase();
    }
    
    return 'UNKNOWN VENDOR';
  }, [product.vendor, product.tags]);

  const handleToggleDescription = useCallback(() => {
    const newState = !isShowingDescription;
    setIsShowingDescription(newState);
    // Persist state
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`product-description-${product.id}`, newState.toString());
    }
  }, [isShowingDescription, product.id]);

  const productName = useMemo(() => 
    (product.title || product.name || product.id
      .split('-')
      .slice(0, -1)
      .join('-')).toUpperCase(),
    [product.title, product.name, product.id]
  );

  return (
    <div className="opacity-0 translate-y-5 animate-[fadeInUp_300ms_ease-out_forwards]">
      <div className="relative w-full max-w-[320px] sm:max-w-[400px] lg:max-w-[480px] mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex flex-col items-center">
          {/* Product Name / Description Toggle */}
          <div className="min-h-[1.5rem] relative w-full flex justify-center items-center overflow-hidden">
            <p className={`font-medium font-mono uppercase absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-in-out break-words text-center ${
              isShowingDescription ? '-translate-y-full' : 'translate-y-0'
            }`}>
              {productName}
            </p>
            <div className={`flex items-center justify-between w-full absolute inset-0 px-2 transition-transform duration-200 ease-in-out ${
              isShowingDescription ? 'translate-y-0' : 'translate-y-full'
            }`}>
              {/* Empty left space for symmetry */}
              <div className="size-8 flex-shrink-0" />
              
              <p className="font-medium font-mono uppercase text-center flex-1 px-2">
                LINK BELOW
              </p>
              
              {/* X Button */}
              <div className={`size-8 flex-shrink-0 transition-all duration-200 ease-out ${
                isShowingDescription ? 'translate-x-0 translate-y-0 opacity-100' : '-translate-x-1/2 translate-y-7 opacity-0'
              }`}>
                <button
                  onClick={handleToggleDescription}
                  className="w-full h-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-black focus:ring-inset rounded"
                  aria-label="Close description"
                  aria-expanded={isShowingDescription}
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Vendor Name / Description */}
          <div className={`mt-4 min-h-[2rem] relative w-full flex justify-center items-center overflow-hidden transition-opacity duration-200 ${
            isShowingDescription ? 'opacity-50' : 'opacity-100'
          }`}>
            {/* Vendor Name */}
            <p className={`font-mono text-sm text-gray-600 absolute inset-0 flex items-center justify-center transition-transform duration-200 ease-in-out break-words text-center ${
              isShowingDescription ? '-translate-y-full' : 'translate-y-0'
            }`}>
              {vendorName}
            </p>
            
            {/* Description */}
            <div className={`absolute inset-0 flex items-center justify-center w-full transition-transform duration-200 ease-in-out ${
              isShowingDescription ? 'translate-y-0' : 'translate-y-full'
            }`}>
              {product.description && (
                <div className="w-full max-w-[320px] sm:max-w-[400px] lg:max-w-[480px] text-center">
                  <p className="font-mono text-xs uppercase tracking-wider text-gray-500 leading-relaxed max-h-16 overflow-y-auto">
                    {product.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Plus Button - Hidden for future use */}
          {/* <motion.div className="mt-6 relative w-full h-12">
            <motion.button
              onClick={handleToggleDescription}
              className="size-12 h-12 flex items-center justify-center bg-white absolute left-1/2 -translate-x-1/2 transition-all duration-200"
              variants={{
                idle: { opacity: 1 },
                showing: { opacity: 0 },
              }}
              aria-label={isShowingDescription ? "Hide description" : "Show description"}
              aria-expanded={isShowingDescription}
            >
              <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </motion.button>
          </motion.div> */}
        </div>
      </div>
    </div>
  );
}