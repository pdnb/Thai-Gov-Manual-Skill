// node pdfpages.mjs file.pdf outDir [scale]
import { pdf } from 'pdf-to-img';
import fs from 'node:fs';
const [file, outDir, scale = '1'] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
let i = 0;
for await (const img of await pdf(file, { scale: Number(scale) })) fs.writeFileSync(`${outDir}/p${String(++i).padStart(3, '0')}.png`, img);
console.log('pages', i);
