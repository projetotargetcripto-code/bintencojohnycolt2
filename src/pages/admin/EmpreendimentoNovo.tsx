import { Protected } from "@/components/Protected";
import { AppShell } from "@/components/shell/AppShell";
import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/dataClient";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { processGeoJSON, LoteData } from "@/lib/geojsonUtils";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --- INÍCIO DA VERSÃO ESTÁVEL E CORRIGIDA ---

interface FormData {
  nome: string;
  descricao: string;
  bounds: string;
}

export default function EmpreendimentoNovo() {
  const navigate = useNavigate();
  const { profile } = useAuth(); // Pega o perfil completo do usuário
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    descricao: '',
    bounds: ''
  });
  const [geojsonFile, setGeojsonFile] = useState<File | null>(null);
  const [masterplanFile, setMasterplanFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [processedLotes, setProcessedLotes] = useState<LoteData[]>([]);

  const mapRef = useRef<L.Map | null>(null);
  const previewLayerRef = useRef<L.Layer | null>(null);
  const masterplanOverlayRef = useRef<L.ImageOverlay | null>(null);

  // Callback Ref para inicialização do mapa
  const mapContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null && mapRef.current === null) {
      const map = L.map(node, {
        center: [-23.5489, -46.6388],
        zoom: 13,
      });

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri'
      }).addTo(map);
      
      mapRef.current = map;
    }
  }, []);

  useEffect(() => {
    document.title = "Novo Empreendimento | BlockURB";
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGeojsonUpload = async (file: File) => {
    setGeojsonFile(file);
    const map = mapRef.current;
    if (!map) return;

    try {
      const text = await file.text();
      const processed = processGeoJSON(text);
      setProcessedLotes(processed.lotes);

      const boundsObj = {
        sw: [processed.bounds.sw.lat, processed.bounds.sw.lng],
        ne: [processed.bounds.ne.lat, processed.bounds.ne.lng]
      };
      handleInputChange('bounds', JSON.stringify(boundsObj));

      if (previewLayerRef.current) {
        map.removeLayer(previewLayerRef.current);
      }
      
      const geojson = JSON.parse(text);
      const layer = L.geoJSON(geojson, { style: { color: '#3b82f6', weight: 2, fillOpacity: 0.3 } });
      
      layer.addTo(map);
      previewLayerRef.current = layer;
      map.fitBounds(layer.getBounds(), { padding: [20, 20] });
      
      toast.success(`${processed.totalLotes} lotes encontrados!`);
    } catch (error) {
      toast.error('Erro ao processar GeoJSON.');
      setProcessedLotes([]);
    }
  };
  
  const handleMasterplanUpload = async (file: File) => {
    setMasterplanFile(file);
    const map = mapRef.current;
    if (!map || !formData.bounds) {
        toast.warning('Faça upload do GeoJSON para definir os limites.');
        return;
    }

    try {
        if (masterplanOverlayRef.current) {
            map.removeLayer(masterplanOverlayRef.current);
        }
        const bounds = JSON.parse(formData.bounds);
        const imageBounds = L.latLngBounds([bounds.sw[0], bounds.sw[1]], [bounds.ne[0], bounds.ne[1]]);
        const imageUrl = URL.createObjectURL(file);
        
        const overlay = L.imageOverlay(imageUrl, imageBounds, { opacity: 0.7 }).addTo(map);
        masterplanOverlayRef.current = overlay;
        map.fitBounds(imageBounds);
    } catch (error) {
        toast.error('Erro ao adicionar masterplan.');
    }
  };

  const uploadFile = async (file: File, folder: string) => {
    const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const path = `${folder}/${fileName}`;
    const { error } = await supabase.storage.from('empreendimentos').upload(path, file);
    if (error) throw new Error(`Falha no upload (${folder}): ${error.message}`);
    const { data: { publicUrl } } = supabase.storage.from('empreendimentos').getPublicUrl(path);
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.filial_id) { // Verificação de segurança
      toast.error('Não foi possível identificar sua filial. Faça login novamente.');
      setLoading(false);
      return;
    }
    if (!formData.nome.trim()) {
      toast.error('O nome do empreendimento é obrigatório.');
      return;
    }
    if (!geojsonFile) {
      toast.error('O arquivo GeoJSON é obrigatório.');
      return;
    }
    if (!masterplanFile) {
      toast.error('O arquivo de masterplan é obrigatório.');
      return;
    }
    setLoading(true);

    try {
      let geojson_url = null;
      let masterplan_url = null;
      if (geojsonFile) geojson_url = await uploadFile(geojsonFile, 'geojson');
      if (masterplanFile) masterplan_url = await uploadFile(masterplanFile, 'masterplans');

      const { data, error } = await supabase
        .from('empreendimentos')
        .insert([{
          nome: formData.nome,
          descricao: formData.descricao,
          total_lotes: processedLotes.length,
          bounds: formData.bounds || null,
          geojson_url,
          masterplan_url,
          filial_id: profile.filial_id, // Adiciona o filial_id
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      if (data && geojsonFile) {
        try {
            const text = await geojsonFile.text();
            const geojsonData = JSON.parse(text);
            const { error: rpcError } = await supabase.rpc('process_geojson_lotes', {
              p_empreendimento_id: data.id,
              p_geojson: geojsonData,
              p_empreendimento_nome: formData.nome
            });
            // Um erro aqui não deve impedir o fluxo, apenas avisar.
            if (rpcError) {
                console.error("Erro na RPC process_geojson_lotes:", rpcError);
                toast.warning("Empreendimento criado, mas falhou ao processar os lotes individuais.");
            }
        } catch (processError) {
             console.error("Erro ao processar GeoJSON para RPC:", processError);
             toast.error("Erro ao ler o arquivo GeoJSON para processar os lotes.");
        }
      }

      toast.success('Empreendimento criado com sucesso!');
      navigate('/admin-filial/mapa');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Erro: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Protected>
      <AppShell menuKey="adminfilial" breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Admin' }, { label: 'Empreendimentos' }, { label: 'Novo' }]}> 
        <header className="mb-4">
          <h1 className="text-2xl font-semibold">Novo Empreendimento</h1>
          <p className="text-sm text-muted-foreground">Envie o GeoJSON e masterplan para pré-visualizar.</p>
        </header>
        <div className="grid gap-4 lg:grid-cols-2">
          <section>
            <Card>
              <CardHeader><CardTitle>Informações</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Nome *</Label>
                    <Input id="nome" value={formData.nome} onChange={(e) => handleInputChange('nome', e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea id="descricao" value={formData.descricao} onChange={(e) => handleInputChange('descricao', e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="geojson">Arquivo GeoJSON *</Label>
                    <Input
                      id="geojson"
                      type="file"
                      accept=".geojson,.json"
                      required
                      onChange={(e) => e.target.files && handleGeojsonUpload(e.target.files[0])}
                    />
                    {geojsonFile && (
                      <div className="mt-2 text-sm text-green-600">
                        ✅ {geojsonFile.name} ({processedLotes.length} lotes)
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="masterplan">Masterplan (Imagem) *</Label>
                    <Input
                      id="masterplan"
                      type="file"
                      accept="image/*"
                      required
                      onChange={(e) => e.target.files && handleMasterplanUpload(e.target.files[0])}
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Salvando...' : 'Criar Empreendimento'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>
          <section>
            <Card>
              <CardHeader><CardTitle>Pré-visualização</CardTitle></CardHeader>
              <CardContent>
                <div ref={mapContainerRef} id="preview-map" className="h-[520px] rounded-md border" />
              </CardContent>
            </Card>
          </section>
        </div>
      </AppShell>
    </Protected>
  );
}
// --- FIM DA VERSÃO ESTÁVEL E CORRIGIDA ---
