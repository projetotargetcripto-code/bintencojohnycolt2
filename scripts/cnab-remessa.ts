import { writeFileSync, readFileSync } from 'fs';
import { generateRemessa, RemessaRegistro } from '../lib/cnab.ts';

const [,, loteArg, filialArg, outFile, recordsFile] = process.argv;

if (!loteArg || !filialArg || !outFile) {
  console.error('Usage: ts-node scripts/cnab-remessa.ts <lote> <filial> <outputFile> [records.json]');
  process.exit(1);
}

let registros: RemessaRegistro[] = [];
if (recordsFile) {
  registros = JSON.parse(readFileSync(recordsFile, 'utf8')) as RemessaRegistro[];
}

const content = generateRemessa(Number(loteArg), filialArg, registros);
writeFileSync(outFile, content);
console.log(`Arquivo CNAB gerado em ${outFile}`);
