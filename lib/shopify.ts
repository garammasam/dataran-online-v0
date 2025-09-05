import { createStorefrontApiClient } from '@shopify/storefront-api-client';

// Shopify client configuration
export const shopifyClient = createStorefrontApiClient({
  storeDomain: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || '',
  apiVersion: (process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION as any) || '2024-10',
  publicAccessToken: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN || '',
});

// Extended Product interface for Shopify integration
export interface ShopifyVariant {
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
    width?: number;
    height?: number;
  };
}

export interface ShopifyProductOption {
  id: string;
  name: string;
  values: string[];
}

export interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  vendor: string;
  productType: string;
  tags: string[];
  collections?: Array<{
    id: string;
    handle: string;
    title: string;
  }>;
  price: {
    amount: string;
    currencyCode: string;
  };
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
    maxVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  compareAtPrice?: {
    amount: string;
    currencyCode: string;
  };
  image: {
    url: string;
    altText?: string;
    width?: number;
    height?: number;
  };
  images: Array<{
    url: string;
    altText?: string;
    width?: number;
    height?: number;
  }>;
  options: ShopifyProductOption[];
  variants: ShopifyVariant[];
  availableForSale: boolean;
  metafields?: Array<{
    key: string;
    value: string;
    type: string;
  }>;
}

// Shopify GraphQL queries
export const PRODUCTS_QUERY = `
  query Products($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          handle
          title
          description
          vendor
          productType
          tags
          collections(first: 5) {
            edges {
              node {
                id
                handle
                title
              }
            }
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          compareAtPriceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          featuredImage {
            url
            altText
            width
            height
          }
          images(first: 10) {
            edges {
              node {
                url
                altText
                width
                height
              }
            }
          }
          options {
            id
            name
            values
          }
          variants(first: 50) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                compareAtPrice {
                  amount
                  currencyCode
                }
                availableForSale
                quantityAvailable
                selectedOptions {
                  name
                  value
                }
                image {
                  url
                  altText
                  width
                  height
                }
              }
            }
          }
          availableForSale
          metafields(identifiers: [{namespace: "custom", key: "category"}]) {
            key
            value
            type
          }
        }
      }
    }
  }
`;

export const PRODUCT_BY_HANDLE_QUERY = `
  query ProductByHandle($handle: String!) {
    productByHandle(handle: $handle) {
      id
      handle
      title
      description
      vendor
      productType
      tags
      collections(first: 5) {
        edges {
          node {
            id
            handle
            title
          }
        }
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
      compareAtPriceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      featuredImage {
        url
        altText
        width
        height
      }
      images(first: 10) {
        edges {
          node {
            url
            altText
            width
            height
          }
        }
      }
      options {
        id
        name
        values
      }
      variants(first: 50) {
        edges {
          node {
            id
            title
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            availableForSale
            quantityAvailable
            selectedOptions {
              name
              value
            }
            image {
              url
              altText
              width
              height
            }
          }
        }
      }
      availableForSale
      metafields(identifiers: [{namespace: "custom", key: "category"}]) {
        key
        value
        type
      }
    }
  }
`;

