// Importa los libros de todos los Excel de public/books a src/data/books.json.
//
// Flujo: 1) se leen todas las filas de todas las pestañas; 2) se aplican las reasignaciones de libros
// individuales (scripts/reclassify.mjs); 3) a partir de la pestaña final de cada libro se calculan su
// tecnología, URL, categoría, subgrupo y orden. Toda la configuración de clasificación está en este
// archivo, más abajo.
import ExcelJS from 'exceljs';
import { readdir, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DROP, EXCLUDE, KEEP_ONE, RECLASSIFY, SPLIT_RULES, VIRTUAL_SHEETS } from './reclassify.mjs';
import { METADATA_FIXES } from './metadata-fixes.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BOOKS_DIR = join(root, 'public', 'books');
const OUT_FILE = join(root, 'src', 'data', 'books.json');

// --- Configuración de clasificación -----------------------------------------------------------

// Pestañas que no se publican: las formadas solo por X ("XXXXXX", "XXXXXXX", …).
const isExcludedSheet = (name) => /^x+$/i.test(name);

// Categoría del inicio según el Excel de origen, en el orden en que se muestran. Un Excel nuevo sin
// entrada usa su nombre de archivo y va al final.
const CATEGORIES = {
  'Lista_JS_Frameworks.xlsx': 'JavaScript y frameworks',
  'Lista_Frontend.xlsx': 'Frontend web',
  'Lista_BackEnd_Otros.xlsx': 'Backend y otros lenguajes',
  'Lista_BackEnd_Microsoft.xlsx': 'Microsoft y .NET',
  'Lista_Bd_Reportes.xlsx': 'Bases de datos y reportes',
  'Lista_AI_Datos.xlsx': 'Inteligencia artificial y datos',
  'Lista_Moviles.xlsx': 'Desarrollo móvil',
  'Lista_Cloud.xlsx': 'Cloud',
  'Lista_Varios.xlsx': 'Ingeniería de software',
};

// Pestañas que van a otra categoría que la de su Excel.
const SHEET_CATEGORIES = {
  // C y C++ no es exclusivo de Microsoft
  'C y C++': 'Backend y otros lenguajes',
  // Lista_Varios.xlsx reúne temas muy distintos: se reparte en tres categorías
  'DevOps y Mas': 'DevOps, sistemas y redes',
  'Git y GitHub': 'DevOps, sistemas y redes',
  Linux: 'DevOps, sistemas y redes',
  PowerShell: 'DevOps, sistemas y redes',
  Nginx: 'DevOps, sistemas y redes',
  IIS: 'DevOps, sistemas y redes',
  Redes: 'DevOps, sistemas y redes',
  Seguridad: 'DevOps, sistemas y redes',
  CMS: 'Plataformas y otras tecnologías',
  Sharepoint: 'Plataformas y otras tecnologías',
  Office: 'Plataformas y otras tecnologías',
  'Arduino y Mas': 'Plataformas y otras tecnologías',
  IOT: 'Plataformas y otras tecnologías',
  WordPress: 'Plataformas y otras tecnologías',
  'Unity y mas': 'Plataformas y otras tecnologías',
  'Bitcoin y Mas': 'Plataformas y otras tecnologías',
};

// Pestañas que se tratan como si estuvieran en otro Excel (para ordenarlas y agruparlas con sus pares).
// IoT viene en Lista_AI_Datos pero se muestra junto a Arduino.
const SHEET_FILES = {
  IOT: 'Lista_Varios.xlsx',
  // WordPress se une a CMS, y videojuegos (que reúne libros de juegos de todas las pestañas) va a
  // Plataformas y otras tecnologías.
  WordPress: 'Lista_Varios.xlsx',
  'Unity y mas': 'Lista_Varios.xlsx',
};

