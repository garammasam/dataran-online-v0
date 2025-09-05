import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/products';
import { cacheUtils, createCacheKey } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendor = searchParams.get('vendor');
    const collection = searchParams.get('collection');
    const limit = searchParams.get('limit');

    // Create cache key based on query parameters
    const cacheKey = createCacheKey('products', { vendor, collection, limit });
    
    // Try to get from cache first
    const cachedProducts = cacheUtils.products.get(cacheKey);
    if (cachedProducts) {
      return NextResponse.json(
        { products: cachedProducts, source: 'cache' },
        { 
          status: 200,
          headers: {
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', // 5 min cache, 10 min stale
            'X-Cache': 'HIT'
          }
        }
      );
    }

    // Get all products from source
    let products = await getAllProducts();

    // Apply filters
    if (vendor) {
      products = products.filter(product => product.vendor === vendor);
    }

    if (collection) {
      products = products.filter(product => 
        product.collections?.some(c => c.id === collection)
      );
    }

    // Apply limit
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        products = products.slice(0, limitNum);
      }
    }

    // Cache the filtered results
    cacheUtils.products.set(cacheKey, products);

    // Set cache headers for performance
    const headers = new Headers({
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'Content-Type': 'application/json',
      'X-Cache': 'MISS'
    });

    return new Response(JSON.stringify({ products, source: 'api' }), {
      status: 200,
      headers,
    });
    
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}