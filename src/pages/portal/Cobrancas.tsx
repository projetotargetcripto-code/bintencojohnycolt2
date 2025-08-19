import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";

export default function PortalCobrancasPage() {
  return (
    <Protected>
      <AppShell
        menuKey="portal"
        breadcrumbs={[{ label: "Portal", href: "/portal" }, { label: "Cobranças" }]}
      >
        <div className="space-y-4">
          <h1 className="text-xl font-semibold">Minhas Cobranças</h1>
          <p className="text-muted-foreground">Você não possui cobranças no momento.</p>
        </div>
      </AppShell>
    </Protected>
  );
}
