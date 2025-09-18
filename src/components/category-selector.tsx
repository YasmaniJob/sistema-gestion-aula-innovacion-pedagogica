
'use client';

import { useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useData } from '@/context/data-provider-refactored';
import { getCategoryVisuals } from '@/domain/constants';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from './ui/scroll-area';
import useEmblaCarousel from 'embla-carousel-react';
import type { EmblaCarouselType } from 'embla-carousel-react';

type CategorySelectorProps = {
  activeCategory: string;
  onCategoryChange: (categoryName: string) => void;
};

export function CategorySelector({
  activeCategory,
  onCategoryChange,
}: CategorySelectorProps) {
  const { categories } = useData();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'keepSnaps',
  });

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  useEffect(() => {
    if (!emblaApi || sortedCategories.length === 0) return;

    const activeIndex = sortedCategories.findIndex(
      (c) => c.name === activeCategory
    );
    if (activeIndex !== -1) {
      emblaApi.scrollTo(activeIndex, true);
    }
  }, [emblaApi, activeCategory, sortedCategories]);

  return (
    <div className="w-full overflow-hidden">
      <div className="embla" ref={emblaRef}>
        <div className="embla__container flex space-x-2 p-1">
          {sortedCategories.map((category) => {
            const { icon: Icon, color } = getCategoryVisuals(category.name);
            const isActive = category.name === activeCategory;
            return (
              <div key={category.name} className="embla__slide flex-shrink-0">
                <Button
                  variant={isActive ? 'default' : 'outline'}
                  className="flex items-center gap-2 whitespace-nowrap"
                  onClick={() => onCategoryChange(category.name)}
                >
                  <Icon className={cn('h-4 w-4', isActive ? '' : color)} />
                  {category.name}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
