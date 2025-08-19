export interface RemessaRegistro {
  nossoNumero: string;
  valor: number;
}

function pad(value: string | number, length: number, char: string = '0', side: 'left' | 'right' = 'left'): string {
  const str = String(value);
  if (str.length >= length) return str.slice(0, length);
  const padStr = char.repeat(length - str.length);
  return side === 'left' ? padStr + str : str + padStr;
}

function line(...parts: string[]): string {
  const joined = parts.join('');
  return joined.padEnd(240, ' ');
}

export function generateRemessa(lote: number, filial: string, registros: RemessaRegistro[] = []): string {
  const header = line('0', pad(lote, 4), pad(filial, 10, ' ', 'right'), pad('HEADER', 230, ' ', 'right'));
  const body = registros.map((r, idx) =>
    line(
      '1',
      pad(lote, 4),
      pad(filial, 10, ' ', 'right'),
      pad(idx + 1, 5),
      pad(r.nossoNumero, 20, ' ', 'right'),
      pad(r.valor.toFixed(2).replace('.', ''), 15)
    )
  );
  const trailer = line('9', pad(lote, 4), pad(filial, 10, ' ', 'right'), pad('TRAILER', 230, ' ', 'right'));
  return [header, ...body, trailer].join('\n');
}

export function parseRetorno(content: string): { lote: number; filial: string } {
  const firstLine = content.split(/\r?\n/)[0] || '';
  const lote = Number(firstLine.slice(1, 5).trim());
  const filial = firstLine.slice(5, 15).trim();
  if (!lote || !filial) throw new Error('Invalid CNAB file');
  return { lote, filial };
}

export function validateRetorno(content: string, lote: number, filial: string): boolean {
  const parsed = parseRetorno(content);
  return parsed.lote === lote && parsed.filial === filial;
}
