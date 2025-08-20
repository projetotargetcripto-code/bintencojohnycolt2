import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { DataTable, type Column } from "@/components/app/DataTable";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@supabase/supabase-js";

interface Breadcrumb {
  label: string;
  href?: string;
}

export interface ExtratosPageProps {
  query: (user: User) => Promise<Record<string, any>[]>;
  columns: Column[];
  menuKey: string;
  breadcrumbs: Breadcrumb[];
}

export function ExtratosPage({ query, columns, menuKey, breadcrumbs }: ExtratosPageProps) {
  const { user } = useAuth();
  const [rows, setRows] = useState<Record<string, any>[]>([]);

  useEffect(() => {
    if (!user) return;
    query(user).then((data) => setRows(data ?? []));
  }, [user, query]);

  return (
    <AppShell menuKey={menuKey} breadcrumbs={breadcrumbs}>
      <DataTable columns={columns} rows={rows} pageSize={5} />
    </AppShell>
  );
}
