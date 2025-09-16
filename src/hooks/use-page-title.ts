
'use client';

import { useEffect } from 'react';
import { useSidebar } from '@/components/layout/sidebar-provider';

export function usePageTitle(title: string) {
  const { setPageTitle } = useSidebar();

  useEffect(() => {
    setPageTitle(title);

    // Clean up the title when the component unmounts
    return () => {
      setPageTitle('');
    };
  }, [title, setPageTitle]);
}
