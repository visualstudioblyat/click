import { useRef, useEffect, useState } from 'react';

export function useAnimatedNumber(target: number, duration = 400): number {
  const [display, setDisplay] = useState(target);
  const frameRef = useRef<number>(0);
  const startRef = useRef(target);
  const startTime = useRef(0);

  useEffect(() => {
    startRef.current = display;
    startTime.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime.current;
      const t = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const value = startRef.current + (target - startRef.current) * eased;
      setDisplay(value);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return display;
}
