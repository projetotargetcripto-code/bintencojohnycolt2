import { useEffect, useState } from "react";
import { supabase } from "@/lib/dataClient";
import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export default function ConfigPage() {
  const [maxFiliais, setMaxFiliais] = useState("0");
  const [enableNewFeature, setEnableNewFeature] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "Configurações | BlockURB";
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      const { data: maxData } = await supabase.rpc("admin_get_setting", { p_key: "max_filiais" });
      if (maxData) setMaxFiliais(String(maxData));
      const { data: featureData } = await supabase.rpc("admin_get_setting", { p_key: "enable_new_feature" });
      if (featureData) setEnableNewFeature(featureData === "true");
    };
    void loadSettings();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const { error: err1 } = await supabase.rpc("admin_set_setting", { p_key: "max_filiais", p_value: maxFiliais });
      if (err1) throw err1;
      const { error: err2 } = await supabase.rpc("admin_set_setting", { p_key: "enable_new_feature", p_value: enableNewFeature ? "true" : "false" });
      if (err2) throw err2;
      toast.success("Configurações salvas");
    } catch (e: any) {
      toast.error(e?.message || "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Protected allowedRoles={["superadmin"]}>
      <AppShell menuKey="superadmin" breadcrumbs={[{ label: "Super Admin" }, { label: "Configurações" }]}>
        <Card>
          <CardHeader>
            <CardTitle>Configurações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="max_filiais">Limite de Filiais</Label>
              <Input id="max_filiais" type="number" value={maxFiliais} onChange={e => setMaxFiliais(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="enable_new_feature" checked={enableNewFeature} onCheckedChange={setEnableNewFeature} />
              <Label htmlFor="enable_new_feature">Habilitar novo recurso</Label>
            </div>
            <Button onClick={save} disabled={saving}>Salvar</Button>
          </CardContent>
        </Card>
      </AppShell>
    </Protected>
  );
}
