import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { Protected } from "@/components/Protected";
import { supabase } from "@/lib/dataClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTable, Column } from "@/components/app/DataTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Filial { id: string; nome: string; }
interface TemplateRow { id: string; name: string; filial: string; storage_path: string; }

export default function ContratosPage() {
  const [filiais, setFiliais] = useState<Filial[]>([]);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [filialId, setFilialId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFiliais();
    loadTemplates();
  }, []);

  async function loadFiliais() {
    const { data } = await supabase.from("filiais").select("id, nome").order("nome");
    setFiliais(data || []);
  }

  async function loadTemplates() {
    const { data, error } = await supabase
      .from("doc_templates")
      .select("id, name, storage_path, filiais(nome)")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar templates: " + error.message);
    const rows = (data || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      filial: t.filiais?.nome || "",
      storage_path: t.storage_path,
    }));
    setTemplates(rows);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !name.trim() || !filialId) {
      toast.error("Informe nome, arquivo e filial");
      return;
    }
    setLoading(true);
    try {
      const fileName = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;
      const { error: uploadError } = await supabase.storage.from("doc-templates").upload(fileName, file);
      if (uploadError) throw uploadError;
      const { error: insertError } = await supabase.from("doc_templates").insert({
        name: name.trim(),
        filial_id: filialId,
        storage_path: fileName,
      });
      if (insertError) throw insertError;
      toast.success("Template enviado");
      setFile(null);
      setName("");
      setFilialId("");
      await loadTemplates();
    } catch (err: any) {
      toast.error("Falha no upload: " + err.message);
    }
    setLoading(false);
  }

  const columns: Column[] = [
    { key: "name", header: "Nome" },
    { key: "filial", header: "Filial" },
    { key: "storage_path", header: "Arquivo" },
  ];

  return (
    <Protected allowedRoles={["superadmin"]}>
      <AppShell menuKey="superadmin" breadcrumbs={[{ label: "Super Admin", href: "/super-admin" }, { label: "Contratos" }]}>
      <Card>
        <CardHeader>
          <CardTitle>Novo Template</CardTitle>
          <CardDescription>Envie um modelo de contrato</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="flex flex-col gap-2">
            <Input type="text" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
            <Select value={filialId} onValueChange={setFilialId}>
              <SelectTrigger>
                <SelectValue placeholder="Filial" />
              </SelectTrigger>
              <SelectContent>
                {filiais.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="file" accept=".docx" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <Button type="submit" disabled={loading}>Enviar</Button>
          </form>
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>Modelos cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} rows={templates} />
        </CardContent>
      </Card>
      </AppShell>
    </Protected>
  );
}
