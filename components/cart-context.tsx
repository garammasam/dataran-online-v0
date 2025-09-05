'use client';

import React, { createContext, use, useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { type Product, type ProductVariant } from '@/lib/products';
import { checkCartInventory, type InventoryCheckResult } from '@/lib/shopify';

interface CartItem extends Product {
  quantity: number;
  size: number;
  selectedVariant?: ProductVariant;
  cartItemId: string; // Unique identifier for cart item
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, size: number, selectedVariant?: ProductVariant) => void;
  updateQuantity: (cartItemId: string, change: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  total: number;
  totalFormatted: string;
  createShopifyCheckout: () => Promise<string | null>;
  isCartFlashing: boolean;
  isCartFlashingRed: boolean;
  inventoryCheck: InventoryCheckResult | null;
  isCheckingInventory: boolean;
  getItemStockInfo: (item: CartItem) => { hasError: boolean; availableQuantity: number | null; requestedQuantity: number; availableForSale: boolean } | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Session storage key for cart persistence
const CART_STORAGE_KEY = 'dataran-cart-items';

// Helper functions for session storage
const saveCartToStorage = (cartItems: CartItem[]) => {
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    }
  } catch (error) {
    console.error('Failed to save cart to session storage:', error);
  }
};

const loadCartFromStorage = (): CartItem[] => {
  try {
    if (typeof window !== 'undefined') {
      const savedCart = sessionStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        return JSON.parse(savedCart);
      }
    }
  } catch (error) {
    console.error('Failed to load cart from session storage:', error);
  }
  return [];
};

