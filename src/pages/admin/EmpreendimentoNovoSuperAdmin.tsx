import { AppShell } from "@/components/shell/AppShell";

export default function EmpreendimentoNovoSuperAdmin() {
  return (
    <AppShell
      menuKey="superadmin"
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Super Admin" },
        { label: "Empreendimentos" },
        { label: "Novo" }
      ]}
    >
      <div className="text-center py-12">
        <h1 className="text-2xl font-semibold">Novo Empreendimento</h1>
        <p className="text-muted-foreground">Página em desenvolvimento.</p>
      </div>
    </AppShell>
  );
}
