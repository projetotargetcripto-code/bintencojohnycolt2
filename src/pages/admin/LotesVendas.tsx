import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/lib/dataClient";
import { LoteData, formatArea } from "@/lib/geojsonUtils";
import { toast } from "sonner";
import { Edit3, DollarSign, Users, TrendingUp } from "lucide-react";

interface Empreendimento {
  id: string;
  nome: string;
  total_lotes: number;
}

export default function LotesVendas() {
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<string>('');
  const [lotes, setLotes] = useState<LoteData[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingLote, setEditingLote] = useState<LoteData | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [filter, setFilter] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Estados do formulário de edição
  const [editForm, setEditForm] = useState({
    status: '',
    preco: '',
    comprador_nome: '',
    comprador_email: '',
    observacoes: ''
  });

  // Carregar empreendimentos
  useEffect(() => {
    const loadEmpreendimentos = async () => {
      try {
        const { data, error } = await supabase
          .from('empreendimentos')
          .select('id, nome, total_lotes')
          .eq('status', 'aprovado')
          .order('nome');

        if (error) {
          console.error('Erro ao carregar empreendimentos:', error);
          return;
        }

        setEmpreendimentos(data || []);
        if (data && data.length > 0) {
          setSelectedEmp(data[0].id);
        }
      } catch (error) {
        console.error('Erro ao carregar empreendimentos:', error);
      }
    };

    loadEmpreendimentos();
  }, []);

  // Carregar lotes do empreendimento selecionado
  useEffect(() => {
    if (!selectedEmp) return;

    const loadLotes = async () => {
      try {
        setLoading(true);
        // Busca direta na tabela, trazendo todos os lotes do empreendimento
        const { data, error } = await supabase
          .from('lotes')
          .select('id, nome, numero, status, area_m2, valor')
          .eq('empreendimento_id', selectedEmp)
          .order('numero', { ascending: true });

        if (error) {
          console.error('Erro ao carregar lotes:', error);
          return;
        }

        const mapped = (data || []).map((l: any) => ({
          id: l.id,
          nome: l.nome,
          numero: l.numero,
          status: l.status,
          area_m2: l.area_m2,
          preco: l.valor ?? null,
        }));
        setLotes(mapped as any);
      } catch (error) {
        console.error('Erro ao carregar lotes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLotes();
  }, [selectedEmp]);

  // Abrir dialog de edição
  const handleEditLote = (lote: LoteData) => {
    setEditingLote(lote);
    setEditForm({
      status: lote.status || 'disponivel',
      preco: lote.preco?.toString() || '',
      comprador_nome: lote.comprador_nome || '',
      comprador_email: lote.comprador_email || '',
      observacoes: lote.observacoes || ''
    });
    setShowEditDialog(true);
  };

  // Salvar alterações do lote
  const handleSaveLote = async () => {
    if (!editingLote) return;

    try {
      const { error: statusError } = await supabase.rpc('update_lote_status', {
        p_lote_id: editingLote.id,
        p_novo_status: editForm.status,
      });

      if (statusError) {
        toast.error('Erro ao atualizar status do lote');
        console.error('Erro:', statusError);
        return;
      }

      const { error: detalhesError } = await supabase
        .from('lotes')
        .update({
          comprador_nome: editForm.status === 'vendido' ? editForm.comprador_nome || null : null,
          comprador_email: editForm.status === 'vendido' ? editForm.comprador_email || null : null,
          valor: editForm.preco ? parseFloat(editForm.preco) : null,
          preco: editForm.preco ? parseFloat(editForm.preco) : null,
        })
        .eq('id', editingLote.id);

      if (detalhesError) {
        toast.error('Erro ao atualizar detalhes do lote');
        console.error('Erro:', detalhesError);
        return;
      }

      toast.success('Lote atualizado com sucesso!');
      setShowEditDialog(false);

      // Recarregar lotes
      const { data } = await supabase
        .from('lotes')
        .select('id, nome, numero, status, area_m2, valor')
        .eq('empreendimento_id', selectedEmp)
        .order('numero', { ascending: true });
      if (data) {
        const mapped = data.map((l: any) => ({ id: l.id, nome: l.nome, numero: l.numero, status: l.status, area_m2: l.area_m2, preco: l.valor ?? null }));
        setLotes(mapped as any);
      }

    } catch (error) {
      toast.error('Erro ao atualizar lote');
      console.error('Erro:', error);
    }
  };

  // Filtrar lotes
  const filteredLotes = lotes.filter(lote => {
    const matchesFilter = filter === 'todos' || lote.status === filter;
    const matchesSearch = lote.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lote.numero.toString().includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  // Estatísticas
  const stats = {
    total: lotes.length,
    disponivel: lotes.filter(l => l.status === 'disponivel').length,
    reservado: lotes.filter(l => l.status === 'reservado').length,
    vendido: lotes.filter(l => l.status === 'vendido').length,
    receita: lotes.filter(l => l.status === 'vendido').reduce((sum, l) => sum + (l.preco || 0), 0)
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const config = {
      'disponivel': { variant: 'secondary' as const, label: 'Disponível' },
      'reservado': { variant: 'default' as const, label: 'Reservado' },
      'vendido': { variant: 'destructive' as const, label: 'Vendido' }
    };
    
    const { variant, label } = config[status as keyof typeof config] || config.disponivel;
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <Protected>
      <AppShell 
        menuKey="adminfilial" 
        breadcrumbs={[
          { label: 'Home', href: '/' }, 
          { label: 'Admin' }, 
          { label: 'Vendas de Lotes' }
        ]}
      >
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold">Gestão de Vendas de Lotes</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie o status e informações de vendas dos lotes
            </p>
          </div>

          {/* Seletor de Empreendimento */}
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Empreendimento</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedEmp} onValueChange={setSelectedEmp}>
                <SelectTrigger className="w-full md:w-96">
                  <SelectValue placeholder="Escolha um empreendimento" />
                </SelectTrigger>
                <SelectContent>
                  {empreendimentos.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.nome} ({emp.total_lotes} lotes)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          {selectedEmp && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-xl font-bold">{stats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full" />
                    <div>
                      <p className="text-xs text-muted-foreground">Disponível</p>
                      <p className="text-xl font-bold text-gray-600">{stats.disponivel}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                    <div>
                      <p className="text-xs text-muted-foreground">Reservado</p>
                      <p className="text-xl font-bold text-yellow-600">{stats.reservado}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full" />
                    <div>
                      <p className="text-xs text-muted-foreground">Vendido</p>
                      <p className="text-xl font-bold text-red-600">{stats.vendido}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Receita</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(stats.receita)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Filtros e Busca */}
          {selectedEmp && (
            <Card>
              <CardHeader>
                <CardTitle>Filtros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Buscar Lote</Label>
                    <Input
                      id="search"
                      placeholder="Nome ou número do lote..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="w-full md:w-48">
                    <Label htmlFor="filter">Status</Label>
                    <Select value={filter} onValueChange={setFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="disponivel">Disponível</SelectItem>
                        <SelectItem value="reservado">Reservado</SelectItem>
                        <SelectItem value="vendido">Vendido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabela de Lotes */}
          {selectedEmp && (
            <Card>
              <CardHeader>
                <CardTitle>Lotes ({filteredLotes.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Carregando lotes...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nº</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Área</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Preço</TableHead>
                          <TableHead>Comprador</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLotes.map(lote => (
                          <TableRow key={lote.id}>
                            <TableCell className="font-medium">{lote.numero}</TableCell>
                            <TableCell>{lote.nome}</TableCell>
                            <TableCell>{formatArea(lote.area_m2)}</TableCell>
                            <TableCell>{getStatusBadge(lote.status || 'disponivel')}</TableCell>
                            <TableCell>
                              {lote.preco ? formatCurrency(lote.preco) : '-'}
                            </TableCell>
                            <TableCell>
                              {lote.comprador_nome || '-'}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditLote(lote)}
                              >
                                <Edit3 className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Dialog de Edição */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  Editar Lote: {editingLote?.nome}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disponivel">Disponível</SelectItem>
                      <SelectItem value="reservado">Reservado</SelectItem>
                      <SelectItem value="vendido">Vendido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="preco">Preço</Label>
                  <Input
                    id="preco"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={editForm.preco}
                    onChange={(e) => setEditForm(prev => ({ ...prev, preco: e.target.value }))}
                  />
                </div>

                {editForm.status === 'vendido' && (
                  <>
                    <div>
                      <Label htmlFor="comprador_nome">Nome do Comprador</Label>
                      <Input
                        id="comprador_nome"
                        placeholder="Nome completo"
                        value={editForm.comprador_nome}
                        onChange={(e) => setEditForm(prev => ({ ...prev, comprador_nome: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="comprador_email">Email do Comprador</Label>
                      <Input
                        id="comprador_email"
                        type="email"
                        placeholder="email@exemplo.com"
                        value={editForm.comprador_email}
                        onChange={(e) => setEditForm(prev => ({ ...prev, comprador_email: e.target.value }))}
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSaveLote} className="flex-1">
                    Salvar
                  </Button>
                  <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AppShell>
    </Protected>
  );
}
