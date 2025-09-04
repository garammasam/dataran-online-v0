'use client';

import { useState, useEffect } from 'react';
import { getAllProducts } from '@/lib/products';
import { SelectDropdown } from '@/components/ui/dropdown';

interface VendorInfo {
  name: string;
  color: string;
  count: number;
  hasVideoProducts: boolean;
}

interface VendorSortProps {
  selectedVendor: string | null;
  onVendorSelect: (vendor: string | null) => void;
}

export function VendorSort({ selectedVendor, onVendorSelect }: VendorSortProps) {
  const [vendors, setVendors] = useState<VendorInfo[]>([]);

  useEffect(() => {
    const loadVendors = async () => {
      try {
        const products = await getAllProducts();
        const vendorMap = new Map<string, { color: string; count: number; hasVideoProducts: boolean }>();

        products.forEach(product => {
          const vendor = product.vendor || 'Unknown';
          
          // Extract color from tags (look specifically for color: tags)
          let color = '#9CA3AF'; // Default grey
          let hasColorTag = false;
          
          if (product.tags) {
            const colorTag = product.tags.find(tag => 
              tag.toLowerCase().startsWith('color:')
            );
            
            if (colorTag) {
              hasColorTag = true;
              // Extract the color value after "color:"
              const colorValue = colorTag.toLowerCase().replace('color:', '').trim();
              
              // Check if it's a valid hex color
              if (/^#[0-9A-F]{6}$/i.test(colorValue)) {
                color = colorValue;
              } else {
                // Map color names to hex values
                const colorMap: Record<string, string> = {
                  red: '#EF4444',
                  blue: '#3B82F6',
                  green: '#10B981',
                  yellow: '#F59E0B',
                  purple: '#8B5CF6',
                  pink: '#EC4899',
                  orange: '#F97316',
                  black: '#1F2937',
                  white: '#F9FAFB',
                  gray: '#6B7280',
                  grey: '#6B7280',
                };
                
                color = colorMap[colorValue] || '#9CA3AF';
              }
            }
          }

          // Only include vendors that have products with color: tags
          if (!hasColorTag) return;

          // Check if vendor has video products
          const hasVideoProducts = Boolean(product.isVideoProduct);

          if (vendorMap.has(vendor)) {
            const existing = vendorMap.get(vendor)!;
            existing.count++;
            existing.hasVideoProducts = existing.hasVideoProducts || hasVideoProducts;
          } else {
            vendorMap.set(vendor, { color, count: 1, hasVideoProducts });
          }
        });

        const vendorList = Array.from(vendorMap.entries())
          .map(([name, info]) => ({
            name,
            ...info,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setVendors(vendorList);
      } catch (error) {
        console.error('Error loading vendors:', error);
      }
    };

    loadVendors();
  }, []);

  if (vendors.length === 0) return null;

  // Prepare options for the dropdown
  const options = [
    { value: null, label: 'ALL VENDORS', color: '#9CA3AF' },
    ...vendors.map(vendor => ({
      value: vendor.name,
      label: vendor.name,
      color: vendor.color,
      count: vendor.count,
      extra: vendor.hasVideoProducts ? (
        <div className="w-1 h-1 bg-blue-500 rounded-full" title="Has video products" />
      ) : null
    }))
  ];

  return (
    <SelectDropdown
      value={selectedVendor}
      onValueChange={onVendorSelect}
      options={options}
      placeholder="ALL VENDORS"
      renderValue={(option) => (
        <>
          <div 
            className="size-2 rounded-full flex-shrink-0" 
            style={{ backgroundColor: option.color }} 
          />
          <span className="truncate" style={{ color: option.color }}>
            {option.label}
          </span>
        </>
      )}
    />
  );
}