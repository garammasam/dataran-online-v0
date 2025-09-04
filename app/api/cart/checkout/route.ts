import { NextRequest, NextResponse } from 'next/server';
import { createCheckout } from '@/lib/shopify';

interface CheckoutRequest {
  items: Array<{
    variantId: string;
    quantity: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { items }: CheckoutRequest = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Validate items format
    const validItems = items.filter(item => 
      item.variantId && 
      typeof item.variantId === 'string' && 
      item.quantity && 
      typeof item.quantity === 'number' && 
      item.quantity > 0
    );

    if (validItems.length === 0) {
      return NextResponse.json(
        { error: 'No valid items in cart' },
        { status: 400 }
      );
    }

    // Create Shopify checkout
    const checkout = await createCheckout(validItems);
    
    return NextResponse.json({ 
      checkoutUrl: checkout.webUrl,
      checkoutId: checkout.id,
      totalPrice: checkout.totalPrice 
    });
    
  } catch (error) {
    console.error('Checkout creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout' },
      { status: 500 }
    );
  }
}