export const CREATE_CART_MUTATION = `
  mutation CreateCart($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        totalQuantity
        cost {
          totalAmount {
            amount
            currencyCode
          }
          subtotalAmount {
            amount
            currencyCode
          }
        }
        lines(first: 250) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  quantityAvailable
                  product {
                    title
                    handle
                  }
                }
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Utility functions
export async function getProducts(limit = 20): Promise<ShopifyProduct[]> {
  try {
    const { data } = await shopifyClient.request(PRODUCTS_QUERY, {
      variables: { first: limit },
    });

          return data.products.edges.map((edge: any) => {
        const product = edge.node;
        const processedImages = product.images?.edges?.map((img: any) => img.node) || [];
        
        const processedCollections = product.collections?.edges?.map((col: any) => col.node) || [];
        
        return {
          id: product.id,
          handle: product.handle,
          title: product.title,
          description: product.description,
          vendor: product.vendor,
          productType: product.productType,
          tags: product.tags,
          collections: processedCollections,
          price: product.priceRange.minVariantPrice,
          priceRange: product.priceRange,
          compareAtPrice: product.compareAtPriceRange?.minVariantPrice,
          image: product.featuredImage || { url: '', altText: '' },
          images: processedImages,
          options: product.options || [],
          variants: product.variants.edges.map((variant: any) => variant.node),
          availableForSale: product.availableForSale,
          metafields: product.metafields || [],
        };
      });
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function getProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  try {
    const { data } = await shopifyClient.request(PRODUCT_BY_HANDLE_QUERY, {
      variables: { handle },
    });

    if (!data.productByHandle) {
      return null;
    }

    const product = data.productByHandle;
    const processedImages = product.images?.edges?.map((img: any) => img.node) || [];
    const processedCollections = product.collections?.edges?.map((col: any) => col.node) || [];
    
    return {
      id: product.id,
      handle: product.handle,
      title: product.title,
      description: product.description,
      vendor: product.vendor,
      productType: product.productType,
      tags: product.tags,
      collections: processedCollections,
      price: product.priceRange.minVariantPrice,
      priceRange: product.priceRange,
      compareAtPrice: product.compareAtPriceRange?.minVariantPrice,
      image: product.featuredImage || { url: '', altText: '' },
      images: processedImages,
      options: product.options || [],
      variants: product.variants.edges.map((variant: any) => variant.node),
      availableForSale: product.availableForSale,
      metafields: product.metafields || [],
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export interface CheckoutLineItem {
  variantId: string;
  quantity: number;
}

export async function createCheckout(lineItems: CheckoutLineItem[]) {
  try {
    // Convert to cart line items format
    const cartLines = lineItems.map(item => ({
      merchandiseId: item.variantId,
      quantity: item.quantity,
    }));

    const { data } = await shopifyClient.request(CREATE_CART_MUTATION, {
      variables: {
        input: {
          lines: cartLines,
        },
      },
    });

    if (data.cartCreate.userErrors.length > 0) {
      throw new Error(data.cartCreate.userErrors[0].message);
    }

    return {
      id: data.cartCreate.cart.id,
      webUrl: data.cartCreate.cart.checkoutUrl,
      totalPrice: data.cartCreate.cart.cost.totalAmount,
    };
  } catch (error) {
    console.error('Error creating checkout:', error);
    throw error;
  }
}

// Helper function to get product handle from variant ID  
async function getVariantProduct(variantId: string): Promise<string | null> {
  try {
    const query = `
      query GetVariant($id: ID!) {
        node(id: $id) {
          ... on ProductVariant {
            product {
              handle
            }
          }
        }
      }
    `;
    
    const { data } = await shopifyClient.request(query, {
      variables: { id: variantId },
    });

    return data.node?.product?.handle || null;
  } catch (error) {
    console.error('Error getting variant product:', error);
    return null;
  }
}

// Helper function for single item checkout (backward compatibility)
export async function createSingleItemCheckout(variantId: string, quantity = 1) {
  return createCheckout([{ variantId, quantity }]);
}

// Inventory check query
export const CHECK_VARIANTS_INVENTORY_QUERY = `
  query CheckVariantsInventory($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        availableForSale
        quantityAvailable
        product {
          title
          handle
        }
      }
    }
  }
