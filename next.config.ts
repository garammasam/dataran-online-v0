import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '6gy9systudbmcbju.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
        search: '',
      },
      // Shopify CDN domains for product images
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        port: '',
        pathname: '/**',
      },
      // Wix static media CDN
      {
        protocol: 'https',
        hostname: 'static.wixstatic.com',
        port: '',
        pathname: '/**',
      },
      // Add specific myshopify.com subdomain patterns
      {
        protocol: 'https',
        hostname: '**.myshopify.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year cache
    dangerouslyAllowSVG: false,
    // Configure allowed quality values for Next.js 16 compatibility
    qualities: [25, 50, 65, 75, 90, 100],
  },
  experimental: {
    inlineCss: true,
    optimizePackageImports: ['lucide-react'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  poweredByHeader: false,
  compress: true,
};

export default withBundleAnalyzer(nextConfig);
