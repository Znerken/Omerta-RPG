import React, { ChangeEvent, forwardRef, useEffect, useRef, useState } from 'react';
import { useDebounce } from '@/hooks/use-throttle';
import { Input, InputProps } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface ThrottledInputProps extends Omit<InputProps, 'onChange'> {
  /**
   * Function called when the input value changes
   */
  onChange?: (value: string) => void;
  
  /**
   * Delay in milliseconds before the onChange function is called
   * @default 300
   */
  debounceDelay?: number;
  
  /**
   * Label for the input field
   */
  label?: string;
  
  /**
   * Show loading indicator when the input is debouncing
   * @default false
   */
  showLoading?: boolean;
  
  /**
   * Additional CSS classes for the loading indicator
   */
  loadingClassName?: string;

  /**
   * Container className
   */
  containerClassName?: string;
  
  /**
   * Label className
   */
  labelClassName?: string;
}

/**
 * Input component that debounces the onChange handler
 * to prevent excessive updates during rapid typing
 */
const ThrottledInput = forwardRef<HTMLInputElement, ThrottledInputProps>(
  ({ 
    onChange, 
    debounceDelay = 300, 
    label,
    showLoading = false,
    loadingClassName,
    containerClassName,
    labelClassName,
    className,
    ...props
  }, ref) => {
    const [localValue, setLocalValue] = useState(props.value || props.defaultValue || '');
    const inputRef = useRef<HTMLInputElement | null>(null);
    
    // Combine the forwarded ref with our local ref
    const setRefs = (element: HTMLInputElement) => {
      inputRef.current = element;
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLInputElement>).current = element;
      }
    };
    
    // Create a debounced handler
    const [debouncedChange, isDebouncePending] = useDebounce((value: string) => {
      onChange?.(value);
    }, debounceDelay);
    
    // Handle input changes
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      debouncedChange(newValue);
    };
    
    // Update local value when props change
    useEffect(() => {
      if (props.value !== undefined && props.value !== localValue) {
        setLocalValue(props.value as string);
      }
    }, [props.value]);
    
    return (
      <div className={cn("space-y-2", containerClassName)}>
        {label && (
          <Label 
            className={cn("text-sm font-medium", labelClassName)} 
            htmlFor={props.id}
          >
            {label}
          </Label>
        )}
        <div className="relative">
          <Input
            {...props}
            ref={setRefs}
            value={localValue}
            onChange={handleChange}
            className={cn(
              "pr-8",
              { "pr-12": showLoading && isDebouncePending },
              className
            )}
          />
          {showLoading && isDebouncePending && (
            <div className={cn("absolute right-3 top-1/2 -translate-y-1/2", loadingClassName)}>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>
      </div>
    );
  }
);

ThrottledInput.displayName = 'ThrottledInput';

export { ThrottledInput };