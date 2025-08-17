import { useEffect, useState } from "react";
import { supabase } from "@/lib/dataClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Filial {
  id: string;
  nome: string;
  kind?: string;
}

interface User {
  user_id: string;
  full_name: string;
  email: string;
  filial_id: string | null;
  role: string;
}

interface Props {
  filiais: Filial[];
  onVincular?: () => void;
}

export default function VincularClienteSaas({ filiais, onVincular }: Props) {
  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [filialId, setFilialId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_profiles")
        .select("user_id, full_name, email, filial_id, role")
        .order("full_name", { ascending: true });
      if (error) {
        toast.error("Erro ao buscar usuários: " + error.message);
      } else {
        setUsuarios(data || []);
      }
      setLoading(false);
    }
    fetchUsers();
  }, []);

  const handleVincular = async () => {
    if (!userId || !filialId) {
      toast.error("Selecione o usuário e a filial.");
      return;
    }
    setSaving(true);
    const usuario = usuarios.find(u => u.user_id === userId);
    const filial = filiais.find(f => f.id === filialId);
    if (!usuario || !filial) {
      toast.error("Usuário ou filial inválido.");
      setSaving(false);
      return;
    }
    const { error } = await supabase.rpc('link_user_to_filial', {
      p_user_id: userId,
      p_filial_id: filialId,
    });
    if (error) {
      toast.error("Erro ao vincular: " + error.message);
    } else {
      toast.success("Usuário vinculado à filial com sucesso!");
      setUserId("");
      setFilialId("");
      if (onVincular) onVincular();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-muted-foreground">Usuário</label>
        <Select value={userId} onValueChange={setUserId}>
          <SelectTrigger>
            <SelectValue placeholder={loading ? "Carregando..." : "Selecione"} />
          </SelectTrigger>
          <SelectContent>
            {usuarios
              .filter(u => u.role === "adminfilial")
              .map(u => (
                <SelectItem key={u.user_id} value={u.user_id}>
                  {u.full_name} ({u.email})
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm text-muted-foreground">Filial SaaS</label>
        <Select value={filialId} onValueChange={setFilialId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {filiais
              .filter(f => f.kind === "saas")
              .map(f => (
                <SelectItem key={f.id} value={f.id}>
                  {f.nome}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={handleVincular} disabled={saving || !userId || !filialId}>
        {saving ? "Vinculando..." : "Vincular"}
      </Button>
    </div>
  );
}
