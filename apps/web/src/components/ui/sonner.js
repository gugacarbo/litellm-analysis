import * as React from "react";
import { jsx as _jsx } from "react/jsx-runtime";
import { Toaster as Sonner } from "sonner";

const Toaster = React.forwardRef(({ className, ...props }, ref) =>
  _jsx(Sonner, { ref: ref, className: className, ...props }),
);
Toaster.displayName = "Sonner";

export { Toaster };
