import type { APIRoute } from 'astro';
import { LOGOS, FALLBACK_LOGO } from '../lib/logos';

// Sprite con todos los logos (<symbol id="slug">), referenciado desde TechLogo con <use>.
const symbol = (id: string, logo: (typeof LOGOS)[string]) => {
  const paint = logo.stroke
    ? 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"'
    : 'fill="currentColor"';
  return `<symbol id="${id}" viewBox="0 0 24 24" ${paint}>${logo.body}</symbol>`;
};

export const GET: APIRoute = () =>
  new Response(
    `<svg xmlns="http://www.w3.org/2000/svg">${Object.entries(LOGOS)
      .map(([id, logo]) => symbol(id, logo))
      .join('')}${symbol('fallback', FALLBACK_LOGO)}</svg>`,
    { headers: { 'Content-Type': 'image/svg+xml' } },
  );
