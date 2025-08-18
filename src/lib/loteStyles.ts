export type LoteStatus = 'disponivel' | 'reservado' | 'vendido';

export const STATUS_MAP: Record<LoteStatus, { color: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  disponivel: { color: '#22c55e', variant: 'secondary' },
  reservado: { color: '#eab308', variant: 'default' },
  vendido: { color: '#ef4444', variant: 'destructive' },
};

const DEFAULT_STYLE = { color: '#3b82f6', variant: 'outline' as const };

export function getLoteColor(status: string): string {
  return STATUS_MAP[status as LoteStatus]?.color ?? DEFAULT_STYLE.color;
}

export function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  return STATUS_MAP[status as LoteStatus]?.variant ?? DEFAULT_STYLE.variant;
}

export function getLoteStatusStyle(status: string) {
  const color = getLoteColor(status);
  return { color, weight: 2, fillColor: color, fillOpacity: 0.25 };
}

export function getLoteStyle(status: string, isHovered = false, isSelected = false) {
  const baseColor = getLoteColor(status);
  return {
    color: isSelected ? '#1e40af' : baseColor,
    weight: isSelected ? 3 : isHovered ? 2 : 1,
    opacity: 1,
    fillColor: baseColor,
    fillOpacity: isHovered ? 0.7 : isSelected ? 0.8 : 0.5,
    dashArray: status === 'reservado' ? '5, 5' : undefined,
  };
}
