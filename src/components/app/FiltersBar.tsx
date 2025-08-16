import { ReactNode } from "react";

export function FiltersBar({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[14px] bg-secondary/70 border border-border p-4 flex flex-wrap items-center gap-3">
      {children}
    </div>
  );
}
