import * as React from 'react';
import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentPropsWithoutRef<typeof Sonner>;

const Toaster = React.forwardRef<
  React.ElementRef<typeof Sonner>,
  ToasterProps
>(({ className, ...props }, ref) => (
  <Sonner
    ref={ref}
    className={className}
    {...props}
  />
));
Toaster.displayName = 'Sonner';

export { Toaster };