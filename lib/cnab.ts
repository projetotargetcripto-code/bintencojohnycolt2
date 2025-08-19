export interface RemessaOptions {
  lote: number;
  filial: string;
  records?: string[];
}

function formatLine(content: string): string {
  return content.padEnd(240).slice(0, 240);
}

export function generateRemessa(
  lote: number,
  filial: string,
  records: string[] = [],
): string {
  const header = formatLine(
    `0${lote.toString().padStart(4, '0')}${filial.padEnd(10).slice(0, 10)}`,
  );

  const body = records.map((r) => formatLine(r));

  const trailer = formatLine(
    `9${lote.toString().padStart(4, '0')}${records.length
      .toString()
      .padStart(6, '0')}`,
  );

  return [header, ...body, trailer].join('\n');
}

export function parseRetorno(content: string): { lote: number; filial: string } {
  const [firstLine] = content.split(/\r?\n/);
  const lote = Number(firstLine?.slice(1, 5)) || 0;
  const filial = firstLine?.slice(5, 15).trim() || '';
  return { lote, filial };
}
