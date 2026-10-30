import type { APIRoute } from 'astro';
import { books, bookHref } from '../lib/data';

// Índice del buscador (Ctrl+K): un único archivo estático que se descarga al abrir el buscador,
// en lugar de incrustarlo en cada una de las ~1.400 páginas.
export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      books.map((b) => ({
        t: b.titulo,
        a: b.autores.join(', '),
        s: b.tecnologia,
        h: bookHref(b),
      })),
    ),
    { headers: { 'Content-Type': 'application/json' } },
  );
