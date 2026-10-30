import { readFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'src', 'data', 'insights');
const books = JSON.parse(await readFile(join(root, 'src', 'data', 'books.json'), 'utf8'));

const insights = {};
for (const f of (await readdir(dir).catch(() => [])).filter((f) => f.endsWith('.json'))) {
  Object.assign(insights, JSON.parse(await readFile(join(dir, f), 'utf8')));
}

const slugs = new Set(books.map((b) => b.slug));
const missing = [...slugs].filter((s) => !(s in insights));
const orphan = Object.keys(insights).filter((s) => !slugs.has(s));
const ENFOQUES = ['teorico', 'ejercicios', 'proyectos', 'mixto'];
const invalid = Object.entries(insights)
  .filter(([, i]) => !i.descripcion || !ENFOQUES.includes(i.enfoque) || !Array.isArray(i.temas) || !Array.isArray(i.proyectos))
  .map(([s]) => s);

console.log(`insights: ${Object.keys(insights).length}/${slugs.size}`);
if (missing.length) console.log(`faltan (${missing.length}):\n  ${missing.join('\n  ')}`);
if (orphan.length) console.log(`huérfanos (${orphan.length}):\n  ${orphan.join('\n  ')}`);
if (invalid.length) console.log(`inválidos (${invalid.length}):\n  ${invalid.join('\n  ')}`);
process.exit(missing.length || orphan.length || invalid.length ? 1 : 0);
