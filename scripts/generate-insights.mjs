// Genera las descripciones (insights) de los libros que aún no tienen, usando Claude Code en modo
// no interactivo (`claude -p`). Usa la sesión iniciada en Claude Code, es decir, tu plan de suscripción.
//
// Uso:
//   npm run insights -- --tech reactjs          solo una sección
//   npm run insights -- --limit 10              como máximo 10 libros
//   npm run insights -- --tech vuejs --dry-run  muestra el resultado sin guardar
//   npm run insights -- --batch 5               libros por llamada (por defecto 5)
//   npm run insights -- --slug <slug> --force   regenera un libro que ya tiene descripción
//   npm run insights -- --tech angular --force  regenera toda una sección
// Con --force la nueva versión reemplaza a la anterior en el mismo archivo donde estaba.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(root, 'src', 'data');
const INSIGHTS_DIR = join(DATA, 'insights');

// --- Seguridad de costos -----------------------------------------------------------------------
// Con ANTHROPIC_API_KEY definida, Claude Code factura por API (pago aparte) en vez de usar el plan.
if (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN) {
  console.error(
    '✖ Hay una API key de Anthropic en el entorno (ANTHROPIC_API_KEY / ANTHROPIC_AUTH_TOKEN).\n' +
      '  Claude Code la usaría y se cobraría aparte de tu plan. Quítala y vuelve a ejecutar.',
  );
  process.exit(1);
}

// --- Argumentos -------------------------------------------------------------------------------
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? def : args[i + 1];
};
const TECH = opt('tech', null);
const LIMIT = Number(opt('limit', Infinity));
const BATCH = Math.max(1, Number(opt('batch', 5)));
const SLUG = opt('slug', null);
const DRY_RUN = args.includes('--dry-run');
const FORCE = args.includes('--force');

// --- Datos ------------------------------------------------------------------------------------
const books = JSON.parse(await readFile(join(DATA, 'books.json'), 'utf8'));
const existing = {};
const fileOf = {}; // slug → archivo donde ya está su descripción
for (const f of (await readdir(INSIGHTS_DIR).catch(() => [])).filter((f) => f.endsWith('.json'))) {
  const entries = JSON.parse(await readFile(join(INSIGHTS_DIR, f), 'utf8'));
  Object.assign(existing, entries);
  for (const slug of Object.keys(entries)) fileOf[slug] = f;
}

// Sin --force: solo libros sin descripción. Con --force: también los que tienen una descripción antigua
// (sin "fuentes"); los ya redactados con fuentes oficiales se saltan, así una ejecución cortada por el
// límite del plan se retoma sin repetir trabajo. Con --slug se regenera ese libro siempre.
const needsWork = (b) => (SLUG ? FORCE || !(b.slug in existing) : FORCE ? !existing[b.slug]?.fuentes : !(b.slug in existing));
const pending = [...new Map(books.filter(needsWork).map((b) => [b.slug, b])).values()]
  .filter((b) => (!TECH || b.techSlug === TECH) && (!SLUG || b.slug === SLUG))
  .slice(0, LIMIT);

if (!pending.length) {
  console.log('✔ No hay libros pendientes' + (TECH ? ` en "${TECH}"` : '') + '.');
  process.exit(0);
}
console.log(`${pending.length} libros pendientes${TECH ? ` en "${TECH}"` : ''}, en tandas de ${BATCH}${DRY_RUN ? ' (dry-run)' : ''}.`);

// --- Prompt y esquema -------------------------------------------------------------------------
const insightSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['slug', 'descripcion', 'temas', 'enfoque', 'tieneEjercicios', 'tieneProyectos', 'proyectos', 'confianza', 'fuentes'],
  properties: {
    slug: { type: 'string' },
    descripcion: { type: 'string' },
    temas: { type: 'array', items: { type: 'string' } },
    enfoque: { type: 'string', enum: ['teorico', 'ejercicios', 'proyectos', 'mixto'] },
    tieneEjercicios: { type: 'boolean' },
    tieneProyectos: { type: 'boolean' },
    proyectos: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['nombre', 'descripcion'],
        properties: { nombre: { type: 'string' }, descripcion: { type: 'string' } },
      },
    },
    confianza: { type: 'string', enum: ['alta', 'media'] },
    fuentes: { type: 'array', items: { type: 'string' } },
  },
};
const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['insights'],
  properties: { insights: { type: 'array', items: insightSchema } },
};

