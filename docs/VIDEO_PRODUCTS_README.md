# Video Products System

This system allows you to create video products using Shopify blog posts, which will appear alongside regular products on your homepage and integrate with the existing vendor sorting system.

## How It Works

1. **Video products are fetched from Shopify blog posts** in a blog called "video-products"
2. **Video URLs are extracted from blog content or tags** and converted to product listings
3. **Products are integrated with existing vendor sorting** and product display systems
4. **Video products show a blue indicator** in the vendor sort to distinguish them

## Setting Up Video Products in Shopify

### 1. Create a Blog
- In your Shopify admin, go to **Online Store > Blog posts**
- Create a new blog called **"video-products"** (exact name required)

### 2. Create Blog Posts for Video Products
Each blog post represents a video product. Use these tag formats:

#### Required Tags:
- `vendor:BrandName` - Sets the vendor/brand for the product
- `video:https://example.com/video.mp4` - Video URL (can have multiple)

#### Optional Tags:
- `price:29.99:USD` - Sets the product price (format: amount:currency)
- `demo` - Any additional tags for categorization

#### Example Blog Post:
```
Title: "Amazing Product Video"
Content: "This is a great product with amazing features..."

Tags:
- vendor:MyBrand
- video:https://example.com/video1.mp4
- video:https://example.com/video2.mp4
- price:29.99:USD
- featured
```

### 3. Video Format Support
Supported video formats:
- MP4
- WebM
- MOV
- AVI
- MKV

## Features

### Video Player
- **Play/Pause controls** with hover overlay
- **Mute/Unmute toggle**
- **Multiple video support** with navigation arrows
- **Auto-advance** between videos
- **Progress bar** during playback
- **Mobile-friendly** touch controls

### Product Integration
- **Appears in homepage grid** alongside regular products
- **Clickable for PDP view** with full video player
- **Vendor sorting** works the same as regular products
- **Blue indicator** shows which vendors have video products
- **Add to cart** functionality (if price is set)

### Vendor Sorting
- **Blue dots** indicate vendors with video products
- **Same sorting behavior** as regular products
- **Visual distinction** between video and regular product vendors

## Technical Details

### Component: `VideoProduct`
- Located in `components/video-product.tsx`
- Handles video playback, controls, and navigation
- Integrates with Framer Motion for animations
- Responsive design for mobile and desktop

### API Integration
- **Shopify GraphQL** queries blog posts
- **Automatic video URL extraction** from content and tags
- **Fallback to static products** if Shopify is unavailable
- **Error handling** for failed video loads

### Data Flow
1. `getAllProducts()` fetches both regular and video products
2. Video products are converted to standard `Product` interface
3. `isVideoProduct` flag determines which component to render
4. Video URLs are stored in `tags` array for component access

## Example Usage

### Creating a Video Product
```typescript
// In Shopify blog post
{
  title: "Product Name",
  content: "Product description...",
  tags: [
    "vendor:BrandName",
    "video:https://example.com/video.mp4",
    "price:29.99:USD"
  ]
}
```

### Adding Multiple Videos
```typescript
// Multiple video URLs in tags
tags: [
  "vendor:BrandName",
  "video:https://example.com/video1.mp4",
  "video:https://example.com/video2.mp4",
  "video:https://example.com/video3.mp4"
]
```

## Troubleshooting

### Video Not Playing
- Check video URL is accessible
- Ensure video format is supported
- Check browser console for errors
- Verify video file size isn't too large

### Product Not Appearing
- Verify blog name is exactly "video-products"
- Check tags are properly formatted
- Ensure Shopify API is configured
- Check console for API errors

### Vendor Sorting Issues
- Verify `vendor:` tag is set correctly
- Check that products have valid vendor names
- Ensure `getAllProducts()` is working

## Future Enhancements

- **Video thumbnails** generation
- **Video compression** and optimization
- **Analytics** for video engagement
- **A/B testing** for video vs image products
- **Bulk import** from video hosting platforms
- **Video categories** and filtering
