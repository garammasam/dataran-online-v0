import './globals.css';
import { GeistMono } from 'geist/font/mono';
import { Metadata, Viewport } from 'next';
import { CartProvider } from '@/components/cart-context';
import { JsonLd } from '@/components/json-ld';
import { generateWebsiteJsonLd, generateOrganizationJsonLd } from '@/lib/seo';
import { PerformanceOptimizer } from '@/components/performance-optimizer';
import { PageErrorBoundary } from '@/components/ui/error-boundary';
import { VIEWPORT_CONFIG } from '@/lib/viewport';
import { ViewportHandler } from '@/components/viewport-handler';


export const metadata: Metadata = {
  title: 'dataran.online',
  description: 'Shop merchandise and book event tickets online. Discover limited-edition products and secure your seats for upcoming events.',
  keywords: 'tickets, merchandise, events, online shopping, limited edition, booking, ecommerce',
  authors: [{ name: 'dataran.online' }],
  creator: 'dataran.online',
  publisher: 'dataran.online',
  robots: 'index, follow',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://dataran.online'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    title: 'dataran.online',
    description: 'Shop merchandise and book event tickets online. Discover limited-edition products and secure your seats for upcoming events.',
    url: '/',
    siteName: 'dataran.online',
    images: [
      {
        url: '/opengraph-image.jpg',
        width: 1200,
        height: 630,
        alt: 'dataran.online',
      },
    ],
    locale: 'en_MY',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'dataran.online',
    description: 'Shop merchandise and book event tickets online. Discover limited-edition products and secure your seats for upcoming events.',
    images: ['/opengraph-image.jpg'],
    creator: '@dataranonline',
    site: '@dataranonline',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
    shortcut: '/favicon.ico',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport: Viewport = VIEWPORT_CONFIG.meta;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preload critical resources */}
        <link 
          rel="preload" 
          href="https://6gy9systudbmcbju.public.blob.vercel-storage.com/ts-white-P2VTrySg3IQ4gdu17JGSrQ8RdLDgTm.png" 
          as="image" 
        />
        <link rel="preconnect" href="https://6gy9systudbmcbju.public.blob.vercel-storage.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.shopify.com" crossOrigin="anonymous" />
        <link 
          rel="dns-prefetch" 
          href="//6gy9systudbmcbju.public.blob.vercel-storage.com" 
        />
        <link 
          rel="dns-prefetch" 
          href="//cdn.shopify.com" 
        />
      </head>
      <body className={`${GeistMono.className} antialiased`} suppressHydrationWarning>
        <ViewportHandler />
        <PerformanceOptimizer />
        <JsonLd data={generateWebsiteJsonLd()} />
        <JsonLd data={generateOrganizationJsonLd()} />
        <PageErrorBoundary>
          <CartProvider>
            <div className="flex flex-col min-h-[100dvh] h-[100dvh] px-4 sm:px-6 lg:px-8 overflow-y-auto">
              {children}
            </div>
          </CartProvider>
        </PageErrorBoundary>
      </body>
    </html>
  );
}