import type { ComponentProps } from 'react';
import { Toaster as SonnerToaster } from 'sonner';

export function Toaster(props: ComponentProps<typeof SonnerToaster>) {
  return (
    <SonnerToaster
      duration={3000}
      position="top-center"
      richColors
      toastOptions={{
        classNames: {
          toast: 'font-sans',
        },
      }}
      {...props}
    />
  );
}
