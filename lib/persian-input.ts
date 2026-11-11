import type { ChangeEvent, CompositionEvent } from "react";
import { toLatinDigits, toPersianDigits } from "@/lib/format";

type TextControl = HTMLInputElement | HTMLTextAreaElement;

/** "0912…" / "٠٩١٢…" → "۰۹۱۲…". Everything that isn't a digit is left alone. */
export function withPersianDigits(value: string): string {
  return toPersianDigits(toLatinDigits(value));
}

const LATIN_OR_ARABIC_DIGIT = /[0-9\u0660-\u0669]/;

/**
 * Handlers for a controlled <input>/<textarea> that shows Persian digits
 * however they were typed (English keyboard, Arabic keyboard, paste):
 *
 *   <input value={phone} {...persianDigits(setPhone)} />
 *
 * `update` receives the converted text. Use it only for fields that hold
 * phone numbers, postal codes or addresses — never for emails, passwords or
 * codes, where changing a digit changes the value.
 *
 * The conversion is done on the DOM element itself, before React re-renders,
 * and the selection is put back: a digit is replaced by exactly one digit, so
 * every position stays valid and the caret doesn't jump to the end when the
 * customer edits in the middle of a long address. Server-side, validation
 * already reads Persian digits (toLatinDigits), so nothing else needs to change.
 */
export function persianDigits(update: (value: string) => void) {
  function convert(el: TextControl) {
    if (LATIN_OR_ARABIC_DIGIT.test(el.value)) {
      const { selectionStart, selectionEnd, selectionDirection } = el;
      el.value = withPersianDigits(el.value);
      if (selectionStart !== null && selectionEnd !== null) {
        el.setSelectionRange(selectionStart, selectionEnd, selectionDirection ?? undefined);
      }
    }
    update(el.value);
  }

  return {
    onChange: (e: ChangeEvent<TextControl>) => {
      // While a keyboard is composing text (some Android keyboards), rewriting
      // the value would cancel the composition — wait for compositionend.
      if ((e.nativeEvent as InputEvent).isComposing) update(e.currentTarget.value);
      else convert(e.currentTarget);
    },
    onCompositionEnd: (e: CompositionEvent<TextControl>) => convert(e.currentTarget),
  };
}
