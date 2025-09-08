'use client';

import { useState, useEffect } from 'react';

interface VendorTypewriterProps {
  vendors: string[];
  className?: string;
}

export function VendorTypewriter({ vendors, className = '' }: VendorTypewriterProps) {
  const [currentVendorIndex, setCurrentVendorIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (vendors.length === 0) return;

    // Create array with vendors and dataran.online
    const allItems = [...vendors, 'dataran.online'];
    const currentItem = allItems[currentVendorIndex];
    const fullText = currentItem;

    const typeSpeed = 15; // ms per character (same as add-to-cart)
    const deleteSpeed = 15; // ms per character (same as add-to-cart)
    const pauseTime = currentVendorIndex === vendors.length ? 2500 : 1800; // longer pause for dataran.online

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing phase
        if (displayText.length < fullText.length) {
          setDisplayText(fullText.slice(0, displayText.length + 1));
        } else {
          // Finished typing, wait then start deleting
          setTimeout(() => {
            setIsDeleting(true);
          }, pauseTime);
        }
      } else {
        // Deleting phase
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          // Finished deleting, move to next item
          setIsDeleting(false);
          setCurrentVendorIndex((prev) => (prev + 1) % allItems.length);
        }
      }
    }, isDeleting ? deleteSpeed : typeSpeed);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentVendorIndex, vendors]);

  if (vendors.length === 0) {
    return <span className={className}>/</span>;
  }

  const isDataranOnline = currentVendorIndex === vendors.length;
  
  return (
    <span className={`${className} transition-all duration-50 ease-in-out ${isDataranOnline ? 'text-white bg-[#00b140] px-2 h-4 flex items-center justify-center rounded-none' : ''}`}>
      /{displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
}