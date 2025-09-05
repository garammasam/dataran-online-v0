// Wix Events API integration utilities
// Documentation: https://dev.wix.com/docs/rest/business-solutions/events/
//
// Required Environment Variables:
// - NEXT_PUBLIC_WIX_CLIENT_ID: Your Wix app client ID
// - NEXT_PUBLIC_WIX_ACCOUNT_ID: Your Wix account ID (required for account-level API access)
// - NEXT_PUBLIC_WIX_SITE_ID: Your Wix site ID (optional, for some APIs)
// - NEXT_PUBLIC_WIX_SITE_URL: Your Wix site URL (for event page links)
//
// Required Wix App Permissions for Real Attendee Counts:
// To access Event Guests API, your Wix app needs one of these permissions:
// - "Read Event Tickets and Guest List" (minimum required)
// - "Manage Guest List" 
// - "Read Events - all read permissions"
// - "Manage Events - all permissions"
//
// Setup Instructions:
// 1. Go to your Wix Developers dashboard
// 2. Select your app
// 3. Go to App Settings > Permissions
// 4. Add one of the permissions listed above
// 5. Use app-level authentication (not visitor tokens)

import { createClient, OAuthStrategy } from '@wix/sdk';
import { wixEventsV2 } from '@wix/events';

interface WixEventLocation {
  name?: string;
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface WixTicketDefinition {
  id: string;
  name: string;
  description?: string;
  price: {
    amount: number;
    currency: string;
  };
  limitPerCheckout?: number;
  available: boolean;
  inventory?: {
    quantity: number;
    unlimited: boolean;
  };
}

interface WixEvent {
  id: string;
  title: string;
  description?: string;
  slug?: string;
  eventPageUrl?: string;
  scheduling: {
    startDate: string;
    endDate?: string;
    timeZone?: string;
  };
  location?: WixEventLocation;
  status: 'PUBLISHED' | 'DRAFT' | 'CANCELED' | 'ENDED';
  registration: {
    status: 'OPEN_TICKETS' | 'CLOSED_MANUALLY' | 'CLOSED_AUTOMATICALLY' | 'OPEN_EXTERNAL';
    ticketDefinitions?: WixTicketDefinition[];
    external?: {
      registration: string;
      checkoutUrl: string;
    };
  };
  mainImage?: string;
  gallery?: string[];
  created: string;
  updated: string;
}

interface WixEventListResponse {
  events: WixEvent[];
  totalCount: number;
  hasNext: boolean;
}

interface WixCreateOrderRequest {
  eventId: string;
  checkoutForm: {
    firstName: string;
    lastName: string;
    email: string;
  };
  ticketQuantities: Array<{
    ticketDefinitionId: string;
    quantity: number;
  }>;
  paymentMethod?: 'OFFLINE' | 'ONLINE';
}

interface WixOrderResponse {
  orderId: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELED';
  totalPrice: {
    amount: number;
    currency: string;
  };
  checkoutUrl?: string;
  tickets?: Array<{
    id: string;
    ticketDefinitionId: string;
    attendeeForm?: {
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
}

// Initialize Wix client for headless visitor sessions
export function createWixClient() {
  return createClient({
    modules: { events: wixEventsV2 },
    auth: OAuthStrategy({
      clientId: process.env.NEXT_PUBLIC_WIX_CLIENT_ID!,
      tokens: {
        accessToken: {
          value: '',
          expiresAt: 0
        },
        refreshToken: {
          value: '',
          role: 'visitor' as any
        }
      }
    })
  });
}

// Create client with visitor session tokens (for authenticated actions)
export function createWixClientWithTokens(accessToken: string, refreshToken: string) {
  return createClient({
    modules: { events: wixEventsV2 },
    auth: OAuthStrategy({
      clientId: process.env.NEXT_PUBLIC_WIX_CLIENT_ID!,
      tokens: {
        accessToken: {
          value: accessToken,
          expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour from now
        },
        refreshToken: {
          value: refreshToken,
          role: 'visitor' as any
        }
      }
    })
  });
}

class WixEventsService {
  private client: ReturnType<typeof createWixClient>;

  constructor() {
    this.client = createWixClient();
  }

  /**
   * List events using Events V3 API
   * Reference: https://dev.wix.com/docs/rest/business-solutions/events/events-v3/
   */
  async listEvents(options: {
    limit?: number;
    offset?: number;
    status?: string[];
    startDate?: Date;
    endDate?: Date;
  } = {}) {
    try {
      console.log('Attempting to fetch events from Wix...');
      
      // Using the Events V3 query approach
      let query = this.client.events.queryEvents();
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.skip(options.offset);
      }

      // Add status filter if provided
      if (options.status && options.status.length > 0) {
        query = query.in('status', options.status);
      }

      // Add date filters if provided
      if (options.startDate) {
        query = query.ge('dateAndTimeSettings.startDate', options.startDate.toISOString());
      }
      
      if (options.endDate) {
        query = query.le('dateAndTimeSettings.endDate', options.endDate.toISOString());
      }

      const response = await query.find();
      
      console.log('Wix Events response:', {
        itemsCount: response.items?.length || 0,
        totalCount: response.totalCount || 0,
        hasNext: response.hasNext() || false
      });
      
      return {
        events: response.items || [],
        totalCount: response.totalCount || 0,
        hasNext: response.hasNext() || false
      };
    } catch (error) {
      console.error('Error fetching events from Wix:', error);
      throw error;
    }
  }

  /**
   * Get a specific event by ID using Events V3 API
   */
  async getEvent(eventId: string) {
    try {
      const response = await this.client.events.getEvent(eventId);
      return response;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  }

  /**
   * Get attendee count for an event using totalGuests from Event Guests API
   * Reference: https://dev.wix.com/docs/rest/business-solutions/events/event-guests/query-event-guests
   */
  async getEventAttendeeCount(eventId: string): Promise<number> {
    try {
      console.log(`Fetching real attendee count for event ${eventId}`);
      
      // Use the correct Event Guests V2 API endpoint
      const authHeaders = await this.client.auth.getAuthHeaders();
      
      if (!authHeaders || !authHeaders.headers) {
        console.warn('No authorization headers available for Event Guests API');
        return 0;
      }
      
      // Query event guests for this specific event using V2 API with account-level access
      const response = await fetch(`https://www.wixapis.com/events/v2/guests/query`, {
        method: 'POST',
        headers: {
          ...authHeaders.headers,
          'Content-Type': 'application/json',
          'wix-account-id': process.env.NEXT_PUBLIC_WIX_ACCOUNT_ID || ''
        },
        body: JSON.stringify({
          query: {
            filter: {
              eventId: eventId
            },
            paging: {
              limit: 1 // We only need one guest to get totalGuests
            }
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.warn(`Event Guests API failed: ${response.status} ${response.statusText}`);
        console.warn('Error details:', errorData);
        
        if (response.status === 403) {
          console.warn('Permission denied: WIX_EVENTS.READ_GUESTS permission required.');
          console.warn('You need one of these permissions in your Wix app:');
          console.warn('- Read Event Tickets and Guest List');
          console.warn('- Manage Guest List'); 
          console.warn('- Read Events (all read permissions)');
          console.warn('- Manage Events (all permissions)');
        } else if (response.status === 401) {
          console.warn('Authentication required: Use app-level authentication, not visitor tokens.');
        } else if (response.status === 404) {
          console.warn('Event not found or no guests data available.');
        }
        
        return 0;
      }
      
      const data = await response.json();
      console.log(`Event Guests API response:`, data);
      
      // Extract totalGuests from the response
      if (data.guests && data.guests.length > 0) {
        const firstGuest = data.guests[0];
        if (firstGuest.totalGuests !== undefined) {
          const totalGuests = firstGuest.totalGuests;
          console.log(`✅ Found ${totalGuests} total guests for event ${eventId}`);
          return totalGuests;
        } else {
          console.log('Guest object found but no totalGuests property');
          // If no totalGuests property, count the guests array length
          const guestCount = data.guests.length;
          console.log(`📊 Counted ${guestCount} individual guests`);
          return guestCount;
        }
      }
      
      console.log(`No guests found for event ${eventId}`);
      return 0;
      
    } catch (error) {
      console.warn('Could not fetch attendee count from Event Guests API:', error);
      // Return 0 instead of fake data
      return 0;
    }
  }
  
  /**
   * Create ticket reservation for headless checkout
   * Reference: https://dev.wix.com/docs/rest/business-solutions/events/orders/
   */
  async createTicketReservation(eventId: string, ticketQuantities: Array<{
    ticketDefinitionId: string;
    quantity: number;
  }>) {
    try {
      console.log(`Creating ticket reservation for event ${eventId}`);
      
      const authHeaders = await this.client.auth.getAuthHeaders();
      
      if (!authHeaders || !authHeaders.headers) {
        throw new Error('Authentication required for ticket reservation');
      }
      
      // Create reservation using Wix Events API
      const response = await fetch(`https://www.wixapis.com/events/v1/reservations`, {
        method: 'POST',
        headers: {
          ...authHeaders.headers,
          'Content-Type': 'application/json',
          'wix-account-id': process.env.NEXT_PUBLIC_WIX_ACCOUNT_ID || ''
        },
        body: JSON.stringify({
          eventId: eventId,
          ticketQuantities: ticketQuantities
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Reservation failed:', response.status, errorData);
        throw new Error(`Failed to create reservation: ${response.status}`);
      }
      
      const reservation = await response.json();
      console.log('Reservation created:', reservation);
      
      return reservation;
      
    } catch (error) {
      console.error('Error creating ticket reservation:', error);
      throw error;
    }
  }

  /**
   * Create order from reservation with visitor details
   * For headless checkout flow
   */
  async createOrderFromReservation(reservationId: string, checkoutForm: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  }) {
    try {
      console.log(`Creating order from reservation ${reservationId}`);
      
      const authHeaders = await this.client.auth.getAuthHeaders();
      
      if (!authHeaders || !authHeaders.headers) {
        throw new Error('Authentication required for order creation');
      }
      
      // Create order from reservation
      const response = await fetch(`https://www.wixapis.com/events/v1/orders`, {
        method: 'POST',
        headers: {
          ...authHeaders.headers,
          'Content-Type': 'application/json',
          'wix-account-id': process.env.NEXT_PUBLIC_WIX_ACCOUNT_ID || ''
        },
        body: JSON.stringify({
          reservationId: reservationId,
          checkoutForm: checkoutForm
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Order creation failed:', response.status, errorData);
        throw new Error(`Failed to create order: ${response.status}`);
      }
      
      const order = await response.json();
      console.log('Order created:', order);
      
      return order;
      
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  /**
   * Get checkout URL for payment processing
   * Redirects to Wix payment flow
   */
  async getCheckoutUrl(orderId: string): Promise<string> {
    try {
      const authHeaders = await this.client.auth.getAuthHeaders();
      
      const response = await fetch(`https://www.wixapis.com/events/v1/orders/${orderId}/checkout-url`, {
        method: 'GET',
        headers: {
          ...authHeaders.headers,
          'wix-account-id': process.env.NEXT_PUBLIC_WIX_ACCOUNT_ID || ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get checkout URL: ${response.status}`);
      }
      
      const data = await response.json();
      return data.checkoutUrl;
      
    } catch (error) {
      console.error('Error getting checkout URL:', error);
      throw error;
    }
  }
}

// Extract main image URL from Wix mainImage object
function getMainImageUrl(mainImage: any): string | undefined {
  if (!mainImage) return undefined;
  
  let imageUrl: string | undefined;
  
  // Handle direct URL string
  if (typeof mainImage === 'string') {
    imageUrl = mainImage;
  }
  // Handle Wix mainImage object structure from API docs
  else if (mainImage.url) {
    imageUrl = mainImage.url;
  }
  else if (mainImage.src) {
    imageUrl = mainImage.src;
  }
  // Handle nested image structure
  else if (mainImage.image?.url) {
    imageUrl = mainImage.image.url;
  }
  else if (mainImage.image?.src) {
    imageUrl = mainImage.image.src;
  }
  // Handle alternative field names
  else if (mainImage.mediaId && mainImage.url) {
    imageUrl = mainImage.url;
  }
  
  if (!imageUrl) return undefined;
  
  // Convert Wix internal image URLs to public URLs
  if (imageUrl.startsWith('wix:image://v1/')) {
    // Extract the image ID from wix:image://v1/[prefix]_[ID]~[format].[ext]#params
    // Pattern matches any prefix (ebd611_, 8792c4_, etc.) followed by the image identifier
    const match = imageUrl.match(/wix:image:\/\/v1\/([^#]+)/);
    if (match) {
      const imageId = match[1];
      return `https://static.wixstatic.com/media/${imageId}`;
    }
  }
  
  // Handle existing Wix media URLs that need https prefix (backward compatibility)
  if (imageUrl.match(/^[a-f0-9]+_/) && !imageUrl.startsWith('https://')) {
    return `https://static.wixstatic.com/media/${imageUrl}`;
  }
  
  return imageUrl;
}

// Transform Wix event data to our internal format
export function transformWixEvent(wixEvent: any) {
  // Map Wix event status to our internal status type - keep original status to avoid duplication
  const mapStatus = (wixStatus: string): 'published' | 'draft' | 'cancelled' => {
    const status = wixStatus?.toLowerCase();
    if (status === 'published') return 'published';
    if (status === 'canceled' || status === 'cancelled') return 'cancelled';
    if (status === 'ended') return 'published'; // Past events that were live
    return 'draft';
  };

  // Extract description from the new Wix API structure - prioritize full description over short
  const getDescription = () => {
    // First try the full description field (rich content)
    if (wixEvent.description && typeof wixEvent.description === 'object') {
      // Handle rich content description
      if (wixEvent.description.plainText) return wixEvent.description.plainText;
      if (wixEvent.description.html) return wixEvent.description.html.replace(/<[^>]*>/g, ''); // Strip HTML tags
    }
    if (typeof wixEvent.description === 'string' && wixEvent.description) return wixEvent.description;
    
    // Fallback to short description if full description not available
    if (wixEvent.shortDescription) return wixEvent.shortDescription;
    
    return '';
  };

  // Debug logging with proper Wix API fields
  const processedImageUrl = getMainImageUrl(wixEvent.mainImage);
  console.log('Transforming Wix event:', {
    id: wixEvent.id || wixEvent._id,
    title: wixEvent.title,
    status: wixEvent.status,
    shortDescription: wixEvent.shortDescription ? `${wixEvent.shortDescription.substring(0, 50)}...` : 'No short description',
    description: wixEvent.description ? (typeof wixEvent.description === 'string' ? `${wixEvent.description.substring(0, 50)}...` : 'Has description object') : 'No description',
    finalDescription: getDescription() ? `${getDescription().substring(0, 50)}...` : 'No final description',
    mainImage: wixEvent.mainImage ? {
      rawUrl: typeof wixEvent.mainImage === 'string' ? wixEvent.mainImage : wixEvent.mainImage.url,
      processedUrl: processedImageUrl,
      isWixFormat: typeof wixEvent.mainImage === 'string' && wixEvent.mainImage.startsWith('wix:image://'),
      transformation: wixEvent.mainImage !== processedImageUrl ? 'applied' : 'none'
    } : 'No main image'
  });

  return {
    id: wixEvent._id || wixEvent.id,
    title: wixEvent.title || '',
    description: getDescription(),
    startDate: wixEvent.dateAndTimeSettings?.startDate || new Date().toISOString(),
    endDate: wixEvent.dateAndTimeSettings?.endDate || wixEvent.dateAndTimeSettings?.startDate || new Date().toISOString(),
    location: {
      name: wixEvent.location?.name || '',
      address: (() => {
        const addr = wixEvent.location?.address;
        if (!addr) return wixEvent.location?.formatted || '';
        if (typeof addr === 'string') return addr;
        // Handle address object from Wix API
        return addr.formatted || 
               `${addr.streetAddress || ''} ${addr.city || ''} ${addr.subdivision || ''} ${addr.postalCode || ''}`.trim() ||
               '';
      })(),
    },
    ticketTypes: (wixEvent.registration?.ticketDefinitions || []).map((ticket: any) => ({
      id: ticket.id || ticket._id,
      name: ticket.name || '',
      price: ticket.price?.value || ticket.price?.amount || 0,
      currency: ticket.price?.currency || 'MYR',
      available: ticket.limitPerCheckout || ticket.inventory?.quantity || 999,
    })),
    imageUrl: getMainImageUrl(wixEvent.mainImage),
    status: mapStatus(wixEvent.status),
    eventPageUrl: wixEvent.eventPageUrl || (() => {
      const siteUrl = process.env.NEXT_PUBLIC_WIX_SITE_URL;
      const eventId = wixEvent.id || wixEvent._id;
      
      if (!siteUrl) {
        console.warn('NEXT_PUBLIC_WIX_SITE_URL not configured. Please add it to your .env.local file');
        return `#missing-wix-site-url-${eventId}`;
      }
      
      // Handle different URL patterns
      if (wixEvent.slug) {
        return `https://${siteUrl}/events/${wixEvent.slug}`;
      }
      
      return `https://${siteUrl}/events?eventId=${eventId}`;
    })(),

  };
}

// Initialize Wix Events service
export function createWixEventsService() {
  const clientId = process.env.NEXT_PUBLIC_WIX_CLIENT_ID;

  if (!clientId) {
    console.warn('Wix Client ID not found. Wix events service unavailable.');
    return null;
  }

  try {
    return new WixEventsService();
  } catch (error) {
    console.warn('Failed to create Wix service:', error);
    return null;
  }
}

export { WixEventsService };
export type { WixEvent, WixEventListResponse, WixCreateOrderRequest, WixOrderResponse };