# CodeBooks

Catálogo informativo de libros de programación (sin venta ni descargas), hecho con Astro y Tailwind.

## Datos

- `public/books/*.xlsx`: listas de origen. Cada Excel es una categoría y cada pestaña una sección. Nunca
  se editan: contienen enlaces de descarga, así que se borran de la salida al compilar.
- `scripts/import-books.mjs` genera `src/data/books.json` a partir de los Excel. Las correcciones viven
  en `scripts/`: `reclassify.mjs` (reasignaciones, duplicados y exclusiones) y `metadata-fixes.mjs`
  (títulos, autores, editoriales, años y páginas verificados).
- `src/data/insights/*.json`: descripción de cada libro, por sección.
- `src/assets/covers/*.webp` + `src/data/covers.json`: portadas y su origen.

## Comandos

| Comando                  | Acción                                                           |
| :----------------------- | :--------------------------------------------------------------- |
| `npm run dev`            | Servidor de desarrollo en `localhost:4321`                       |
| `npm run build`          | Importa los Excel y compila el sitio en `./dist/`                |
| `npm run import`         | Solo regenera `src/data/books.json`                              |
| `npm run covers`         | Descarga por ISBN las portadas que falten (`--tech <sección>`)   |
| `npm run covers:optimize`| Convierte a WebP las portadas nuevas                             |
| `npm run insights`       | Genera descripciones pendientes con `claude -p` (`--tech`/`--slug`) |
| `npm run check:insights` | Cuenta los libros con descripción                                |
