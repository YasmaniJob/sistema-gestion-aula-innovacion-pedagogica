
'use client';

import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 640; // sm breakpoint in tailwind

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
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

  return isMobile;
}
