// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/**
 * Los Excel de public/books solo son la fuente de datos del importador. Contienen la columna de enlaces
 * de descarga, así que nunca deben publicarse: se eliminan de la salida al terminar la build.
 * @returns {import('astro').AstroIntegration}
 */
const excludeSourceExcels = () => ({
  name: 'exclude-source-excels',
  hooks: {
    'astro:build:done': async ({ dir, logger }) => {
      await rm(fileURLToPath(new URL('books/', dir)), { recursive: true, force: true });
      logger.info('Excel de origen excluidos de la salida (dist/books)');
    },
  },
});

/**
 * Netlify sirve el HTML con max-age=0: el navegador descarta lo precargado y lo vuelve a pedir al hacer clic.
 * Las fichas (/libros/*) se cubren en netlify.toml; aquí se genera la misma regla para el inicio y cada
 * sección de listados. No se usa un comodín "/*" porque se combinaría con la caché de /_astro/*.
 * @returns {import('astro').AstroIntegration}
 */
const cacheListPages = () => ({
  name: 'cache-list-pages',
  hooks: {
    'astro:build:done': async ({ dir, logger }) => {
      const root = fileURLToPath(dir);
      const sections = (await readdir(root, { withFileTypes: true }))
        .filter((d) => d.isDirectory() && !d.name.startsWith('_') && d.name !== 'libros' && d.name !== 'books')
        .map((d) => d.name);
      const rule = '  Cache-Control: public, max-age=300, must-revalidate';
      const paths = ['/', ...sections.flatMap((s) => [`/${s}/`, `/${s}/*`])];
      await writeFile(new URL('_headers', dir), paths.map((p) => `${p}\n${rule}\n`).join(''));
      logger.info(`Caché de 5 minutos para ${sections.length} secciones de listados (_headers)`);
    },
  },
});

// https://astro.build/config
export default defineConfig({
  integrations: [excludeSourceExcels(), cacheListPages()],
  // Pide en segundo plano las páginas de los enlaces que están en pantalla, para que el clic sea inmediato
  // también en el celular (donde no hay "hover"). Astro lo omite en conexiones lentas o con ahorro de datos.
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
  vite: {
    plugins: [tailwindcss()],
  },
});
