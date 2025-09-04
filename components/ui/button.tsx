import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// Button variants using consistent design system
const buttonVariants = {
  variant: {
    primary: 'bg-black text-white hover:bg-gray-800 focus:ring-black',
    secondary: 'bg-transparent text-black border border-gray-300 hover:bg-black hover:text-white focus:ring-gray-500',
    ghost: 'bg-transparent text-black hover:bg-gray-100 focus:ring-gray-300',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  },
  size: {
    sm: 'h-8 px-3 text-xs',
    default: 'h-10 px-4 text-sm', 
    lg: 'h-12 px-6 text-sm',
    icon: 'size-8 p-0',
    iconLg: 'size-12 p-0',
  },
  shape: {
    default: 'rounded',
    square: 'rounded-none',
    pill: 'rounded-full',
  }
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants.variant;
  size?: keyof typeof buttonVariants.size;
  shape?: keyof typeof buttonVariants.shape;
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'default',
    shape = 'default',
    loading = false,
    fullWidth = false,
    disabled,
    children, 
    ...props 
  }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center font-mono font-semibold',
          'transition-all duration-200 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-95',
          
          // Variants
          buttonVariants.variant[variant],
          buttonVariants.size[size], 
          buttonVariants.shape[shape],
          
          // Conditional styles
          fullWidth && 'w-full',
          loading && 'cursor-wait',
          
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg 
            className="mr-2 size-4 animate-spin" 
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
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Specialized button components for common use cases
export const IconButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'size'> & { size?: 'icon' | 'iconLg' }>(
  ({ size = 'icon', variant = 'ghost', ...props }, ref) => (
    <Button ref={ref} size={size} variant={variant} {...props} />
  )
);
IconButton.displayName = 'IconButton';

export const AddToCartButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  ({ children = 'ADD TO CART', ...props }, ref) => (
    <Button ref={ref} variant="primary" fullWidth {...props}>
      {children}
    </Button>
  )
);
AddToCartButton.displayName = 'AddToCartButton';

export const VariantButton = forwardRef<HTMLButtonElement, ButtonProps & { selected?: boolean }>(
  ({ selected, variant, ...props }, ref) => (
    <Button 
      ref={ref} 
      variant={selected ? 'primary' : 'secondary'} 
      size="default"
      {...props} 
    />
  )
);
VariantButton.displayName = 'VariantButton';

export { Button, buttonVariants };