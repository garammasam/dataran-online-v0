'use client';

import { useState, useEffect } from 'react';
import { getAllProducts } from '@/lib/products';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { Button } from '@/components/ui/button';
import { animationClasses } from '@/lib/animations';

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

  const selectedVendorInfo = vendors.find(v => v.name === selectedVendor);

  const trigger = (
    <Button
      variant="ghost"
      className={`flex items-center justify-center gap-2 px-3 py-1 bg-white font-mono text-sm uppercase hover:bg-gray-100 min-w-[120px] ${animationClasses.hover}`}
    >
      {selectedVendorInfo ? (
        <div 
          className="size-2 rounded-full flex-shrink-0" 
          style={{ backgroundColor: selectedVendorInfo.color }} 
        />
      ) : (
        <div className="size-2 rounded-full flex-shrink-0 bg-gray-400" />
      )}
    </Button>
  );

  return (
    <Dropdown trigger={trigger} className="w-full">
      {/* All Vendors Option */}
      <DropdownItem
        onClick={() => onVendorSelect(null)}
        selected={!selectedVendor}
        className={!selectedVendor ? 'bg-gray-100 text-black font-mono' : 'text-gray-700'}
      >
        <span>all</span>
      </DropdownItem>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Vendor Options */}
      {vendors.map((vendor) => (
        <DropdownItem
          key={vendor.name}
          onClick={() => onVendorSelect(vendor.name)}
          selected={selectedVendor === vendor.name}
          style={{
            color: selectedVendor === vendor.name ? vendor.color : '#374151',
            fontWeight: 'normal'
          }}
          className="flex items-center justify-center gap-2"
        >
          <span className="truncate">
            {vendor.name}
          </span>
          {vendor.hasVideoProducts && (
            <div className="w-1 h-1 bg-blue-500 rounded-full flex-shrink-0 ml-2" title="Has video products" />
          )}
        </DropdownItem>
      ))}
    </Dropdown>
  );
}