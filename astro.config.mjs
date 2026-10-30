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
 * Reglas de caché (_headers, mismo formato en Netlify y Cloudflare Pages):
 * - /_astro/*: los archivos llevan un hash en el nombre (si cambian, cambia la URL), se guardan un año.
 * - Páginas: Netlify y Cloudflare sirven el HTML con max-age=0, y el navegador descarta lo precargado y lo
 *   vuelve a pedir al hacer clic. Con 1 minuto el clic usa la copia precargada (se suele hacer clic a los pocos
 *   segundos) y una versión nueva del sitio llega casi enseguida a quien ya lo tenía abierto.
 * Cloudflare admite como máximo 100 reglas pero permite quitar una cabecera con "!": un comodín "/*" y se
 * reemplaza en /_astro/*. Netlify no admite "!" (combinaría las dos cabeceras), así que ahí va una regla por
 * sección. Cloudflare marca sus builds con CF_PAGES.
 * @returns {import('astro').AstroIntegration}
 */
const cacheHeaders = () => ({
  name: 'cache-headers',
  hooks: {
    'astro:build:done': async ({ dir, logger }) => {
      const assets = 'Cache-Control: public, max-age=31536000, immutable';
      const pages = 'Cache-Control: public, max-age=60, must-revalidate';
      /** @type {[string, string[]][]} */
      let rules;
      if (process.env.CF_PAGES) {
        rules = [
          ['/*', [pages]],
          ['/_astro/*', ['! Cache-Control', assets]],
        ];
      } else {
        const sections = (await readdir(fileURLToPath(dir), { withFileTypes: true }))
          .filter((d) => d.isDirectory() && !d.name.startsWith('_') && d.name !== 'books')
          .map((d) => d.name);
        rules = [
          ['/_astro/*', [assets]],
          ['/', [pages]],
          ...sections.flatMap((s) => [
            [`/${s}/`, [pages]],
            [`/${s}/*`, [pages]],
          ]),
        ];
      }
      const text = rules.map(([path, lines]) => [path, ...lines.map((l) => `  ${l}`), ''].join('\n')).join('');
      await writeFile(new URL('_headers', dir), text);
      logger.info(`_headers para ${process.env.CF_PAGES ? 'Cloudflare' : 'Netlify'}: ${rules.length} reglas`);
    },
  },
});

// https://astro.build/config
export default defineConfig({
  integrations: [excludeSourceExcels(), cacheHeaders()],
  // Pide en segundo plano las páginas de los enlaces que están en pantalla, para que el clic sea inmediato
  // también en el celular (donde no hay "hover"). Astro lo omite en conexiones lentas o con ahorro de datos.
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
  vite: {
    plugins: [tailwindcss()],
  },
});
