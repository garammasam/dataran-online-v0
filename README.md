### Dataran Online

A modern e‑commerce/events web app built with Next.js 15, React 19, and Tailwind CSS. Integrates Shopify Storefront API for products and Wix Events for event listings and checkout flows. Optimized for performance, SEO, and deployment on Vercel.

## Tech stack
- **Framework**: Next.js 15 (App Router), React 19
- **Styling**: Tailwind CSS (with `tailwindcss-animate`), custom CSS vars
- **UI**: Radix UI primitives, `lucide-react`
- **Commerce**: Shopify Storefront API client
- **Events**: Wix SDK (`@wix/events`, `@wix/stores`)
- **Build/Analyze**: `@next/bundle-analyzer`

## Features
- **Product + PDP**: `app/p/[slug]` with `components/product-image`, `variant-picker`, `add-to-cart`
- **Cart + Checkout**: `components/cart`, API routes under `app/api/cart/*`
- **Events**: `app/events`, dynamic event pages, filtering/sorting components
- **SEO**: `lib/seo`, `components/json-ld`, `robots.ts`, `sitemap.ts`
- **Performance**: `lib/performance*`, `components/performance-optimizer`
- **Middleware**: vendor/handle rewrite to `/` for clean, shareable URLs

## Routes
- **Pages**: `/`, `/about`, `/contact`, `/help`, `/privacy`, `/terms`, `/tracking`
- **Products**: `/p/[slug]`
- **Events**: `/events`, `/events/[id]`
- **Checkout**: `/checkout`, `/checkout/success`
- **API**:
  - `GET /api/products`
  - `POST /api/orders`
  - `GET /api/cart/inventory`
  - `POST /api/cart/checkout`

## Configuration
- **Images**: Remote patterns enabled for Shopify CDN, Wix static media, and `*.myshopify.com`
- **Experimental**: `inlineCss`, `optimizePackageImports: ['lucide-react']`
- **Production**: `compiler.removeConsole`, compression, no `x-powered-by`

## Environment variables (expected)
Set these in `.env.local` (names may vary based on your implementation):
- `SHOPIFY_STORE_DOMAIN` (e.g. `your-store.myshopify.com`)
- `SHOPIFY_STOREFRONT_API_TOKEN`
- `WIX_API_KEY` or OAuth credentials for Wix SDK usage
- Any additional keys referenced by `lib/shopify.ts` and `lib/wix-events.ts`

## Scripts
- `pnpm dev` / `npm run dev`: start dev server
- `pnpm build` / `npm run build`: production build
- `pnpm start` / `npm run start`: run production server
- Optional: `ANALYZE=true pnpm build` to enable bundle analyzer

## Development
1. Install deps: `pnpm i` (or `npm i`)
2. Create `.env.local` with required keys
3. Run: `pnpm dev`
4. Visit `http://localhost:3000`

## Deployment
- Target: **Vercel** (`vercel.json` present; uses standard `npm run build`/`npm install`)
- Ensure env vars and image domains are configured in the hosting environment

## Notable directories
- `app/`: App Router pages, layouts, API routes
- `components/`: UI and feature components (cart, product, events, SEO)
- `lib/`: API clients, performance, SEO, utils, styles
- `public/`: static assets (including `sw.js`)

## Notes
- Middleware rewrites two‑segment paths (excluding `api`, assets) to `/`
- Tailwind configured with extended theme tokens via CSS custom properties