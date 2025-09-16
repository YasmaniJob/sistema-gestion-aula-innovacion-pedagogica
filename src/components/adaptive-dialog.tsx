'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffect, useState } from 'react';

type AdaptiveDialogProps = {
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  trigger?: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AdaptiveDialog({
  isOpen,
  onOpenChange,
  trigger,
  title,
  description,
  children,
}: AdaptiveDialogProps) {
  const [isClient, setIsClient] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const dialogProps = {
    open: isOpen,
    onOpenChange: onOpenChange,
  };

  if (!isClient) {
    return (
      <Dialog {...dialogProps}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  if (isMobile) {
    return (
      <Sheet {...dialogProps}>
        {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
        <SheetContent side="bottom">
          <SheetHeader className="text-left">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </SheetHeader>
          <div className="py-4">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog {...dialogProps}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
