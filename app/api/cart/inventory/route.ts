import { NextRequest, NextResponse } from 'next/server';
import { checkCartInventory } from '@/lib/shopify';
import { cacheUtils, createCacheKey } from '@/lib/cache';

interface InventoryCheckRequest {
  items: Array<{
    variantId: string;
    quantity: number;
    productTitle?: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { items }: InventoryCheckRequest = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({
        hasErrors: false,
        errors: []
      });
    }

    // Validate items format
    const validItems = items
      .filter(item => 
        item.variantId && 
        typeof item.variantId === 'string' && 
        item.quantity && 
        typeof item.quantity === 'number' && 
        item.quantity > 0
      )
      .map(item => ({
        variantId: item.variantId,
        quantity: item.quantity,
        productTitle: item.productTitle || 'Unknown Product'
      }));

    if (validItems.length === 0) {
      return NextResponse.json({
        hasErrors: false,
        errors: []
      });
    }

    // Check inventory through Shopify
    // Create cache key based on variant IDs and quantities (short TTL for inventory)
    const cacheKey = createCacheKey('inventory', validItems.map(i => `${i.variantId}:${i.quantity}`));
    
    // Try cache first (very short TTL for inventory)
    const cachedResult = cacheUtils.inventory.get(cacheKey);
    if (cachedResult) {
      return NextResponse.json(
        { ...cachedResult, source: 'cache' },
        {
          headers: {
            'Cache-Control': 'private, max-age=60', // 1 minute cache
            'X-Cache': 'HIT'
          }
        }
      );
    }

    const inventoryResult = await checkCartInventory(validItems);
    
    // Cache the result briefly
    cacheUtils.inventory.set(cacheKey, inventoryResult);
    
    return NextResponse.json(
      { ...inventoryResult, source: 'api' },
      {
        headers: {
          'Cache-Control': 'private, max-age=60',
          'X-Cache': 'MISS'
        }
      }
    );
    
  } catch (error) {
    console.error('Inventory check failed:', error);
    return NextResponse.json(
      { error: 'Failed to check inventory' },
      { status: 500 }
    );
  }
}