'use client';

import { useState, useEffect } from 'react';
import { SelectDropdown } from '@/components/ui/dropdown';

interface EventSortProps {
  selectedFilter: string | null;
  onFilterSelect: (filter: string | null) => void;
}

export function EventSort({ selectedFilter, onFilterSelect }: EventSortProps) {
  const [isVisible, setIsVisible] = useState(false);

  const filters = [
    { value: 'all', label: 'ALL EVENTS' },
    { value: 'upcoming', label: 'UPCOMING' },
    { value: 'past', label: 'PAST EVENTS' },
  ];

  // Show component after a short delay to match the header animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) {
    return null;
  }

  // Prepare options for dropdown (convert to the expected format)
  const options = filters.map(filter => ({
    value: filter.value,
    label: filter.label
  }));

  return (
    <div className="relative inline-block">
      <SelectDropdown
        value={selectedFilter}
        onValueChange={onFilterSelect}
        options={options}
        placeholder="ALL EVENTS"
        className="min-w-[140px]"
      />
    </div>
  );
}