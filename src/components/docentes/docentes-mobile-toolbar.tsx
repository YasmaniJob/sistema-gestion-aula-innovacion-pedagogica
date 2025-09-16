
'use client';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

type DocentesMobileToolbarProps = {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
};

export function DocentesMobileToolbar({
  searchQuery,
  onSearchQueryChange,
}: DocentesMobileToolbarProps) {

  return (
    <div className="sm:hidden flex items-center gap-2 mb-4">
      <div className="relative w-full flex-grow">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o DNI..."
          className="pl-9 w-full"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
        />
      </div>
    </div>
  );
}
