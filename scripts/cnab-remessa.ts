import { writeFileSync } from 'fs';
import { generateRemessa } from '../lib/cnab.ts';

const [,, loteArg, filial, output] = process.argv;

if (!loteArg || !filial || !output) {
  console.error('Usage: node scripts/cnab-remessa.ts <lote> <filial> <output>');
  process.exit(1);
}

const lote = Number(loteArg);
const fileContent = generateRemessa(lote, filial);
writeFileSync(output, fileContent, { encoding: 'utf8' });
console.log(`Remessa gerada em ${output}`);
