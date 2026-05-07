import { Switch as SwitchPrimitive } from "radix-ui";
import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "../../lib/utils";

function Switch({ className, ...props }) {
  return _jsx(SwitchPrimitive.Root, {
    "data-slot": "switch",
    className: cn(
      "inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent bg-muted transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary",
      className,
    ),
    ...props,
    children: _jsx(SwitchPrimitive.Thumb, {
      "data-slot": "switch-thumb",
      className:
        "pointer-events-none block size-4 rounded-full bg-background transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0",
    }),
  });
}

export { Switch };
