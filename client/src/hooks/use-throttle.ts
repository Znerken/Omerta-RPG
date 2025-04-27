import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Custom hook to throttle a function call.
 * 
 * @param fn The function to throttle
 * @param delay The delay in milliseconds
 * @param options Configuration options
 * @returns A tuple containing [throttledFn, isThrottling]
 */
export function useThrottle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300,
  options: { 
    leading?: boolean; // Call function immediately on first invocation
    trailing?: boolean; // Call function after delay when throttling ends
  } = { leading: true, trailing: true }
): [(...args: Parameters<T>) => void, boolean] {
  const { leading = true, trailing = true } = options;
  
  // Refs to track state between renders
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastArgs = useRef<Parameters<T> | null>(null);
  const [isThrottling, setIsThrottling] = useState(false);

  // Cleanup timers when component unmounts
  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, []);

  // The throttled function
  const throttledFn = useCallback(
    (...args: Parameters<T>) => {
      lastArgs.current = args;
      
      // If not currently throttling and leading is enabled, call immediately
      if (!isThrottling && leading) {
        fn(...args);
      }
      
      // If we're not already in a throttle period, start one
      if (!isThrottling) {
        setIsThrottling(true);
        
        // Set a timer to end the throttle period
        timer.current = setTimeout(() => {
          // If trailing is enabled, call with the most recent args
          if (trailing && lastArgs.current) {
            fn(...lastArgs.current);
          }
          
          // Reset throttle state
          setIsThrottling(false);
          lastArgs.current = null;
          timer.current = null;
        }, delay);
      }
    },
    [fn, delay, isThrottling, leading, trailing]
  );

  return [throttledFn, isThrottling];
}

/**
 * Custom hook to debounce a function call.
 * 
 * @param fn The function to debounce
 * @param delay The delay in milliseconds
 * @param options Configuration options
 * @returns A tuple containing [debouncedFn, isPending, cancel]
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 500,
  options: { 
    leading?: boolean; // Call function immediately on first invocation 
    maxWait?: number;  // Maximum time to wait before forced execution
  } = {}
): [(...args: Parameters<T>) => void, boolean, () => void] {
  const { leading = false, maxWait } = options;
  
  // Refs to track state between renders
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCallTime = useRef<number | null>(null);
  const lastArgs = useRef<Parameters<T> | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Cleanup timers when component unmounts
  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      if (maxTimer.current) {
        clearTimeout(maxTimer.current);
        maxTimer.current = null;
      }
    };
  }, []);

  // Function to execute the callback and reset state
  const executeCallback = useCallback(() => {
    if (lastArgs.current) {
      fn(...lastArgs.current);
    }
    setIsPending(false);
    lastCallTime.current = null;
    lastArgs.current = null;
    
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (maxTimer.current) {
      clearTimeout(maxTimer.current);
      maxTimer.current = null;
    }
  }, [fn]);

  // Cancel function to abort pending operations
  const cancel = useCallback(() => {
    setIsPending(false);
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (maxTimer.current) {
      clearTimeout(maxTimer.current);
      maxTimer.current = null;
    }
    lastArgs.current = null;
  }, []);

  // The debounced function
  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      lastArgs.current = args;
      const now = Date.now();
      lastCallTime.current = now;
      setIsPending(true);
      
      // If leading and it's the first call, execute immediately
      if (leading && !timer.current) {
        executeCallback();
        return;
      }
      
      // Clear any existing timer
      if (timer.current) {
        clearTimeout(timer.current);
      }
      
      // Set a new debounce timer
      timer.current = setTimeout(executeCallback, delay);
      
      // Setup maxWait timer if specified
      if (maxWait && !maxTimer.current && lastCallTime.current) {
        const timeSinceLastCall = now - lastCallTime.current;
        const timeToWait = Math.max(0, maxWait - timeSinceLastCall);
        
        maxTimer.current = setTimeout(executeCallback, timeToWait);
      }
    },
    [delay, executeCallback, leading, maxWait]
  );

  return [debouncedFn, isPending, cancel];
}

/**
 * Hook to perform rate-limited API calls with visual feedback
 * and support for aborting in-flight requests.
 * 
 * @param fn The async function to call
 * @param options Configuration options
 * @returns A tuple containing [throttledAsyncFn, status, abort]
 */
