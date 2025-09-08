'use client';
// using native <img> for onboarding demo


import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

const mockProducts = [
  {
    id: '1',
    title: 'BASIC TEE',
    vendor: 'DATARAN',
    price: 'MYR 25.00',
    image: 'https://6gy9systudbmcbju.public.blob.vercel-storage.com/ts-white-P2VTrySg3IQ4gdu17JGSrQ8RdLDgTm.png',
    color: '#EF4444',
    collections: [
      { id: 'essentials', handle: 'essentials', title: 'Essentials' }
    ],
    description: 'Classic everyday tee made from premium cotton. Essential wardrobe staple with clean lines and comfortable fit.'
  },
  {
    id: '2',
    title: 'HOODIE',
    vendor: 'DATARAN',
    price: 'MYR 85.00',
    image: 'https://6gy9systudbmcbju.public.blob.vercel-storage.com/hd-white-K3qh4s0wfcmCCSIwTgtscr02jPSsg0.png',
    color: '#EF4444',
    collections: [
      { id: 'essentials', handle: 'essentials', title: 'Essentials' },
      { id: 'streetwear', handle: 'streetwear', title: 'Streetwear' }
    ],
    description: 'Heavyweight cotton hoodie with kangaroo pocket. Perfect for casual wear and layering in cooler weather.'
  },
  {
    id: '3',
    title: 'WORKWEAR',
    vendor: 'STUDIO',
    price: 'MYR 120.00',
    image: 'https://6gy9systudbmcbju.public.blob.vercel-storage.com/wb-white-82bTXBV4TGM8XGOfuiI3IYcsJudeAt.png',
    color: '#3B82F6',
    collections: [
      { id: 'professional', handle: 'professional', title: 'Professional' }
    ],
    description: 'Durable workwear jacket designed for professionals. Features reinforced stitching and multiple pockets for tools and essentials.'
  }
];

const mockTrackingData = {
  orderId: '#1001',
  email: 'demo@example.com',
  status: 'shipped' as const,
  date: '2024-01-15',
  trackingNumber: 'DX123456789MY',
  totalAmount: '85.00',
  currency: 'MYR',
  items: [{ title: 'HOODIE', quantity: 1 }]
};

