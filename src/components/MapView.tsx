import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/lib/dataClient';
import { LoteData, getLoteStyle, formatArea, formatPrice } from '@/lib/geojsonUtils';

interface MapViewProps {
  empreendimentoId?: string;
  height?: string;
  onLoteClick?: (lote: LoteData) => void;
  showControls?: boolean;
  readonly?: boolean;
  onUpdateLoteStatus?: (loteId: string, newStatus: string) => Promise<void> | void;
}

export function MapView({
  empreendimentoId,
  height = '500px',
  onLoteClick,
  showControls = true,
  readonly = false,
  onUpdateLoteStatus
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [lotes, setLotes] = useState<LoteData[]>([]);
  const [selectedLote, setSelectedLote] = useState<string | null>(null);
  const [hoveredLote, setHoveredLote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const lotesLayersRef = useRef<Map<string, L.GeoJSON>>(new Map());

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-23.5489, -46.6388],
      zoom: 13,
      zoomControl: showControls
    });

    // Adicionar camada base
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles © Esri'
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [showControls]);

  // Carregar lotes do empreendimento
  useEffect(() => {
    if (!empreendimentoId || !mapRef.current) return;

    const loadLotes = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.rpc('get_empreendimento_lotes', {
          p_empreendimento_id: empreendimentoId
        });

        if (error) {
          console.error('Erro ao carregar lotes:', error);
          // Se a RPC não existir, mostrar mensagem informativa
            if (error.message?.includes('function') || error.message?.includes('does not exist')) {
              console.warn('⚠️ RPC get_empreendimento_lotes não encontrada. Execute o SQL NovoSetup/sql.final.referenciado.sql');
            }
          setError(error.message || 'Erro ao carregar lotes');
          return;
        }

        if (data && data.length > 0) {
          setLotes(data);
          renderLotes(data);
        } else {
          console.warn('⚠️ Nenhum lote encontrado para este empreendimento');
        }
      } catch (error) {
        console.error('Erro ao carregar lotes:', error);
        setError(error instanceof Error ? error.message : 'Erro ao carregar lotes');
      } finally {
        setLoading(false);
      }
    };

    loadLotes();
  }, [empreendimentoId]);

  // Renderizar lotes no mapa
  const renderLotes = (lotesData: LoteData[]) => {
    if (!mapRef.current) return;

    // Limpar layers existentes
    lotesLayersRef.current.forEach(layer => {
      mapRef.current?.removeLayer(layer);
    });
    lotesLayersRef.current.clear();

    let bounds: L.LatLngBounds | null = null;

    lotesData.forEach(lote => {
      if (!lote.geometria || !mapRef.current) return;

      // Filtrar por status
      if (statusFilter !== 'todos' && lote.status !== statusFilter) return;

      // Converter coordenadas para Leaflet
      const coordinates = lote.geometria.map(ring => 
        ring.map(([lng, lat]) => [lat, lng] as [number, number])
      );

      // Criar polígono
      const polygon = L.polygon(coordinates, {
        ...getLoteStyle(lote.status || 'disponivel'),
        className: `lote-${lote.id}`
      });

      // Eventos do lote
      polygon.on('click', () => {
        setSelectedLote(lote.id || null);
        onLoteClick?.(lote);
        
        if (!readonly) {
          showLotePopup(lote, polygon);
        }
      });

      polygon.on('mouseover', (e) => {
        setHoveredLote(lote.id || null);
        
        // Atualizar estilo para hover
        polygon.setStyle(getLoteStyle(
          lote.status || 'disponivel', 
          true, 
          selectedLote === lote.id
        ));

        // Tooltip simples
        polygon.bindTooltip(`
          <strong>${lote.nome}</strong><br/>
          Status: ${lote.status}<br/>
          Área: ${formatArea(lote.area_m2)}
        `, {
          permanent: false,
          direction: 'top'
        }).openTooltip();
      });

      polygon.on('mouseout', () => {
        setHoveredLote(null);
        
        // Restaurar estilo normal
        polygon.setStyle(getLoteStyle(
          lote.status || 'disponivel', 
          false, 
          selectedLote === lote.id
        ));

        polygon.closeTooltip();
      });

      // Adicionar ao mapa
      polygon.addTo(mapRef.current);
      lotesLayersRef.current.set(lote.id || '', polygon);

      // Calcular bounds
      if (!bounds) {
        bounds = polygon.getBounds();
      } else {
        bounds.extend(polygon.getBounds());
      }
    });

    // Ajustar vista para mostrar todos os lotes
    if (bounds && mapRef.current) {
      mapRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  };

  // Mostrar popup com detalhes do lote
  const showLotePopup = (lote: LoteData, polygon: L.Polygon) => {
    const statusText = {
      'disponivel': 'Disponível',
      'reservado': 'Reservado', 
      'vendido': 'Vendido'
    }[lote.status || 'disponivel'];

    const popupContent = `
      <div class="p-3 min-w-[200px]">
        <h3 class="font-bold text-lg mb-2">${lote.nome}</h3>
        <div class="space-y-1 text-sm">
          <div><strong>Número:</strong> ${lote.numero}</div>
          <div><strong>Status:</strong> <span class="inline-block px-2 py-1 rounded text-xs font-medium" style="background-color: ${getLoteStyle(lote.status || 'disponivel').fillColor}20; color: ${getLoteStyle(lote.status || 'disponivel').fillColor}">${statusText}</span></div>
          <div><strong>Área:</strong> ${formatArea(lote.area_m2)}</div>
          ${lote.preco ? `<div><strong>Preço:</strong> ${formatPrice(lote.preco)}</div>` : ''}
          ${lote.comprador_nome ? `<div><strong>Comprador:</strong> ${lote.comprador_nome}</div>` : ''}
          ${lote.data_venda ? `<div><strong>Vendido em:</strong> ${new Date(lote.data_venda).toLocaleDateString('pt-BR')}</div>` : ''}
        </div>
        ${!readonly ? `
          <div class="mt-3 flex gap-2">
            ${lote.status !== 'vendido' ? `<button data-status="vendido" class="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600">Vender</button>` : ''}
            ${lote.status !== 'reservado' ? `<button data-status="reservado" class="px-2 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600">Reservar</button>` : ''}
            ${lote.status !== 'disponivel' ? `<button data-status="disponivel" class="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600">Disponibilizar</button>` : ''}
          </div>
        ` : ''}
      </div>
    `;

    polygon.bindPopup(popupContent, {
      maxWidth: 300,
      className: 'lote-popup'
    }).openPopup();

    if (!readonly) {
      polygon.once('popupopen', () => {
        const popupEl = polygon.getPopup()?.getElement();
        popupEl?.querySelectorAll<HTMLButtonElement>('button[data-status]').forEach(btn => {
          btn.addEventListener('click', () => {
            const newStatus = btn.getAttribute('data-status');
            if (newStatus && lote.id) {
              handleUpdateLoteStatus(lote.id, newStatus);
            }
          });
        });
      });
    }
  };

  // Atualizar status do lote
  const defaultUpdateLoteStatus = async (loteId: string, newStatus: string) => {
    try {
      setError(null);
      const { error: rpcError } = await supabase.rpc('update_lote_status', {
        p_lote_id: loteId,
        p_novo_status: newStatus
      });

      if (rpcError) {
        console.error('Erro ao atualizar status:', rpcError);
        setError(rpcError.message || 'Erro ao atualizar status');
        return;
      }

      // Recarregar lotes
      if (empreendimentoId) {
        const { data } = await supabase.rpc('get_empreendimento_lotes', {
          p_empreendimento_id: empreendimentoId
        });

        if (data) {
          setLotes(data);
          renderLotes(data);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      setError(error instanceof Error ? error.message : 'Erro ao atualizar status');
    }
  };

  const handleUpdateLoteStatus = onUpdateLoteStatus ?? defaultUpdateLoteStatus;

  // Filtrar lotes por status
  useEffect(() => {
    if (lotes.length > 0) {
      renderLotes(lotes);
    }
  }, [statusFilter]);

  const stats = {
    total: lotes.length,
    disponivel: lotes.filter(l => l.status === 'disponivel').length,
    reservado: lotes.filter(l => l.status === 'reservado').length,
    vendido: lotes.filter(l => l.status === 'vendido').length
  };

  return (
    <div className="w-full relative">
      {showControls && (
        <div className="mb-4 flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('todos')}
              className={`px-3 py-1 rounded text-sm ${statusFilter === 'todos' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Todos ({stats.total})
            </button>
            <button
              onClick={() => setStatusFilter('disponivel')}
              className={`px-3 py-1 rounded text-sm ${statusFilter === 'disponivel' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
            >
              Disponível ({stats.disponivel})
            </button>
            <button
              onClick={() => setStatusFilter('reservado')}
              className={`px-3 py-1 rounded text-sm ${statusFilter === 'reservado' ? 'bg-yellow-500 text-white' : 'bg-gray-200'}`}
            >
              Reservado ({stats.reservado})
            </button>
            <button
              onClick={() => setStatusFilter('vendido')}
              className={`px-3 py-1 rounded text-sm ${statusFilter === 'vendido' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
            >
              Vendido ({stats.vendido})
            </button>
          </div>
          
          {stats.total > 0 && (
            <div className="text-sm text-gray-600">
              Vendidos: {((stats.vendido / stats.total) * 100).toFixed(1)}%
            </div>
          )}
        </div>
      )}
      
      <div 
        ref={mapContainerRef} 
        style={{ height, width: '100%' }}
        className="rounded-lg border"
      />
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Carregando lotes...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
          <p className="text-sm text-red-600">Erro: {error}</p>
        </div>
      )}
    </div>
  );
}
