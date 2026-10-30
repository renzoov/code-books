// Logos de tecnologías. Los oficiales vienen de Simple Icons (CC0). Simple Icons no incluye Java,
// Salesforce, Azure ni AWS (lo pidieron las marcas), así que esas, "Varios JS" (para diferenciarse de
// JavaScript), videojuegos y "Cloud Otros" (mezcla de proveedores) usan íconos propios de trazo. Todos se sirven en un único sprite
// (src/pages/tech-logos.svg.ts) que se descarga una vez y se cachea.
import {
  siArduino,
  siBitcoin,
  siGit,
  siLinux,
  siNginx,
  siAndroid,
  siAngular,
  siApache,
  siApachecouchdb,
  siBootstrap,
  siCss,
  siFirebase,
  siFlutter,
  siHtml5,
  siIonic,
  siIos,
  siJson,
  siMongodb,
  siMysql,
  siNeo4j,
  siOpengl,
  siPostgresql,
  siRedis,
  siSass,
  siSqlite,
  siWebgl,
  siWebrtc,
  siXml,
  siApachegroovy,
  siBackbonedotjs,
  siBlazor,
  siClojure,
  siCplusplus,
  siD3,
  siDart,
  siDotnet,
  siFsharp,
  siGo,
  siGooglecloud,
  siGraphql,
  siJavascript,
  siJquery,
  siNestjs,
  siNodedotjs,
  siPerl,
  siPhp,
  siPython,
  siR,
  siReact,
  siRuby,
  siRust,
  siScala,
  siSelenium,
  siTypescript,
  siVuedotjs,
  siWordpress,
} from 'simple-icons';

export interface Logo {
  title: string;
  /** Contenido interno del <symbol> (viewBox 0 0 24 24). */
  body: string;
  /** Íconos de trazo en vez de relleno. */
  stroke?: boolean;
}

const brand = (icon: { title: string; path: string }): Logo => ({ title: icon.title, body: `<path d="${icon.path}"/>` });

