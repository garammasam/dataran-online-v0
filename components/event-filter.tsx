'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { animationClasses } from '@/lib/animations';

interface EventFilterProps {
  selectedFilter: string | null;
  onFilterSelect: (filter: string | null) => void;
}

export function EventFilter({ selectedFilter, onFilterSelect }: EventFilterProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Show component after a short delay to match the header animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const filters = [
    { label: 'UPCOMING', value: 'upcoming', color: '#10B981' }, // Green
    { label: 'PAST', value: 'past', color: '#F59E0B' }, // Yellow
  ];

  if (!isVisible) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterSelect(filter.value)}
          className={`relative flex items-center justify-center h-8 overflow-hidden ${animationClasses.smooth} group`}
        >
          {/* Colored dot */}
          <div
            className="size-2 rounded-full transition-colors duration-200"
            style={{ 
              backgroundColor: selectedFilter === filter.value ? filter.color : '#9CA3AF'
            }}
          />

          {/* Label with smooth reveal */}
          <div 
            className={`ml-2 relative h-4 overflow-hidden transition-all duration-200 ease-out ${
              selectedFilter === filter.value ? 'w-auto opacity-100' : 'w-0 opacity-0'
            }`}
          >
            <span
              className={`font-mono text-xs uppercase whitespace-nowrap absolute left-0 top-0 transition-transform duration-200 ease-out ${
                selectedFilter === filter.value ? 'translate-x-0' : '-translate-x-full'
              }`}
            >
              {filter.label}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}