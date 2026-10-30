// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { rm } from 'node:fs/promises';
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

// https://astro.build/config
export default defineConfig({
  integrations: [excludeSourceExcels()],
  vite: {
    plugins: [tailwindcss()],
  },
});
