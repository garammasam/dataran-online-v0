import { Metadata } from 'next';
import { Product } from './products';

interface SEOConfig {
  siteName: string;
  siteUrl: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultImage: string;
  twitterHandle?: string;
  facebookAppId?: string;
}

export const seoConfig: SEOConfig = {
  siteName: 'dataran.online',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://dataran.online',
  defaultTitle: 'dataran.online - Tickets & Merchandise',
  defaultDescription: 'Shop merchandise and book event tickets online. Discover limited-edition products and secure your seats for upcoming events.',
  defaultImage: '/opengraph-image.jpg',
  twitterHandle: '@dataranonline',
};

export function generatePageMetadata({
  title,
  description,
  path = '',
  image,
  type = 'website',
  noIndex = false,
}: {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
}): Metadata {
  const pageTitle = title ? `${title} | ${seoConfig.siteName}` : seoConfig.defaultTitle;
  const pageDescription = description || seoConfig.defaultDescription;
  const pageImage = image || seoConfig.defaultImage;
  const pageUrl = `${seoConfig.siteUrl}${path}`;

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: [
      'tickets',
      'merchandise',
      'events',
      'limited edition',
      'online shopping',
      'booking',
      'ecommerce'
    ].join(', '),
    authors: [{ name: seoConfig.siteName }],
    creator: seoConfig.siteName,
    publisher: seoConfig.siteName,
    robots: noIndex ? 'noindex, nofollow' : 'index, follow',
    metadataBase: new URL(seoConfig.siteUrl),
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type,
      title: pageTitle,
      description: pageDescription,
      url: pageUrl,
      siteName: seoConfig.siteName,
      images: [
        {
          url: pageImage,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
      locale: 'en_MY',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: [pageImage],
      creator: seoConfig.twitterHandle,
      site: seoConfig.twitterHandle,
    },
  };
}

export function generateProductMetadata(product: Product): Metadata {
  const productTitle = product.title || product.name;
  const productDescription = product.description || `${productTitle} - Available now on dataran.online`;
  const productImage = product.image || product.images?.[0]?.url;
  const productUrl = `/p/${product.handle || product.id}`;

  return generatePageMetadata({
    title: productTitle,
    description: productDescription,
    path: productUrl,
    image: productImage,
    type: 'article',
  });
}

export function generateProductJsonLd(product: Product) {
  const productTitle = product.title || product.name;
  const productDescription = product.description || `${productTitle} - Available now on dataran.online`;
  const productImage = product.image || product.images?.[0]?.url;
  const productUrl = `${seoConfig.siteUrl}/p/${product.handle || product.id}`;
  
  const price = product.price?.amount || product.priceRange?.minVariantPrice?.amount;
  const currency = product.price?.currencyCode || product.priceRange?.minVariantPrice?.currencyCode || 'MYR';

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productTitle,
    description: productDescription,
    image: productImage ? [productImage] : [],
    url: productUrl,
    brand: {
      '@type': 'Brand',
      name: product.vendor || 'dataran.online',
    },
    manufacturer: {
      '@type': 'Organization',
      name: product.vendor || 'dataran.online',
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: currency,
      price: price ? parseFloat(price) : undefined,
      availability: product.availableForSale !== false 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'dataran.online',
        url: seoConfig.siteUrl,
      },
    },
    category: product.collections?.[0]?.title || 'Merchandise',
    sku: product.id,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.5',
      reviewCount: '12',
      bestRating: '5',
      worstRating: '1',
    },
  };
}

export function generateEventJsonLd(event: {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: {
    name?: string;
    address?: string;
  };
  ticketTypes?: Array<{
    name: string;
    price: number;
    currency: string;
  }>;
  imageUrl?: string;
  eventPageUrl?: string;
}) {
  const eventUrl = event.eventPageUrl || `${seoConfig.siteUrl}/events/${event.id}`;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description || `Join us for ${event.title}`,
    startDate: event.startDate,
    endDate: event.endDate || event.startDate,
    url: eventUrl,
    image: event.imageUrl ? [event.imageUrl] : [],
    location: event.location ? {
      '@type': 'Place',
      name: event.location.name || 'TBA',
      address: {
        '@type': 'PostalAddress',
        streetAddress: event.location.address || 'TBA',
        addressCountry: 'MY',
      },
    } : undefined,
    organizer: {
      '@type': 'Organization',
      name: 'dataran.online',
      url: seoConfig.siteUrl,
    },
    offers: event.ticketTypes?.map(ticket => ({
      '@type': 'Offer',
      name: ticket.name,
      price: ticket.price,
      priceCurrency: ticket.currency,
      availability: 'https://schema.org/InStock',
      url: eventUrl,
      seller: {
        '@type': 'Organization',
        name: 'dataran.online',
      },
    })) || [],
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  };
}

export function generateWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: seoConfig.siteName,
    url: seoConfig.siteUrl,
    description: seoConfig.defaultDescription,
    publisher: {
      '@type': 'Organization',
      name: seoConfig.siteName,
      url: seoConfig.siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${seoConfig.siteUrl}/logo.png`,
      },
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${seoConfig.siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function generateOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: seoConfig.siteName,
    url: seoConfig.siteUrl,
    logo: `${seoConfig.siteUrl}/logo.png`,
    description: seoConfig.defaultDescription,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'MY',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      url: `${seoConfig.siteUrl}/contact`,
    },
    sameAs: [
      // Add social media URLs here
    ],
  };
}