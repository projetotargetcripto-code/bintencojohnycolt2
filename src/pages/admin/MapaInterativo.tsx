import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapView } from "@/components/MapView";
import { supabase } from "@/lib/dataClient";
import { LoteData } from "@/lib/geojsonUtils";
import { RefreshCw, Search, TrendingUp } from "lucide-react";

interface Empreendimento {
  id: string;
  nome: string;
  descricao?: string;
  status: string;
  total_lotes: number;
  lotes_vendidos: number;
  created_at: string;
  created_by_email?: string;
}

interface VendasStats {
  total_lotes: number;
  lotes_disponiveis: number;
  lotes_reservados: number;
  lotes_vendidos: number;
  percentual_vendido: number;
  area_total: number;
  area_vendida: number;
  receita_total: number;
}

export default function MapaInterativo() {
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedLote, setSelectedLote] = useState<LoteData | null>(null);
  const [stats, setStats] = useState<VendasStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [params] = useSearchParams();
  const paramEmp = params.get('emp');

  // Carregar empreendimentos
  const loadEmpreendimentos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('empreendimentos')
        .select('*')
        .eq('status', 'aprovado')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar empreendimentos:', error);
        return;
      }

      setEmpreendimentos(data || []);

      // Selecionar empreendimento do parâmetro ou primeiro da lista
      if (data && data.length > 0 && !selectedEmp) {
        setSelectedEmp(paramEmp || data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar empreendimentos:', error);
    } finally {
      setLoading(false);
    }
  }, [paramEmp, selectedEmp]);

  // Carregar estatísticas de vendas
  const loadStats = async (empId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_vendas_stats', {
        p_empreendimento_id: empId
      });

      if (error) {
        console.error('Erro ao carregar estatísticas:', error);
        return;
      }

      if (data && data.length > 0) {
        setStats(data[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  useEffect(() => {
    loadEmpreendimentos();
  }, [loadEmpreendimentos]);

  useEffect(() => {
    if (selectedEmp) {
      loadStats(selectedEmp);
    }
  }, [selectedEmp]);

  const handleLoteClick = (lote: LoteData) => {
    setSelectedLote(lote);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const filteredEmpreendimentos = empreendimentos.filter(emp =>
    emp.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedEmpreendimento = empreendimentos.find(emp => emp.id === selectedEmp);

  return (
    <Protected>
      <AppShell 
        menuKey="adminfilial" 
        breadcrumbs={[
          { label: 'Home', href: '/' }, 
          { label: 'Admin' }, 
          { label: 'Mapa Interativo' }
        ]}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Mapa Interativo de Lotes</h1>
              <p className="text-sm text-muted-foreground">
                Visualize e gerencie lotes de empreendimentos aprovados
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadEmpreendimentos}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Controles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Selecionar Empreendimento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar empreendimento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedEmp} onValueChange={setSelectedEmp}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um empreendimento" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredEmpreendimentos.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{emp.nome}</span>
                          <Badge variant="secondary" className="ml-2">
                            {emp.total_lotes} lotes
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Estatísticas */}
            {stats && (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Vendas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Vendidos:</span>
                        <span className="font-medium">{stats.lotes_vendidos}/{stats.total_lotes}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Progresso:</span>
                        <span className="font-medium">{stats.percentual_vendido.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${stats.percentual_vendido}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Receita</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(stats.receita_total)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total arrecadado com vendas
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-medium text-green-600">{stats.lotes_disponiveis}</div>
                          <div className="text-muted-foreground">Disponível</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-yellow-600">{stats.lotes_reservados}</div>
                          <div className="text-muted-foreground">Reservado</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-red-600">{stats.lotes_vendidos}</div>
                          <div className="text-muted-foreground">Vendido</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Mapa */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedEmpreendimento ? selectedEmpreendimento.nome : 'Selecione um empreendimento'}
              </CardTitle>
              {selectedEmpreendimento?.descricao && (
                <p className="text-sm text-muted-foreground">
                  {selectedEmpreendimento.descricao}
                </p>
              )}
            </CardHeader>
            <CardContent>
              {selectedEmp ? (
                <MapView
                  empreendimentoId={selectedEmp}
                  height="600px"
                  onLoteClick={handleLoteClick}
                  showControls={true}
                  readonly={false}
                />
              ) : (
                <div className="h-[600px] flex items-center justify-center border border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-2">Nenhum empreendimento selecionado</p>
                    <p className="text-sm text-muted-foreground">
                      Escolha um empreendimento para visualizar os lotes
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detalhes do Lote Selecionado */}
          {selectedLote && (
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Lote Selecionado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">{selectedLote.nome}</h4>
                    <div className="space-y-1 text-sm">
                      <div><strong>Número:</strong> {selectedLote.numero}</div>
                      <div><strong>Status:</strong> 
                        <Badge 
                          variant={selectedLote.status === 'vendido' ? 'destructive' : 
                                  selectedLote.status === 'reservado' ? 'default' : 'secondary'}
                          className="ml-2"
                        >
                          {selectedLote.status}
                        </Badge>
                      </div>
                      <div><strong>Área:</strong> {selectedLote.area_m2?.toFixed(0)} m²</div>
                    </div>
                  </div>
                  
                  {selectedLote.preco && (
                    <div>
                      <h4 className="font-medium mb-2">Informações Comerciais</h4>
                      <div className="space-y-1 text-sm">
                        <div><strong>Preço:</strong> {formatCurrency(selectedLote.preco)}</div>
                        {selectedLote.area_m2 && (
                          <div><strong>Preço/m²:</strong> {formatCurrency(selectedLote.preco / selectedLote.area_m2)}</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {selectedLote.comprador_nome && (
                    <div>
                      <h4 className="font-medium mb-2">Informações do Comprador</h4>
                      <div className="space-y-1 text-sm">
                        <div><strong>Nome:</strong> {selectedLote.comprador_nome}</div>
                        {selectedLote.data_venda && (
                          <div><strong>Data da Venda:</strong> {new Date(selectedLote.data_venda).toLocaleDateString('pt-BR')}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </AppShell>
    </Protected>
  );
}

