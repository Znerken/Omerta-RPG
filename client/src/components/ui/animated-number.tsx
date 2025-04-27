import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useSpring, animated, config } from '@react-spring/web';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  delay?: number;
  formatter?: (value: number) => string;
  className?: string;
  prefix?: string;
  suffix?: string;
  formatOptions?: Intl.NumberFormatOptions;
  threshold?: number; // Only animate if the difference exceeds this threshold
  springConfig?: 'default' | 'gentle' | 'wobbly' | 'stiff' | 'slow' | 'molasses' | { tension: number; friction: number };
}

/**
 * Animated number component that smoothly transitions between values
 * with performance optimizations and customizable formatting
 */
const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 400,
  delay = 0,
  formatter,
  className = '',
  prefix = '',
  suffix = '',
  formatOptions,
  threshold = 0,
  springConfig = 'default',
}) => {
  // Use refs to store values for comparison without causing re-renders
  const prevValueRef = useRef<number>(value);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldSkipAnimation = Math.abs(value - prevValueRef.current) <= threshold;
  
  // Create a memoized formatter function
  const formatterFn = useMemo(() => {
    if (formatter) return formatter;
    
    // Use Intl.NumberFormat for efficient number formatting when custom formatter not provided
    const numberFormatter = new Intl.NumberFormat(undefined, formatOptions);
    return (val: number) => `${prefix}${numberFormatter.format(val)}${suffix}`;
  }, [formatter, formatOptions, prefix, suffix]);
  
  // Get the appropriate spring configuration
  const springConfigValue = useMemo(() => {
    if (typeof springConfig === 'object') {
      return springConfig;
    }
    
    if (springConfig in config) {
      return config[springConfig as keyof typeof config];
    }
    
    return {
      tension: 170,
      friction: 26,
      duration,
    };
  }, [springConfig, duration]);
  
  // Configure the animation spring
  const { number } = useSpring({
    from: { number: prevValueRef.current },
    to: { number: value },
    delay,
    config: springConfigValue,
    immediate: !shouldAnimate || shouldSkipAnimation,
    onRest: () => {
      // Clean up any timeouts when animation completes
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    },
  });

  // Enable animation after initial render and handle value changes
  useEffect(() => {
    // First time setup - no animation
    if (!shouldAnimate) {
      setShouldAnimate(true);
      prevValueRef.current = value;
      return;
    }
    
    // Clear any pending animation timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    
    // Add a small debounce to avoid too many re-renders when values change rapidly
    animationTimeoutRef.current = setTimeout(() => {
      prevValueRef.current = value;
    }, duration + 50);
    
    // Cleanup on unmount
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [value, duration, shouldAnimate]);

  return (
    <animated.span className={className}>
      {number.to(formatterFn)}
    </animated.span>
  );
};

export default AnimatedNumber;