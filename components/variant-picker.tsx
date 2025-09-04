'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { type Product, type ProductVariant } from '@/lib/products';
import { VariantButton } from '@/components/ui/button';

interface VariantPickerProps {
  product: Product;
  selectedVariant: ProductVariant | null;
  onVariantChange: (variant: ProductVariant) => void;
}

export function VariantPicker({ product, selectedVariant, onVariantChange }: VariantPickerProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // Initialize with first available variant or first variant
  useEffect(() => {
    if (!selectedVariant && product.variants && product.variants.length > 0) {
      const firstAvailableVariant = product.variants.find(v => v.availableForSale) || product.variants[0];
      onVariantChange(firstAvailableVariant);
      
      // Set initial selected options
      const initialOptions: Record<string, string> = {};
      firstAvailableVariant.selectedOptions.forEach(option => {
        initialOptions[option.name] = option.value;
      });
      setSelectedOptions(initialOptions);
    }
  }, [product, selectedVariant, onVariantChange]);

  // If no variants or options, show fallback size picker
 {/*} if (!product.variants || product.variants.length === 0 || !product.options || product.options.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <p className="font-mono text-sm mb-2">SIZE</p>
          <div className="flex gap-2">
            {['S-M', 'M-L', 'XL-XXL'].map((size, index) => (
              <button
                key={size}
                className="px-4 py-2 border border-gray-300 hover:bg-black hover:text-white transition-colors font-mono text-sm"
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }*/}

  const handleOptionChange = useCallback((optionName: string, optionValue: string) => {
    const newSelectedOptions = {
      ...selectedOptions,
      [optionName]: optionValue,
    };
    setSelectedOptions(newSelectedOptions);

    // Find matching variant
    const matchingVariant = product.variants?.find(variant => {
      return variant.selectedOptions.every(option => 
        newSelectedOptions[option.name] === option.value
      );
    });

    if (matchingVariant) {
      onVariantChange(matchingVariant);
    }
  }, [selectedOptions, product.variants, onVariantChange]);

  return (
    <div className="space-y-4">
      {product.options?.map((option) => (
        <div key={option.id}>
          <p className="font-mono text-sm mb-2 uppercase">{option.name}</p>
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const isSelected = selectedOptions[option.name] === value;
              
              // Check if this option value is available
              const isAvailable = product.variants?.some(variant => 
                variant.availableForSale && 
                variant.selectedOptions.some(opt => 
                  opt.name === option.name && opt.value === value
                )
              );

              return (
                <VariantButton
                  key={value}
                  onClick={() => handleOptionChange(option.name, value)}
                  disabled={!isAvailable}
                  selected={isSelected}
                  className={!isAvailable ? 'opacity-50 cursor-not-allowed line-through' : ''}
                >
                  {value}
                </VariantButton>
              );
            })}
          </div>
        </div>
      ))}
      
      {selectedVariant && (
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="font-mono text-sm">PRICE</span>
            <span className="font-mono font-semibold">
              {selectedVariant.price.currencyCode} {parseFloat(selectedVariant.price.amount).toFixed(2)}
            </span>
          </div>
          {selectedVariant.compareAtPrice && parseFloat(selectedVariant.compareAtPrice.amount) > parseFloat(selectedVariant.price.amount) && (
            <div className="flex justify-between items-center mt-1">
              <span className="font-mono text-sm text-gray-500">COMPARE AT</span>
              <span className="font-mono text-sm text-gray-500 line-through">
                {selectedVariant.compareAtPrice.currencyCode} {parseFloat(selectedVariant.compareAtPrice.amount).toFixed(2)}
              </span>
            </div>
          )}
          {selectedVariant.quantityAvailable !== undefined && selectedVariant.quantityAvailable <= 5 && (
            <p className="font-mono text-xs text-orange-600 mt-1">
              Only {selectedVariant.quantityAvailable} left in stock
            </p>
          )}
          {!selectedVariant.availableForSale && (
            <p className="font-mono text-xs text-red-600 mt-1">
              Out of stock
            </p>
          )}
        </div>
      )}
    </div>
  );
}