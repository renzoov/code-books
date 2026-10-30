import type { ImageMetadata } from 'astro';
import booksRaw from '../data/books.json';
import { CATEGORY_COLORS, TECH_COLORS } from './colors';

export interface Book {
  slug: string;
  titulo: string;
  autores: string[];
  editorial: string | null;
  paginas: number | null;
  anio: number | null;
  nivel: string | null;
  tecnologia: string;
  techSlug: string;
  /** Categoría del inicio, según el Excel de origen. */
  categoria: string;
  /** Subgrupo dentro de la categoría (p. ej. "Lenguajes" en Microsoft y .NET), si lo tiene. */
  subgrupo: string | null;
  orden: number;
}

export interface Insight {
  descripcion: string;
  temas: string[];
  enfoque: 'teorico' | 'ejercicios' | 'proyectos' | 'mixto';
  tieneEjercicios: boolean;
  tieneProyectos: boolean;
  proyectos: { nombre: string; descripcion: string }[];
  confianza: 'alta' | 'media';
  /** URLs consultadas al redactar (solo trazabilidad, no se muestran). */
  fuentes?: string[];
}

export interface Tech {
  slug: string;
  nombre: string;
  color: string;
  total: number;
  categoria: string;
  subgrupo: string | null;
}

export const PAGE_SIZE = 10;

export const books: Book[] = booksRaw as Book[];

export const techs: Tech[] = (() => {
  const map = new Map<string, Tech>();
  for (const b of books) {
    const t = map.get(b.techSlug) ?? {
      slug: b.techSlug,
      nombre: b.tecnologia,
      color: TECH_COLORS[b.techSlug] ?? '#94a3b8',
      total: 0,
      categoria: b.categoria,
      subgrupo: b.subgrupo ?? null,
    };
    t.total++;
    map.set(b.techSlug, t);
  }
  return [...map.values()];
})();

const techsBySlug = new Map(techs.map((t) => [t.slug, t]));
export const techBySlug = (slug: string) => techsBySlug.get(slug)!;

/** Igual que en scripts/import-books.mjs: sin tildes, en minúsculas y con guiones. */
const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export interface Category {
  slug: string;
  nombre: string;
  color: string;
  /** Libros de la categoría (suma de sus secciones). */
  total: number;
  techs: Tech[];
  grupos: { nombre: string | null; techs: Tech[] }[];
}

/**
 * Categorías en el orden de importación, cada una con sus tecnologías y, si las tiene, agrupadas por
 * subgrupo. Una categoría sin subgrupos tiene un único grupo con nombre null.
 */
export const categories: Category[] = [...new Set(techs.map((t) => t.categoria))].map((nombre) => {
  const list = techs.filter((t) => t.categoria === nombre);
  const grupos = [...new Set(list.map((t) => t.subgrupo))].map((sub) => ({
    nombre: sub,
    techs: list.filter((t) => t.subgrupo === sub),
  }));
  return {
    slug: slugify(nombre),
    nombre,
    color: CATEGORY_COLORS[nombre] ?? '#818cf8',
    total: list.reduce((n, t) => n + t.total, 0),
    techs: list,
    grupos,
  };
});

const categoriesByName = new Map(categories.map((c) => [c.nombre, c]));
export const categoryOf = (tech: Tech) => categoriesByName.get(tech.categoria)!;

const booksByTech = new Map<string, Book[]>();
for (const b of books) {
  const list = booksByTech.get(b.techSlug) ?? [];
  list.push(b);
  booksByTech.set(b.techSlug, list);
}
for (const list of booksByTech.values()) list.sort((a, b) => a.orden - b.orden);

export const booksOf = (techSlug: string) => booksByTech.get(techSlug) ?? [];

/** Página (1-based) donde aparece un libro dentro de su sección. */
export const pageOf = (b: Book) => Math.floor(booksOf(b.techSlug).findIndex((x) => x.slug === b.slug) / PAGE_SIZE) + 1;

// --- URLs y textos compartidos --------------------------------------------------------------------

export const categoryHref = (c: Category) => `/categoria/${c.slug}`;
export const techHref = (techSlug: string, page = 1) => (page > 1 ? `/${techSlug}/${page}` : `/${techSlug}`);
export const bookHref = (b: Book) => `/libros/${b.techSlug}/${b.slug}`;

export const authorsText = (b: Book) => (b.autores.length ? b.autores.join(', ') : 'Autor no indicado');

/** Nombre de un archivo sin carpeta ni extensión ("../assets/covers/x.webp" → "x"). */
const fileStem = (path: string) => path.split('/').pop()!.replace(/\.[^.]+$/, '');

// Insights redactados: un JSON por tecnología, clave = slug del libro. Se cargan bajo demanda (no eager):
// importarlos todos al arrancar obligaba a Vite a procesar ~10 MB antes de servir la primera página en dev.
const insightLoaders = import.meta.glob<Record<string, Insight>>('../data/insights/*.json', { import: 'default' });
// El nombre del archivo indica la tecnología (csharp-auto.json, angular-2.json); un libro presente en dos
// secciones puede tener una descripción distinta en cada una, así que primero se busca en las de su sección.
const insightFilesByTech = new Map<string, string[]>();
for (const path of Object.keys(insightLoaders)) {
  const tech = fileStem(path).replace(/-(auto|\d+)$/, '');
  insightFilesByTech.set(tech, [...(insightFilesByTech.get(tech) ?? []), path]);
}
const loadedInsights = new Map<string, Promise<Record<string, Insight>>>();
const loadInsights = (path: string) => {
  if (!loadedInsights.has(path)) loadedInsights.set(path, insightLoaders[path]());
  return loadedInsights.get(path)!;
};
export const getInsight = async (slug: string, techSlug?: string): Promise<Insight | undefined> => {
  for (const path of (techSlug && insightFilesByTech.get(techSlug)) || []) {
    const found = (await loadInsights(path))[slug];
    if (found) return found;
  }
  // Libro compartido cuya descripción está en el archivo de otra sección.
  for (const path of Object.keys(insightLoaders)) {
    const found = (await loadInsights(path))[slug];
    if (found) return found;
  }
};

// Portadas: src/assets/covers/<slug>.webp (opcionales). También bajo demanda: con eager, el servidor de
// desarrollo procesaba las ~4.200 imágenes antes de responder la primera petición (unos 5 minutos).
const coverLoaders = import.meta.glob<{ default: ImageMetadata }>('../assets/covers/*.{jpg,jpeg,png,webp}');
const coverPaths = new Map(Object.keys(coverLoaders).map((path) => [fileStem(path), path]));
export const getCover = async (slug: string): Promise<ImageMetadata | undefined> => {
  const path = coverPaths.get(slug);
  return path ? (await coverLoaders[path]()).default : undefined;
};

export const ENFOQUE_LABEL: Record<Insight['enfoque'], string> = {
  teorico: 'Teórico',
  ejercicios: 'Con ejercicios',
  proyectos: 'Con proyectos',
  mixto: 'Teoría + práctica',
};
