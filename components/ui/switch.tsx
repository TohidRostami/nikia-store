"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      dir="ltr"
      className={cn(
        "peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-transparent outline-none transition-colors",
        "data-[state=checked]:bg-primary",
        "data-[state=unchecked]:bg-secondary",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none absolute top-1/2 left-0.5 block size-5 -translate-y-1/2 rounded-full bg-background shadow-sm ring-0",
          "transition-[left] duration-200 ease-in-out",
          "data-[state=unchecked]:left-0.5",
          "data-[state=checked]:left-[calc(100%-1.375rem)]"
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };