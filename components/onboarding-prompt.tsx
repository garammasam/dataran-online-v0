'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function OnboardingPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has visited before
    const hasVisited = localStorage.getItem('dataran-visited');
    const hasSeenOnboarding = localStorage.getItem('dataran-onboarding-seen');
    
    if (!hasVisited && !hasSeenOnboarding) {
      // Show prompt after a short delay for new visitors
      const timer = setTimeout(() => {
        setShowPrompt(true);
        setTimeout(() => setIsVisible(true), 100);
      }, 3000);
      return () => clearTimeout(timer);
    }
    
    // Mark as visited
    localStorage.setItem('dataran-visited', 'true');
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      setShowPrompt(false);
      localStorage.setItem('dataran-onboarding-seen', 'true');
    }, 300);
  };

  const handleStartTour = () => {
    localStorage.setItem('dataran-onboarding-seen', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className={`fixed bottom-20 right-5 z-20 transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`}>
      <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-4 max-w-xs">
        <div className="flex items-start justify-between mb-3">
         
          <button 
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            
          </button>
        </div>
        
        <div className="mb-4">
          <h3 className="font-mono text-sm font-semibold mb-1">WEBSITE TOUR</h3>
          <p className="font-mono text-xs text-gray-600 leading-relaxed">
            Quick tour: product browsing, order tracking, cart management.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Link href="/onboarding" onClick={handleStartTour} className="flex-1">
            <Button size="sm" fullWidth>
              START TOUR
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDismiss}
            className="px-3"
          >
            Skip
          </Button>
        </div>
      </div>
    </div>
  );
}