`;

// Check inventory for multiple variants
export async function checkVariantsInventory(variantIds: string[]): Promise<Array<{
  id: string;
  availableForSale: boolean;
  quantityAvailable: number | null;
  productTitle?: string;
  productHandle?: string;
}>> {
  try {
    const { data } = await shopifyClient.request(CHECK_VARIANTS_INVENTORY_QUERY, {
      variables: { ids: variantIds },
    });

    return data.nodes
      .filter((variant: any) => variant && variant.id) // Filter out null/undefined nodes
      .map((variant: any) => ({
        id: variant.id,
        availableForSale: variant.availableForSale,
        quantityAvailable: variant.quantityAvailable,
        productTitle: variant.product?.title,
        productHandle: variant.product?.handle,
      }));
  } catch (error) {
    console.error('Error checking variants inventory:', error);
    throw error;
  }
}

// Check if cart items have sufficient inventory
export interface InventoryCheckResult {
  hasErrors: boolean;
  errors: Array<{
    variantId: string;
    productTitle: string;
    requestedQuantity: number;
    availableQuantity: number | null;
    availableForSale: boolean;
    message: string;
  }>;
}

export async function checkCartInventory(cartItems: Array<{
  variantId: string;
  quantity: number;
  productTitle?: string;
}>): Promise<InventoryCheckResult> {
  try {
    const variantIds = cartItems.map(item => item.variantId);
    const inventoryData = await checkVariantsInventory(variantIds);
    
    const errors: InventoryCheckResult['errors'] = [];
    
    for (const item of cartItems) {
      const variant = inventoryData.find(v => v.id === item.variantId);
      
      if (!variant) {
        errors.push({
          variantId: item.variantId,
          productTitle: item.productTitle || 'Unknown Product',
          requestedQuantity: item.quantity,
          availableQuantity: null,
          availableForSale: false,
          message: 'Product variant not found'
        });
        continue;
      }
      
      if (!variant.availableForSale) {
        errors.push({
          variantId: item.variantId,
          productTitle: variant.productTitle || item.productTitle || 'Unknown Product',
          requestedQuantity: item.quantity,
          availableQuantity: variant.quantityAvailable,
          availableForSale: false,
          message: 'This item is no longer available for sale'
        });
        continue;
      }
      
      if (variant.quantityAvailable !== null && variant.quantityAvailable < item.quantity) {
        errors.push({
          variantId: item.variantId,
          productTitle: variant.productTitle || item.productTitle || 'Unknown Product',
          requestedQuantity: item.quantity,
          availableQuantity: variant.quantityAvailable,
          availableForSale: true,
          message: `Only ${variant.quantityAvailable} item${variant.quantityAvailable !== 1 ? 's' : ''} available, but ${item.quantity} requested`
        });
      }
    }
    
    return {
      hasErrors: errors.length > 0,
      errors
    };
  } catch (error) {
    console.error('Error checking cart inventory:', error);
    throw error;
  }
}

// Admin API queries for order tracking
export const ORDERS_BY_EMAIL_QUERY = `
  query OrdersByEmail($query: String!, $first: Int!) {
    orders(first: $first, query: $query) {
      edges {
        node {
          id
          name
          email
          createdAt
          updatedAt
          displayFinancialStatus
          displayFulfillmentStatus
          customer {
            firstName
            lastName
            displayName
          }
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          fulfillments {
            trackingInfo {
              number
              url
              company
            }
            displayStatus
          }
          lineItems(first: 5) {
            edges {
              node {
                title
                quantity
              }
            }
          }
        }
      }
    }
  }
