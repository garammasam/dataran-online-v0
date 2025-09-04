'use client';

import { MainMenu } from './main-menu';
import { Cart } from './cart';
import { VendorSort } from './vendor-sort';
import { EventFilter } from './event-filter';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useCart } from './cart-context';
import { usePathname } from 'next/navigation';

enum BreadcrumbState {
  HIDDEN,
  ENTERING,
  VISIBLE,
  EXITING,
}

interface HeaderProps {
  isBackVisible: boolean;
  onBack: any;
  selectedVendor?: string | null;
  selectedCollection?: string | null;
  onVendorSelect?: (vendor: string | null) => void;
  onCollectionSelect?: (collectionId: string | null) => void;
  breadcrumbData?: {
    vendor: string;
    vendorHandle: string;
    collections?: Array<{
      id: string;
      handle: string;
      title: string;
    }>;
    productName: string;
    productId: string;
  } | null;
  getCollectionHandle?: (collectionId: string) => string;
  showPastEvents?: boolean;
  onTogglePastEvents?: (showPast: boolean) => void;
  isEventsPage?: boolean;
  onHomeBack?: () => void;
}

export function Header({ 
  isBackVisible, 
  onBack, 
  selectedVendor, 
  selectedCollection,
  onVendorSelect, 
  onCollectionSelect,
  breadcrumbData,
  getCollectionHandle,
  showPastEvents,
  onTogglePastEvents,
  isEventsPage,
  onHomeBack
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);
  const [breadcrumbState, setBreadcrumbState] = useState<BreadcrumbState>(BreadcrumbState.HIDDEN);
  const [isMobile, setIsMobile] = useState(false);
  const { items, isCartFlashing, isCartFlashingRed } = useCart();
  const pathname = usePathname();

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const totalQuantity = useMemo(() => 
    items.reduce((total, item) => total + item.quantity, 0), 
    [items]
  );
  const isEventsPageFromPath = useMemo(() => 
    pathname?.startsWith('/events'), 
    [pathname]
  );

  // Determine which back function to use
  const effectiveBackFunction = useMemo(() => {
    if (isEventsPage && !isBackVisible) {
      // On events page with no expanded event, go to home
      return onHomeBack || onBack;
    }
    
    // If filters are active, create a function that clears them
    if (selectedVendor || selectedCollection) {
      return () => {
        if (onVendorSelect) onVendorSelect(null);
        if (onCollectionSelect) onCollectionSelect(null);
      };
    }
    
    return onBack;
  }, [isEventsPage, isBackVisible, onHomeBack, onBack, selectedVendor, selectedCollection, onVendorSelect, onCollectionSelect]);

  // Determine if back button should be visible
  const effectiveBackVisible = useMemo(() => {
    if (isEventsPage) {
      // On events page, always show back button (either to home or to events list)
      return true;
    }
    // Show back button when viewing expanded product OR when filters are active
    return isBackVisible || !!selectedVendor || !!selectedCollection;
  }, [isEventsPage, isBackVisible, selectedVendor, selectedCollection]);

  // Handle breadcrumb state changes
  useEffect(() => {
    if ((isBackVisible && breadcrumbData) || selectedVendor || selectedCollection) {
      if (breadcrumbState === BreadcrumbState.HIDDEN) {
        setBreadcrumbState(BreadcrumbState.ENTERING);
        setTimeout(() => setBreadcrumbState(BreadcrumbState.VISIBLE), 150);
      }
    } else {
      if (breadcrumbState === BreadcrumbState.VISIBLE) {
        setBreadcrumbState(BreadcrumbState.EXITING);
        setTimeout(() => setBreadcrumbState(BreadcrumbState.HIDDEN), 150);
      }
    }
  }, [isBackVisible, breadcrumbData, breadcrumbState, selectedVendor, selectedCollection]);

  const handleVendorClick = useCallback(() => {
    if (breadcrumbData?.vendorHandle === 'events') {
      // If on events page, go back to events list (not product grid)
      onBack();
    } else if (breadcrumbData?.vendor && onVendorSelect) {
      // If on product page, filter by vendor
      onVendorSelect(breadcrumbData.vendor);
      // Go back to product grid
      onBack();
    }
  }, [breadcrumbData, onVendorSelect, onBack]);

  const handleProductClick = useCallback(() => {
    // Product click just goes back to grid (already handled by onBack)
    onBack();
  }, [onBack]);

  return (
    <nav className="flex items-center justify-between py-0 px-5 fixed top-0 left-0 right-0 z-10 bg-white">
      <div className="flex items-center flex-1 min-w-0">
        <MainMenu 
          isBackVisible={effectiveBackVisible} 
          onBack={effectiveBackFunction}
          onMenuToggle={setIsMainMenuOpen}
        />
        {/* Breadcrumb for expanded product view or filter states - compact on mobile */}
        {(breadcrumbState === BreadcrumbState.ENTERING || breadcrumbState === BreadcrumbState.VISIBLE || breadcrumbState === BreadcrumbState.EXITING) && (breadcrumbData || selectedVendor || selectedCollection) && (
          <div className={`ml-3 flex items-center text-sm font-mono text-gray-600 flex-1 min-w-0 overflow-hidden ${
            breadcrumbState === BreadcrumbState.ENTERING 
              ? 'animate-[slideInLeft_200ms_ease-out_forwards]' 
              : breadcrumbState === BreadcrumbState.EXITING
              ? 'animate-[slideOutLeft_200ms_ease-in_forwards]'
              : ''
          }`}>
            {breadcrumbData ? (
              // Product breadcrumb
              <>
                <button
                  onClick={handleVendorClick}
                  className={`tracking-wide hover:text-[#00b140] transition-colors cursor-pointer ${
                    isMobile ? 'truncate max-w-[80px]' : ''
                  }`}
                >
                  {breadcrumbData.vendorHandle}
                </button>
                {breadcrumbData.collections && breadcrumbData.collections.length > 0 ? (
                  <>
                    <span className={`${isMobile ? 'mx-1' : 'mx-2'} text-gray-400`}>/</span>
                    <button
                      onClick={() => {
                        // Filter by collection and go back to product grid
                        if (onCollectionSelect && breadcrumbData?.collections?.[0]?.id) {
                          onCollectionSelect(breadcrumbData.collections[0].id);
                          onBack();
                        }
                      }}
                      className={`tracking-wide hover:text-[#00b140] transition-colors cursor-pointer ${
                        isMobile ? 'truncate max-w-[80px]' : ''
                      }`}
                    >
                      {breadcrumbData.collections[0].handle}
                    </button>
                    <span className={`${isMobile ? 'mx-1' : 'mx-2'} text-gray-400`}>/</span>
                  </>
                ) : (
                  <span className={`${isMobile ? 'mx-1' : 'mx-2'} text-gray-400`}>/</span>
                )}
                <button
                  onClick={handleProductClick}
                  className={`text-black font-medium transition-colors cursor-pointer hover:text-[#00b140] ${
                    isMobile ? `truncate ${breadcrumbData.collections && breadcrumbData.collections.length > 0 ? 'max-w-[120px]' : 'max-w-[200px]'}` : ''
                  }`}
                >
                  {breadcrumbData.productName}
                </button>
              </>
            ) : (
              // Filter breadcrumb
              <>
                <button
                  onClick={() => onVendorSelect && onVendorSelect(null)}
                  className={`tracking-wide hover:text-[#00b140] transition-colors cursor-pointer ${
                    selectedVendor ? 'font-bold' : ''
                  } ${isMobile ? 'truncate max-w-[80px]' : ''}`}
                >
                  {selectedVendor || 'all'}
                </button>
                {selectedCollection && (
                  <>
                    <span className={`${isMobile ? 'mx-1' : 'mx-2'} text-gray-400`}>/</span>
                    <button
                      onClick={() => onCollectionSelect && onCollectionSelect(null)}
                      className={`tracking-wide hover:text-[#00b140] transition-colors cursor-pointer ${
                        selectedCollection ? 'font-bold' : ''
                      } ${isMobile ? 'truncate max-w-[80px]' : ''}`}
                    >
                      {getCollectionHandle ? getCollectionHandle(selectedCollection) : selectedCollection}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Center - Vendor Sort / Event Filter / Events Toggle */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center">
        {onVendorSelect && !isMainMenuOpen && !isBackVisible && !selectedVendor && !selectedCollection && (
          <>
            {isEventsPageFromPath ? (
              <EventFilter 
                selectedFilter={selectedVendor || null} 
                onFilterSelect={onVendorSelect} 
              />
            ) : (
              <VendorSort 
                selectedVendor={selectedVendor || null} 
                onVendorSelect={onVendorSelect} 
              />
            )}
          </>
        )}
        
        {/* Events Toggle - adjust spacing and size for mobile */}
        {isEventsPageFromPath && onTogglePastEvents && !isBackVisible && (
          <div className={`flex items-center ${isMobile ? 'space-x-1 ml-2' : 'space-x-2 ml-4'}`}>
            <button
              onClick={() => onTogglePastEvents(false)}
              className={`bg-white rounded font-mono hover:opacity-70 transition-opacity ${
                isMobile 
                  ? 'px-2 py-1 text-xs' 
                  : 'px-3 py-1 text-sm'
              } ${
                !showPastEvents 
                  ? 'text-black' 
                  : 'text-gray-500'
              }`}
            >
              UPCOMING
            </button>
            <button
              onClick={() => onTogglePastEvents(true)}
              className={`bg-white rounded font-mono hover:opacity-70 transition-opacity ${
                isMobile 
                  ? 'px-2 py-1 text-xs' 
                  : 'px-3 py-1 text-sm'
              } ${
                showPastEvents 
                  ? 'text-black' 
                  : 'text-gray-500'
              }`}
            >
              PAST
            </button>
          </div>
        )}
      </div>
      
      <div className="flex items-center">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`relative z-20 size-12 flex items-center justify-center transition-colors duration-200 focus-interactive rounded ${
            isCartFlashing ? 'text-[#00b140]' : isCartFlashingRed ? 'text-red-500' : 'text-black'
          }`}
          aria-label={`Cart with ${totalQuantity} item${totalQuantity !== 1 ? 's' : ''}`}
          aria-expanded={isMenuOpen}
        >
          <svg
            className="size-6"
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="6"
              y="8"
              width="12"
              height="10"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            ></rect>
            <path
              d="M9 7V7C9 5.34315 10.3431 4 12 4V4C13.6569 4 15 5.34315 15 7V7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            ></path>
          </svg>
          <span className={`ml-1 font-semibold transition-colors duration-200 ${
            isCartFlashing ? 'text-[#00b140]' : isCartFlashingRed ? 'text-red-500' : 'text-black'
          }`}>{totalQuantity}</span>
        </button>
        <Cart isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      </div>
    </nav>
  );
}