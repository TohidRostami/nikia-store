/**
 * Size rows are stored as free text by the admin, e.g.
 * "دور سینه ۹۲ · دور کمر ۷۴ · قد ۱۱۰". This splits that into labelled
 * measurements so the size guide can show a proper table.
 */
export function parseSizeDescription(description: string | null): { label: string; value: string }[] {
  if (!description) return [];
  return description
    .split(/[·|،,]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const m = part.match(/^(.*?)\s*([\d۰-۹٠-٩][\d۰-۹٠-٩.\-–/]*)$/);
      return m && m[1] ? { label: m[1].trim(), value: m[2] } : { label: "", value: part };
    });
}

export type SizeRow = { name: string; measures: { label: string; value: string }[] };

/** Rows plus the union of measurement labels, in first-seen order. */
export function buildSizeTable(sizes: { name: string; description: string | null }[]) {
  const rows: SizeRow[] = sizes.map((s) => ({ name: s.name, measures: parseSizeDescription(s.description) }));
  const labels: string[] = [];
  for (const row of rows) {
    for (const m of row.measures) if (m.label && !labels.includes(m.label)) labels.push(m.label);
  }
  return { rows, labels };
}