`;

// Admin API client for order tracking
export async function getOrdersByEmail(searchInput: string, searchType: 'email' | 'order' = 'email') {
  // Check if admin API is properly configured
  if (!process.env.SHOPIFY_ADMIN_ACCESS_TOKEN) {
    console.log('Shopify Admin API not configured - missing access token');
    throw new Error('Shopify Admin API not configured');
  }

  // Check if we have shop name or proper domain
  if (!process.env.SHOPIFY_SHOP_NAME && !process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN) {
    console.log('Shopify Admin API not configured - missing shop domain/name');
    throw new Error('Shopify Admin API not configured');
  }

  try {
    // Determine the correct shop domain for Admin API
    let shopDomain: string;
    
    if (process.env.SHOPIFY_SHOP_NAME) {
      // Use explicit shop name if provided (preferred method)
      shopDomain = `${process.env.SHOPIFY_SHOP_NAME}.myshopify.com`;
      console.log('Using explicit shop name:', process.env.SHOPIFY_SHOP_NAME);
    } else {
      // Use the store domain, but only if it's already .myshopify.com
      const storeDomain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
      
      if (storeDomain && storeDomain.includes('myshopify.com')) {
        shopDomain = storeDomain;
        console.log('Using myshopify domain:', storeDomain);
      } else {
        // Custom domain detected - we can't use it for Admin API
        console.error('Custom domain detected for Admin API:', storeDomain);
        console.error('Admin API requires .myshopify.com domain, not custom domain');
        throw new Error(`Admin API requires .myshopify.com domain. Custom domain "${storeDomain}" cannot be used. Please set SHOPIFY_SHOP_NAME environment variable with your actual shop name (without .myshopify.com)`);
      }
    }
    
    const adminApiUrl = `https://${shopDomain}/admin/api/2024-10/graphql.json`;
    
    console.log('Attempting to fetch from:', adminApiUrl);
    console.log('Using access token:', process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ? 'Present' : 'Missing');
    
    // Build query based on search type
    let queryString: string;
    if (searchType === 'email') {
      queryString = `email:${searchInput}`;
    } else {
      queryString = `name:${searchInput}`;
    }

    console.log('Searching with query:', queryString);

    const response = await fetch(adminApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
      },
      body: JSON.stringify({
        query: ORDERS_BY_EMAIL_QUERY,
        variables: {
          query: queryString,
          first: 10
        }
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response body:', errorText);
      throw new Error(`Shopify API error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    console.log('Shopify response:', JSON.stringify(data, null, 2));
    
    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    return data.data?.orders?.edges?.map((edge: any) => {
      const order = edge.node;
      
      // Collect all tracking info from active fulfillments only (exclude cancelled ones)
      const allTrackingInfo = order.fulfillments?.flatMap((fulfillment: any) => {
        // Skip cancelled fulfillments
        if (fulfillment.displayStatus === 'CANCELLED' || fulfillment.displayStatus === 'CANCELED') {
          console.log('Skipping cancelled fulfillment:', fulfillment.displayStatus);
          return [];
        }
        
        return fulfillment.trackingInfo?.map((track: any) => {
          // Extract courier from existing URL or use company field
          let courier = track.company || 'UNKNOWN';
          
          // If we have an EasyParcel URL, extract courier from it
          if (track.url && track.url.includes('easyparcel.com')) {
            const urlMatch = track.url.match(/courier=([^&]+)/);
            if (urlMatch) {
              courier = urlMatch[1];
            }
          }
          
          // Create EasyParcel tracking URL
          const easyParcelUrl = `https://app.easyparcel.com/my/en/track/details/?courier=${encodeURIComponent(courier)}&awb=${encodeURIComponent(track.number)}`;
          
          return {
            number: track.number,
            url: easyParcelUrl,
            courier: courier,
            originalUrl: track.url
          };
        }) || [];
      }) || [];
      
      // Get customer name
      const customerName = order.customer?.displayName || 
        (order.customer?.firstName && order.customer?.lastName 
          ? `${order.customer.firstName} ${order.customer.lastName}`.trim()
          : null);
      
      return {
        orderId: order.name,
        email: order.email,
        customerName: customerName,
        status: mapShopifyStatusToLocal(order.displayFulfillmentStatus, order.displayFinancialStatus),
        date: new Date(order.createdAt).toISOString().split('T')[0],
        trackingNumber: allTrackingInfo.length > 0 ? allTrackingInfo[0].number : null,
        trackingUrl: allTrackingInfo.length > 0 ? allTrackingInfo[0].url : null,
        allTrackingInfo: allTrackingInfo, // Include all tracking info
        totalAmount: order.totalPriceSet?.shopMoney?.amount || '0',
        currency: order.totalPriceSet?.shopMoney?.currencyCode || 'USD',
        items: order.lineItems.edges.map((item: any) => ({
          title: item.node.title,
          quantity: item.node.quantity
        }))
      };
    }) || [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error; // Re-throw to let the API route handle it
  }
}

