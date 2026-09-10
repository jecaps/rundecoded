import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

export function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'border-border bg-background placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-ring/25 flex h-10 w-full rounded-[var(--radius-control)] border px-3 py-2 text-sm outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      data-slot="input"
      type={type}
      {...props}
    />
  );
}
