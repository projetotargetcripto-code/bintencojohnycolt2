import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/dataClient";
import { toast } from "sonner";
import { useAuth } from "@/providers/AuthProvider";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Calendar,
  MapPin,
  Building2
} from "lucide-react";

interface Empreendimento {
  id: string;
  nome: string;
  descricao: string;
  total_lotes: number;
  lotes_vendidos: number;
  bounds: string;
  geojson_url: string;
  masterplan_url: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  created_by: string;
  created_by_email: string;
  created_at: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
}

export default function AprovacaoEmpreendimentos() {
  const { profile } = useAuth();
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Aprovação de Empreendimentos | BlockURB";
    fetchEmpreendimentos();
  }, []);

  const fetchEmpreendimentos = async () => {
    try {
      const { data, error } = await supabase
        .from('empreendimentos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmpreendimentos(data || []);
    } catch (error) {
      console.error('Erro ao buscar empreendimentos:', error);
      toast.error('Erro ao carregar empreendimentos');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const { error } = await supabase.rpc('approve_empreendimento', {
        p_empreendimento_id: id,
        p_approved: true
      });

      if (error) throw error;

      toast.success('Empreendimento aprovado com sucesso!');
      await fetchEmpreendimentos();
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      toast.error('Erro ao aprovar empreendimento');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Por favor, informe o motivo da rejeição');
      return;
    }

    setProcessingId(id);
    try {
      const { error } = await supabase.rpc('approve_empreendimento', {
        p_empreendimento_id: id,
        p_approved: false,
        p_rejection_reason: rejectionReason
      });

      if (error) throw error;

      toast.success('Empreendimento rejeitado');
      setRejectionReason('');
      setSelectedId(null);
      await fetchEmpreendimentos();
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      toast.error('Erro ao rejeitar empreendimento');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'aprovado':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'rejeitado':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default:
        return null;
    }
  };

  // Verificar se é superadmin (esta página é exclusiva do painel Super Admin)
  if (profile?.role !== 'superadmin') {
    return (
      <Protected allowedRoles={["superadmin"]}>
        <AppShell menuKey="superadmin">
          <div className="text-center py-12">
            <h1 className="text-2xl font-semibold mb-4">Acesso Negado</h1>
            <p className="text-muted-foreground">
              Apenas administradores podem acessar esta página.
            </p>
          </div>
        </AppShell>
      </Protected>
    );
  }

  return (
    <Protected allowedRoles={["superadmin"]}>
      <AppShell menuKey="superadmin" breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'Super Admin' },
        { label: 'Aprovação de Empreendimentos' }
      ]}>
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Aprovação de Empreendimentos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie a aprovação de novos empreendimentos cadastrados no sistema
          </p>
        </header>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando empreendimentos...</p>
          </div>
        ) : empreendimentos.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Nenhum empreendimento encontrado
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {empreendimentos.map((emp) => (
              <Card key={emp.id} className={emp.status === 'pendente' ? 'border-yellow-500' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{emp.nome}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {emp.descricao || 'Sem descrição'}
                      </p>
                    </div>
                    {getStatusBadge(emp.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>Criado por: <strong>{emp.created_by_email}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {format(new Date(emp.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{emp.total_lotes} lotes totais</span>
                    </div>
                  </div>

                  {emp.status === 'pendente' && (
                    <>
                      {selectedId === emp.id ? (
                        <div className="space-y-3 border-t pt-4">
                          <Textarea
                            placeholder="Motivo da rejeição..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="destructive"
                              onClick={() => handleReject(emp.id)}
                              disabled={processingId === emp.id}
                            >
                              Confirmar Rejeição
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedId(null);
                                setRejectionReason('');
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 border-t pt-4">
                          <Button
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprove(emp.id)}
                            disabled={processingId === emp.id}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Aprovar
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => setSelectedId(emp.id)}
                            disabled={processingId === emp.id}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Rejeitar
                          </Button>
                          {emp.geojson_url && (
                            <Button
                              variant="outline"
                              onClick={() => window.open(emp.geojson_url, '_blank')}
                            >
                              Ver GeoJSON
                            </Button>
                          )}
                          {emp.masterplan_url && (
                            <Button
                              variant="outline"
                              onClick={() => window.open(emp.masterplan_url, '_blank')}
                            >
                              Ver Masterplan
                            </Button>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {emp.status === 'aprovado' && emp.approved_at && (
                    <div className="border-t pt-4 text-sm text-muted-foreground">
                      Aprovado em {format(new Date(emp.approved_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  )}

                  {emp.status === 'rejeitado' && emp.rejection_reason && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-destructive">Motivo da rejeição:</p>
                      <p className="text-sm mt-1">{emp.rejection_reason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </AppShell>
    </Protected>
  );
}
