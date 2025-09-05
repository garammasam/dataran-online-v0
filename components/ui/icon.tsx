import { 
    CheckCircle, 
    X, 
    ChevronRight, 
    ChevronLeft, 
    Minus, 
    Plus, 
    HelpCircle,
    Info 
  } from 'lucide-react';
  import { cn } from '@/lib/utils';
  
  // Icon size variants
  const iconSizes = {
    xs: 'size-3',
    sm: 'size-4', 
    default: 'size-5',
    lg: 'size-6',
    xl: 'size-8',
    '2xl': 'size-16',
  } as const;
  
  interface IconProps {
    size?: keyof typeof iconSizes;
    className?: string;
  }
  
  // Reusable icon components with consistent sizing
  export function CheckIcon({ size = 'default', className }: IconProps) {
    return (
      <CheckCircle 
        className={cn(iconSizes[size], 'text-green-500', className)} 
      />
    );
  }
  
  export function CloseIcon({ size = 'default', className }: IconProps) {
    return (
      <X 
        className={cn(iconSizes[size], className)} 
      />
    );
  }
  
  export function ChevronRightIcon({ size = 'default', className }: IconProps) {
    return (
      <ChevronRight 
        className={cn(iconSizes[size], className)} 
      />
    );
  }
  
  export function ChevronLeftIcon({ size = 'default', className }: IconProps) {
    return (
      <ChevronLeft 
        className={cn(iconSizes[size], className)} 
      />
    );
  }
  
  export function MinusIcon({ size = 'default', className }: IconProps) {
    return (
      <Minus 
        className={cn(iconSizes[size], className)} 
      />
    );
  }
  
  export function PlusIcon({ size = 'default', className }: IconProps) {
    return (
      <Plus 
        className={cn(iconSizes[size], className)} 
      />
    );
  }
  
  export function HelpIcon({ size = 'default', className }: IconProps) {
    return (
      <HelpCircle 
        className={cn(iconSizes[size], className)} 
      />
    );
  }
  
  export function InfoIcon({ size = 'default', className }: IconProps) {
    return (
      <Info 
        className={cn(iconSizes[size], className)} 
      />
    );
  }
  
  // Composite icon components for common patterns
  interface QuantityControlsProps {
    quantity: number;
    onDecrease: () => void;
    onIncrease: () => void;
    disabled?: boolean;
    size?: keyof typeof iconSizes;
  }
  
  export function QuantityControls({ 
    quantity, 
    onDecrease, 
    onIncrease, 
    disabled = false,
    size = 'sm' 
  }: QuantityControlsProps) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onDecrease}
          disabled={disabled || quantity <= 1}
          className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
          aria-label="Decrease quantity"
        >
          <MinusIcon size={size} />
        </button>
        <span className="font-mono text-sm min-w-[2ch] text-center">
          {quantity}
        </span>
        <button
          onClick={onIncrease}
          disabled={disabled}
          className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
          aria-label="Increase quantity"
        >
          <PlusIcon size={size} />
        </button>
      </div>
    );
  }
  
  // Navigation icon pattern
  interface NavigationIconProps extends IconProps {
    direction: 'left' | 'right';
    label?: string;
  }
  
  export function NavigationIcon({ direction, size = 'default', className, label }: NavigationIconProps) {
    const Icon = direction === 'left' ? ChevronLeftIcon : ChevronRightIcon;
    const defaultLabel = direction === 'left' ? 'Go back' : 'Go forward';
    
    return (
      <Icon 
        size={size} 
        className={className}
        aria-label={label || defaultLabel}
      />
    );
  }
  
  // Loading spinner using CSS animation instead of external library
  export function SpinnerIcon({ size = 'default', className }: IconProps) {
    return (
      <svg 
        className={cn(iconSizes[size], 'animate-spin', className)} 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="2"
          className="opacity-25"
        />
        <path 
          fill="currentColor" 
          d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          className="opacity-75"
        />
      </svg>
    );
  }
  
  // Plus icon for add actions
  export function AddIcon({ size = 'default', className }: IconProps) {
    return (
      <svg
        className={cn(iconSizes[size], className)}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
    );
  }
  
  export { iconSizes };