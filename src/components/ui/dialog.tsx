'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

type DialogContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>;

export function DialogContent({ className, children, ...props }: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px]" />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2',
          'rounded-md border border-border bg-paper p-6 shadow-lg focus:outline-none',
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm text-muted hover:text-ink">
          <X className="h-4 w-4" />
          <span className="sr-only">Fermer</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4', className)} {...props} />;
}

type DialogTitleProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>;

export function DialogTitle({ className, ...props }: DialogTitleProps) {
  return <DialogPrimitive.Title className={cn('text-base font-semibold', className)} {...props} />;
}

type DialogDescriptionProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>;

/** Toujours présent pour l'accessibilité (lu par les lecteurs d'écran) ; peut rester visuellement masqué. */
export function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return <DialogPrimitive.Description className={cn('sr-only', className)} {...props} />;
}
