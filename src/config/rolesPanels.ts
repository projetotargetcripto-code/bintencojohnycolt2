export const ALL_ROLES = [
  'superadmin',
  'adminfilial',
  'urbanista',
  'juridico',
  'contabilidade',
  'marketing',
  'comercial',
  'imobiliaria',
  'corretor',
  'obras',
  'investidor',
  'terrenista',
] as const;

export const ALL_PANELS = [
  { key: 'adminfilial', label: 'Admin Filial (Geral)' },
  { key: 'urbanista', label: 'Urbanista (Mapa, Projetos)' },
  { key: 'juridico', label: 'Jurídico' },
  { key: 'contabilidade', label: 'Contabilidade' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'comercial', label: 'Comercial (Vendas)' },
  { key: 'imobiliaria', label: 'Imobiliária' },
  { key: 'corretor', label: 'Corretor' },
  { key: 'obras', label: 'Obras' },
  { key: 'investidor', label: 'Investidor' },
  { key: 'terrenista', label: 'Terrenista' },
] as const;

export type Role = typeof ALL_ROLES[number];
export type PanelKey = typeof ALL_PANELS[number]['key'];
