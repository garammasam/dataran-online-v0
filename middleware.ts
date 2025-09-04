import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Prevent infinite loops - don't rewrite if already at root
  if (pathname === '/') {
    return NextResponse.next();
  }

  // Handle vendor/handle URLs by rewriting them to the main page
  const pathSegments = pathname.split('/').filter(segment => segment !== '');
  
  // If we have exactly 2 segments (vendor/handle), rewrite to main page
  if (pathSegments.length === 2 && 
      !pathSegments[0].startsWith('_') && 
      !pathSegments[0].includes('.') &&
      pathSegments[0] !== 'api' &&
      pathSegments[0] !== 'icon.svg') {
    
    // Rewrite to main page, keeping the original URL in the browser
    url.pathname = '/';
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|icon.svg|^$).*)',
  ],
};