function mapShopifyStatusToLocal(fulfillmentStatus: string, financialStatus: string): 'processing' | 'shipped' | 'delivered' | 'cancelled' {
  // Map Shopify statuses to our local status types
  // Convert to uppercase for consistent comparison since Shopify returns uppercase
  const fulfillment = fulfillmentStatus?.toUpperCase();
  const financial = financialStatus?.toUpperCase();
  
  // Check for cancelled/refunded orders first
  if (financial === 'REFUNDED' || financial === 'VOIDED' || financial === 'CANCELLED') {
    return 'cancelled';
  }
  
  // Check for cancelled fulfillments
  if (fulfillment === 'CANCELLED' || fulfillment === 'CANCELED') {
    return 'cancelled';
  }
  
  switch (fulfillment) {
    case 'FULFILLED':
      return 'shipped'; // Show fulfilled orders as shipped (green)
    case 'PARTIAL':
      return 'shipped';
    case 'UNFULFILLED':
      return 'processing';
    default:
      return 'processing';
  }
}

// Fallback/demo mode check
export function isShopifyConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN &&
    process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN &&
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN !== 'your-store.myshopify.com' &&
    process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN !== 'your_storefront_access_token_here'
  );
}

export function isShopifyAdminConfigured(): boolean {
  const hasBasicConfig = !!(
    process.env.SHOPIFY_ADMIN_ACCESS_TOKEN && 
    (process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_SHOP_NAME)
  );
  
  // Also check if we have proper domain format
  if (hasBasicConfig && process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN) {
    return process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN.includes('myshopify.com') || 
           !!process.env.SHOPIFY_SHOP_NAME;
  }
  
  return hasBasicConfig;
}

// Blog post interface for video products
export interface ShopifyBlogPost {
  id: string;
  handle: string;
  title: string;
  content: string;
  contentHtml: string;
  excerpt: string;
  publishedAt: string;
  tags: string[];
  seo?: {
    title?: string;
    description?: string;
  };
  image?: {
    url: string;
    altText?: string;
    width?: number;
    height?: number;
  };
}

// Video product interface
export interface VideoProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  vendor: string;
  price?: {
    amount: string;
    currencyCode: string;
  };
  videoUrls: string[];
  thumbnailUrl?: string;
  tags: string[];
  publishedAt: string;
}

// Blog posts query for video products - more flexible
export const BLOG_POSTS_QUERY = `
  query BlogPosts($first: Int!, $query: String) {
    blogs(first: 10) {
      edges {
        node {
          handle
          title
          articles(first: $first, query: $query) {
            edges {
              node {
                id
                handle
                title
                content
                contentHtml
                excerpt
                publishedAt
                tags
                seo {
                  title
                  description
                }
                image {
                  url
                  altText
                  width
                  height
                }
              }
            }
          }
        }
      }
    }
  }
`;

