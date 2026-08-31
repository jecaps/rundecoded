import type { ComponentProps } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  children,
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="bg-overlay data-[state=closed]:animate-out data-[state=open]:animate-in fixed inset-0 z-50 backdrop-blur-[2px]" />
      <DialogPrimitive.Content
        className={cn(
          'border-border bg-surface text-foreground fixed top-1/2 left-1/2 z-50 grid w-[min(calc(100%-2rem),32rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-[var(--radius-panel)] border p-6 shadow-2xl outline-none',
          className,
        )}
        data-slot="dialog-content"
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="text-muted-foreground hover:bg-surface-subtle hover:text-foreground focus-visible:ring-ring/35 absolute top-4 right-4 inline-flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:ring-3 focus-visible:outline-none">
          <X aria-hidden="true" className="size-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('grid gap-2 pr-8', className)} {...props} />;
}

export function DialogTitle({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn('text-xl font-semibold tracking-tight', className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-muted-foreground text-sm leading-6', className)}
      {...props}
    />
  );
}
