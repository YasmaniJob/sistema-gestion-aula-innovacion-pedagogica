
'use client';

import { useState, useEffect } from 'react';

const MEDIUM_BREAKPOINT = 1024; // lg breakpoint in tailwind

export function useIsMedium() {
  const [isMedium, setIsMedium] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMedium(window.innerWidth < MEDIUM_BREAKPOINT);
    };

    // Check on mount
    checkDevice();

    // Add listener for window resize
    window.addEventListener('resize', checkDevice);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  return isMedium;
}
