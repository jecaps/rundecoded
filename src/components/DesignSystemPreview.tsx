import { Info, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const swatches = [
  { className: 'bg-background', label: 'Background' },
  { className: 'bg-surface', label: 'Surface' },
  { className: 'bg-surface-subtle', label: 'Subtle' },
  { className: 'bg-primary', label: 'Primary' },
];

export function DesignSystemPreview() {
  return (
    <div className="grid gap-10">
      <section aria-labelledby="colors-title" className="grid gap-4">
        <div>
          <p className="route-preview__eyebrow">Semantic tokens</p>
          <h2
            id="colors-title"
            className="text-2xl font-semibold tracking-tight"
          >
            Theme-aware color roles
          </h2>
        </div>
        <div className="tablet:grid-cols-4 grid grid-cols-2 gap-3">
          {swatches.map((swatch) => (
            <div
              className="border-border bg-surface overflow-hidden rounded-[var(--radius-control)] border shadow-sm"
              key={swatch.label}
            >
              <div className={`h-20 ${swatch.className}`} />
              <p className="border-border text-muted-foreground m-0 border-t px-3 py-2 text-xs font-medium">
                {swatch.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="controls-title" className="grid gap-4">
        <div>
          <p className="route-preview__eyebrow">Project components</p>
          <h2
            id="controls-title"
            className="text-2xl font-semibold tracking-tight"
          >
            Consistent states and behavior
          </h2>
        </div>
        <div className="border-border bg-surface flex flex-wrap items-center gap-3 rounded-[var(--radius-panel)] border p-5 shadow-sm">
          <Button>Primary action</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label="About this preview"
                  size="icon"
                  variant="ghost"
                >
                  <Info aria-hidden="true" className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Keyboard-accessible tooltip</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Sparkles aria-hidden="true" className="size-4" />
                Open dialog
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Accessible by default</DialogTitle>
                <DialogDescription>
                  Focus is contained while this dialog is open. Press Escape or
                  use the close button to return to the trigger.
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <section aria-labelledby="tabs-title" className="grid gap-4">
        <div>
          <p className="route-preview__eyebrow">Layered content</p>
          <h2 id="tabs-title" className="text-2xl font-semibold tracking-tight">
            Radix-backed in-page tabs
          </h2>
        </div>
        <Tabs defaultValue="principle">
          <TabsList aria-label="Design-system guidance">
            <TabsTrigger value="principle">Principle</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
          </TabsList>
          <TabsContent value="principle">
            Use semantic tokens so light and dark themes communicate the same
            hierarchy without page-specific overrides.
          </TabsContent>
          <TabsContent value="usage">
            Prefer native HTML for simple links and buttons. Choose Radix when
            focus management, keyboard navigation, or layered content needs
            proven behavior.
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
