'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { animationClasses } from '@/lib/animations';

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
  side?: 'bottom' | 'top';
  sideOffset?: number;
  onOpenChange?: (open: boolean) => void;
}

export function Dropdown({ 
  trigger, 
  children, 
  className,
  align = 'left',
  side = 'bottom',
  sideOffset = 4,
  onOpenChange 
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Notify parent of state changes
  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const getPositionClasses = () => {
    const positions = {
      // Side positioning
      bottom: 'top-full',
      top: 'bottom-full',
    };

    const alignments = {
      left: 'left-0',
      right: 'right-0', 
      center: 'left-1/2 -translate-x-1/2',
    };

    return `${positions[side]} ${alignments[align]}`;
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 bg-white border border-gray-200 shadow-lg overflow-hidden',
            getPositionClasses(),
            animationClasses.scaleIn,
            className
          )}
          style={{
            marginTop: side === 'bottom' ? `${sideOffset}px` : undefined,
            marginBottom: side === 'top' ? `${sideOffset}px` : undefined,
          }}
          role="menu"
        >
          <div onClick={() => setIsOpen(false)}>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

// Dropdown item component for consistent styling
interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  selected?: boolean;
  style?: React.CSSProperties;
}

export function DropdownItem({ 
  children, 
  onClick, 
  disabled = false, 
  className,
  selected = false,
  style
}: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={cn(
        'w-full text-center px-3 py-2 font-mono text-sm uppercase transition-colors',
        'hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed',
        selected && 'bg-gray-100',
        className
      )}
      role="menuitem"
    >
      {children}
    </button>
  );
}

// Specialized dropdown for vendor/filter selection
interface SelectDropdownProps {
  value: string | null;
  onValueChange: (value: string | null) => void;
  options: Array<{
    value: string | null;
    label: string;
    color?: string;
    count?: number;
    extra?: ReactNode;
  }>;
  placeholder?: string;
  className?: string;
  renderValue?: (option: any) => ReactNode;
}

export function SelectDropdown({
  value,
  onValueChange,
  options,
  placeholder = 'Select...',
  className,
  renderValue
}: SelectDropdownProps) {
  const selectedOption = options.find(opt => opt.value === value);

  const trigger = (
    <div className={cn(
      'flex items-center justify-center gap-2 px-3 py-1 bg-white font-mono text-sm uppercase hover:bg-gray-100 transition-colors min-w-[120px] cursor-pointer',
      className
    )}>
      {selectedOption && renderValue ? (
        renderValue(selectedOption)
      ) : (
        <>
          {selectedOption?.color && (
            <div 
              className="size-2 rounded-full flex-shrink-0" 
              style={{ backgroundColor: selectedOption.color }} 
            />
          )}
          <span className="truncate">
            {selectedOption?.label || placeholder}
          </span>
        </>
      )}
      <span className="ml-2 text-gray-400">▼</span>
    </div>
  );

  return (
    <Dropdown trigger={trigger} className="min-w-[140px]">
      {options.map((option) => (
        <DropdownItem
          key={option.value || 'null'}
          onClick={() => onValueChange(option.value)}
          selected={value === option.value}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            {option.color && (
              <div 
                className="size-2 rounded-full flex-shrink-0" 
                style={{ backgroundColor: option.color }} 
              />
            )}
            <span className="truncate">{option.label}</span>
          </div>
          {option.count !== undefined && (
            <span className="text-gray-400 text-xs">({option.count})</span>
          )}
          {option.extra}
        </DropdownItem>
      ))}
    </Dropdown>
  );
}