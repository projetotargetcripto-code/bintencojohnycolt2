import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Interface para as propriedades detalhadas do lote
export interface LoteDetalhado {
  id: string;
  nome: string;
  numero: number;
  status: string;
  area_m2: number;
  perimetro_m: number;
  area_hectares: number;
  valor: number | null; // Adiciona o campo valor
  // Adicionar coordenadas do centroide se for exibi-las
}

interface LoteInfoModalProps {
  lote: LoteDetalhado | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatNumber = (num: number | null | undefined) => {
  if (num === null || num === undefined) return 'N/A';
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatCurrency = (num: number | null | undefined) => {
  if (num === null || num === undefined) return 'Não definido';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export function LoteInfoModal({ lote, isOpen, onClose }: LoteInfoModalProps) {
  if (!lote) return null;

  const getStatusVariant = (status: string) => {
    switch (status) {
        case 'disponivel': return 'default';
        case 'vendido': return 'destructive';
        case 'reservado': return 'secondary';
        default: return 'outline';
    }
  }

  const numeroTexto = (() => {
    if (lote.numero !== null && lote.numero !== undefined) return String(lote.numero);
    const m = (lote.nome || '').match(/\d+/);
    return m ? m[0] : 'N/A';
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] z-[2000]">
        <DialogHeader>
          <DialogTitle>{lote.nome}</DialogTitle>
          <DialogDescription>
            Detalhes completos do lote selecionado.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">Status</span>
            <Badge variant={getStatusVariant(lote.status)} className="w-fit">
                {lote.status.charAt(0).toUpperCase() + lote.status.slice(1)}
            </Badge>
          </div>
          <div className="grid grid-cols-2 items-center gap-4 font-semibold">
            <span className="text-sm font-medium text-muted-foreground">Valor (R$)</span>
            <span>{formatCurrency(lote.valor)}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">Número</span>
            <span>{numeroTexto}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">Área</span>
            <span>{formatNumber(lote.area_m2)} m²</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">Perímetro</span>
            <span>{formatNumber(lote.perimetro_m)} m</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">Área (Hectares)</span>
            <span>{lote.area_hectares ? lote.area_hectares.toFixed(4) : 'N/A'} ha</span>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