// Un ejemplo ya revisado sirve de referencia de estilo, extensión y nivel de detalle.
const EXAMPLE_SLUG = 'angular-shopping-store-2024';
const example = existing[EXAMPLE_SLUG];

const buildPrompt = (batch) => `Eres el redactor de un catálogo informativo de libros de programación (no es una tienda).
Para cada libro de la lista, INVESTIGA antes de escribir, usando SOLO FUENTES OFICIALES O LEGÍTIMAS:
1. Busca con WebSearch la descripción oficial y el índice: página de la editorial (O'Reilly, Manning, Packt, Apress, BPB, Wrox, SitePoint, etc.), Amazon, sitio o blog del autor, Google Books, Goodreads. Lee las páginas relevantes con WebFetch.
2. NUNCA uses sitios de descarga de libros o PDFs (allitebooks, oceanofpdf, z-library, dokumen.pub, vdoc.pub y similares), ni los cites en "fuentes".
3. Descarta páginas que redirijan a otro sitio, que pidan verificación anti-bots o que no traten de ESTE libro (otra edición u otro autor).
Luego combina lo encontrado con tu propio criterio de experto y redacta en ESPAÑOL neutro:

- "descripcion": 3 párrafos separados por "\\n\\n":
  1) de qué trata, con qué versión de la tecnología y para quién es (nivel y conocimientos previos);
  2) qué enseña concretamente: temas, APIs, librerías, servicios y herramientas que usa (nómbralos: p. ej. Stripe, Node.js, RxJS, Firebase, Jest);
  3) qué se construye o practica y tu valoración: qué aporta, qué deja fuera o qué conviene saber antes.
- "temas": 5 a 12 etiquetas cortas y concretas.
- "enfoque": "teorico" (conceptual, sin práctica guiada), "ejercicios" (recetas o ejercicios), "proyectos" (aprende construyendo aplicaciones) o "mixto" (teoría con ejemplos y algo de práctica).
- "tieneEjercicios" y "tieneProyectos": booleanos.
- "proyectos": si tiene proyectos, nómbralos y explica en 1–2 frases qué hace cada uno y qué tecnologías usa; si no tiene, deja [].
- "confianza": "alta" solo si encontraste información concreta del libro (descripción oficial, índice); "media" si te apoyas en el título, el autor y la época.
- "fuentes": las URLs oficiales que realmente usaste.

Reglas: no inventes nombres de proyectos, capítulos ni tecnologías. Si no los encontraste, descríbelos de forma genérica y usa "confianza": "media". No copies la descripción oficial: tradúcela, resúmela y complétala con tu análisis. No menciones precios, compras ni descargas. Devuelve exactamente un objeto por libro, con el mismo "slug" que se te da.

Ejemplo de estilo y nivel de detalle (ya aprobado):
${JSON.stringify({ slug: EXAMPLE_SLUG, ...example }, null, 2)}

Libros:
${JSON.stringify(
  batch.map((b) => ({
    slug: b.slug,
    titulo: b.titulo,
    autores: b.autores,
    editorial: b.editorial,
    anio: b.anio,
    paginas: b.paginas,
    nivel: b.nivel,
    seccion: b.tecnologia,
  })),
  null,
  2,
)}`;

// --- Llamada a Claude Code --------------------------------------------------------------------
class UsageLimitError extends Error {}

