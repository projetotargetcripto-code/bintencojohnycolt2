import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";

export default function CobrancasComercialPage() {
  return (
    <Protected allowedRoles={["comercial"]}>
      <AppShell
        menuKey="comercial"
        breadcrumbs={[{ label: "Comercial", href: "/comercial" }, { label: "Cobranças" }]}
      >
        <div className="space-y-4">
          <h1 className="text-xl font-semibold">Cobranças</h1>
          <p className="text-muted-foreground">Nenhuma cobrança registrada.</p>
        </div>
      </AppShell>
    </Protected>
  );
}
