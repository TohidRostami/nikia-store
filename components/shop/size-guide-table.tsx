import { buildSizeTable } from "@/lib/size-guide";
import { toPersianDigits } from "@/lib/format";

export function SizeGuideTable({ sizes }: { sizes: { name: string; description: string | null }[] }) {
  const { rows, labels } = buildSizeTable(sizes);
  if (rows.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-md border border-[#e2dace] bg-white">
      <table className="w-full border-collapse text-center text-[13px]">
        <thead>
          <tr className="bg-sand">
            <th className="p-2.5 font-semibold">سایز</th>
            {labels.length > 0 ? (
              labels.map((l) => (
                <th key={l} className="p-2.5 font-semibold">
                  {l}
                </th>
              ))
            ) : (
              <th className="p-2.5 font-semibold">اندازه‌ها</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.name} className={i % 2 ? "bg-paper" : undefined}>
              <td className="p-2.5 font-medium">{toPersianDigits(row.name)}</td>
              {labels.length > 0 ? (
                labels.map((l) => (
                  <td key={l} className="p-2.5">
                    {row.measures.find((m) => m.label === l)?.value ?? "—"}
                  </td>
                ))
              ) : (
                <td className="p-2.5">{row.measures.map((m) => m.value).join(" · ") || "—"}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-3 py-2.5 text-[11px] text-muted-foreground">اندازه‌ها به سانتی‌متر است.</div>
    </div>
  );
}
