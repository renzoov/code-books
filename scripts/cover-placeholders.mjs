// Genera para cada portada de src/assets/covers una miniatura diminuta (16 px de ancho, ~300 bytes) en
// src/data/cover-placeholders.json. Va incrustada en el HTML como fondo de la portada: la tarjeta muestra la
// portada borrosa al instante y la imagen real la reemplaza al llegar, aunque el CDN no la tenga en caché.
// Es incremental: solo procesa las portadas nuevas o cambiadas (por tamaño de archivo).
//
// Uso: node scripts/cover-placeholders.mjs
import sharp from 'sharp';
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(root, 'src', 'assets', 'covers');
const OUT = join(root, 'src', 'data', 'cover-placeholders.json');
const WIDTH = 16;

const previous = existsSync(OUT) ? JSON.parse(await readFile(OUT, 'utf8')) : {};
const result = {};
let made = 0;
for (const f of (await readdir(DIR)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort()) {
  const slug = f.replace(/\.[^.]+$/, '');
  const { size } = await stat(join(DIR, f));
  if (previous[slug]?.size === size) {
    result[slug] = previous[slug];
    continue;
  }
  const buf = await sharp(join(DIR, f)).resize({ width: WIDTH }).webp({ quality: 40 }).toBuffer();
  result[slug] = { size, src: `data:image/webp;base64,${buf.toString('base64')}` };
  made++;
}
await writeFile(OUT, JSON.stringify(result));
console.log(`Miniaturas de portada: ${Object.keys(result).length} (${made} nuevas)`);