// Subgrupos dentro de las categorías de cada Excel, en el orden en que se muestran (por nombre de
// pestaña o de sección virtual).
const SUBGROUPS = {
  'Lista_Frontend.xlsx': {
    'Maquetación y estilos': ['HTML', 'HTML5', 'CSS', 'SASS y LESS', 'Bootstrap'],
    'Diseño UX/UI': ['UX y UI'],
    'APIs, comunicación y tiempo real': ['APIS', 'Ajax', 'WebSocket', 'WebRTC'],
    Rendimiento: ['Rendimiento web'],
    'Gráficos': ['WebGL', 'OpenGL'],
    'Formatos de datos': ['JSON', 'XML'],
  },
  'Lista_BackEnd_Microsoft.xlsx': {
    Lenguajes: ['C#', 'F#', 'VB.NET', 'VBA'],
    'Web: interfaz y full-stack': ['MVC', 'Blazor'],
    'Backend, APIs y datos': ['.NET Core', 'Web API', 'WCF', 'EF', 'WF', '.NET Otros'],
    'Escritorio (Windows)': ['WinForms', 'WPF'],
  },
  'Lista_Bd_Reportes.xlsx': {
    'Relacionales (SQL)': ['MSSQL', 'MySQL', 'Oracle', 'PostgreSQL', 'SQLite'],
    NoSQL: ['MongoDB', 'Redis', 'Neo4j', 'CouchDB', 'NoSQL'],
    'Big data': ['Apache'],
    Reportes: ['SSRS', 'Crystal Reports'],
  },
  'Lista_AI_Datos.xlsx': {
    'Inteligencia artificial': [
      'IA generativa y LLMs',
      'Agentes de IA',
      'Machine Learning',
      'Deep Learning',
      'Procesamiento de lenguaje natural (NLP)',
      'Visión por computadora',
      'IA: fundamentos y aplicaciones',
    ],
    'Ciencia de datos y big data': ['Data Science', 'Big Data'],
  },
  'Lista_Moviles.xlsx': {
    Nativo: ['Android', 'IOS'],
    Multiplataforma: ['Flutter', 'React Native', 'Xamarin', 'Ionic'],
    'Servicios y diseño': ['Firebase', 'Mobile'],
  },
  'Lista_Varios.xlsx': {
    // Ingeniería de software
    Fundamentos: ['CS', 'Algoritmos', 'Regular Expressions'],
    'Arquitectura y calidad': ['Arq. y Mas', 'Diseño de APIs y REST', 'Testing y calidad'],
    'Certificaciones y otros temas': ['Certificaciones', 'Varios'],
    // DevOps, sistemas y redes
    'DevOps y control de versiones': ['DevOps y Mas', 'Git y GitHub'],
    'Sistemas operativos y servidores': ['Linux', 'PowerShell', 'Nginx', 'IIS'],
    'Redes y seguridad': ['Redes', 'Seguridad'],
    // Plataformas y otras tecnologías
    'CMS y productividad': ['CMS', 'WordPress', 'Sharepoint', 'Office'],
    'Videojuegos y 3D': ['Unity y mas'],
    'Hardware, IoT y blockchain': ['Arduino y Mas', 'IOT', 'Bitcoin y Mas'],
  },
};

// Pestañas que se muestran como una sola sección (variantes del mismo tema): pestaña → pestaña con la
// que se une.
const SHEET_GROUPS = {
  'jQuery UI': 'jQuery',
  'jQuery Mobile': 'jQuery',
  'Data Mining': 'Data Science',
};

