'use client';

import { useState } from 'react';
import { Header } from '@/components/header';

interface TrackingInfo {
  orderId: string;
  email: string;
  customerName?: string;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  allTrackingInfo?: Array<{
    number: string;
    url: string;
    courier: string;
    originalUrl?: string;
  }>;
  totalAmount: string;
  currency: string;
  items: Array<{
    title: string;
    quantity: number;
  }>;
}

export default function TrackingPage() {
  const [searchInput, setSearchInput] = useState('');
  const [searchType, setSearchType] = useState<'email' | 'order'>('order');
  const [trackingInfo, setTrackingInfo] = useState<TrackingInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  const getStatusColor = (status: TrackingInfo['status']) => {
    switch (status) {
      case 'processing':
        return 'text-yellow-600';
      case 'shipped':
        return 'text-blue-600';
      case 'delivered':
        return 'text-green-600';
      case 'cancelled':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = (status: TrackingInfo['status']) => {
    switch (status) {
      case 'processing':
        return 'PROCESSING';
      case 'shipped':
        return 'SHIPPED';
      case 'delivered':
        return 'DELIVERED';
      case 'cancelled':
        return 'CANCELLED';
      default:
        return 'UNKNOWN';
    }
  };

  const handleTrackOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    setError(null);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          searchInput: searchInput.trim(),
          searchType: searchType
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch orders');
        setTrackingInfo([]);
        return;
      }

      setTrackingInfo(data.orders || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Network error. Please check your connection and try again.');
      setTrackingInfo([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header isBackVisible={true} onBack={handleBack} />
      
      <main className="flex-grow pt-20 pb-8 px-4">
        <div className="space-y-12 font-mono max-w-[700px] mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-xl">ORDER TRACKING</h1>
          
          <section className="space-y-4">
            <form onSubmit={handleTrackOrder} className="space-y-4">
            {/* Search Type Toggle */}
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchType('order');
                    setSearchInput('');
                    setHasSearched(false);
                    setTrackingInfo([]);
                    setError(null);
                  }}
                  className={`px-3 py-1 font-mono text-xs rounded ${
                    searchType === 'order' 
                      ? 'bg-black text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  ORDER #
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSearchType('email');
                    setSearchInput('');
                    setHasSearched(false);
                    setTrackingInfo([]);
                    setError(null);
                  }}
                  className={`px-3 py-1 font-mono text-xs rounded ${
                    searchType === 'email' 
                      ? 'bg-black text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  EMAIL
                </button>
              </div>
              
              <div>
                <label htmlFor="searchInput" className="block font-mono text-sm mb-2">
                  {searchType === 'email' ? 'EMAIL ADDRESS' : 'ORDER NUMBER'}
                </label>
                <input
                  id="searchInput"
                  type={searchType === 'email' ? 'email' : 'text'}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={searchType === 'email' ? 'your@email.com' : '#1001'}
                  className="w-full px-3 py-2 border border-gray-300 font-mono text-sm focus:outline-none focus:border-black"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white font-mono text-sm py-2 px-4 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'SEARCHING...' : 'TRACK ORDERS'}
            </button>
            </form>
          </section>

          {/* Results */}
          {hasSearched && (
            <section className="space-y-4">
              {error ? (
                <div className="text-center py-8">
                  <p className="font-mono text-sm text-red-600 mb-2">ERROR</p>
                  <p className="font-mono text-xs text-gray-600">
                    {error}
                  </p>
                </div>
              ) : trackingInfo.length > 0 ? (
                <>
                  <h2 className="font-mono text-sm mb-4">FOUND {trackingInfo.length} ORDER{trackingInfo.length !== 1 ? 'S' : ''}</h2>
                  {trackingInfo.map((order) => (
                    <div key={order.orderId} className="border border-gray-200 p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="font-mono text-sm font-medium">{order.orderId}</span>
                          {searchType === 'order' && order.customerName && (
                            <span className="font-mono text-xs text-gray-600 mt-1">{order.customerName}</span>
                          )}
                        </div>
                        <span className={`font-mono text-sm font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      
                      <div className="font-mono text-xs text-gray-600 space-y-1">
                        <div>ORDER DATE: {order.date}</div>
                        <div>TOTAL: {order.currency}{order.totalAmount}</div>
                        
                        {/* Show all tracking numbers if available */}
                        {order.allTrackingInfo && order.allTrackingInfo.length > 0 ? (
                          <div className="space-y-1">
                            {order.allTrackingInfo.length === 1 ? (
                              <div>
                                {order.allTrackingInfo[0].url ? (
                                  <a 
                                    href={order.allTrackingInfo[0].url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    TRACKING: {order.allTrackingInfo[0].number} ({order.allTrackingInfo[0].courier})
                                  </a>
                                ) : (
                                  <div>TRACKING: {order.allTrackingInfo[0].number} ({order.allTrackingInfo[0].courier})</div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <div className="text-gray-500 mb-1">TRACKING NUMBERS:</div>
                                {order.allTrackingInfo.map((track, index) => (
                                  <div key={index} className="ml-2">
                                    {track.url ? (
                                      <a 
                                        href={track.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline"
                                      >
                                        {index + 1}. {track.number} ({track.courier})
                                      </a>
                                    ) : (
                                      <div>{index + 1}. {track.number} ({track.courier})</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : order.trackingNumber && (
                          <div>
                            {order.trackingUrl ? (
                              <a 
                                href={order.trackingUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                TRACKING: {order.trackingNumber}
                              </a>
                            ) : (
                              <div>TRACKING: {order.trackingNumber}</div>
                            )}
                          </div>
                        )}
                      </div>

                      {order.items && order.items.length > 0 && (
                        <div className="border-t pt-2 mt-2">
                          <div className="font-mono text-xs text-gray-500 mb-1">ITEMS:</div>
                          {order.items.map((item, index) => (
                            <div key={index} className="font-mono text-xs text-gray-600">
                              {item.quantity}x {item.title}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="font-mono text-sm text-gray-600 mb-2">NO ORDERS FOUND</p>
                  <p className="font-mono text-xs text-gray-500">
                    Please check your {searchType === 'email' ? 'email address' : 'order number'} or contact support
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
}