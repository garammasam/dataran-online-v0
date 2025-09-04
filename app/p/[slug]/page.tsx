import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { getProductById } from '@/lib/products';
import { generateProductMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const slug = (await params).slug;
  const product = await getProductById(slug);
  
  if (!product) {
    return {
      title: 'Product Not Found | dataran.online',
      description: 'The requested product could not be found.',
    };
  }

  return generateProductMetadata(product);
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  
  // Get product to create beautiful URL
  const product = await getProductById(slug);
  if (product) {
    const vendor = product.vendor ? product.vendor.toLowerCase().replace(/\s+/g, '-') : 'shop';
    const handle = product.handle || product.id;
    redirect(`/${vendor}/${handle}`);
  } else {
    // Fallback to main page if product not found
    redirect('/');
  }
}