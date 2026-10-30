// Convierte las portadas de src/assets/covers a WebP (más liviano que JPG/PNG): ancho máximo 600 px
// (sobra para el tamaño en que se muestran) y calidad 82. Borra el original y actualiza
// src/data/covers.json. Los scripts de descarga lo llaman al terminar, así no queda ningún JPG/PNG.
//
// Uso: node scripts/optimize-covers.mjs
import sharp from 'sharp';
import { readdir, readFile, writeFile, unlink, stat, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(root, 'src', 'assets', 'covers');
const INDEX = join(root, 'src', 'data', 'covers.json');
const MAX_WIDTH = 600;
const QUALITY = 82;

export async function optimizeCovers({ quiet = false } = {}) {
  const files = (await readdir(DIR)).filter((f) => /\.(jpe?g|png)$/i.test(f));
  let before = 0;
  let after = 0;
  for (const f of files) {
    const src = join(DIR, f);
    const slug = f.replace(/\.[^.]+$/, '');
    const out = join(DIR, `${slug}.webp`);
    before += (await stat(src)).size;
    await sharp(src).resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: QUALITY }).toFile(out);
    after += (await stat(out)).size;
    await unlink(src);
  }
  // El índice se lee recién ahora (otro proceso pudo escribirlo mientras se convertía) y siempre
  // refleja los archivos reales. Si parece truncado (p. ej. OneDrive restauró una versión vieja), se
  // aborta en vez de rellenarlo con entradas 'sin registrar'.
  const index = existsSync(INDEX) ? JSON.parse(await readFile(INDEX, 'utf8')) : {};
  const total = (await readdir(DIR)).length;
  if (Object.keys(index).length < total * 0.9) {
    throw new Error(`covers.json tiene ${Object.keys(index).length} entradas para ${total} portadas: parece truncado, no se sobrescribe`);
  }
  // El índice siempre refleja los archivos reales (un script que guardó el índice con datos viejos
  // podría haber dejado nombres .jpg).
  const onDisk = new Map((await readdir(DIR)).map((f) => [f.replace(/\.[^.]+$/, ''), f]));
  for (const [slug, file] of onDisk) {
    if (index[slug]) index[slug].file = file;
    else index[slug] = { file, source: 'sin registrar' };
  }
  await writeFile(`${INDEX}.tmp`, JSON.stringify(index, null, 2) + '\n');
  await rename(`${INDEX}.tmp`, INDEX);
  if (!quiet && files.length) {
    const mb = (n) => (n / 1024 / 1024).toFixed(1);
    console.log(`✔ ${files.length} portadas convertidas a WebP: ${mb(before)} MB → ${mb(after)} MB`);
  }
  return { converted: files.length, before, after };
}

// Ejecución directa
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await optimizeCovers();
}
