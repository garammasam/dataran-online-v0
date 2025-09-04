"use client";
// Removed next/image for event grid/detail to restore previous <img> behavior

import { useState, useEffect, useCallback, useTransition, useMemo, useRef } from 'react';
import { Header } from '@/components/header';
import { FooterMenu } from '@/components/footer-menu';

// Lazy load Wix Events service only when needed
const createWixEventsService = async () => {
  const { createWixEventsService: service, transformWixEvent } = await import('@/lib/wix-events');
  return { service: service(), transformWixEvent };
};



interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: {
    name: string;
    address: string;
  };
  ticketTypes: {
    id: string;
    name: string;
    price: number;
    currency: string;
    available: number;
  }[];
  imageUrl?: string;
  status: 'published' | 'draft' | 'cancelled';
  eventPageUrl?: string;
}



export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleEventClick = useCallback((event: Event) => {
    if (isMobile) {
      // Instant expansion on mobile - no transition
      setExpandedEventId(event.id);
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', `/events/${event.id}`);
      }
    } else {
      // Use transition on desktop for smooth animation
      startTransition(() => {
        setExpandedEventId(event.id);
        if (typeof window !== 'undefined') {
          window.history.pushState(null, '', `/events/${event.id}`);
        }
      });
    }
  }, [startTransition, isMobile]);

  const handleBack = useCallback(() => {
    if (expandedEventId) {
      // If viewing an event, go back to events list
      startTransition(() => {
        setExpandedEventId(null);
        if (typeof window !== 'undefined') {
          window.history.pushState(null, '', '/events');
        }
      });
    } else {
      // If on events page, go back to home
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  }, [expandedEventId, startTransition]);

  const handleHomeBack = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }, []);

  const handleBuyTickets = async (event: Event) => {
    try {
      console.log('Starting ticket purchase for event:', event.title);
      
      // For now, redirect to Wix event page
      // TODO: Implement headless checkout flow
      if (event.eventPageUrl) {
        window.open(event.eventPageUrl, '_blank');
      } else {
        console.warn('No event page URL available');
      }
      
      // Future headless checkout implementation:
      // 1. Show ticket selection modal
      // 2. Collect customer details  
      // 3. Create reservation via WixEventsService
      // 4. Process payment through Wix checkout
      
    } catch (error) {
      console.error('Error initiating ticket purchase:', error);
    }
  };



  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (expandedEventId) {
        if (event.key === 'Escape') {
          handleBack();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [expandedEventId, handleBack]);

  // Load events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // Filter events to remove cancelled ones and duplicates, and separate by time
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const filtered = events.filter((event, index, self) => {
      // Remove duplicates by event ID
      const isUnique = index === self.findIndex(e => e.id === event.id);
      // Hide cancelled events
      const isNotCancelled = event.status !== 'cancelled';
      return isUnique && isNotCancelled;
    });

    const now = new Date();
    const upcoming = filtered.filter(event => new Date(event.startDate) > now);
    const past = filtered.filter(event => new Date(event.startDate) <= now);

    return { upcomingEvents: upcoming, pastEvents: past };
  }, [events]);

  // Use upcoming events by default, or past events if toggle is on
  const displayedEvents = showPastEvents ? pastEvents : upcomingEvents;

  // Get breadcrumb data for expanded event
  const breadcrumbData = useMemo(() => {
    if (expandedEventId) {
      const expandedEvent = events.find(e => e.id === expandedEventId);
      if (expandedEvent) {
        return {
          vendor: 'events',
          vendorHandle: 'events',
          productName: expandedEvent.title.toLowerCase().replace(/\s+/g, '-'),
          productId: expandedEvent.id
        };
      }
    }
    return null;
  }, [expandedEventId, events]);

  // Handle initial URL and popstate events
  useEffect(() => {
    const parseUrlForEvent = async () => {
      if (typeof window === 'undefined') return;
      const path = window.location.pathname;
      const pathSegments = path.split('/').filter(segment => segment !== '');
      
      if (pathSegments.length === 3 && pathSegments[1] === 'events' && pathSegments[2]) {
        const eventId = pathSegments[2];
        const event = events.find(e => e.id === eventId);
        if (event) {
          setExpandedEventId(event.id);
        } else {
          setExpandedEventId(null);
        }
      } else {
        setExpandedEventId(null);
      }
    };

    const handlePopState = async () => {
      await parseUrlForEvent();
    };

    // Check initial state on mount
    parseUrlForEvent();
    
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [events]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      // Try to use lazy-loaded Wix Events API
      const { service: wixService, transformWixEvent } = await createWixEventsService();
      console.log('Wix service created:', !!wixService);
      
      if (wixService) {
        try {
          const response = await wixService.listEvents({
            limit: 100 // Get more events to ensure we have data
          });
          console.log('Raw Wix events response:', response);
          
                                  const transformedEvents = response.events.map((event: any) => transformWixEvent(event));
            console.log('Transformed events with images:', transformedEvents.map((e: any) => ({
            id: e.id,
            title: e.title,
            imageUrl: e.imageUrl,
            hasImage: !!e.imageUrl
          })));
          
          setEvents(transformedEvents);
          return;
        } catch (wixError) {
          console.log('Wix API call failed:', wixError);
        }
      } else {
        console.log('No Wix service available');
      }
      
      // No fallback to mock data - show empty state
      console.log('No events available');
      setEvents([]);
    } catch (error) {
      console.error('Failed to load events:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcomingEvent = (dateString: string) => {
    const eventDate = new Date(dateString);
    const now = new Date();
    return eventDate > now;
  };



  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header 
          isBackVisible={true} 
          onBack={handleBack}
        />
        <main className="flex-grow pt-16 px-5">
          {/* Loading skeleton that mimics the actual grid */}
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-x-5 gap-y-12 pb-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="group">
                <div className="aspect-[4/5] bg-gray-100 animate-pulse rounded-sm mb-2"></div>
                <div className="text-center">
                  <div className="h-4 bg-gray-100 animate-pulse rounded mb-1 hidden md:block"></div>
                  <div className="h-3 bg-gray-100 animate-pulse rounded w-16 mx-auto"></div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header 
        isBackVisible={!!expandedEventId} 
        onBack={handleBack}
        breadcrumbData={breadcrumbData}
        showPastEvents={showPastEvents}
        onTogglePastEvents={setShowPastEvents}
        isEventsPage={true}
        onHomeBack={handleHomeBack}
      />
      <main className="flex-grow pt-16 px-5">
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-x-5 gap-y-12 pb-8">
          {displayedEvents.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              {!showPastEvents ? (
                <>
                  <p className="font-mono text-sm text-gray-500 mb-2">
                    No upcoming events
                  </p>
                  <p className="font-mono text-xs text-gray-400 text-center max-w-xs">
                    Check back later for new events or view past events
                  </p>
                </>
              ) : (
                <>
                  <p className="font-mono text-sm text-gray-500 mb-2">
                    No past events
                  </p>
                  <p className="font-mono text-xs text-gray-400">
                    Switch to upcoming events to see what&apos;s coming
                  </p>
                </>
              )}
            </div>
          ) : (
            displayedEvents.map((event) => (
              <EventGridItem
                key={event.id}
                event={event}
                isExpanded={expandedEventId === event.id}
                onEventClick={handleEventClick}
                isMobile={isMobile}
                showPastEvents={showPastEvents}
              />
            ))
          )}
        </div>
      </main>
      
      {/* Footer Menu - only show when not on event detail */}
      {!expandedEventId && (
        <div className="fixed bottom-5 left-5 z-10">
          <FooterMenu />
        </div>
      )}
    </div>
  );
}