export const LOGOS: Record<string, Logo> = {
  angular: brand(siAngular),
  'backbone-js': brand(siBackbonedotjs),
  'd3-js': brand(siD3),
  javascript: brand(siJavascript),
  jquery: brand(siJquery),
  reactjs: brand(siReact),
  typescript: brand(siTypescript),
  vuejs: brand(siVuedotjs),
  clojure: brand(siClojure),
  dart: brand(siDart),
  go: brand(siGo),
  graphql: brand(siGraphql),
  groovy: brand(siApachegroovy),
  'nest-js': brand(siNestjs),
  'node-js': brand(siNodedotjs),
  perl: brand(siPerl),
  php: brand(siPhp),
  python: brand(siPython),
  r: brand(siR),
  ruby: brand(siRuby),
  rust: brand(siRust),
  scala: brand(siScala),
  selenium: brand(siSelenium),
  wordpress: brand(siWordpress),
  gcp: brand(siGooglecloud),
  'c-cpp': brand(siCplusplus),
  fsharp: brand(siFsharp),
  blazor: brand(siBlazor),
  'net-core': brand(siDotnet),
  // Frontend web
  html5: brand(siHtml5),
  css: brand(siCss),
  'sass-y-less': brand(siSass),
  bootstrap: brand(siBootstrap),
  webrtc: brand(siWebrtc),
  webgl: brand(siWebgl),
  opengl: brand(siOpengl),
  json: brand(siJson),
  xml: brand(siXml),
  // Bases de datos
  mysql: brand(siMysql),
  postgresql: brand(siPostgresql),
  sqlite: brand(siSqlite),
  mongodb: brand(siMongodb),
  redis: brand(siRedis),
  neo4j: brand(siNeo4j),
  couchdb: brand(siApachecouchdb),
  apache: brand(siApache),
  // Desarrollo móvil
  android: brand(siAndroid),
  ios: brand(siIos),
  flutter: brand(siFlutter),
  'react-native': brand(siReact),
  ionic: brand(siIonic),
  firebase: brand(siFirebase),

  // DevOps, sistemas y plataformas
  'git-y-github': brand(siGit),
  linux: brand(siLinux),
  nginx: brand(siNginx),
  'arduino-y-hardware': brand(siArduino),
  'blockchain-y-bitcoin': brand(siBitcoin),

  // --- Íconos propios para inteligencia artificial y datos (son temas, no productos) ---
  // Destellos: IA generativa y LLMs
  'ia-generativa-y-llms': {
    title: 'IA generativa y LLMs',
    stroke: true,
    body: `<path d="M10 3.5c.6 3.6 2.4 5.4 6 6-3.6.6-5.4 2.4-6 6-.6-3.6-2.4-5.4-6-6 3.6-.6 5.4-2.4 6-6z"/>
      <path d="M18 14c.3 1.8 1.2 2.7 3 3-1.8.3-2.7 1.2-3 3-.3-1.8-1.2-2.7-3-3 1.8-.3 2.7-1.2 3-3z"/>
      <path d="M18 2.5v3M16.5 4h3"/>`,
  },
  // Robot: agentes de IA
  'agentes-de-ia': {
    title: 'Agentes de IA',
    stroke: true,
    body: `<rect x="4" y="8" width="16" height="11" rx="3"/>
      <path d="M12 8V4.5M12 4.5h.01M2 12.5v3M22 12.5v3"/>
      <circle cx="9" cy="13" r="1.3" fill="currentColor"/>
      <circle cx="15" cy="13" r="1.3" fill="currentColor"/>
      <path d="M9.5 16.5h5"/>`,
  },
  // Puntos con recta de regresión: machine learning
  'machine-learning': {
    title: 'Machine Learning',
    stroke: true,
    body: `<path d="M3 3v18h18"/>
      <path d="m6 17 13-10" opacity="0.6"/>
      <circle cx="7.5" cy="13" r="1.2" fill="currentColor"/>
      <circle cx="10" cy="15.5" r="1.2" fill="currentColor"/>
      <circle cx="12.5" cy="10" r="1.2" fill="currentColor"/>
      <circle cx="15" cy="12" r="1.2" fill="currentColor"/>
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/>`,
  },
  // Red neuronal por capas: deep learning
  'deep-learning': {
    title: 'Deep Learning',
    stroke: true,
    body: `<circle cx="4" cy="7" r="1.8"/><circle cx="4" cy="17" r="1.8"/>
      <circle cx="12" cy="4.5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19.5" r="1.8"/>
      <circle cx="20" cy="12" r="1.8"/>
      <path d="m5.7 6.3 4.6-1.2M5.7 7.8l4.6 3.4M5.7 16.2l4.6-3.4M5.7 17.7l4.6 1.2M13.8 5.3l4.5 5.6M13.8 12h4.4M13.8 18.7l4.5-5.6" opacity="0.7"/>`,
  },
  // Globo de diálogo con texto: procesamiento de lenguaje natural
  nlp: {
    title: 'Procesamiento de lenguaje natural',
    stroke: true,
    body: `<path d="M4 4h16a1.5 1.5 0 0 1 1.5 1.5v10A1.5 1.5 0 0 1 20 17h-9l-5 4v-4H4a1.5 1.5 0 0 1-1.5-1.5v-10A1.5 1.5 0 0 1 4 4z"/>
      <path d="M7 8.5h10M7 12.5h6"/>`,
  },
  // Ojo dentro de un visor: visión por computadora
  'vision-por-computadora': {
    title: 'Visión por computadora',
    stroke: true,
    body: `<path d="M3 7.5V4.5A1.5 1.5 0 0 1 4.5 3h3M16.5 3h3A1.5 1.5 0 0 1 21 4.5v3M21 16.5v3a1.5 1.5 0 0 1-1.5 1.5h-3M7.5 21h-3A1.5 1.5 0 0 1 3 19.5v-3"/>
      <path d="M5.5 12s2.4-4.5 6.5-4.5 6.5 4.5 6.5 4.5-2.4 4.5-6.5 4.5S5.5 12 5.5 12z"/>
      <circle cx="12" cy="12" r="1.8" fill="currentColor"/>`,
  },
  // Cerebro: fundamentos y aplicaciones de la IA
  'ia-fundamentos': {
    title: 'Inteligencia artificial',
    stroke: true,
    body: `<path d="M12 4.5A3 3 0 0 0 6.5 6a3 3 0 0 0-2.3 4.5A3.2 3.2 0 0 0 5 16a3 3 0 0 0 3.5 3.3A3 3 0 0 0 12 20z"/>
      <path d="M12 4.5A3 3 0 0 1 17.5 6a3 3 0 0 1 2.3 4.5A3.2 3.2 0 0 1 19 16a3 3 0 0 1-3.5 3.3A3 3 0 0 1 12 20z"/>
      <path d="M12 4.5V20M8.5 9.5c1 0 1.8.6 2 1.5M15.5 9.5c-1 0-1.8.6-2 1.5M8 15c1 .2 1.7-.2 2-1M16 15c-1 .2-1.7-.2-2-1"/>`,
  },
  // Gráfico de barras con tendencia: ciencia de datos
  'ciencia-de-datos': {
    title: 'Ciencia de datos',
    stroke: true,
    body: `<path d="M3 21h18"/>
      <rect x="5" y="13" width="3" height="5" rx=".5"/>
      <rect x="10.5" y="9" width="3" height="9" rx=".5"/>
      <rect x="16" y="11" width="3" height="7" rx=".5"/>
      <path d="m4.5 9 5-4 4 2.5 6-4.5"/>`,
  },
  // Clúster de bases de datos: big data
  'big-data': {
    title: 'Big Data',
    stroke: true,
    body: `<ellipse cx="7" cy="5" rx="4" ry="1.6"/><path d="M3 5v5c0 .9 1.8 1.6 4 1.6s4-.7 4-1.6V5"/>
      <ellipse cx="17" cy="5" rx="4" ry="1.6"/><path d="M13 5v5c0 .9 1.8 1.6 4 1.6s4-.7 4-1.6V5"/>
      <ellipse cx="12" cy="14.5" rx="4" ry="1.6"/><path d="M8 14.5v5c0 .9 1.8 1.6 4 1.6s4-.7 4-1.6v-5"/>`,
  },
  // Chip con ondas: internet de las cosas
  iot: {
    title: 'Internet de las cosas',
    stroke: true,
    body: `<rect x="7" y="10" width="10" height="10" rx="1.5"/>
      <path d="M10 13h4v4h-4zM9 20v2M15 20v2M5 13h2M5 17h2M17 13h2M17 17h2"/>
      <path d="M8.5 6.5a5 5 0 0 1 7 0M6.3 4.3a8 8 0 0 1 11.4 0"/>`,
  },

  // --- Íconos propios para ingeniería de software, DevOps, sistemas y plataformas ---
  // Chip: ciencias de la computación
  'ciencias-de-la-computacion': {
    title: 'Ciencias de la computación',
    stroke: true,
    body: `<rect x="6" y="6" width="12" height="12" rx="2"/>
      <rect x="9.5" y="9.5" width="5" height="5" rx=".8"/>
      <path d="M9 2.5V6M15 2.5V6M9 18v3.5M15 18v3.5M2.5 9H6M2.5 15H6M18 9h3.5M18 15h3.5"/>`,
  },
  // Árbol: algoritmos y estructuras de datos
  algoritmos: {
    title: 'Algoritmos',
    stroke: true,
    body: `<circle cx="12" cy="4.5" r="2"/>
      <circle cx="6" cy="12" r="2"/>
      <circle cx="18" cy="12" r="2"/>
      <circle cx="3.5" cy="19.5" r="2"/>
      <circle cx="9" cy="19.5" r="2"/>
      <path d="m10.7 6-3.3 4.4M13.3 6l3.3 4.4M5 13.8l-.9 3.8M7 13.8l1.2 3.8"/>`,
  },
  // ".*": expresiones regulares
  'expresiones-regulares': {
    title: 'Expresiones regulares',
    stroke: true,
    body: `<circle cx="6" cy="18" r="1.6" fill="currentColor"/>
      <path d="M16 4v10M11.7 6.5l8.6 5M11.7 11.5l8.6-5"/>`,
  },
  // Capas: arquitectura de software
  'arquitectura-de-software': {
    title: 'Arquitectura de software',
    stroke: true,
    body: `<path d="m12 3 9 4.5-9 4.5-9-4.5z"/>
      <path d="m3 12 9 4.5 9-4.5"/>
      <path d="m3 16.5 9 4.5 9-4.5"/>`,
  },
  // Matraz con check: testing y calidad
  'testing-y-calidad': {
    title: 'Testing y calidad',
    stroke: true,
    body: `<path d="M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/>
      <path d="m9 15.5 2 2 4-4"/>`,
  },
  // Medalla: certificaciones
  certificaciones: {
    title: 'Certificaciones',
    stroke: true,
    body: `<circle cx="12" cy="9" r="6"/>
      <path d="m9.5 9 1.8 1.8L14.8 7.3"/>
      <path d="M8.5 14 7 21.5l5-2.5 5 2.5-1.5-7.5"/>`,
  },
  // Brújula: otros temas
  'otros-temas': {
    title: 'Otros temas',
    stroke: true,
    body: `<circle cx="12" cy="12" r="9"/>
      <path d="m15.5 8.5-2 5-5 2 2-5z"/>`,
  },
  // Infinito: DevOps (ciclo continuo de desarrollo y operación)
  'devops-y-contenedores': {
    title: 'DevOps',
    stroke: true,
    body: `<path d="M12 12c-2-2.7-3.6-4-5.5-4a4 4 0 0 0 0 8c1.9 0 3.5-1.3 5.5-4s3.6-4 5.5-4a4 4 0 0 1 0 8c-1.9 0-3.5-1.3-5.5-4z"/>`,
  },
  // Terminal ">_": PowerShell
  powershell: {
    title: 'PowerShell',
    stroke: true,
    body: `<path d="M5 4h16l-2 16H3z"/>
      <path d="m7.5 9 4 3-5 3.5M12 16h4"/>`,
  },
  // Globo sobre servidor: IIS (servidor web de Windows)
  iis: {
    title: 'IIS',
    stroke: true,
    body: `<circle cx="12" cy="8" r="5.5"/>
      <path d="M6.5 8h11M12 2.5c1.6 1.6 2.4 3.4 2.4 5.5s-.8 3.9-2.4 5.5c-1.6-1.6-2.4-3.4-2.4-5.5s.8-3.9 2.4-5.5"/>
      <rect x="4" y="16.5" width="16" height="5" rx="1.5"/>
      <path d="M7.5 19h.01"/>`,
  },
  // Nodos conectados: redes
  redes: {
    title: 'Redes',
    stroke: true,
    body: `<rect x="9.5" y="2.5" width="5" height="5" rx="1"/>
      <rect x="2.5" y="16.5" width="5" height="5" rx="1"/>
      <rect x="16.5" y="16.5" width="5" height="5" rx="1"/>
      <path d="M12 7.5V12M5 16.5V12h14v4.5"/>`,
  },
  // Escudo con candado: seguridad
  seguridad: {
    title: 'Seguridad',
    stroke: true,
    body: `<path d="M12 2.5 4 5.5v6c0 4.8 3.4 8.8 8 10 4.6-1.2 8-5.2 8-10v-6z"/>
      <rect x="9" y="11" width="6" height="5" rx="1"/>
      <path d="M10 11V9.5a2 2 0 0 1 4 0V11"/>`,
  },
  // Bloques de página: CMS (gestores de contenido)
  cms: {
    title: 'CMS',
    stroke: true,
    body: `<rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 8h18M9 8v13"/>
      <path d="M12 11.5h6M12 14.5h6M12 17.5h4"/>`,
  },
  // Personas compartiendo documentos: SharePoint (colaboración)
  sharepoint: {
    title: 'SharePoint',
    stroke: true,
    body: `<circle cx="9" cy="8" r="5"/>
      <circle cx="16.5" cy="14" r="4.5"/>
      <circle cx="10" cy="18.5" r="3"/>`,
  },
  // Documento con tabla: Microsoft Office
  'microsoft-office': {
    title: 'Microsoft Office',
    stroke: true,
    body: `<path d="M6 2.5h8.5L19 7v14.5H6z"/>
      <path d="M14.5 2.5V7H19"/>
      <path d="M8.5 11h8M8.5 14.5h8M8.5 18h8M12.5 11v7"/>`,
  },
  // Lambda: otros lenguajes de programación (Elixir, Lisp, Ada, COBOL, MATLAB…)
  'otros-lenguajes': {
    title: 'Otros lenguajes',
    stroke: true,
    body: `<path d="M6 4h2.5l9.5 16"/>
      <path d="M12.6 11.2 6 20"/>`,
  },
  // Velocímetro: rendimiento web
  'rendimiento-web': {
    title: 'Rendimiento web',
    stroke: true,
    body: `<path d="M4.2 17.5a9 9 0 1 1 15.6 0"/>
      <path d="m12 14 4-5"/>
      <circle cx="12" cy="14.5" r="1.4" fill="currentColor"/>
      <path d="M7 10.5h.01M12 7h.01M17 10.5h.01"/>`,
  },

  // --- Íconos propios para Frontend, bases de datos y móvil ---
  // Etiquetas </>: HTML clásico (HTML5 usa el escudo oficial)
  html: {
    title: 'HTML',
    stroke: true,
    body: `<path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 4.5l-3 15"/>`,
  },
  // Cursor sobre un boceto de interfaz: UX y UI
  'ux-y-ui': {
    title: 'UX y UI',
    stroke: true,
    body: `<rect x="2.5" y="3" width="15" height="12" rx="2"/>
      <path d="M2.5 6.5h15M6 10h5M6 12.5h3"/>
      <path d="m14 13 7 2.6-3 1.2 2.4 2.4-1.4 1.4-2.4-2.4-1.2 3z" fill="currentColor"/>`,
  },
  // Enchufe: APIs web
  'apis-web': {
    title: 'APIs web',
    stroke: true,
    body: `<path d="M8.5 9V3M15.5 9V3"/>
      <path d="M5.5 9h13v3a6.5 6.5 0 0 1-13 0z"/>
      <path d="M12 18.5V22"/>`,
  },
  // Flechas circulares: peticiones asíncronas (Ajax)
  ajax: {
    title: 'Ajax',
    stroke: true,
    body: `<path d="M20 11a8 8 0 0 0-14.3-4.8L4 8"/>
      <path d="M4 3.5V8h4.5"/>
      <path d="M4 13a8 8 0 0 0 14.3 4.8L20 16"/>
      <path d="M20 20.5V16h-4.5"/>`,
  },
  // Flechas bidireccionales: conexión persistente (WebSocket)
  websocket: {
    title: 'WebSocket',
    stroke: true,
    body: `<path d="M3 8.5h15M14.5 5 18 8.5 14.5 12"/>
      <path d="M21 15.5H6M9.5 12 6 15.5 9.5 19"/>`,
  },
  // Servidor en rack: SQL Server
  'sql-server': {
    title: 'SQL Server',
    stroke: true,
    body: `<rect x="3" y="3" width="18" height="7.5" rx="2"/>
      <rect x="3" y="13.5" width="18" height="7.5" rx="2"/>
      <path d="M7 6.75h.01M7 17.25h.01M11 6.75h6M11 17.25h6"/>`,
  },
  // Anillo ovalado con registros: Oracle Database
  oracle: {
    title: 'Oracle',
    stroke: true,
    body: `<rect x="2" y="6" width="20" height="12" rx="6"/>
      <path d="M8 10.5h8M8 13.5h5"/>`,
  },
  // Documentos con llaves: bases de datos NoSQL (orientadas a documentos)
  nosql: {
    title: 'NoSQL',
    stroke: true,
    body: `<path d="M7 3h7l4 4v8.5"/>
      <path d="M4 6.5h9l4 4V21H4z"/>
      <path d="M8.6 12.5c-.8 0-1.2.4-1.2 1.1v.7c0 .5-.3.8-.8.8.5 0 .8.3.8.8v.7c0 .7.4 1.1 1.2 1.1M12.4 12.5c.8 0 1.2.4 1.2 1.1v.7c0 .5.3.8.8.8-.5 0-.8.3-.8.8v.7c0 .7-.4 1.1-1.2 1.1"/>`,
  },
  // Documento con gráfico de barras: SQL Server Reporting Services
  ssrs: {
    title: 'Reporting Services',
    stroke: true,
    body: `<path d="M6 2.5h8l4.5 4.5v14.5H6z"/>
      <path d="M14 2.5V7h4.5"/>
      <path d="M9 18v-3M12 18v-6M15 18v-4"/>`,
  },
  // Cristal facetado: Crystal Reports
  'crystal-reports': {
    title: 'Crystal Reports',
    stroke: true,
    body: `<path d="M6.5 3h11L22 9 12 21 2 9z"/>
      <path d="M2 9h20M9 3 7.5 9 12 21l4.5-12L15 3"/>`,
  },
  // Hexágono con X: Xamarin
  xamarin: {
    title: 'Xamarin',
    stroke: true,
    body: `<path d="M7 3h10l5 9-5 9H7l-5-9z"/>
      <path d="m9 8.5 6 7M15 8.5l-6 7"/>`,
  },
  // Teléfono: desarrollo móvil en general
  movil: {
    title: 'Desarrollo móvil',
    stroke: true,
    body: `<rect x="6" y="2" width="12" height="20" rx="2.5"/>
      <path d="M10.5 5h3M11 18.5h2"/>`,
  },

  // --- Microsoft y .NET: íconos propios (Simple Icons no incluye C#, VB ni las tecnologías concretas) ---
  // Hexágono con "C#"
  csharp: {
    title: 'C#',
    stroke: true,
    body: `<path d="M12 2 20.7 7v10L12 22 3.3 17V7z"/>
      <path d="M12.4 9.3a3.5 3.5 0 1 0 0 5.4"/>
      <path d="M15.2 10v4.4M17.4 10v4.4M14.4 11.4h3.8M14.4 13h3.8"/>`,
  },
  // Letras "VB"
  'vb-net': {
    title: 'VB.NET',
    stroke: true,
    body: `<rect x="2.5" y="4" width="19" height="16" rx="3"/>
      <path d="m5.8 8.5 2.6 7 2.6-7"/>
      <path d="M13.6 8.5v7h2.7a1.8 1.8 0 0 0 0-3.6h-2.7 2.2a1.7 1.7 0 0 0 0-3.4z"/>`,
  },
  // Hoja de cálculo con código: VBA (macros de Office)
  vba: {
    title: 'VBA',
    stroke: true,
    body: `<rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M3 8h18M9 3v18"/>
      <path d="m13.5 12.5-2 2 2 2M16.5 12.5l2 2-2 2"/>`,
  },
  // Modelo, Vista y Controlador conectados
  'asp-net-mvc': {
    title: 'ASP.NET MVC',
    stroke: true,
    body: `<rect x="2" y="3" width="8" height="6" rx="1.5"/>
      <rect x="14" y="3" width="8" height="6" rx="1.5"/>
      <rect x="8" y="15" width="8" height="6" rx="1.5"/>
      <path d="M6 9v3h12V9M12 12v3"/>`,
  },
  // Llaves con flechas de petición/respuesta: APIs
  'web-api': {
    title: 'Web API',
    stroke: true,
    body: `<path d="M7.5 4C5.8 4 5.2 5 5.2 6.5V9c0 1.2-.8 2-2 3 1.2 1 2 1.8 2 3v2.5c0 1.5.6 2.5 2.3 2.5"/>
      <path d="M16.5 4c1.7 0 2.3 1 2.3 2.5V9c0 1.2.8 2 2 3-1.2 1-2 1.8-2 3v2.5c0 1.5-.6 2.5-2.3 2.5"/>
      <path d="M9 10h6l-1.6-1.6M15 14H9l1.6 1.6"/>`,
  },
  // Servicios conectados: WCF
  wcf: {
    title: 'WCF',
    stroke: true,
    body: `<circle cx="5" cy="12" r="2.5"/>
      <circle cx="19" cy="5.5" r="2.5"/>
      <circle cx="19" cy="18.5" r="2.5"/>
      <path d="M7.3 11 16.7 6.5M7.3 13l9.4 4.5"/>`,
  },
  // Base de datos: Entity Framework (acceso a datos)
  'entity-framework': {
    title: 'Entity Framework',
    stroke: true,
    body: `<ellipse cx="12" cy="5.5" rx="7.5" ry="2.5"/>
      <path d="M4.5 5.5v13c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5v-13"/>
      <path d="M4.5 12c0 1.4 3.4 2.5 7.5 2.5s7.5-1.1 7.5-2.5"/>`,
  },
  // Diagrama de flujo: Workflow Foundation
  'workflow-foundation': {
    title: 'Workflow Foundation',
    stroke: true,
    body: `<rect x="9" y="2" width="6" height="4.5" rx="1"/>
      <path d="m12 9.5 3 2.5-3 2.5-3-2.5z"/>
      <rect x="3" y="17.5" width="6" height="4.5" rx="1"/>
      <rect x="15" y="17.5" width="6" height="4.5" rx="1"/>
      <path d="M12 6.5v3M9 12H6v5.5M15 12h3v5.5"/>`,
  },
  // Caja de herramientas: otras librerías y componentes .NET
  'net-otros': {
    title: 'Otras herramientas .NET',
    stroke: true,
    body: `<rect x="3" y="8" width="18" height="12" rx="2"/>
      <path d="M9 8V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V8M3 13h18M10 13v2h4v-2"/>`,
  },
  // Ventana con campos de formulario: WinForms
  winforms: {
    title: 'WinForms',
    stroke: true,
    body: `<rect x="2.5" y="3.5" width="19" height="17" rx="2"/>
      <path d="M2.5 7.5h19"/>
      <rect x="5.5" y="10.5" width="9" height="2.2" rx=".6"/>
      <rect x="5.5" y="14.5" width="9" height="2.2" rx=".6"/>
      <path d="M16.5 15.6h2.5"/>`,
  },
  // Ventana con gráfico vectorial: WPF
  wpf: {
    title: 'WPF',
    stroke: true,
    body: `<rect x="2.5" y="3.5" width="19" height="17" rx="2"/>
      <path d="M2.5 7.5h19"/>
      <path d="M5.5 17c2.5-5.5 5.5.5 8.5-4.5 1.2-2 2.6-2.1 4.5-1"/>
      <circle cx="5.5" cy="17" r="1" fill="currentColor"/>
      <circle cx="18.5" cy="11.5" r="1" fill="currentColor"/>`,
  },

  // Pila de módulos con llaves { }: colección de librerías JavaScript (legacy)
  'varios-js': {
    title: 'Librerías JavaScript varias',
    stroke: true,
    body: `<rect x="8" y="1.5" width="14" height="14" rx="2.5" opacity="0.4"/>
      <rect x="5" y="4.5" width="14" height="14" rx="2.5" opacity="0.7" fill="#12151c"/>
      <rect x="2" y="7.5" width="14" height="14" rx="2.5" fill="#12151c"/>
      <path d="M7.4 11.3c-.9 0-1.4.5-1.4 1.3v.9c0 .6-.4 1-1 1 .6 0 1 .4 1 1v.9c0 .8.5 1.3 1.4 1.3"/>
      <path d="M10.6 11.3c.9 0 1.4.5 1.4 1.3v.9c0 .6.4 1 1 1-.6 0-1 .4-1 1v.9c0 .8-.5 1.3-1.4 1.3"/>`,
  },
  // Taza de café humeante: Java
  java: {
    title: 'Java',
    stroke: true,
    body: `<path d="M4 10h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/>
      <path d="M16 11.5h1.5a2.5 2.5 0 0 1 0 5H15.6"/>
      <path d="M3 22h15"/>
      <path d="M8 2.5c-.8.9-.8 1.9 0 2.8s.8 1.9 0 2.7"/>
      <path d="M11.5 2.5c-.8.9-.8 1.9 0 2.8s.8 1.9 0 2.7"/>`,
  },
  // Nube: Salesforce (plataforma en la nube)
  salesforce: {
    title: 'Salesforce',
    stroke: true,
    body: `<path d="M7 19h10.5a4.5 4.5 0 0 0 .6-8.96A6 6 0 0 0 6.6 9.1 5 5 0 0 0 7 19z"/>
      <path d="M9.5 14.5h5" opacity="0.6"/>`,
  },
  // Llaves con flechas de petición/respuesta y un recurso: diseño de APIs REST
  'diseno-de-apis-y-rest': {
    title: 'Diseño de APIs y REST',
    stroke: true,
    body: `<rect x="3" y="4" width="18" height="16" rx="2.5"/>
      <path d="M3 8.5h18"/>
      <path d="M7 13h4M7 16.5h7"/>
      <path d="m15.5 12 2.5 2.25-2.5 2.25"/>`,
  },
  // Control de juego: desarrollo de videojuegos (Unity, Unreal, GameMaker…)
  videojuegos: {
    title: 'Desarrollo de videojuegos',
    stroke: true,
    body: `<path d="M6.5 7h11a4.5 4.5 0 0 1 4.4 5.5l-1 4.4a2.5 2.5 0 0 1-4.3 1.1L14.4 16H9.6l-2.2 2a2.5 2.5 0 0 1-4.3-1.1l-1-4.4A4.5 4.5 0 0 1 6.5 7z"/>
      <path d="M7.5 10.5v3M6 12h3"/>
      <circle cx="15.5" cy="11" r=".6" fill="currentColor"/>
      <circle cx="17.5" cy="13" r=".6" fill="currentColor"/>`,
  },
  // Letras "AWS" con la flecha-sonrisa debajo
  aws: {
    title: 'AWS',
    stroke: true,
    body: `<path d="M1.8 15.5 4.3 7.5l2.5 8M2.9 12.8h2.8"/>
      <path d="m8 7.5 1.3 8 1.7-5.3 1.7 5.3 1.3-8"/>
      <path d="M21.6 8.5c-.6-.7-1.4-1-2.3-1-1.3 0-2.2.7-2.2 1.8 0 2.6 4.7 1.6 4.7 4.3 0 1.2-1 1.9-2.4 1.9-1 0-1.9-.4-2.5-1.1"/>
      <path d="M4.5 18.6c4.6 2.4 10.4 2.4 15 0"/>
      <path d="m17.6 17.5 1.9 1.1-1.2 1.8"/>`,
  },
  // "A" geométrica con el travesaño extendido: Azure
  azure: {
    title: 'Azure',
    stroke: true,
    body: `<path d="M3.5 20 10.4 4h3.2l6.9 16"/>
      <path d="M7.4 14.5h11.3"/>
      <path d="M13.6 4 9 20" opacity="0.55"/>`,
  },
  // Dos nubes superpuestas: multinube / otros proveedores
  'cloud-otros': {
    title: 'Otros servicios cloud',
    stroke: true,
    body: `<path d="M9 9.5a4.5 4.5 0 0 1 8.6-1.3A3.6 3.6 0 0 1 18.3 15H16" opacity="0.55"/>
      <path d="M5.5 20h8.3a3.5 3.5 0 0 0 .4-7 4.7 4.7 0 0 0-9-.9A3.9 3.9 0 0 0 5.5 20z"/>`,
  },
};

/** Ícono genérico para una tecnología nueva que aún no tiene logo asignado. */
export const FALLBACK_LOGO: Logo = { title: 'Tecnología', stroke: true, body: '<rect x="3" y="3" width="18" height="18" rx="4"/>' };