export function useThrottledAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    delay?: number;         // Minimum time between calls in ms (default: 500)
    cooldown?: number;      // Additional delay after completion before next call (default: 200)
    showLoadingAfter?: number; // Delay before showing loading state (default: 300)
    abortPrevious?: boolean; // Abort previous request if new one comes in (default: true)
  } = {}
) {
  const {
    delay = 500,
    cooldown = 200,
    showLoadingAfter = 300,
    abortPrevious = true
  } = options;
  
  // Track state between renders
  const abortController = useRef<AbortController | null>(null);
  const lastCallTime = useRef<number>(0);
  const loadingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // State for tracking status
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<Error | null>(null);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
      if (loadingTimer.current) {
        clearTimeout(loadingTimer.current);
      }
    };
  }, []);
  
  // Function to abort current request
  const abort = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
    if (loadingTimer.current) {
      clearTimeout(loadingTimer.current);
      loadingTimer.current = null;
    }
    setStatus('idle');
  }, []);
  
  // The throttled async function
  const throttledAsyncFn = useCallback(
    async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTime.current;
      
      // If we need to throttle, delay execution
      if (timeSinceLastCall < delay) {
        await new Promise(resolve => setTimeout(resolve, delay - timeSinceLastCall));
      }
      
      // Abort previous request if needed
      if (abortPrevious && abortController.current) {
        abortController.current.abort();
      }
      
      // Create new abort controller for this request
      const controller = new AbortController();
      abortController.current = controller;
      
      // Set up delayed loading state
      if (loadingTimer.current) {
        clearTimeout(loadingTimer.current);
      }
      
      loadingTimer.current = setTimeout(() => {
        if (!controller.signal.aborted) {
          setStatus('loading');
        }
        loadingTimer.current = null;
      }, showLoadingAfter);
      
      try {
        // Update timestamp for throttling
        lastCallTime.current = Date.now();
        
        // Call the function with abort signal
        const result = await fn(...[...args, controller.signal]);
        
        // Clear loading timer if it's still active
        if (loadingTimer.current) {
          clearTimeout(loadingTimer.current);
          loadingTimer.current = null;
        }
        
        // Only update state if this request hasn't been aborted
        if (!controller.signal.aborted) {
          setStatus('success');
          setError(null);
          
          // Reset status after cooldown
          if (cooldown > 0) {
            setTimeout(() => {
              if (!controller.signal.aborted) {
                setStatus('idle');
              }
            }, cooldown);
          }
        }
        
        return result as ReturnType<T>;
      } catch (err) {
        // Clear loading timer if it's still active
        if (loadingTimer.current) {
          clearTimeout(loadingTimer.current);
          loadingTimer.current = null;
        }
        
        // Only update state if this request hasn't been aborted
        if (!controller.signal.aborted && err instanceof Error && err.name !== 'AbortError') {
          setStatus('error');
          setError(err as Error);
          
          // Reset error status after cooldown
          if (cooldown > 0) {
            setTimeout(() => {
              if (!controller.signal.aborted) {
                setStatus('idle');
              }
            }, cooldown);
          }
        }
      } finally {
        // Clean up reference if this is still the active controller
        if (abortController.current === controller) {
          abortController.current = null;
        }
      }
      
      return undefined as unknown as ReturnType<T>;
    },
    [fn, delay, cooldown, showLoadingAfter, abortPrevious]
  );
  
  return { 
    execute: throttledAsyncFn, 
    status, 
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error',
    error,
    abort 
  };
}