// Swipe-to-Remove Component
function SwipeToRemoveDemo({ 
  children, 
  onRemove 
}: { 
  children: React.ReactNode; 
  onRemove: () => void; 
}) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  
  const SWIPE_THRESHOLD = 80;
  const MAX_SWIPE = 120;
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diff = startX - currentX;
    
    if (diff > 0) {
      const newTranslateX = Math.min(diff, MAX_SWIPE);
      setTranslateX(newTranslateX);
    }
  };
  
  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    if (translateX >= SWIPE_THRESHOLD) {
      onRemove();
    } else {
      setTranslateX(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const currentX = e.clientX;
    const diff = startX - currentX;
    
    if (diff > 0) {
      const newTranslateX = Math.min(diff, MAX_SWIPE);
      setTranslateX(newTranslateX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    if (translateX >= SWIPE_THRESHOLD) {
      onRemove();
    } else {
      setTranslateX(0);
    }
  };
  
  return (
    <div className="relative overflow-hidden">
      {/* Remove background */}
      <div 
        className="absolute inset-0 bg-red-500 flex items-center justify-end pr-6 z-0"
        style={{
          opacity: Math.min(translateX / SWIPE_THRESHOLD, 1)
        }}
      >
        <div className="flex items-center space-x-2 text-white">
          <span className="font-mono text-sm font-medium uppercase">Remove</span>
        </div>
      </div>
      
      {/* Item content */}
      <div
        className="relative z-10 bg-white transition-transform duration-200 ease-out"
        style={{
          transform: `translateX(-${translateX}px)`,
          transitionDuration: isDragging ? '0ms' : '200ms'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={isDragging ? handleMouseMove : undefined}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {children}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  // Core browsing state  
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Cart state
  const [showVariantPicker, setShowVariantPicker] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<string>('M');
  const [cartItems, setCartItems] = useState<{ id: string; title: string; price: string; quantity: number; variant?: string }[]>([]);
  const [showCart, setShowCart] = useState(false);
  
  // Tracking state
  const [showTracking, setShowTracking] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchType, setSearchType] = useState<'email' | 'order'>('order');
  const [showTrackingResults, setShowTrackingResults] = useState(false);
  
  // Experience guidance
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());
  
  const variants = ['S', 'M', 'L', 'XL'];
  
  const mockImages = [
    'https://6gy9systudbmcbju.public.blob.vercel-storage.com/ts-white-P2VTrySg3IQ4gdu17JGSrQ8RdLDgTm.png',
    'https://6gy9systudbmcbju.public.blob.vercel-storage.com/hd-white-K3qh4s0wfcmCCSIwTgtscr02jPSsg0.png',
    'https://6gy9systudbmcbju.public.blob.vercel-storage.com/wb-white-82bTXBV4TGM8XGOfuiI3IYcsJudeAt.png'
  ];

  const filteredProducts = useMemo(() => {
    return mockProducts.filter(product => {
      const vendorMatch = !selectedVendor || product.vendor === selectedVendor;
      const collectionMatch = !selectedCollection || 
        product.collections?.some(collection => collection.id === selectedCollection);
      
      return vendorMatch && collectionMatch;
    });
  }, [selectedVendor, selectedCollection]);

  const vendors = useMemo(() => {
    const uniqueVendors = Array.from(new Set(mockProducts.map(p => p.vendor)));
    return uniqueVendors.map(vendor => ({
      name: vendor,
      color: vendor === 'DATARAN' ? '#EF4444' : '#3B82F6'
    }));
  }, []);

  // Smart contextual hint - only when needed
  const getContextualHint = () => {
    if (showTracking) return `Try: ${searchType === 'email' ? mockTrackingData.email : mockTrackingData.orderId}`;
    if (showCart && cartItems.length > 0) return "SWIPE LEFT TO REMOVE";
    if (expandedProduct && !showVariantPicker) return "CLICK +";
    if (expandedProduct) return "SWIPE PHOTOS";
    if (selectedVendor && !expandedProduct) return "CLICK PRODUCT";
    if (!selectedVendor && !expandedProduct) return "CLICK DOT";
    return null;
  };

  const addAction = (action: string) => {
    setCompletedActions(prev => new Set([...prev, action]));
  };

  const handleProductClick = (productId: string) => {
    setExpandedProduct(productId);
    setCurrentImageIndex(0);
    setShowVariantPicker(false);
    addAction('product-expand');
  };

  const handleImageSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left' && currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    } else if (direction === 'right' && currentImageIndex < mockImages.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
    addAction('photo-swipe');
  };

  const addToCart = () => {
    const product = mockProducts.find(p => p.id === expandedProduct);
    if (!product) return;
    
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id && item.variant === selectedVariant);
      if (existing) {
        return prev.map(item => 
          item.id === product.id && item.variant === selectedVariant
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        id: product.id,
        title: product.title,
        price: product.price,
        quantity: 1,
        variant: selectedVariant
      }];
    });
    
    setShowCart(true);
    addAction('add-to-cart');
  };

  const removeFromCart = (itemId: string, variant: string) => {
    setCartItems(prev => prev.filter(item => !(item.id === itemId && item.variant === variant)));
    addAction('swipe-remove');
  };

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setShowTrackingResults(true);
    addAction('order-tracking');
  };

  const cartTotal = cartItems.reduce((total, item) => {
    const price = parseFloat(item.price.replace('MYR ', ''));
    return total + (price * item.quantity);
  }, 0);

  return (
    <div className="min-h-screen bg-white">
      {/* Clean header with simple navigation */}
      <div className="border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => typeof window !== 'undefined' && (window.location.href = '/')}
            className="font-mono text-sm hover:opacity-70 transition-opacity"
          >
            ← dataran.online
          </button>
          
          {/* Tab navigation - like real website */}
          {!expandedProduct && (
            <div className="flex items-center gap-6">
              <button
                onClick={() => {setShowTracking(false); setShowCart(false);}}
                className={`font-mono text-sm transition-colors ${!showTracking && !showCart ? 'text-black' : 'text-gray-500 hover:text-black'}`}
              >
                SHOP
              </button>
              <button
                onClick={() => {setShowTracking(true); setShowCart(false);}}
                className={`font-mono text-sm transition-colors ${showTracking ? 'text-black' : 'text-gray-500 hover:text-black'}`}
              >
                TRACK
              </button>
              {cartItems.length > 0 && (
                <button
                  onClick={() => {setShowCart(true); setShowTracking(false);}}
                  className={`font-mono text-sm transition-colors flex items-center gap-1 ${showCart ? 'text-black' : 'text-gray-500 hover:text-black'}`}
                >
                  CART ({cartItems.length})
                </button>
              )}
            </div>
          )}
          
          <div className="font-mono text-xs text-gray-500">Demo</div>
        </div>
      </div>

      {/* Minimal contextual hint */}
      {getContextualHint() && (
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div className="bg-black text-white rounded px-3 py-1 text-center animate-[fadeIn_300ms_ease-out] inline-block">
            <p className="font-mono text-xs">{getContextualHint()}</p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* EXPANDED PRODUCT VIEW */}
        {expandedProduct && (() => {
          const product = mockProducts.find(p => p.id === expandedProduct);
          if (!product) return null;

          return (
            <div className="space-y-6">
              {/* Breadcrumbs */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 font-mono text-sm text-gray-600">
                  <button
                    onClick={() => {
                      setSelectedVendor(product.vendor);
                      setExpandedProduct(null);
                    }}
                    className="hover:text-[#00b140] transition-colors"
                  >
                    {product.vendor.toLowerCase()}
                  </button>
                  {product.collections && product.collections.length > 0 && (
                    <>
                      <span className="text-gray-400">/</span>
                      <button
                        onClick={() => {
                          setSelectedCollection(product.collections[0].id);
                          setExpandedProduct(null);
                        }}
                        className="hover:text-[#00b140] transition-colors"
                      >
                        {product.collections[0].handle}
                      </button>
                    </>
                  )}
                  <span className="text-gray-400">/</span>
                  <button
                    onClick={() => setExpandedProduct(null)}
                    className="text-black font-medium hover:text-[#00b140] transition-colors"
                  >
                    {product.title.toLowerCase()}
                  </button>
                </div>
              </div>

              <div className="max-w-md mx-auto space-y-6">
                {/* Image with swipe */}
                <div className="relative">
                  <div className="aspect-[4/5] bg-gray-100 rounded-sm overflow-hidden">
                    <img 
                      src={mockImages[currentImageIndex]} 
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Navigation arrows */}
                  <button 
                    onClick={() => handleImageSwipe('left')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 size-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-all duration-200"
                    disabled={currentImageIndex === 0}
                  >
                    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <button 
                    onClick={() => handleImageSwipe('right')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 size-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-all duration-200"
                    disabled={currentImageIndex === mockImages.length - 1}
                  >
                    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Image indicators */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {mockImages.map((_, index) => (
                      <div
                        key={index}
                        className={`size-2 rounded-full transition-all duration-200 ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Product info */}
                <div className="text-center space-y-4">
                  <div>
                    <h3 className="font-mono text-lg font-medium">{product.title}</h3>
                    <p className="font-mono text-sm text-gray-600">{product.price}</p>
                  </div>

                  {/* + Button expansion */}
                  <div className="relative">
                    {!showVariantPicker ? (
                      <button
                        onClick={() => setShowVariantPicker(true)}
                        className="size-12 h-12 flex items-center justify-center bg-white border-2 border-gray-300 hover:border-black mx-auto rounded transition-all duration-200"
                        aria-label="Select product options"
                      >
                        <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    ) : (
                      <div className="space-y-4 animate-[scaleIn_200ms_ease-out]">
                        {/* Description appears after + */}
                        <div className="bg-gray-50 rounded p-3 text-left">
                          <p className="font-mono text-xs text-gray-700 leading-relaxed">
                            {product.description}
                          </p>
                        </div>

                        <div>
                          <p className="font-mono text-sm mb-2 uppercase text-center">SIZE</p>
                          <div className="flex gap-2 justify-center">
                            {variants.map(variant => (
                              <button
                                key={variant}
                                onClick={() => setSelectedVariant(variant)}
                                className={`px-4 py-2 border transition-all duration-200 font-mono text-sm ${
                                  selectedVariant === variant
                                    ? 'bg-black text-white border-black'
                                    : 'border-gray-300 hover:bg-black hover:text-white'
                                }`}
                              >
                                {variant}
                              </button>
                            ))}
                          </div>
                        </div>

                        <Button onClick={addToCart} fullWidth>
                          ADD TO CART
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ORDER TRACKING VIEW */}
        {showTracking && !expandedProduct && (
          <div className="space-y-6 max-w-md mx-auto">
            <h2 className="text-xl font-mono">ORDER TRACKING</h2>
            
            {/* Search Type Toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSearchType('order');
                  setSearchInput('');
                  setShowTrackingResults(false);
                }}
                className={`px-3 py-1 font-mono text-xs rounded transition-colors ${
                  searchType === 'order' 
                    ? 'bg-black text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ORDER #
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchType('email');
                  setSearchInput('');
                  setShowTrackingResults(false);
                }}
                className={`px-3 py-1 font-mono text-xs rounded transition-colors ${
                  searchType === 'email' 
                    ? 'bg-black text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                EMAIL
              </button>
            </div>

            {/* Search Form */}
            <form onSubmit={handleTrack} className="space-y-4">
              <div>
                <label className="block font-mono text-sm mb-2">
                  {searchType === 'email' ? 'EMAIL ADDRESS' : 'ORDER NUMBER'}
                </label>
                <input
                  type={searchType === 'email' ? 'email' : 'text'}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={searchType === 'email' ? 'your@email.com' : '#1001'}
                  className="w-full px-3 py-2 border border-gray-300 font-mono text-sm focus:outline-none focus:border-black transition-colors"
                  required
                />
              </div>
              
              <Button type="submit" fullWidth>
                TRACK ORDERS
              </Button>
            </form>

            {/* Results */}
            {showTrackingResults && (
              <div className="border border-gray-200 p-4 space-y-3 animate-[slideUp_300ms_ease-out]">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-sm font-medium">{mockTrackingData.orderId}</span>
                  <span className="font-mono text-sm font-medium text-blue-600">SHIPPED</span>
                </div>
                
                <div className="font-mono text-xs text-gray-600 space-y-1">
                  <div>ORDER DATE: {mockTrackingData.date}</div>
                  <div>TOTAL: {mockTrackingData.currency}{mockTrackingData.totalAmount}</div>
                  <div>TRACKING: {mockTrackingData.trackingNumber}</div>
                  <div>ITEMS: {mockTrackingData.items.map(item => `${item.quantity}x ${item.title}`).join(', ')}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PRODUCT GRID VIEW */}
        {!showTracking && !expandedProduct && !showCart && (
          <div className="space-y-6">
            {/* Vendor Filter */}
            <div className="flex justify-center">
              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-3 py-1 bg-white font-mono text-sm uppercase hover:bg-gray-100 min-w-[120px]"
                >
                  <div 
                    className="size-2 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: selectedVendor ? vendors.find(v => v.name === selectedVendor)?.color || '#9CA3AF' : '#9CA3AF' }} 
                  />
                  <span>{selectedVendor || 'all'}</span>
                  <svg className="size-3 transition-transform" style={{ transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Button>

                {showDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg rounded z-10 min-w-[120px] animate-[slideUp_200ms_ease-out]">
                    <button
                      onClick={() => {
                        setSelectedVendor(null);
                        setShowDropdown(false);
                        addAction('vendor-filter');
                      }}
                      className="w-full px-3 py-2 text-left font-mono text-sm hover:bg-gray-100 border-b border-gray-100"
                    >
                      all
                    </button>
                    {vendors.map(vendor => (
                      <button
                        key={vendor.name}
                        onClick={() => {
                          setSelectedVendor(vendor.name);
                          setShowDropdown(false);
                          addAction('vendor-filter');
                        }}
                        className="w-full px-3 py-2 text-left font-mono text-sm hover:bg-gray-100 flex items-center gap-2"
                      >
                        <div className="size-2 rounded-full" style={{ backgroundColor: vendor.color }} />
                        {vendor.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-3 gap-4">
              {filteredProducts.map((product, index) => (
                <div 
                  key={product.id} 
                  onClick={() => handleProductClick(product.id)}
                  className="group cursor-pointer transition-all duration-200 ease-out hover:scale-105"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="aspect-[4/5] bg-gray-100 rounded-sm mb-2 overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <div className="text-center">
                    <p className="font-medium font-mono uppercase text-sm transition-colors duration-200 group-hover:text-[#00b140]">
                      {product.title}
                    </p>
                    <p className="font-mono text-xs mt-1 opacity-70 transition-colors duration-200 group-hover:text-[#00b140]">
                      {product.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CART SIDEBAR */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 animate-[fadeIn_300ms_ease-out]">
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg animate-[slideInLeft_300ms_ease-out] flex flex-col">
            {/* Cart Header */}
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-mono text-lg">CART ({cartItems.length})</h3>
              <button 
                onClick={() => setShowCart(false)}
                className="size-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cartItems.map((item, index) => (
                <SwipeToRemoveDemo 
                  key={`${item.id}-${item.variant}`}
                  onRemove={() => removeFromCart(item.id, item.variant || '')}
                >
                  <div className="border-b pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-mono text-sm font-medium">{item.title}</h4>
                        <p className="font-mono text-xs text-gray-600">Size: {item.variant}</p>
                        <p className="font-mono text-xs text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-mono text-sm">{item.price}</p>
                    </div>
                  </div>
                </SwipeToRemoveDemo>
              ))}
            </div>

            {/* Cart Footer */}
            <div className="p-4 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="font-mono text-lg font-medium">TOTAL:</span>
                <span className="font-mono text-lg font-medium">MYR {cartTotal.toFixed(2)}</span>
              </div>
              
              <div className="text-center">
                <Button onClick={() => typeof window !== 'undefined' && (window.location.href = '/')} fullWidth>
                  START SHOPPING
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skip option */}
      <div className="fixed bottom-4 right-4">
        <button 
          onClick={() => typeof window !== 'undefined' && (window.location.href = '/')}
          className="font-mono text-xs text-gray-500 hover:text-black transition-colors bg-white px-3 py-2 rounded shadow-sm border border-gray-200"
        >
          Skip
        </button>
      </div>
    </div>
  );
}