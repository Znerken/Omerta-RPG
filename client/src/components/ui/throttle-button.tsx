import React, { forwardRef } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useThrottle } from '@/hooks/use-throttle';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ThrottleButtonProps extends Omit<ButtonProps, 'onClick'> {
  /**
   * The function to call when the button is clicked.
   */
  onClick?: (...args: any[]) => any;
  
  /**
   * The delay before allowing another click, in milliseconds.
   * @default 500
   */
  throttleDelay?: number;
  
  /**
   * Whether to add loading state in the button.
   * @default true
   */
  showLoading?: boolean;
  
  /**
   * Text to display when button is throttled.
   * If not provided, original button text will be shown.
   */
  throttleText?: string;
  
  /**
   * Options for the throttle behavior.
   */
  throttleOptions?: {
    leading?: boolean;
    trailing?: boolean;
  };
}

/**
 * A button that prevents rapid multiple clicks by throttling the onClick handler.
 */
const ThrottleButton = forwardRef<HTMLButtonElement, ThrottleButtonProps>(
  (
    {
      onClick,
      children,
      throttleDelay = 500,
      showLoading = true,
      throttleText,
      throttleOptions = { leading: true, trailing: false },
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    // Set up throttled click handler
    const [throttledClick, isThrottling] = useThrottle(
      onClick || (() => {}),
      throttleDelay,
      throttleOptions
    );

    return (
      <Button
        ref={ref}
        className={cn(className)}
        onClick={throttledClick}
        disabled={disabled || isThrottling}
        {...props}
      >
        {isThrottling && showLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {throttleText || children}
          </>
        ) : (
          children
        )}
      </Button>
    );
  }
);

ThrottleButton.displayName = 'ThrottleButton';

export { ThrottleButton };