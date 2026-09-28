/** Persian text arrives with Arabic look-alike letters depending on the keyboard — fold them so search matches either. */
export function normalizeFa(text: string): string {
  return text
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ۀ/g, "ه")
    .replace(/[\u200c\u200f\u200e]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
