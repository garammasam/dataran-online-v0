import { getProducts, getProductByHandle, isShopifyConfigured, ShopifyProduct, getVideoProducts, getVideoProductByHandle, VideoProduct } from './shopify';

export interface ProductVariant {
  id: string;
  title: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  compareAtPrice?: {
    amount: string;
    currencyCode: string;
  };
  availableForSale: boolean;
  quantityAvailable?: number;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
  image?: {
    url: string;
    altText?: string;
  };
}

export interface ProductOption {
  id: string;
  name: string;
  values: string[];
}

// Extended Product interface to support video products
export interface Product {
  id: string;
  name: string;
  image: string;
  // Extended fields for Shopify compatibility
  handle?: string;
  title?: string;
  description?: string;
  price?: {
    amount: string;
    currencyCode: string;
  };
  priceRange?: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
    maxVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  images?: Array<{
    url: string;
    altText?: string;
  }>;
  options?: ProductOption[];
  variants?: ProductVariant[];
  availableForSale?: boolean;
  vendor?: string;
  tags?: string[];
  collections?: Array<{
    id: string;
    handle: string;
    title: string;
  }>;
  // Video product fields
  isVideoProduct?: boolean;
  videoUrls?: string[];
  thumbnailUrl?: string;
  publishedAt?: string;
  // Metafields
  metafields?: Array<{
    key: string;
    value: string;
    type: string;
  }>;
}

// Product images were generated with Midjourney
// and are stored in a public Vercel Blob storage bucket
export const products: Product[] = [];

// Convert Shopify product to our Product interface
function convertShopifyProduct(shopifyProduct: ShopifyProduct): Product {
  return {
    id: shopifyProduct.handle, // Use handle as ID for URL compatibility
    name: shopifyProduct.title,
    image: shopifyProduct.image.url,
    handle: shopifyProduct.handle,
    title: shopifyProduct.title,
    description: shopifyProduct.description,
    price: shopifyProduct.price,
    priceRange: shopifyProduct.priceRange,
    images: shopifyProduct.images, // Add the images array!
    options: shopifyProduct.options,
    variants: shopifyProduct.variants,
    availableForSale: shopifyProduct.availableForSale,
    vendor: shopifyProduct.vendor,
    tags: shopifyProduct.tags,
    collections: shopifyProduct.collections,
    metafields: shopifyProduct.metafields,
  };
}

// Convert Shopify video product to our Product interface
function convertVideoProduct(videoProduct: VideoProduct): Product {
  const converted = {
    id: videoProduct.handle,
    name: videoProduct.title,
    image: videoProduct.thumbnailUrl || '',
    handle: videoProduct.handle,
    title: videoProduct.title,
    description: videoProduct.description,
    price: videoProduct.price,
    vendor: videoProduct.vendor,
    tags: [
      ...videoProduct.tags,
      // Add video URLs as tags for the VideoProduct component
      ...videoProduct.videoUrls.map(url => `video:${url}`)
    ],
    isVideoProduct: true,
    videoUrls: videoProduct.videoUrls,
    thumbnailUrl: videoProduct.thumbnailUrl,
    publishedAt: videoProduct.publishedAt,
  };
  
  return converted;
}

// Get all products (Shopify + Video Products or fallback to static)
export async function getAllProducts(): Promise<Product[]> {
  const allProducts: Product[] = [];
  
  // Get regular Shopify products
  if (isShopifyConfigured()) {
    try {
      const shopifyProducts = await getProducts(50);
      allProducts.push(...shopifyProducts.map(convertShopifyProduct));
    } catch (error) {
      console.error('Failed to fetch Shopify products:', error);
    }
  } else {
    console.warn('Shopify not configured, no products available');
    // Don't add mock data
  }
  
  // Get video products from blog posts
  try {
    const videoProducts = await getVideoProducts(20);
    allProducts.push(...videoProducts.map(convertVideoProduct));
  } catch (error) {
    console.error('Failed to fetch video products:', error);
  }
  
  return allProducts;
}

// Get product by ID/handle (Shopify + Video Products or fallback to static)
export async function getProductById(id: string): Promise<Product | undefined> {
  // First try to get as video product
  try {
    const videoProduct = await getVideoProductByHandle(id);
    if (videoProduct) {
      return convertVideoProduct(videoProduct);
    }
  } catch (error) {
    console.error('Failed to fetch video product:', error);
  }
  
  // Then try regular Shopify product
  if (isShopifyConfigured()) {
    try {
      const shopifyProduct = await getProductByHandle(id);
      if (shopifyProduct) {
        return convertShopifyProduct(shopifyProduct);
      }
    } catch (error) {
      console.error('Failed to fetch Shopify product:', error);
    }
  }
  
  // No fallback to mock data
  console.warn(`Product with ID '${id}' not found`);
  return undefined;
}