// Want a full-featured optimistic cart?
// Check out Next.js Commerce: https://github.com/vercel/commerce
// Want to use Stripe instead?
// Check out my starter: https://github.com/leerob/next-saas-starter
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartFlashing, setIsCartFlashing] = useState(false);
  const [isCartFlashingRed, setIsCartFlashingRed] = useState(false);
  const [inventoryCheck, setInventoryCheck] = useState<InventoryCheckResult | null>(null);
  const [isCheckingInventory, setIsCheckingInventory] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const inventoryCheckRef = useRef<InventoryCheckResult | null>(null);

  // Load cart from session storage on mount (optimized)
  useEffect(() => {
    // Use timeout to defer after initial render
    const timeoutId = setTimeout(() => {
      const savedCart = loadCartFromStorage();
      if (savedCart.length > 0) {
        setItems(savedCart);
      }
      setIsLoaded(true);
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Save cart to session storage whenever items change (but only after initial load)
  useEffect(() => {
    if (isLoaded) {
      saveCartToStorage(items);
    }
  }, [items, isLoaded]);

  // Helper function to get stock info for a specific item
  const getItemStockInfo = useCallback((item: CartItem) => {
    if (!inventoryCheck || !item.selectedVariant) return null;
    
    const error = inventoryCheck.errors.find(err => err.variantId === item.selectedVariant!.id);
    if (!error) return null;
    
    return {
      hasError: true,
      availableQuantity: error.availableQuantity,
      requestedQuantity: error.requestedQuantity,
      availableForSale: error.availableForSale
    };
  }, [inventoryCheck]);

  // Check inventory function - moved to API route
  const checkInventory = useCallback(async () => {
    setIsCheckingInventory(true);
    setInventoryCheck(null);
    
    try {
      // Only check items with Shopify variants
      const shopifyItems = items
        .filter(item => item.selectedVariant)
        .map(item => ({
          variantId: item.selectedVariant!.id,
          quantity: item.quantity,
          productTitle: item.title || item.name || 'Unknown Product'
        }));
      
      if (shopifyItems.length === 0) {
        // No Shopify items to check
        setInventoryCheck({ hasErrors: false, errors: [] });
        return;
      }
      
      // Use API route instead of direct library call
      const response = await fetch('/api/cart/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: shopifyItems }),
      });

      if (!response.ok) {
        throw new Error('Inventory check failed');
      }

      const result = await response.json();
      setInventoryCheck(result);
      inventoryCheckRef.current = result;
      
      // Trigger red flash if there are inventory errors
      if (result.hasErrors) {
        setIsCartFlashingRed(true);
        setTimeout(() => setIsCartFlashingRed(false), 1000);
      }
    } catch (err) {
      console.error('Error checking inventory:', err);
    } finally {
      setIsCheckingInventory(false);
    }
  }, [items]);

  const addToCart = useCallback((product: Product, size: number, selectedVariant?: ProductVariant) => {
    setItems((prevItems) => {
      // Create unique cart item ID
      const cartItemId = selectedVariant 
        ? `${product.id}-${selectedVariant.id}`
        : `${product.id}-${size}`;
      
      const existingItemIndex = prevItems.findIndex(
        (item) => item.cartItemId === cartItemId,
      );
      
      if (existingItemIndex > -1) {
        return prevItems.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      } else {
        return [...prevItems, { 
          ...product, 
          quantity: 1, 
          size, 
          selectedVariant,
          cartItemId 
        }];
      }
    });
    
    // Trigger cart flash
    setIsCartFlashing(true);
    setTimeout(() => setIsCartFlashing(false), 1000);
  }, []);

  const updateQuantity = useCallback(
    (cartItemId: string, change: number) => {
      setItems((prevItems) =>
        prevItems.reduce((acc, item) => {
          if (item.cartItemId === cartItemId) {
            const newQuantity = item.quantity + change;
            return newQuantity > 0
              ? [...acc, { ...item, quantity: newQuantity }]
              : acc;
          }
          return [...acc, item];
        }, [] as CartItem[]),
      );
    },
    [],
  );

  const removeItem = useCallback((cartItemId: string) => {
    setItems((prevItems) => prevItems.filter(item => item.cartItemId !== cartItemId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    // Also clear from session storage
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem(CART_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to clear cart from session storage:', error);
    }
  }, []);

  // Calculate total with proper pricing (memoized)
  const total = useMemo(() => {
    return items.reduce((acc, item) => {
      let price = 20; // default price
      
      if (item.selectedVariant) {
        // Use Shopify variant price
        price = parseFloat(item.selectedVariant.price.amount);
      } else if (item.price) {
        // Use product price
        price = parseFloat(item.price.amount);
      } else {
        // Fallback to legacy pricing logic
        price = item.id.startsWith('sk')
          ? item.id.includes('gray')
            ? 40
            : 20
          : 20;
      }
      
      return acc + price * item.quantity;
    }, 0);
  }, [items]);

  const totalFormatted = useMemo(() => {
    if (items.length === 0) return '$0.00';
    
    // Get currency from first Shopify variant if available
    const shopifyVariant = items.find(item => item.selectedVariant);
    if (shopifyVariant) {
      return `${shopifyVariant.selectedVariant!.price.currencyCode} ${total.toFixed(2)}`;
    }
    
    // Get currency from first product if available
    const productWithPrice = items.find(item => item.price);
    if (productWithPrice) {
      return `${productWithPrice.price!.currencyCode} ${total.toFixed(2)}`;
    }
    
    // Use environment currency or default to USD
    const envCurrency = process.env.NEXT_PUBLIC_SHOPIFY_CURRENCY || 'USD';
    return `${envCurrency} ${total.toFixed(2)}`;
  }, [items, total]);

  const createShopifyCheckout = useCallback(async (): Promise<string | null> => {
    try {
      // Convert cart items to Shopify line items
      const lineItems = items
        .filter(item => item.selectedVariant)
        .map(item => ({
          variantId: item.selectedVariant!.id,
          quantity: item.quantity,
        }));

      if (lineItems.length === 0) {
        // No Shopify variants - return null to trigger fallback to checkout page
        return null;
      }

      // Use API route instead of direct library call
      const response = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: lineItems }),
      });

      if (!response.ok) {
        throw new Error('Checkout creation failed');
      }

      const result = await response.json();
      return result.checkoutUrl;
    } catch (error) {
      console.error('Failed to create Shopify checkout:', error);
      return null;
    }
  }, [items]);

  // Optimized inventory check to prevent rerender issues
  useEffect(() => {
    if (!isLoaded || items.length === 0) {
      setInventoryCheck(null);
      return;
    }
    
    // Debounce inventory check to prevent excessive calls during state changes
    const timeoutId = setTimeout(() => {
      checkInventory();
    }, 200);
    
    // Set up auto-refresh only when needed
    const interval = setInterval(() => {
      // Only check if we still have stock issues or haven't checked yet
      if (!inventoryCheckRef.current || inventoryCheckRef.current.hasErrors) {
        checkInventory();
      }
    }, 30000); // Increased to 30 seconds for better performance
    
    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [items, checkInventory, isLoaded]);

  return (
    <CartContext.Provider value={{ 
      items, 
      addToCart, 
      updateQuantity, 
      removeItem, 
 clearCart,
      total, 
      totalFormatted,
      createShopifyCheckout,
      isCartFlashing,
      isCartFlashingRed,
      inventoryCheck,
      isCheckingInventory,
      getItemStockInfo
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = use(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}