function runClaude(prompt) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'claude',
      [
        '-p',
        '--output-format', 'json',
        '--json-schema', JSON.stringify(schema),
        '--tools', 'WebSearch,WebFetch',
        '--allowedTools', 'WebSearch,WebFetch',
        '--no-session-persistence',
      ],
      { cwd: root, stdio: ['pipe', 'pipe', 'pipe'] },
    );
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', reject);
    child.on('close', (code) => {
      const text = `${out}\n${err}`;
      if (/usage limit|rate limit|limit reached|out of (extra )?usage/i.test(text) && code !== 0) {
        return reject(new UsageLimitError(text.trim().slice(0, 300)));
      }
      let res;
      try {
        res = JSON.parse(out);
      } catch {
        return reject(new Error(`salida no válida (código ${code}): ${text.trim().slice(0, 300)}`));
      }
      if (res.is_error) {
        const msg = String(res.result ?? res.subtype ?? 'error');
        return reject(/limit/i.test(msg) ? new UsageLimitError(msg) : new Error(msg));
      }
      let data = res.structured_output;
      if (!data && typeof res.result === 'string') {
        try {
          data = JSON.parse(res.result.replace(/^```(?:json)?\s*|\s*```$/g, ''));
        } catch {}
      }
      if (!data?.insights) return reject(new Error(`respuesta sin "insights": ${String(res.result).slice(0, 300)}`));
      resolve(data.insights);
    });
    child.stdin.end(prompt);
  });
}

// --- Guardado ---------------------------------------------------------------------------------
// Lo nuevo va a <tech>-auto.json, separado de lo escrito a mano. Con --force, la descripción
// regenerada reemplaza a la anterior en su mismo archivo, para no dejar duplicados.
async function save(fileName, entries) {
  const file = join(INSIGHTS_DIR, fileName);
  const current = existsSync(file) ? JSON.parse(await readFile(file, 'utf8')) : {};
  Object.assign(current, entries);
  await writeFile(file, JSON.stringify(current, null, 2) + '\n');
}

const ENFOQUES = insightSchema.properties.enfoque.enum;
const valid = (i) =>
  i && typeof i.descripcion === 'string' && i.descripcion.length > 80 && ENFOQUES.includes(i.enfoque) &&
  Array.isArray(i.temas) && Array.isArray(i.proyectos);

let done = 0;
let skipped = 0;
for (let i = 0; i < pending.length; i += BATCH) {
  const batch = pending.slice(i, i + BATCH);
  const label = `[${i + 1}-${i + batch.length}/${pending.length}]`;
  console.log(`${label} ${batch.map((b) => b.titulo).join(' · ')}`);

  let results;
  try {
    results = await runClaude(buildPrompt(batch));
  } catch (e) {
    if (e instanceof UsageLimitError) {
      console.error(`\n⏸ Se alcanzó el límite de uso del plan. Lo generado quedó guardado (${done} libros).`);
      console.error('  Vuelve a ejecutar el mismo comando más tarde: continuará con lo que falta.');
      console.error(`  Detalle: ${e.message}`);
      process.exit(2);
    }
    console.warn(`  ! tanda omitida: ${e.message}`);
    skipped += batch.length;
    continue;
  }

  const bySlug = new Map(results.map((r) => [r.slug, r]));
  const byFile = {};
  for (const b of batch) {
    const r = bySlug.get(b.slug);
    if (!valid(r)) {
      console.warn(`  ! ${b.slug}: respuesta incompleta, se reintentará en otra ejecución`);
      skipped++;
      continue;
    }
    const { slug, ...insight } = r;
    (byFile[fileOf[b.slug] ?? `${b.techSlug}-auto.json`] ??= {})[b.slug] = insight;
    done++;
    console.log(`  ✓ ${b.titulo} (${insight.enfoque}, confianza ${insight.confianza}, ${insight.fuentes.length} fuentes)`);
  }

  if (DRY_RUN) console.log(JSON.stringify(byFile, null, 2));
  else for (const [file, entries] of Object.entries(byFile)) await save(file, entries);
}

console.log(`\n✔ ${done} generados${skipped ? `, ${skipped} omitidos (vuelve a ejecutar para reintentar)` : ''}.`);
