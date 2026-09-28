// Character-level transliteration, not full phonetic reconstruction —
// Persian script doesn't write short vowels, so e.g. "کفش" becomes
// "kfsh" rather than "kafsh". Still produces a valid, unique, readable
// slug; the admin can always hand-edit the generated result afterward
// (see slugTouched in the forms that use this).
const PERSIAN_TO_LATIN: Record<string, string> = {
  ا: "a", آ: "a", أ: "a", إ: "a",
  ب: "b", پ: "p", ت: "t", ث: "s",
  ج: "j", چ: "ch", ح: "h", خ: "kh",
  د: "d", ذ: "z", ر: "r", ز: "z", ژ: "zh",
  س: "s", ش: "sh", ص: "s", ض: "z",
  ط: "t", ظ: "z", ع: "a", غ: "gh",
  ف: "f", ق: "gh", ک: "k", ك: "k", گ: "g",
  ل: "l", م: "m", ن: "n", و: "v",
  ه: "h", ة: "h", ی: "i", ي: "i", ء: "",
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
};

function transliteratePersian(value: string): string {
  return value
    .split("")
    .map((ch) => PERSIAN_TO_LATIN[ch] ?? ch)
    .join("");
}

/** Generates a URL-safe slug from any mix of Persian and Latin text. */
export function slugify(value: string): string {
  return transliteratePersian(value)
    .toLowerCase()
    .trim()
    .replace(/[\u200c\s]+/g, "-") // ZWNJ (نیم‌فاصله) and whitespace -> hyphen
    .replace(/[^a-z0-9-]/g, "") // drop anything else that isn't latin/digit/hyphen
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
