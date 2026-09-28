"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const inputStyles = cn(
  "flex h-11 w-full min-w-0 rounded-sm border border-input bg-white px-3.5 py-1 text-sm text-foreground transition-colors outline-none",
  "placeholder:text-muted-foreground",
  "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "aria-invalid:border-destructive aria-invalid:ring-destructive/30"
);

function formatWithSeparators(digitsOnly: string): string {
  if (!digitsOnly) return "";
  return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * The thousandSeparator=true path. Kept as its own component (rather
 * than branching inside Input itself) since it needs its own state/ref
 * — React hooks can't be called conditionally within one component.
 *
 * Displays a live-grouped number ("1,890,000") while still handing the
 * parent's onChange a plain digit string via e.target.value, exactly
 * like a normal <input> — so an existing `onChange={(e) =>
 * setPrice(e.target.value)}` call site keeps working unchanged; only
 * the `thousandSeparator` prop needs adding.
 */
function NumberInputWithSeparator({
  className,
  value,
  onChange,
  ...props
}: Omit<React.ComponentProps<"input">, "type" | "value"> & {
  value?: string | number | readonly string[];
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const rawValue = value == null ? "" : String(value).replace(/[^0-9]/g, "");
  const [displayValue, setDisplayValue] = React.useState(() => formatWithSeparators(rawValue));

  // Keeps the display in sync if the parent changes `value` from the
  // outside (loading a record into an edit form, resetting the form) —
  // adjusted during render, and only when it differs from what's shown, so
  // it doesn't fight with the user's own typing.
  if (displayValue.replace(/[^0-9]/g, "") !== rawValue) {
    setDisplayValue(formatWithSeparators(rawValue));
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const el = e.target;
    const cursorPos = el.selectionStart ?? el.value.length;
    const digitsBeforeCursor = el.value.slice(0, cursorPos).replace(/[^0-9]/g, "").length;
    const onlyDigits = el.value.replace(/[^0-9]/g, "");
    const formatted = formatWithSeparators(onlyDigits);

    // Mutate the real element's value to the plain digits just long
    // enough for the parent's onChange to read e.target.value as usual
    // — React's own re-render (via the controlled `value` below) then
    // puts the formatted display back right after.
    el.value = onlyDigits;
    onChange?.(e);
    setDisplayValue(formatted);

    // Deferred a frame so this runs after React has actually committed
    // the new (formatted) value to the DOM — setting selection range
    // before that would measure against the stale value.
    requestAnimationFrame(() => {
      const node = inputRef.current;
      if (!node) return;
      let newPos = 0;
      if (digitsBeforeCursor > 0) {
        newPos = formatted.length;
        let seenDigits = 0;
        for (let i = 0; i < formatted.length; i++) {
          if (/[0-9]/.test(formatted[i])) {
            seenDigits++;
            if (seenDigits === digitsBeforeCursor) {
              newPos = i + 1;
              break;
            }
          }
        }
      }
      node.setSelectionRange(newPos, newPos);
    });
  }

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      data-slot="input"
      value={displayValue}
      onChange={handleChange}
      className={cn(inputStyles, className)}
      {...props}
    />
  );
}

function Input({
  className,
  type,
  thousandSeparator,
  ...props
}: React.ComponentProps<"input"> & {
  /** Live-groups digits by 3 ("1,890,000") as the user types — useful
   * for prices, quantities, anything meant to be read at a glance.
   * The parent's onChange still receives the plain, ungrouped digit
   * string via e.target.value, same as a normal number input. */
  thousandSeparator?: boolean;
}) {
  if (thousandSeparator) {
    return <NumberInputWithSeparator className={className} {...props} />;
  }

  return (
    <input type={type} data-slot="input" className={cn(inputStyles, className)} {...props} />
  );
}

export { Input };