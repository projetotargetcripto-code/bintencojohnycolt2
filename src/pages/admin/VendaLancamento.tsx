import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/lib/dataClient";
import { toast } from "sonner";

export default function VendaLancamento() {
  const [form, setForm] = useState({
    lote_id: "",
    filial_id: "",
    corretor_id: "",
    valor: "",
    comissao: ""
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async () => {
    const { error } = await supabase.from("vendas").insert({
      lote_id: form.lote_id,
      filial_id: form.filial_id,
      corretor_id: form.corretor_id,
      valor: Number(form.valor),
      comissao: Number(form.comissao)
    });
    if (error) {
      console.error(error);
      toast.error("Erro ao lançar venda");
    } else {
      toast.success("Venda lançada");
      setForm({ lote_id: "", filial_id: "", corretor_id: "", valor: "", comissao: "" });
    }
  };

  return (
    <Protected>
      <AppShell>
        <div className="max-w-md space-y-4">
          <div>
            <Label htmlFor="lote">Lote ID</Label>
            <Input id="lote" value={form.lote_id} onChange={handleChange("lote_id")} />
          </div>
          <div>
            <Label htmlFor="filial">Filial ID</Label>
            <Input id="filial" value={form.filial_id} onChange={handleChange("filial_id")} />
          </div>
          <div>
            <Label htmlFor="corretor">Corretor ID</Label>
            <Input id="corretor" value={form.corretor_id} onChange={handleChange("corretor_id")} />
          </div>
          <div>
            <Label htmlFor="valor">Valor</Label>
            <Input id="valor" type="number" value={form.valor} onChange={handleChange("valor")} />
          </div>
          <div>
            <Label htmlFor="comissao">Comissão</Label>
            <Input id="comissao" type="number" value={form.comissao} onChange={handleChange("comissao")} />
          </div>
          <Button onClick={handleSubmit}>Lançar venda</Button>
        </div>
      </AppShell>
    </Protected>
  );
}