// Nombre visible de algunas pestañas.
const SHEET_NAMES = {
  'Unity y mas': 'Desarrollo de videojuegos',
  EF: 'Entity Framework y NHibernate',
  MVC: 'ASP.NET MVC',
  WF: 'Workflow Foundation',
  MSSQL: 'SQL Server',
  SSRS: 'Reporting Services (SSRS)',
  Apache: 'Apache: Hadoop, Spark y Kafka',
  APIS: 'APIs web',
  'SASS y LESS': 'Sass y Less',
  IOS: 'iOS',
  Mobile: 'Móvil (general)',
  CS: 'Ciencias de la computación',
  'Arq. y Mas': 'Arquitectura de software',
  'Arduino y Mas': 'Arduino y hardware',
  IOT: 'Internet de las cosas (IoT)',
  'Data Science': 'Ciencia de datos',
  'Procesamiento de lenguaje natural (NLP)': 'Lenguaje natural (NLP)',
  'Bitcoin y Mas': 'Blockchain y Bitcoin',
  'DevOps y Mas': 'DevOps y contenedores',
  'Regular Expressions': 'Expresiones regulares',
  Sharepoint: 'SharePoint',
  Office: 'Microsoft Office',
  Varios: 'Otros temas',
};

// URL de algunas tecnologías ("C#" daría /c, "F#" daría /f).
const TECH_SLUGS = {
  'C#': 'csharp',
  'F#': 'fsharp',
  'C y C++': 'c-cpp',
  SSRS: 'ssrs',
  Apache: 'apache',
  Mobile: 'movil',
  'Unity y mas': 'videojuegos',
  EF: 'entity-framework',
  IOT: 'iot',
  'Procesamiento de lenguaje natural (NLP)': 'nlp',
  'IA: fundamentos y aplicaciones': 'ia-fundamentos',
};

// Encabezados mal escritos en algún Excel que se aceptan igual (y se avisa para corregirlos).
const HEADER_TYPOS = { APRES: 'EDITORIAL' };

// Títulos que traen un prefijo que no es la editorial ni el autor registrado.
const TITLE_FIXES = {
  'Laurens Van Houtven - Crypto 101': 'Crypto 101',
  // Verificado: es de friends of ED (David Powers, 2009), no de SitePoint.
  'Sitepoint - Getting Started with CSS': 'Getting StartED with CSS',
  'Building Data-Driven Applications with Llamalndex': 'Building Data-Driven Applications with LlamaIndex',
  'Practical hap': 'Practical hapi',
  'Mastering JavaScript Single Page Pplication Development': 'Mastering JavaScript Single Page Application Development',
};

// --- Utilidades -------------------------------------------------------------------------------

const stripAccents = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '');

const normalize = (s) => stripAccents(s).replace(/[.\s¿?]/g, '').toUpperCase();

