import { NextRequest, NextResponse } from 'next/server';
import { getOrdersByEmail, isShopifyAdminConfigured } from '@/lib/shopify';

export async function POST(request: NextRequest) {
  try {
    const { searchInput, searchType, email } = await request.json();

    // Support both new format (searchInput + searchType) and legacy format (email)
    const actualSearchInput = searchInput || email;
    const actualSearchType = searchType || 'email';

    if (!actualSearchInput || typeof actualSearchInput !== 'string') {
      return NextResponse.json(
        { error: `${actualSearchType === 'email' ? 'Email' : 'Order number'} is required` },
        { status: 400 }
      );
    }

    // Check if Shopify admin is configured
    if (!isShopifyAdminConfigured()) {
      return NextResponse.json(
        { error: 'Order tracking is currently unavailable. Please contact support.' },
        { status: 503 }
      );
    }

    // Try to fetch real orders from Shopify
    try {
      const orders = await getOrdersByEmail(actualSearchInput, actualSearchType);
      
      return NextResponse.json({ 
        orders
      });
    } catch (shopifyError: any) {
      // If Shopify API fails, return error
      console.error('Shopify API failed:', shopifyError.message);
      
      return NextResponse.json(
        { error: 'Unable to fetch order information. Please try again later or contact support.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in orders API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}