import React, { useEffect, useState, useRef } from 'react';
import { useSpring, animated } from '@react-spring/web';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  delay?: number;
  formatter?: (value: number) => string;
  className?: string;
}

/**
 * Animated number component that smoothly transitions between values
 */
const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 500,
  delay = 0,
  formatter = (val) => val.toLocaleString(),
  className = '',
}) => {
  // Use a ref to store the previous value for comparison
  const prevValueRef = useRef<number>(value);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  
  // Configure the animation spring
  const { number } = useSpring({
    from: { number: prevValueRef.current },
    number: value,
    delay,
    config: { 
      duration,
      easing: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)), // Exponential ease-out
    },
    immediate: !shouldAnimate, // Only animate after initial render
  });

  // Enable animation after initial render
  useEffect(() => {
    if (!shouldAnimate) {
      setShouldAnimate(true);
    }
    
    // Store the current value for the next animation
    prevValueRef.current = value;
  }, [value, shouldAnimate]);

  return (
    <animated.span className={className}>
      {number.to(n => formatter(n))}
    </animated.span>
  );
};

export default AnimatedNumber;