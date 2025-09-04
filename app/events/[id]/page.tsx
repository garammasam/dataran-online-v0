'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/header';
import { FooterMenu } from '@/components/footer-menu';
import { createWixEventsService, transformWixEvent } from '@/lib/wix-events';
import { animationClasses } from '@/lib/animations';


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

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchEvent = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try to use Wix Events API
      const wixService = createWixEventsService();
      if (wixService) {
        try {
          // Fetch event data
          const eventResponse = await wixService.getEvent(eventId);
          
          // Transform event data
          const transformedEvent = transformWixEvent(eventResponse);
          setEvent(transformedEvent);
          setError(null);
          return;
        } catch (apiError) {
          console.warn('Wix API failed:', apiError);
        }
      }
      
      // No fallback to mock data - show error
      setError('Event not found. Please check the event ID and try again.');
      setEvent(null);
    } catch (err) {
      setError('Failed to load event. Please try again later.');
      console.error('Error fetching event:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [eventId, fetchEvent]);

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

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

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
      
      // Future implementation:
      // 1. Show ticket selection modal
      // 2. Collect customer details
      // 3. Create reservation via WixEventsService
      // 4. Process payment through Wix checkout
      
    } catch (error) {
      console.error('Error initiating ticket purchase:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <Header isBackVisible={true} onBack={handleBack} />
        <main className="flex-1 flex items-center justify-center pt-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
            <p className="font-mono text-sm">LOADING...</p>
          </div>
        </main>
        <FooterMenu />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="flex flex-col h-full">
        <Header isBackVisible={true} onBack={handleBack} />
        <main className="flex-1 flex items-center justify-center pt-16">
          <div className="text-center">
            <p className="font-mono text-sm text-red-600 mb-4">{error || 'Event not found'}</p>
            <button 
              onClick={() => typeof window !== 'undefined' && window.history.back()}
              className="bg-black text-white px-4 py-2 font-mono text-sm hover:bg-gray-800 transition-colors"
            >
              Go Back
            </button>
          </div>
        </main>
        <FooterMenu />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header isBackVisible={true} onBack={handleBack} />
      
      <main className="flex-grow pt-16 px-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Two-column layout for desktop, single column for mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[calc(var(--viewport-height)-8rem)]">
            
            {/* Left Column - Image */}
            <div className={`flex items-center justify-center p-4 ${animationClasses.slideInLeft}`}>
              {event.imageUrl ? (
                <img 
                  src={event.imageUrl} 
                  alt={event.title}
                  className={`w-full h-auto max-h-[70vh] object-cover rounded-lg ${animationClasses.scaleIn}`}
                  style={{ animationDelay: '100ms' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-lg">
                  <span className="font-mono text-sm text-gray-400">NO IMAGE</span>
                </div>
              )}
            </div>

            {/* Right Column - Event Information */}
            <div className={`flex flex-col justify-center p-4 lg:p-8 ${animationClasses.slideInLeft}`} style={{ animationDelay: '200ms' }}>
              {/* Title Section */}
              <h1 
                className={`font-mono text-2xl lg:text-3xl font-bold mb-6 uppercase tracking-wide ${animationClasses.fadeInUp}`}
                style={{ animationDelay: '300ms' }}
              >
                {event.title}
              </h1>
              
              {/* Meta Information */}
              <div 
                className={`space-y-3 mb-8 ${animationClasses.fadeInUp}`}
                style={{ animationDelay: '400ms' }}
              >
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
              
              {/* Description */}
              {event.description && (
                <div 
                  className={`mb-8 ${animationClasses.fadeInUp}`}
                  style={{ animationDelay: '500ms' }}
                >
                  <h3 className="font-mono text-sm font-bold mb-3 uppercase tracking-wide text-gray-800">
                    About This Event
                  </h3>
                  <p className="font-mono text-sm text-gray-700 leading-relaxed">
                    {event.description}
                  </p>
                </div>
              )}
              
              {/* Buy Now Section */}
              <div
                className={`flex justify-center ${animationClasses.fadeInUp}`}
                style={{ animationDelay: '600ms' }}
              >
                <button
                  onClick={() => handleBuyTickets(event)}
                  className="bg-black text-white px-8 py-3 font-mono text-sm font-semibold hover:bg-gray-800 transition-colors uppercase tracking-wide"
                >
                  BUY TICKETS
                </button>
              </div>
            </div>
          </div>
        </div>

      </main>
      
      {/* Footer Menu - hide when event selected */}
      <div className="fixed bottom-5 left-5 z-10">
        <FooterMenu />
      </div>
    </div>
  );
}