// Get video products from blog posts
export async function getVideoProducts(limit = 20): Promise<VideoProduct[]> {
  try {
    const { data } = await shopifyClient.request(BLOG_POSTS_QUERY, {
      variables: { first: limit },
    });

    if (!data.blogs?.edges) {
      console.log('No blogs found');
      return [];
    }

    const allArticles: any[] = [];
    
    // Collect articles from all blogs
    data.blogs.edges.forEach((blogEdge: any) => {
      const blog = blogEdge.node;
      if (blog.articles?.edges) {
        blog.articles.edges.forEach((articleEdge: any) => {
          const article = articleEdge.node;
          // Add blog handle to article for debugging
          article.blogHandle = blog.handle;
          allArticles.push(article);
        });
      }
    });

    if (allArticles.length === 0) {
      return [];
    }

    // Filter articles that have video content
    const videoArticles = allArticles.filter(article => {
      // Check if article has video URLs in content
      const videoRegex = /(https?:\/\/[^\s<>"]+\.(mp4|webm|mov|avi|mkv))/gi;
      const hasVideoInContent = article.content && videoRegex.test(article.content);
      
      // Check if article has video URLs in tags
      const hasVideoInTags = article.tags && article.tags.some((tag: string) => 
        tag.startsWith('video:')
      );
      
      return hasVideoInContent || hasVideoInTags;
    });

    if (videoArticles.length === 0) {
      return [];
    }

    return videoArticles.map((article) => {
      // Extract video URLs from content or tags
      const videoUrls: string[] = [];
      
      // Look for video URLs in content
      const videoRegex = /(https?:\/\/[^\s<>"]+\.(mp4|webm|mov|avi|mkv))/gi;
      const contentMatches = article.content.match(videoRegex);
      if (contentMatches) {
        videoUrls.push(...contentMatches);
      }
      
      // Look for video URLs in tags
      const videoTagUrls = article.tags
        .filter((tag: string) => tag.startsWith('video:'))
        .map((tag: string) => tag.replace('video:', ''))
        .filter(Boolean);
      
      if (videoTagUrls.length > 0) {
        videoUrls.push(...videoTagUrls);
      }
      

      
      // Extract price from content or tags
      let price: { amount: string; currencyCode: string } | undefined;
      
      // First try to find price in content (look for currency patterns)
      const priceRegex = /(\$|USD|EUR|GBP)\s*(\d+(?:\.\d{2})?)/gi;
      const contentPriceMatch = article.content.match(priceRegex);
      if (contentPriceMatch) {
        const priceText = contentPriceMatch[0];
        const amountMatch = priceText.match(/(\d+(?:\.\d{2})?)/);
        const currencyMatch = priceText.match(/(\$|USD|EUR|GBP)/i);
        if (amountMatch && currencyMatch) {
          const currency = currencyMatch[1] === '$' ? 'USD' : currencyMatch[1].toUpperCase();
          price = {
            amount: amountMatch[1],
            currencyCode: currency
          };
        }
      }
      
      // If no price in content, try tags
      if (!price) {
        const priceTag = article.tags.find((tag: string) => tag.startsWith('price:'));
        if (priceTag) {
          const priceMatch = priceTag.match(/price:(\d+(?:\.\d{2})?):([A-Z]{3})/);
          if (priceMatch) {
            price = {
              amount: priceMatch[1],
              currencyCode: priceMatch[2]
            };
          }
        }
      }
      
      // Extract vendor from content or tags
      let vendor = 'Unknown';
      
      // First try to find vendor in content (look for brand names)
      const vendorTag = article.tags.find((tag: string) => tag.startsWith('vendor:'));
      if (vendorTag) {
        vendor = vendorTag.replace('vendor:', '');
      } else {
        // Look for common brand indicators in content
        const brandIndicators = ['brand:', 'by ', 'from ', 'manufactured by'];
        for (const indicator of brandIndicators) {
          const brandMatch = article.content.match(new RegExp(`${indicator}\\s*([A-Za-z\\s]+)`, 'i'));
          if (brandMatch) {
            vendor = brandMatch[1].trim();
            break;
          }
        }
      }
      
      return {
        id: article.handle,
        handle: article.handle,
        title: article.title,
        description: article.excerpt || article.content.substring(0, 200) + '...',
        vendor,
        price,
        videoUrls,
        thumbnailUrl: article.image?.url,
        tags: article.tags,
        publishedAt: article.publishedAt,
      };
    });
  } catch (error) {
    console.error('Error fetching video products:', error);
    return [];
  }
}

// Get video product by handle
export async function getVideoProductByHandle(handle: string): Promise<VideoProduct | null> {
  try {
    const { data } = await shopifyClient.request(BLOG_POSTS_QUERY, {
      variables: { 
        first: 50, // Get more articles to search through
        query: `handle:${handle}` 
      },
    });

    if (!data.blogs?.edges) {
      console.log('No blogs found');
      return null;
    }

    // Search through all blogs for the specific article
    let targetArticle: any = null;
    
    data.blogs.edges.forEach((blogEdge: any) => {
      const blog = blogEdge.node;
      if (blog.articles?.edges) {
        const found = blog.articles.edges.find((articleEdge: any) => 
          articleEdge.node.handle === handle
        );
        if (found) {
          targetArticle = found.node;
          targetArticle.blogHandle = blog.handle;
        }
      }
    });

    if (!targetArticle) {
      console.log(`Article with handle '${handle}' not found in any blog`);
      return null;
    }


    
    // Extract video URLs from content or tags
    const videoUrls: string[] = [];
    
    // Look for video URLs in content
    const videoRegex = /(https?:\/\/[^\s<>"]+\.(mp4|webm|mov|avi|mkv))/gi;
    const contentMatches = targetArticle.content.match(videoRegex);
    if (contentMatches) {
      videoUrls.push(...contentMatches);
    }
    
    // Look for video URLs in tags
    const videoTagUrls = targetArticle.tags
      .filter((tag: string) => tag.startsWith('video:'))
      .map((tag: string) => tag.replace('video:', ''))
      .filter(Boolean);
    
    if (videoTagUrls.length > 0) {
      videoUrls.push(...videoTagUrls);
    }
    

    
    // Extract price from content or tags
    let price: { amount: string; currencyCode: string } | undefined;
    
    // First try to find price in content
    const priceRegex = /(\$|USD|EUR|GBP)\s*(\d+(?:\.\d{2})?)/gi;
    const contentPriceMatch = targetArticle.content.match(priceRegex);
    if (contentPriceMatch) {
      const priceText = contentPriceMatch[0];
      const amountMatch = priceText.match(/(\d+(?:\.\d{2})?)/);
      const currencyMatch = priceText.match(/(\$|USD|EUR|GBP)/i);
      if (amountMatch && currencyMatch) {
        const currency = currencyMatch[1] === '$' ? 'USD' : currencyMatch[1].toUpperCase();
        price = {
          amount: amountMatch[1],
          currencyCode: currency
        };
      }
    }
    
    // If no price in content, try tags
    if (!price) {
      const priceTag = targetArticle.tags.find((tag: string) => tag.startsWith('price:'));
      if (priceTag) {
        const priceMatch = priceTag.match(/price:(\d+(?:\.\d{2})?):([A-Z]{3})/);
        if (priceMatch) {
          price = {
            amount: priceMatch[1],
            currencyCode: priceMatch[2]
          };
        }
      }
    }
    
    // Extract vendor from content or tags
    let vendor = 'Unknown';
    
    const vendorTag = targetArticle.tags.find((tag: string) => tag.startsWith('vendor:'));
    if (vendorTag) {
      vendor = vendorTag.replace('vendor:', '');
    } else {
      // Look for common brand indicators in content
      const brandIndicators = ['brand:', 'by ', 'from ', 'manufactured by'];
      for (const indicator of brandIndicators) {
        const brandMatch = targetArticle.content.match(new RegExp(`${indicator}\\s*([A-Za-z\\s]+)`, 'i'));
        if (brandMatch) {
          vendor = brandMatch[1].trim();
          break;
        }
      }
    }
    
    return {
      id: targetArticle.handle,
      handle: targetArticle.handle,
      title: targetArticle.title,
      description: targetArticle.excerpt || targetArticle.content.substring(0, 200) + '...',
      vendor,
      price,
      videoUrls,
      thumbnailUrl: targetArticle.image?.url,
      tags: targetArticle.tags,
      publishedAt: targetArticle.publishedAt,
    };
  } catch (error) {
    console.error('Error fetching video product:', error);
    return null;
  }
}