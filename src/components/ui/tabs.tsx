import type { ComponentProps } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/lib/utils';

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'bg-surface-subtle inline-flex min-h-10 items-center gap-1 rounded-[var(--radius-control)] p-1',
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'text-muted-foreground hover:text-foreground focus-visible:ring-ring/35 data-[state=active]:bg-surface data-[state=active]:text-foreground cursor-pointer rounded-[var(--radius-sm)] px-3 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 data-[state=active]:shadow-sm',
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn(
        'border-border bg-surface focus-visible:ring-ring/35 mt-4 rounded-[var(--radius-control)] border p-4 text-sm leading-6 outline-none focus-visible:ring-3',
        className,
      )}
      {...props}
    />
  );
}
