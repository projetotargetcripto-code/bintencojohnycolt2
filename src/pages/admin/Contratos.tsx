import { useEffect, useState } from "react";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { supabase } from "@/lib/dataClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/app/DataTable";
import { toast } from "sonner";

interface DocTemplate {
  id: string;
  name: string;
  storage_path: string;
}

export default function ContratosPage() {
  const [templates, setTemplates] = useState<DocTemplate[]>([]);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data, error } = await supabase
      .from("doc_templates")
      .select("id, name, storage_path")
      .order("name");
    if (error) toast.error("Erro ao carregar templates: " + error.message);
    setTemplates(data || []);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { toast.error("Selecione um arquivo DOCX"); return; }
    if (!name.trim()) { toast.error("Informe o nome"); return; }
    setLoading(true);
    try {
      const path = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
      const { error: upErr } = await supabase.storage.from("doc-templates").upload(path, file);
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("doc_templates").insert({ name: name.trim(), storage_path: path });
      if (insErr) throw insErr;
      toast.success("Template enviado");
      setName("");
      setFile(null);
      load();
    } catch (err: any) {
      toast.error("Falha no upload: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const columns: Column[] = [
    { key: "name", header: "Nome" },
    { key: "storage_path", header: "Arquivo" },
  ];

  const rows = templates.map((t) => ({ id: t.id, name: t.name, storage_path: t.storage_path }));

  return (
    <Protected allowedRoles={["superadmin"]}>
      <AppShell
        menuKey="superadmin"
        breadcrumbs={[{ label: "Super Admin", href: "/super-admin" }, { label: "Contratos" }]}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Novo Template</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" />
              <Input type="file" accept=".docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <Button onClick={handleUpload} disabled={loading}>Upload</Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable columns={columns} rows={rows} pageSize={5} />
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </Protected>
  );
}