// Event Grid Item Component
interface EventGridItemProps {
  event: Event;
  isExpanded: boolean;
  onEventClick: (event: Event) => void;
  isMobile: boolean;
  showPastEvents: boolean;
}

const EventGridItem = ({ event, isExpanded, onEventClick, isMobile, showPastEvents }: EventGridItemProps) => {
  const expandedContainerRef = useRef<HTMLDivElement>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);

  // Handle image load to detect aspect ratio
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    setImageAspectRatio(aspectRatio);
  }, []);

  // Calculate responsive sizing based on image dimensions (similar to video-product.tsx)
  const responsiveSizing = useMemo(() => {
    if (!isExpanded) {
      // Grid view: maintain consistent 4:5 aspect ratio
      return {
        aspectRatio: '4 / 5',
        objectFit: 'cover' as const,
        maxHeight: 'none'
      };
    }
    
    // Expanded view: respect image dimensions with constraints
    if (imageAspectRatio) {
      const isPortrait = imageAspectRatio < 1;
      const isSquare = Math.abs(imageAspectRatio - 1) < 0.1;
      const isWidescreen = imageAspectRatio > 1.5;
      
      return {
        aspectRatio: isWidescreen ? '16 / 9' : isSquare ? '1 / 1' : isPortrait ? '3 / 4' : '4 / 3',
        objectFit: 'contain' as const,
        maxHeight: 'calc(70vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))'
      };
    }
    
    // Fallback while loading
    return {
      aspectRatio: 'auto',
      objectFit: 'contain' as const,
      maxHeight: 'calc(70vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))'
    };
  }, [isExpanded, imageAspectRatio]);
  
  // Auto-scroll to center of expanded event when expanded
  useEffect(() => {
    if (isExpanded && expandedContainerRef.current) {
      const scrollToCenter = () => {
        expandedContainerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      };
      
      // Delay scroll to allow for layout changes and animations
      const timeoutId = setTimeout(scrollToCenter, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [isExpanded]);

  const handleClick = useCallback(() => {
    if (!isExpanded) {
      onEventClick(event);
    }
  }, [event, onEventClick, isExpanded]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isExpanded) {
    // Expanded view - full width event details
    return (
      <div ref={expandedContainerRef} className="col-span-full">
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center justify-center p-2 sm:p-4 lg:p-6">
          <div className="w-full flex flex-col items-center justify-center p-2 sm:p-6">
            {event.imageUrl ? (
              <div
                className="w-full flex items-center justify-center overflow-hidden rounded-lg"
                style={{
                  aspectRatio: responsiveSizing.aspectRatio,
                  maxHeight: responsiveSizing.maxHeight,
                  minHeight: isExpanded ? '300px' : 'auto',
                }}
              >
                <img 
                  src={event.imageUrl} 
                  alt={event.title}
                  className="w-full h-full opacity-0 animate-[fadeIn_300ms_ease-out_forwards]"
                  style={{ 
                    objectFit: responsiveSizing.objectFit,
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden'
                  }}
                  onLoad={handleImageLoad}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-lg">
                <span className="font-mono text-sm text-gray-400">NO IMAGE</span>
              </div>
            )}
          </div>
          
          <div className="w-full max-w-md mx-auto p-2 sm:p-4 lg:p-6">
            <div className="text-center">
              <h1 className="font-mono text-2xl lg:text-3xl font-bold mb-6 uppercase tracking-wide">
                {event.title}
              </h1>
            </div>
            
            <div className="space-y-3 mb-8 text-left">
              <div className="flex items-start space-x-2">
                <span className="font-mono text-sm text-gray-400 mt-1">📅</span>
                <p className="font-mono text-sm text-gray-600 leading-relaxed">
                  {formatDate(event.startDate)}
                </p>
              </div>
              
              {event.location.name && (
                <div className="flex items-start space-x-2">
                  <span className="font-mono text-sm text-gray-400 mt-1">📍</span>
                  <div>
                    <p className="font-mono text-sm text-gray-600">
                      {event.location.name}
                    </p>
                    {event.location.address && (
                      <p className="font-mono text-xs text-gray-500 mt-1">
                        {event.location.address}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {event.description && (
              <div className="mb-8 text-left">
                <h3 className="font-mono text-sm font-bold mb-3 uppercase tracking-wide text-gray-800">
                  About This Event
                </h3>
                <p className="font-mono text-sm text-gray-700 leading-relaxed">
                  {event.description}
                </p>
              </div>
            )}
            
            <div className="text-center">
              <button
                onClick={() => {
                  try {
                    console.log('Starting ticket purchase for event:', event.title);
                    if (event.eventPageUrl) {
                      window.open(event.eventPageUrl, '_blank');
                    } else {
                      console.warn('No event page URL available');
                    }
                  } catch (error) {
                    console.error('Error initiating ticket purchase:', error);
                  }
                }}
                className="bg-black text-white px-8 py-3 font-mono text-sm font-semibold hover:bg-gray-800 transition-colors uppercase tracking-wide"
              >
                BUY TICKETS
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal grid view
  return (
    <div
      className="group cursor-pointer transition-all duration-200 ease-out hover:scale-105"
      onClick={handleClick}
    >
      <div
        className="mb-2 overflow-hidden"
        style={{
          aspectRatio: responsiveSizing.aspectRatio,
          maxHeight: responsiveSizing.maxHeight,
        }}
      >
        {event.imageUrl ? (
          <img 
            src={event.imageUrl} 
            alt={event.title}
            className="w-full h-full transition-opacity duration-300"
            style={{ 
              objectFit: responsiveSizing.objectFit,
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden'
            }}
            onLoad={handleImageLoad}
            onError={(e) => {
              console.error(`Image error for event ${event.id}:`, event.imageUrl);
              e.currentTarget.style.display = 'none';
              const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
              if (nextSibling) {
                nextSibling.style.display = 'flex';
              }
            }}
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="font-mono text-xs text-gray-400">NO IMAGE</span>
          </div>
        )}
        <div 
          className="w-full h-full bg-gray-100 items-center justify-center hidden"
          style={{ display: 'none' }}
        >
          <span className="font-mono text-xs text-gray-400">NO IMAGE</span>
        </div>
      </div>
      <div className="text-center">
        <p className="font-medium font-mono uppercase text-sm transition-colors duration-200 group-hover:text-[#00b140] hidden md:block">
          {event.title}
        </p>
        {!showPastEvents && (
          <p className="font-mono text-xs mt-1 opacity-70 transition-colors duration-200 group-hover:text-[#00b140]">
            {formatDate(event.startDate)}
          </p>
        )}
      </div>
    </div>
  );
};