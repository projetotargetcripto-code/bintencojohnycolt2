import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/dataClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

// --- INÍCIO DA VERSÃO COM GERENCIAMENTO DE STATUS ---

// Interfaces
interface Empreendimento {
  id: string;
  nome: string;
}

interface Lote {
  id: string;
  nome: string;
  numero: number;
  status: string;
  area_m2: number;
  perimetro_m: number;
  valor: number | null; // Adiciona o campo valor
}

// Componente para o Seletor de Status
function StatusSelector({ lote, onStatusChange }: { lote: Lote, onStatusChange: (loteId: string, newStatus: string) => void }) {
  const [currentStatus, setCurrentStatus] = useState(lote.status);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleValueChange = async (newStatus: string) => {
    setIsUpdating(true);
    const success = await onStatusChange(lote.id, newStatus);
    if (success) {
      setCurrentStatus(newStatus);
    }
    setIsUpdating(false);
  };

  return (
    <Select value={currentStatus} onValueChange={handleValueChange} disabled={isUpdating}>
      <SelectTrigger className="w-[120px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="disponivel">Disponível</SelectItem>
        <SelectItem value="reservado">Reservado</SelectItem>
        <SelectItem value="vendido">Vendido</SelectItem>
      </SelectContent>
    </Select>
  );
}

// Componente para o Input de Valor com Debounce
function ValorInput({ lote, onValorChange }: { lote: Lote, onValorChange: (loteId: string, novoValor: number) => void }) {
  const initialFormatted =
    lote.valor !== null && lote.valor !== undefined
      ? lote.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '';
  const initialRaw =
    lote.valor !== null && lote.valor !== undefined ? lote.valor.toString() : '';

  const [rawValue, setRawValue] = useState<string>(initialRaw);
  const [formattedValue, setFormattedValue] = useState<string>(initialFormatted);
  const [isUpdating, setIsUpdating] = useState(false);

  // Debounce para salvar o valor numérico
  useEffect(() => {
    const handler = setTimeout(() => {
      if (rawValue === '') return;
      const numero = parseFloat(rawValue);
      if (!isNaN(numero) && numero !== lote.valor) {
        setIsUpdating(true);
        onValorChange(lote.id, numero).finally(() => setIsUpdating(false));
      }
    }, 1000);

    return () => {
      clearTimeout(handler);
    };
  }, [rawValue, lote.id, lote.valor, onValorChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorDigitado = e.target.value;
    const valorNumerico = valorDigitado.replace(/\./g, '').replace(',', '.');
    if (/^[0-9.,]*$/.test(valorDigitado)) {
      setFormattedValue(valorDigitado);
      setRawValue(valorNumerico);
    }
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
      <Input
        type="text"
        value={formattedValue}
        onChange={handleChange}
        className="pl-9 pr-2 text-right w-[150px]"
        disabled={isUpdating}
        placeholder="0,00"
      />
    </div>
  );
}


export default function LotesPage() {
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [selectedEmpreendimentoId, setSelectedEmpreendimentoId] = useState<string | null>(null);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(false);

  useEffect(() => {
    document.title = "Gestão de Lotes | BlockURB";
    supabase.from('empreendimentos').select('id, nome').order('nome').then(({ data }) => {
      if (data) setEmpreendimentos(data);
    });
  }, []);

  useEffect(() => {
    if (!selectedEmpreendimentoId) {
      setLotes([]);
      return;
    }
    setLoadingLotes(true);
    supabase
      .from('lotes')
      .select('id, nome, numero, status, area_m2, perimetro_m, valor') // Adiciona 'valor'
      .eq('empreendimento_id', selectedEmpreendimentoId)
      .order('numero')
      .then(({ data }) => {
        if (data) setLotes(data);
        setLoadingLotes(false);
      });
  }, [selectedEmpreendimentoId]);
  
  // Função para chamar a RPC e atualizar o status
  const handleStatusChange = async (loteId: string, newStatus: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc('update_lote_status', {
      p_lote_id: loteId,
      p_novo_status: newStatus
    });

    if (error) {
      toast.error(`Erro ao atualizar lote: ${error.message}`);
      return false;
    }
    
    if (data) {
        // Atualiza o estado local para refletir a mudança imediatamente
        setLotes(currentLotes => 
            currentLotes.map(l => l.id === loteId ? { ...l, status: newStatus } : l)
        );
        toast.success("Status do lote atualizado com sucesso!");
        return true;
    }
    return false;
  };

  // Função para chamar a RPC e atualizar o valor
  const handleValorChange = async (loteId: string, novoValor: number): Promise<boolean> => {
    const { error } = await supabase.rpc('update_lote_valor', {
      p_lote_id: loteId,
      p_novo_valor: novoValor
    });

    if (error) {
      toast.error(`Erro ao atualizar valor: ${error.message}`);
      return false;
    }
    
    // Atualiza o estado local para refletir a mudança imediatamente
    setLotes(currentLotes => 
        currentLotes.map(l => l.id === loteId ? { ...l, valor: novoValor } : l)
    );
    toast.success("Valor do lote atualizado com sucesso!");
    return true;
  };

  const formatNumber = (num: number | null | undefined) => num?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A';
  const formatCurrency = (num: number | null | undefined) => {
    if (num === null || num === undefined) return 'R$ 0,00';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  return (
    <Protected>
      <AppShell menuKey="adminfilial" breadcrumbs={[{ label: 'Admin' }, { label: 'Gestão de Lotes' }]}>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seleção de Empreendimento</CardTitle>
              <p className="text-sm text-muted-foreground">Selecione para visualizar e gerenciar os lotes.</p>
            </CardHeader>
            <CardContent>
              <Select onValueChange={setSelectedEmpreendimentoId}>
                <SelectTrigger className="w-full md:w-[350px]">
                  <SelectValue placeholder="Selecione um empreendimento..." />
                </SelectTrigger>
                <SelectContent>
                  {empreendimentos.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedEmpreendimentoId && (
            <Card>
              <CardHeader><CardTitle>Lotes do Empreendimento</CardTitle></CardHeader>
              <CardContent>
                {loadingLotes ? <p>Carregando lotes...</p> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nº</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead className="text-right">Área (m²)</TableHead>
                        <TableHead className="text-right">Perímetro (m)</TableHead>
                        <TableHead className="text-right">Valor (R$)</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Alterar Status</TableHead>
                        <TableHead>Alterar Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lotes.map(lote => (
                        <TableRow key={lote.id}>
                          <TableCell>{lote.numero}</TableCell>
                          <TableCell className="font-medium">{lote.nome}</TableCell>
                          <TableCell className="text-right">{formatNumber(lote.area_m2)}</TableCell>
                          <TableCell className="text-right">{formatNumber(lote.perimetro_m)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(lote.valor)}</TableCell>
                          <TableCell>
                            <Badge variant={lote.status === 'disponivel' ? 'default' : lote.status === 'vendido' ? 'destructive' : 'secondary'}>
                              {lote.status.charAt(0).toUpperCase() + lote.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <StatusSelector lote={lote} onStatusChange={handleStatusChange} />
                          </TableCell>
                          <TableCell>
                            <ValorInput lote={lote} onValorChange={handleValorChange} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {!loadingLotes && lotes.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">Nenhum lote encontrado.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </AppShell>
    </Protected>
  );
}
// --- FIM DA VERSÃO COM GERENCIAMENTO DE STATUS ---
