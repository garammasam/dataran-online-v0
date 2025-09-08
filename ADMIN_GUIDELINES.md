# Shopify Admin Guidelines for Dataran Online

This guide provides comprehensive instructions for managing the Dataran Online website through the Shopify Admin dashboard. The website integrates Shopify products, video products from blog posts, and Wix events to create a unified shopping experience.

## Table of Contents

1. [Product Management](#product-management)
2. [Image Requirements](#image-requirements)
3. [Collections & Tags System](#collections--tags-system)
4. [Video Products via Blog Posts](#video-products-via-blog-posts)
5. [Vendor Management](#vendor-management)
6. [Product Prioritization](#product-prioritization)
7. [SEO & Copywriting](#seo--copywriting)
8. [Event Management (Wix Integration)](#event-management-wix-integration)
9. [Troubleshooting](#troubleshooting)

---

## Product Management

### Creating Products

1. **Navigate to Products** in Shopify Admin
2. **Click "Add product"**
3. **Fill in required fields:**
   - **Title**: Product name (appears in grid view)
   - **Description**: Detailed product description (appears in expanded view)
   - **Vendor**: Brand/manufacturer name (used for filtering)
   - **Product Type**: Category classification
   - **Price**: Base price for the product

### Product Variants

- **Create variants** for different sizes, colors, or options
- **Set individual prices** for each variant if needed
- **Upload variant-specific images** for better product presentation
- **Set inventory quantities** for each variant

### Product Status

- **Published**: Product appears on website
- **Draft**: Product hidden from customers
- **Archived**: Product removed from website

---

## Image Requirements

### Primary Product Images

**Aspect Ratio**: 4:5 (Portrait orientation)
- **Recommended Size**: 800x1000px minimum
- **Maximum Size**: 2000x2500px
- **Format**: JPG or PNG
- **File Size**: Under 2MB per image

**Why 4:5?**
- The website uses a consistent 4:5 aspect ratio for all product grid items
- Images are automatically cropped to fit this ratio
- Ensures uniform grid layout across all products

### Image Gallery

**Multiple Images Support:**
- Upload up to 10 images per product
- First image becomes the featured image
- Additional images appear in the product detail slider
- Each image should follow the 4:5 aspect ratio

### Image Optimization

**Best Practices:**
- Use high-quality, well-lit product photos
- Ensure products fill most of the frame
- Use consistent lighting across all product images
- Include different angles (front, back, side, detail shots)
- Consider lifestyle shots for better engagement

**Technical Requirements:**
- Images are automatically optimized by Next.js
- Different sizes are generated for different screen sizes
- Lazy loading is implemented for performance

---

## Collections & Tags System

### Collections

**Purpose**: Group related products for filtering and organization

**Creating Collections:**
1. Go to **Products > Collections**
2. Click **"Create collection"**
3. Set collection title and description
4. Choose manual or automatic collection rules

**Collection Usage:**
- Products can belong to multiple collections
- Collections appear in the vendor filter dropdown
- Used for organizing products by category, season, or theme

### Tags System

**Priority Tags:**
- `priority:1` - Featured product
- `priority:2` - New arrivals
- `priority:3` - Regular products
- `priority:999` - Sale items

**Vendor Tags:**
- `vendor:BrandName` - Sets the vendor/brand
- Used for filtering and organization
- Appears in the vendor dropdown

**Category Tags:**
- Use collaborator or descriptive tags for categorization
- Examples: `gard`, `53`, `accessories`, `sale`
- Helps with internal organization

**Special Tags:**
- `featured` - Highlight important products
- `new` - Mark new arrivals
- `sale` - Indicate discounted items

---

## Video Products via Blog Posts

### Setting Up Video Products

**Create a Blog:**
1. Go to **Online Store > Blog posts**
2. Create a new blog called **"video-products"** (exact name required)
3. This blog will contain video product entries

### Creating Video Product Blog Posts

**Required Tags:**
- `vendor:BrandName` - Sets the vendor/brand
- `video:https://example.com/video.mp4` - Video URL (can have multiple)

**Optional Tags:**
- `price:29.99:USD` - Sets the product price (format: amount:currency)
- `featured` - Any additional categorization tags

**Example Blog Post:**
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

### Video Format Support

**Supported Formats:**
- MP4 (recommended)
- WebM
- MOV
- AVI
- MKV

**Video Requirements:**
- **Aspect Ratio**: 4:5 (same as product images)
- **Resolution**: 720p minimum, 1080p recommended
- **File Size**: Under 50MB per video
- **Duration**: 10-60 seconds recommended
- **Hosting**: Use reliable video hosting (YouTube, Vimeo, or direct hosting)

### Video Product Features

**Player Controls:**
- Play/Pause on click
- Mute/Unmute toggle
- Multiple video support with navigation
- Auto-advance between videos
- Mobile-friendly touch controls

**Integration:**
- Appears in homepage grid alongside regular products
- Clickable for detailed view with full video player
- Works with vendor sorting system
- Blue indicator shows which vendors have video products

---

## Vendor Management

### Setting Up Vendors

**Vendor Field:**
- Set in the **Vendor** field of each product
- Used for filtering and organization
- Appears in the vendor dropdown on the website

**Vendor Naming:**
- Use consistent naming (e.g., "Nike", not "nike" or "NIKE")
- Avoid special characters or spaces
- Keep names concise and recognizable

### Vendor Filtering

**How it Works:**
- Products are grouped by vendor
- Users can filter by specific vendors
- Blue dots indicate vendors with video products
- Vendors are sorted alphabetically

**Best Practices:**
- Use the same vendor name across all products from that brand
- Consider using vendor codes for internal organization
- Keep vendor names customer-friendly

---

## Product Prioritization

### Priority System

**How Priorities Work:**
- Lower numbers = higher priority
- Products with `priority:1` appear first
- Products without priority tags get `priority:999` (lowest)
- Within same priority, newest products appear first

**Setting Priorities:**
1. Edit a product in Shopify
2. Add a tag: `priority:1` (or 2, 3, etc.)
3. Save the product
4. Priority takes effect immediately

**Priority Examples:**
- `priority:1` - Featured products, bestsellers
- `priority:2` - New arrivals, seasonal items
- `priority:3` - Regular products
- `priority:999` - Clearance, discontinued items

---

## SEO & Copywriting

### Product Titles

**Best Practices:**
- Keep titles concise but descriptive
- Include key product features
- Use relevant keywords
- Avoid excessive capitalization
- Make titles search-friendly

**Examples:**
- ✅ "Wireless Bluetooth Headphones - Noise Cancelling"
- ❌ "AMAZING WIRELESS BLUETOOTH HEADPHONES!!! BEST QUALITY!!!"

### Product Descriptions

**Structure:**
- Start with key benefits
- Include technical specifications
- Mention unique selling points
- Use bullet points for features
- Include care instructions if relevant

**Length:**
- Minimum: 50 words
- Recommended: 100-300 words
- Maximum: 500 words (for readability)

### Alt Text for Images

**Purpose**: Improves accessibility and SEO

**Best Practices:**
- Describe what's in the image
- Include product name and key features
- Keep descriptions concise
- Avoid keyword stuffing

**Examples:**
- ✅ "Red Nike Air Max running shoes, side view"
- ❌ "shoes"

---

## Event Management (Wix Integration)

### Wix Events Setup

**Required Environment Variables:**
- `NEXT_PUBLIC_WIX_CLIENT_ID`
- `NEXT_PUBLIC_WIX_ACCOUNT_ID`
- `NEXT_PUBLIC_WIX_SITE_ID`
- `NEXT_PUBLIC_WIX_SITE_URL`

### Event Requirements

**Image Specifications:**
- **Aspect Ratio**: 4:5 (same as products)
- **Resolution**: 800x1000px minimum
- **Format**: JPG or PNG
- **File Size**: Under 2MB

**Event Information:**
- **Title**: Clear, descriptive event name
- **Description**: Detailed event information
- **Date/Time**: Start and end times
- **Location**: Venue name and address
- **Tickets**: Pricing and availability

### Event Display

**Grid View:**
- Events appear in a separate grid
- Same 4:5 aspect ratio as products
- Clickable for detailed view
- Shows event date and location

**Event Details:**
- Full event information
- Ticket purchasing options
- Location details
- Contact information

---

## Troubleshooting

### Products Not Appearing

**Check:**
1. Product is published (not draft)
2. Product has required fields filled
3. Images are uploaded and accessible
4. Shopify API is properly configured
5. Check browser console for errors

### Images Not Displaying

**Check:**
1. Image aspect ratio is close to 4:5
2. Image file size is under 2MB
3. Image format is JPG or PNG
4. Image URL is accessible
5. Check for broken image links

### Video Products Not Working

**Check:**
1. Blog name is exactly "video-products"
2. Tags are properly formatted
3. Video URLs are accessible
4. Video format is supported
5. Check console for API errors

### Vendor Filtering Issues

**Check:**
1. Vendor field is filled consistently
2. No extra spaces in vendor names
3. Vendor names match exactly
4. Products are published
5. Check for typos in vendor names

### Performance Issues

**Optimization Tips:**
1. Compress images before uploading
2. Use appropriate image sizes
3. Limit number of product variants
4. Keep video files under 50MB
5. Use efficient video formats (MP4)

---

## Best Practices Summary

### Product Management
- Use consistent naming conventions
- Set appropriate priorities
- Include detailed descriptions
- Upload multiple high-quality images
- Organize with collections and tags

### Image Management
- Always use 4:5 aspect ratio
- Compress images before uploading
- Include multiple angles
- Use descriptive alt text
- Maintain consistent lighting

### Video Products
- Use the "video-products" blog
- Follow tag formatting exactly
- Host videos reliably
- Keep videos under 50MB
- Use 4:5 aspect ratio

### SEO & Content
- Write descriptive titles
- Include relevant keywords
- Use proper alt text
- Keep descriptions concise
- Update content regularly

### Organization
- Use collections for grouping
- Apply consistent tagging
- Set appropriate priorities
- Maintain vendor consistency
- Regular content audits

---

## Support

For technical issues or questions about the website functionality, contact the development team with:
- Specific error messages
- Steps to reproduce the issue
- Screenshots if applicable
- Browser and device information

For Shopify-specific issues, refer to Shopify's documentation or contact Shopify support.

---

*Last updated: [Current Date]*
*Version: 1.0*