/** Clave para comparar títulos: sin mayúsculas, tildes ni signos, salvo # y + ("C#" ≠ "C++"). */
const titleKey = (s) => stripAccents(s).toLowerCase().replace(/[^a-z0-9#+]+/g, '');

const slugify = (s) =>
  stripAccents(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Identificador de un libro: título + año. Se recalcula cada vez que cambia alguno de los dos. */
const bookSlug = ({ titulo, anio }) => slugify(`${titulo}-${anio ?? ''}`);

/** Nombre visible de una pestaña o sección virtual. */
const displayName = (sheet) => SHEET_NAMES[sheet] ?? sheet;

/** Suma 1 al contador `key` de un objeto de resumen (se imprimen al final). */
const bump = (counter, key) => (counter[key] = (counter[key] ?? 0) + 1);

/** Clave "pestaña|título" con la que se identifican los libros en reclassify.mjs. */
const sheetTitleKey = (sheet, title) => `${sheet}|${titleKey(title)}`;

// Solo se toma el texto visible: de una celda con hipervínculo nunca se lee la URL.
const valueText = (v) => {
  if (v == null) return '';
  if (typeof v === 'object') {
    if (v.richText) return v.richText.map((t) => t.text).join('');
    if (v.text != null) return valueText(v.text); // el texto de un hipervínculo puede tener formato
    if (v.result != null) return String(v.result);
  }
  return String(v);
};
const cellText = (cell) => valueText(cell?.value);

const toInt = (v) => {
  const n = parseInt(String(v).replace(/[^\d.]/g, ''), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

// Nombres mal escritos en la celda AUTOR.
const AUTHOR_FIXES = { 'Amir Keivan ShafieiAmir Keivan': 'Amir Keivan Shafiei' };
const SUFFIX = /^(jr\.?|sr\.?|msc|phd|ii|iii)$/i;

const splitAuthors = (s) => {
  const parts = s
    .replace(/\s+/g, ' ')
    .split(/\s*(?:,|;|&|\sand\s|\sy\s)\s*/i)
    .map((a) => a.replace(/^and\s+/i, '').trim())
    .filter(Boolean);
  // "John Smith, Jr." → un solo autor
  const out = [];
  for (const p of parts) {
    if (SUFFIX.test(p) && out.length) out[out.length - 1] += `, ${p}`;
    else out.push(AUTHOR_FIXES[p] ?? p);
  }
  return out;
};

/** Quita del título el prefijo "Editorial - " (o "Autor - ") y una extensión ".pdf" sobrante. */
const cleanTitle = (title, editorial, autor) => {
  let t = title.replace(/\.pdf$/i, '').trim();
  const m = t.match(/^(.{2,40}?)\s+-\s*(.+)$/);
  if (m) {
    const prefix = normalize(m[1]);
    const matches = (x) => {
      const n = normalize(x);
      return n && (prefix === n || n.includes(prefix) || prefix.includes(n));
    };
    if (matches(editorial) || matches(autor)) t = m[2].trim();
  }
  return t;
};

const LEVELS = { basico: 'Básico', intermedio: 'Intermedio', avanzado: 'Avanzado', avanzada: 'Avanzado' };
const warnings = [];
// Un nivel desconocido (p. ej. una editorial escrita por error en la columna NIVEL) se descarta y se avisa.
const normalizeLevel = (s, where) => {
  if (!s) return null;
  const level = LEVELS[normalize(s).toLowerCase()];
  if (!level) warnings.push(`Nivel no reconocido en ${where}: "${s}" (se muestra sin nivel)`);
  return level ?? null;
};

const categoryOf = (file) =>
  CATEGORIES[file] ?? file.replace(/\.xlsx$/i, '').replace(/^Lista_/i, '').replace(/[_-]+/g, ' ');

// Los Excel con categoría conocida van primero, en el orden de CATEGORIES; los demás, alfabéticamente.
const rank = (f) => {
  const i = Object.keys(CATEGORIES).indexOf(f);
  return i === -1 ? Object.keys(CATEGORIES).length : i;
};

const subgroupOf = (file, sheet) => {
  const groups = SUBGROUPS[file] ?? {};
  return Object.keys(groups).find((g) => groups[g].includes(sheet)) ?? null;
};
const subgroupRank = (file, sheet) => {
  const groups = SUBGROUPS[file] ?? {};
  const g = subgroupOf(file, sheet);
  return g ? Object.keys(groups).indexOf(g) * 100 + groups[g].indexOf(sheet) : -1;
};

// --- 1) Lectura de todas las filas ------------------------------------------------------------

const files = (await readdir(BOOKS_DIR))
  .filter((f) => f.toLowerCase().endsWith('.xlsx') && !f.startsWith('~$'))
  .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));

const rows = [];
const fileOfSheet = { ...VIRTUAL_SHEETS }; // pestaña → Excel al que pertenece

for (const file of files) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(join(BOOKS_DIR, file));

  for (const ws of wb.worksheets) {
    const rawSheet = ws.name.trim();
    if (isExcludedSheet(rawSheet)) continue;
    // Las pestañas agrupadas se tratan desde aquí como la pestaña con la que se unen.
    const sheet = SHEET_GROUPS[rawSheet] ?? rawSheet;
    const sheetFile = SHEET_FILES[sheet] ?? file;
    if (fileOfSheet[sheet] && fileOfSheet[sheet] !== sheetFile) {
      warnings.push(`La pestaña "${sheet}" existe en ${fileOfSheet[sheet]} y en ${file}; se unen en una sola sección`);
    }
    fileOfSheet[sheet] ??= sheetFile;

    const cols = {};
    ws.getRow(1).eachCell((cell, n) => {
      let h = normalize(cellText(cell));
      if (HEADER_TYPOS[h]) {
        warnings.push(`${file} / ${sheet}: el encabezado "${cellText(cell)}" se tomó como ${HEADER_TYPOS[h]} (corrígelo en el Excel)`);
        h = HEADER_TYPOS[h];
      }
      // La columna "LINK PAGINA" (sitios de descarga) se ignora a propósito: no se guarda ni se usa.
      if (h === 'NOMBREDELIBRO') cols.titulo = n;
      else if (h === 'AUTOR') cols.autor = n;
      else if (h === 'EDITORIAL') cols.editorial = n;
      else if (h.startsWith('NROPAG')) cols.paginas = n;
      else if (h === 'NIVEL') cols.nivel = n;
      else if (h.endsWith('O') && h.length === 3 && h.startsWith('A')) cols.anio = n; // AÑO / ANO
    });
    if (!cols.titulo) {
      warnings.push(`${file} / ${sheet}: sin columna de título, se omite`);
      continue;
    }

    ws.eachRow((row, i) => {
      if (i === 1) return;
      const rawTitle = cellText(row.getCell(cols.titulo)).trim();
      if (!rawTitle) return;
      const editorial = cols.editorial ? cellText(row.getCell(cols.editorial)).trim() : '';
      const autor = cols.autor ? cellText(row.getCell(cols.autor)).trim() : '';
      const cleaned = cleanTitle(rawTitle, editorial, autor);
      const titulo = TITLE_FIXES[rawTitle] ?? TITLE_FIXES[cleaned] ?? cleaned;
      const anio = cols.anio ? toInt(cellText(row.getCell(cols.anio))) : null;
      rows.push({
        file: sheetFile,
        sheet,
        book: {
          slug: bookSlug({ titulo, anio }),
          titulo,
          autores: splitAuthors(autor),
          editorial: editorial || null,
          paginas: cols.paginas ? toInt(cellText(row.getCell(cols.paginas))) : null,
          anio,
          nivel: normalizeLevel(cols.nivel ? cellText(row.getCell(cols.nivel)).trim() : '', `${file} / ${sheet} / fila ${i}`),
        },
      });
    });
  }
}

// Títulos que aún conservan "Editorial - " porque la columna EDITORIAL dice otra cosa o está vacía: si
// el prefijo es una editorial conocida (aparece en alguna columna EDITORIAL), se quita del título y se
// toma como editorial, avisando de la diferencia.
// Variantes de una misma editorial en los Excel → nombre unificado.
const PUBLISHER_ALIASES = {
  cambridge: 'Cambridge University Press',
  crc: 'CRC Press',
  friendsof: 'friends of ED',
  friendsoft: 'friends of ED',
  mcgraw: 'McGraw Hill',
  mcgrawhil: 'McGraw Hill',
  mcgrawhill: 'McGraw Hill',
  oxford: 'Oxford University Press',
  prenticehall: 'Prentice Hall',
  princetonpress: 'Princeton University Press',
  taylorfracisgroup: 'Taylor & Francis Group',
  themitpress: 'MIT Press',
  thepragmaticprogrammer: 'The Pragmatic Programmers',
  twoscoopspres: 'Two Scoops Press',
  corner: 'C# Corner',
  technics: 'Technics Publications',
  kens: 'Kens Learning Curve',
  deeplearning: 'DeepLearning.AI',
  eni: 'ENI',
  owasp: 'OWASP',
  williamsvincent: 'William S. Vincent',
};
for (const r of rows) {
  const alias = r.book.editorial && PUBLISHER_ALIASES[titleKey(r.book.editorial)];
  if (alias) r.book.editorial = alias;
  // Autopublicados con el nombre del autor truncado como editorial ("Marc" → "Marc-Andre Giroux").
  const author = r.book.autores[0];
  const ed = titleKey(r.book.editorial);
  if (ed && author && titleKey(author).startsWith(ed) && titleKey(author) !== ed) r.book.editorial = author;
  // Años imposibles (p. ej. "202" incompleto en el Excel) se descartan.
  if (r.book.anio && (r.book.anio < 1970 || r.book.anio > 2030)) {
    warnings.push(`${r.file} / ${r.sheet}: año inválido ${r.book.anio} en "${r.book.titulo}" (se muestra sin año)`);
    r.book.anio = null;
  }
}

// Correcciones de metadatos verificadas (scripts/metadata-fixes.mjs).
const fixesByTitle = new Map(Object.entries(METADATA_FIXES).map(([t, f]) => [titleKey(t), f]));
let metadataFixed = 0;
for (const r of rows) {
  let fix = fixesByTitle.get(titleKey(r.book.titulo));
  if (fix?.soloEditorial) {
    const { soloEditorial, ...rest } = fix;
    fix = titleKey(r.book.editorial) === titleKey(soloEditorial) ? rest : undefined;
  }
  if (!fix) continue;
  Object.assign(r.book, fix);
  r.book.slug = bookSlug(r.book);
  metadataFixed++;
}

// Se compara sin signos ni espacios ("OReilly" = "O'Reilly").
const PUBLISHER_TYPOS = { addsionwesley: 'Addison Wesley' };
const publishers = new Map(rows.filter((r) => r.book.editorial).map((r) => [titleKey(r.book.editorial), r.book.editorial]));
for (const r of rows) {
  const m = r.book.titulo.match(/^(.{2,40}?)\s+-\s*(.+)$/);
  const publisher = m && (PUBLISHER_TYPOS[titleKey(m[1])] ?? publishers.get(titleKey(m[1])));
  if (!publisher) continue;
  if (r.book.editorial && titleKey(r.book.editorial) !== titleKey(publisher)) {
    warnings.push(`${r.file} / ${r.sheet}: "${r.book.titulo}" tiene editorial "${r.book.editorial}" en la columna, pero el título dice "${publisher}"; se usa "${publisher}"`);
  }
  r.book.titulo = m[2].trim();
  r.book.editorial = publisher;
  r.book.slug = bookSlug(r.book);
}

// --- 2) División de pestañas grandes y reasignación de libros individuales --------------------

const splits = {};
for (const r of rows) {
  const rules = SPLIT_RULES[r.sheet];
  if (!rules) continue;
  const t = r.book.titulo;
  const [to] = rules.find(([, re, exclude]) => !re || (re.test(t) && !exclude?.test(t)));
  if (to === r.sheet) continue;
  bump(splits, `${r.sheet} → ${to}`);
  r.sheet = to;
  r.file = fileOfSheet[to];
}

const moves = new Map(); // "pestaña origen|título" → pestaña destino
for (const [from, targets] of Object.entries(RECLASSIFY)) {
  for (const [to, titles] of Object.entries(targets)) {
    for (const t of titles) moves.set(sheetTitleKey(from, t), to);
  }
}
const used = new Set();
const moved = {};
for (const r of rows) {
  const key = sheetTitleKey(r.sheet, r.book.titulo);
  const to = moves.get(key);
  if (!to) continue;
  if (!fileOfSheet[to]) {
    warnings.push(`Reasignación de "${r.book.titulo}": la sección destino "${to}" no existe`);
    continue;
  }
  used.add(key);
  bump(moved, `${r.sheet} → ${displayName(to)}`);
  r.sheet = to;
  r.file = fileOfSheet[to];
}
for (const key of moves.keys()) {
  if (!used.has(key)) warnings.push(`Reasignación sin coincidencia (revisa el título en reclassify.mjs): ${key.replace('|', ' / ')}`);
}

// --- Duplicados ---------------------------------------------------------------------------------

const sheetTitleKeys = (bySheet) =>
  new Set(Object.entries(bySheet).flatMap(([sheet, titles]) => titles.map((t) => sheetTitleKey(sheet, t))));
const dropKeys = sheetTitleKeys(DROP);
const excludeKeys = sheetTitleKeys(EXCLUDE);
const keepOne = new Set(KEEP_ONE.map(titleKey));
const seenBooks = new Set();
const droppedList = [];
const drop = (reason, r) => {
  droppedList.push(`[${reason}] ${displayName(r.sheet)} | ${r.book.titulo} (${r.book.anio ?? 's/a'}, ${r.book.editorial ?? ''})`);
  return false;
};
const kept = rows.filter((r) => {
  const key = sheetTitleKey(r.sheet, r.book.titulo);
  if (excludeKeys.has(key)) return drop('excluido por decisión del usuario', r);
  if (dropKeys.has(key)) return drop('repetido en otra sección donde encaja mejor', r);
  // Mismo libro dos veces en la misma sección: mismo título, año y editorial (o listado en KEEP_ONE).
  const bookKey = keepOne.has(titleKey(r.book.titulo)) ? key : `${key}|${r.book.anio}|${titleKey(r.book.editorial)}`;
  if (seenBooks.has(bookKey)) return drop('mismo libro dos veces en la sección', r);
  seenBooks.add(bookKey);
  return true;
});
const dropped = droppedList.length;
rows.length = 0;
rows.push(...kept);

// --- Validación de niveles ----------------------------------------------------------------------
// El nivel del Excel se respeta salvo que el título lo contradiga según las convenciones de las
// editoriales técnicas ("Beginning…", "Pro…", "…Internals", "Mastering…"). Sin nivel → Intermedio.
const ADVANCED = /\b(advanced|expert|internals|deep dive|in depth|hard parts|high performance|under the hood|performance tuning|at scale|mastering)\b/i;
const BEGINNER = /\b(beginning|beginners?|beginner's|introduc(tion|ing)|getting started|for dummies|head first|in easy steps|teach yourself|in 24 hours|month of lunches|step by step|primer|basics|101|quick start|quick syntax reference|absolute|novice|first steps|for kids)\b/i;
// "Learning X" suele ser introductorio, salvo que el título apunte a un tema intermedio.
const LEARNING = /^learning\b/i;
const AT_LEAST_INTERMEDIATE = /\b(pro|professional|cookbook|recipes|patterns|architecture|effective|deferreds|animations|internals)\b/i;
const levelChanges = {};
for (const r of rows) {
  const t = r.book.titulo;
  const adv = ADVANCED.test(t);
  const beg = BEGINNER.test(t) || (LEARNING.test(t) && !AT_LEAST_INTERMEDIATE.test(t));
  let level = r.book.nivel ?? 'Intermedio';
  if (adv && !beg) level = 'Avanzado';
  else if (beg && !adv) level = 'Básico';
  else if (!adv && !beg && level === 'Básico' && AT_LEAST_INTERMEDIATE.test(t)) level = 'Intermedio';
  if (level !== r.book.nivel) {
    bump(levelChanges, `${r.book.nivel ?? 'sin nivel'} → ${level}`);
    r.book.nivel = level;
  }
}

// --- Formato de la edición en el título ---------------------------------------------------------
// Siempre "Título, 2nd Edition": sin guion ni espacio suelto antes de la edición, con ordinal y en
// mayúscula. Va después de las reglas por título (reclassify, metadata-fixes), que usan el del Excel.
const ordinal = (n) => {
  const v = Number(n) % 100;
  return n + (v >= 11 && v <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[v % 10] ?? 'th'));
};
let editionFixes = 0;
for (const r of rows) {
  const t = r.book.titulo
    // Los libros de Mike Murach & Associates llevan apóstrofo: "Murach's", no "Murachs" ni "Murach’s".
    .replace(/^Murach(?:s|[’']s)\b/, "Murach's")
    .replace(/\s{2,}/g, ' ')
    .replace(/,\s*,/g, ',')
    .replace(/[\s,;:\-–—]*\(?\b(\d{1,2})(?:st|nd|rd|th)?\s+editio(?:n)?\)?\.?\s*$/i, (_, n) => `, ${ordinal(n)} Edition`)
    .replace(/[\s,;:\-–—]*\b(\d{1,2})(ta|da|ra|va|na|ma)\.?\s+edici[oó]n\s*$/i, (_, n, s) => `, ${n}${s.toLowerCase()} Edición`);
  if (t === r.book.titulo) continue;
  r.book.titulo = t;
  r.book.slug = bookSlug(r.book);
  editionFixes++;
}

// --- 3) Datos finales: tecnología, categoría, subgrupo y orden ---------------------------------

// Orden: por Excel (CATEGORIES), luego por subgrupo; el resto conserva el orden de las pestañas.
// Los libros reasignados quedan al final de su nueva sección.
const sortKey = (r) => rank(r.file) * 10000 + subgroupRank(r.file, r.sheet);
const sorted = rows.map((r, i) => ({ r, i })).sort((a, b) => sortKey(a.r) - sortKey(b.r) || a.i - b.i);

const counts = {};
const books = sorted.map(({ r }) => {
  const tecnologia = displayName(r.sheet);
  const techSlug = TECH_SLUGS[r.sheet] ?? slugify(tecnologia);
  const categoria = SHEET_CATEGORIES[r.sheet] ?? categoryOf(r.file);
  // Una pestaña que sale de la categoría de su Excel solo conserva subgrupo si está definido para ella.
  const subgrupo = subgroupOf(r.file, r.sheet);
  const orden = bump(counts, tecnologia) - 1;
  return { ...r.book, tecnologia, techSlug, categoria, subgrupo, orden };
});

// Dentro de cada tecnología se ordena por editorial y luego por título, como en los Excels; los libros
// traídos de otras pestañas (reclasificados o fusionadas) quedaban al final. Sin editorial → al final.
const publisherKey = (e) => (e ? e.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '') : '￿');
const byTitle = new Intl.Collator('en', { sensitivity: 'base', numeric: true, ignorePunctuation: true });
const byTech = Map.groupBy(books, (b) => b.tecnologia);
for (const list of byTech.values()) {
  list
    .toSorted(
      (a, b) =>
        publisherKey(a.editorial).localeCompare(publisherKey(b.editorial)) ||
        byTitle.compare(a.titulo, b.titulo) ||
        a.orden - b.orden,
    )
    .forEach((b, i) => (b.orden = i));
}

// Un slug repetido dentro de la misma tecnología se desambigua; entre tecnologías se comparte a propósito.
const seen = new Map();
for (const b of books) {
  const key = `${b.techSlug}/${b.slug}`;
  const n = seen.get(key) ?? 0;
  seen.set(key, n + 1);
  if (n > 0) b.slug = `${b.slug}-${n + 1}`;
}

await mkdir(dirname(OUT_FILE), { recursive: true });
await writeFile(OUT_FILE, JSON.stringify(books, null, 2) + '\n');

console.table(counts);
if (Object.keys(splits).length) {
  console.log('Pestañas divididas por tema:');
  console.table(splits);
}
if (Object.keys(moved).length) {
  console.log('Libros reasignados:');
  console.table(moved);
}
if (dropped) console.log(`Duplicados eliminados: ${dropped}\n  ${droppedList.join('\n  ')}`);
if (metadataFixed) console.log(`Libros con metadatos corregidos: ${metadataFixed}`);
if (Object.keys(levelChanges).length) {
  console.log('Niveles ajustados según el título:');
  console.table(levelChanges);
}
if (warnings.length) console.warn(`⚠ Avisos:\n  ${warnings.join('\n  ')}`);
console.log(`✔ ${books.length} libros, ${new Set(books.map((b) => b.slug)).size} slugs únicos → src/data/books.json`);
