import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'bg-surface-strong animate-pulse rounded-[var(--radius-sm)]',
        className,
      )}
      data-slot="skeleton"
      {...props}
    />
  );
}
