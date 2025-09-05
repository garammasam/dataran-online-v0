'use client';

import { useState, useEffect, useMemo } from 'react';
import { getProductById, Product } from '@/lib/products';
import { AddToCart } from '@/components/add-to-cart';
import { Header } from '@/components/header';
import { ProductImage } from '@/components/product-image';
import { VideoProduct } from '@/components/video-product';
import { VideoProductDetails } from '@/components/video-product-details';

export default function PDP({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true);
      try {
        const productData = await getProductById(slug);
        setProduct(productData || null);
      } catch (error) {
        console.error('Failed to load product:', error);
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [slug]);

  // Don't memoize video component in PDP to allow proper intersection observer updates
  const MediaComponent = useMemo(() => {
    if (!product) return null;
    
    return (product as any).isVideoProduct ? (
      <VideoProduct
        key={`video-${product.id}`} // Force re-render with key
        product={product}
        maxWidth="100%"
        maxHeight="calc(var(--safe-viewport-height) - var(--image-max-height-offset))"
        className="w-full"
        enableSlider={true}
      />
    ) : (
      <ProductImage
        product={product}
        maxWidth="100%"
        maxHeight="calc(var(--safe-viewport-height) - var(--image-max-height-offset))"
        className="w-full"
        enableSlider={true}
      />
    );
  }, [product]);

  // Memoize details component
  const DetailsComponent = useMemo(() => {
    if (!product) return null;
    
    return (product as any).isVideoProduct ? (
      <VideoProductDetails product={product} />
    ) : (
      <AddToCart product={product} />
    );
  }, [product]);

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header isBackVisible={true} onBack={() => typeof window !== 'undefined' && (window.location.href = '/')} />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="font-mono text-sm">Loading product...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header isBackVisible={true} onBack={handleBack} />
      <main className="flex flex-col items-center justify-between pt-[20px]">
        <div className="w-full max-w-4xl mx-auto flex-grow flex flex-col items-center justify-center p-2 sm:p-4 lg:p-6">
          {MediaComponent}
        </div>

        <div className="w-full max-w-md mx-auto mt-2 px-4 sm:px-6 lg:px-8 animate-[fadeInUp_200ms_ease-out_100ms_both]">
          {DetailsComponent}
        </div>
      </main>
    </div>
  );
}