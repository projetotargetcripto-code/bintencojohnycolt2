import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

export interface Column { key: string; header: string }
export interface DataTableProps { columns: Column[]; rows: Record<string, any>[]; pageSize?: number }

export function DataTable({ columns, rows, pageSize = 5 }: DataTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const data = [...rows];
    if (!sortKey) return data;
    data.sort((a, b) => {
      const va = a[sortKey]; const vb = b[sortKey];
      if (va === vb) return 0;
      if (va == null) return -1;
      if (vb == null) return 1;
      return va > vb ? 1 : -1;
    });
    return sortDir === "asc" ? data : data.reverse();
  }, [rows, sortKey, sortDir]);

  const start = page * pageSize;
  const slice = sorted.slice(start, start + pageSize);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));

  function onSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  return (
    <div className="rounded-[14px] border border-border bg-secondary/60 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-background/60">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="text-left px-3 py-2 border-b border-border cursor-pointer select-none" onClick={() => onSort(c.key)}>
                  <span className="inline-flex items-center gap-1">{c.header}{sortKey===c.key && (sortDir==='asc'?' ▲':' ▼')}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row, i) => (
              <tr key={i} className="hover:bg-background/40">
                {columns.map((c) => (
                  <td key={c.key} className="px-3 py-2 border-b border-border font-mono">{String(row[c.key] ?? "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-3 py-2 text-xs">
        <span>Página {page+1} de {totalPages}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p)=>Math.max(0,p-1))} disabled={page===0}>Anterior</Button>
          <Button variant="outline" size="sm" onClick={() => setPage((p)=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1}>Próxima</Button>
        </div>
      </div>
    </div>
  );
}
