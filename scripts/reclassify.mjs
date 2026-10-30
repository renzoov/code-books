// Reasignación de libros individuales a otra sección. Se usa sobre todo para la pestaña "Varios" de
// Lista_Varios.xlsx, que reúne libros sin clasificar: cada uno se mueve a la sección que le corresponde
// (existente o nueva). Lo que no aparece aquí se queda en su pestaña original.
//
// Formato: { "pestaña de origen": { "pestaña o sección de destino": ["título", ...] } }
// Los títulos se comparan sin mayúsculas, tildes ni signos, tal como quedan tras el importador.
// El destino es el nombre de una pestaña de cualquier Excel o una sección nueva de VIRTUAL_SHEETS.

/** Secciones que no existen como pestaña en ningún Excel: nombre → Excel al que pertenecen. */
export const VIRTUAL_SHEETS = {
  Redes: 'Lista_Varios.xlsx',
  Seguridad: 'Lista_Varios.xlsx',
  'Testing y calidad': 'Lista_Varios.xlsx',
  'Otros lenguajes': 'Lista_BackEnd_Otros.xlsx',
  'Rendimiento web': 'Lista_Frontend.xlsx',
  // Subsecciones de la pestaña "AI" (ver SPLIT_RULES)
  'IA generativa y LLMs': 'Lista_AI_Datos.xlsx',
  'Agentes de IA': 'Lista_AI_Datos.xlsx',
  'Machine Learning': 'Lista_AI_Datos.xlsx',
  'Deep Learning': 'Lista_AI_Datos.xlsx',
  'Procesamiento de lenguaje natural (NLP)': 'Lista_AI_Datos.xlsx',
  'Visión por computadora': 'Lista_AI_Datos.xlsx',
  'IA: fundamentos y aplicaciones': 'Lista_AI_Datos.xlsx',
  'Diseño de APIs y REST': 'Lista_Varios.xlsx',
};

// --- Reglas de dominio para secciones de lenguaje ---------------------------------------------
// Criterio: un libro va a la sección de su tema principal. Si un libro de lenguaje trata en realidad
// de un dominio (datos, IA, seguridad, juegos, algoritmos, redes…) y el lenguaje es solo la
// herramienta, se mueve al dominio. Los libros que nombran un framework concreto (Spring, ASP.NET…)
// o que son buenas prácticas del propio lenguaje (testing, patrones, clean code) se quedan.
// Formato: [sección destino, patrón, patrón de exclusión opcional]. Se aplica la primera que coincide.
const AI_RULES = [
  ['Agentes de IA', /model context protocol|\bmcp\b/i],
  ['IA generativa y LLMs', /chatgpt|gpt-4|generative ai|\bllms?\b/i, /for programmers/i],
  ['Procesamiento de lenguaje natural (NLP)', /natural language|text analytics/i],
  ['Visión por computadora', /computer vision|opencv|image processing/i],
  ['Deep Learning', /deep learning|neural network/i],
  ['Machine Learning', /machine learning|predictive analytics/i],
  ['IA: fundamentos y aplicaciones', /\bai\b|artificial intelligence/i, /spring ai|for programmers|enterprise java/i],
];
const SECURITY_RULE = [
  'Seguridad',
  /hack|black hat|cryptograph|cryptanalysis|cipher|penetration|forensic|secur(e|ity|ing)\b|kali/i,
  /asp\.?net|spring|sql server|ado\.net|social/i,
];
const DATA_RULES = [
  ['Apache', /pyspark|\bspark\b/i],
  ['Data Science', /pandas|numpy|data anal|data science|data visuali|data wrangling|statistic|data mining/i],
];
const OTHER_DOMAIN_RULES = [
  ['Algoritmos', /algorithm|data structures/i],
  ['Regular Expressions', /regular expressions?|regexp|\bregex/i],
  ['Unity y mas', /\bgames?\b|game (development|programming|engine)|pygame/i, /diversions/i],
  ['Redes', /network programming|networking/i, /social networking/i],
  ['CS', /compiler|interpreter|operating systems|computer science problems/i],
  ['IOT', /internet of things|\biot\b/i],
  ['Arduino y Mas', /raspberry|microcontroller|embedded/i, /embedded linux/i],
  ['DevOps y Mas', /devops|docker|kubernetes/i],
  ['AWS', /\baws\b/i],
];
const DOMAIN_RULES = [SECURITY_RULE, ...AI_RULES, ...DATA_RULES, ...OTHER_DOMAIN_RULES];
const LANGUAGE_SHEETS = [
  'Python', 'Java', 'JavaScript', 'C#', 'Scala', 'Go', 'Rust', 'C y C++', 'PHP', 'Ruby', 'Node.js',
  'TypeScript', 'Perl', 'VB.NET',
];
// R es en sí un lenguaje de estadística y datos: sus libros de análisis de datos se quedan en R.
const R_RULES = [SECURITY_RULE, ...AI_RULES, ...OTHER_DOMAIN_RULES];

// Pestañas demasiado grandes que se dividen en subsecciones según palabras del título. Se aplica la
// primera regla que coincide (el orden importa: "NLP with Transformers" es NLP, no IA generativa);
// la última regla, sin patrón, recoge el resto. RECLASSIFY se aplica después y puede corregir casos.
export const SPLIT_RULES = {
  AI: [
    ['Procesamiento de lenguaje natural (NLP)', /natural language|\bnlp\b|spacy|conversational|\bbots?\b/i],
    ['Agentes de IA', /agent|\bmcp\b|model context protocol|\ba2a\b/i],
    [
      'IA generativa y LLMs',
      /generative|genai|\bllms?\b|large language|language models?|small language|chatgpt|\bgpt\b|openai|claude|prompt|\brag\b|retrieval|graphrag|langchain|langgraph|llamaindex|llamalndex|dspy|deepseek|mistral|bedrock|transformers?\b|hugging face|vector databases|vibe coding|copilot|cursor ai|deepfakes|text-to-image|video generation|reasoning model|post-training|multimodal|hallucinations|context engineering|ai-assisted|coding with ai|ai-powered developer|ai sidekick|creating websites with ai|\bevals?\b/i,
    ],
    ['Visión por computadora', /computer vision|\bcv\b|image|imaging|vision|detectron|opencv/i],
    ['Deep Learning', /deep learning|neural|pytorch|tensorflow|keras|\bjax\b|fastai|reinforcement|graph learning/i],
    [
      'Machine Learning',
      /machine learning|\bml\b|mlops|scikit|pyspark|spark|kaggle|ensemble|predictive|data without labels|feature store|recommender|optimization algorithms|causal ai|probabilistic|time series|algorithmic trading/i,
    ],
    ['IA: fundamentos y aplicaciones'],
  ],
  // Secciones de lenguaje: el último elemento (la propia pestaña) recoge lo que no se mueve.
  ...Object.fromEntries(LANGUAGE_SHEETS.map((s) => [s, [...(s === 'C#' ? [['EF', /nhibernate/i]] : []), ...DOMAIN_RULES, [s]]])),
  R: [...R_RULES, ['R']],
  // En Linux solo salen los libros de hacking y pentesting (Kali); la administración se queda.
  Linux: [SECURITY_RULE, ['Linux']],
  // Los libros de WordPress de la pestaña CMS se reúnen en la sección WordPress.
  CMS: [['WordPress', /wordpress/i], ['CMS']],
  // Three.js es una librería de WebGL.
  'Varios JS': [['WebGL', /three\.js/i], ['Varios JS']],
};

// Libros que se eliminan por estar repetidos en otra sección donde encajan mejor (o por ser el mismo
// libro dos veces). Formato: { "sección actual": ["título", ...] }. Los duplicados exactos (mismo título,
// año y editorial en la misma sección) se eliminan automáticamente.
export const DROP = {
  'C#': [
    'NET Development Using the Compiler API',
    'Architecting ASP.NET Core Applications',
    // Es la edición para VB 2008 (Rattz y Hayes, 2009); ya está en la sección VB.NET
    'Pro LINQ: Language Integrated Query in VB 2008',
  ],
  '.NET Core': ['Design Patterns in .NET'],
  CS: ['NET Development Using the Compiler API'],
  XML: ['Microsoft ASP.NET and AJAX'],
  'Node.js': ['Scalable Application Development with NestJS'],
  Algoritmos: ['C++ Programming, 6th Edition'],
  Redis: ['Designing Data-Intensive Applications'],
  Mobile: ['The Definitive Guide to Firebase'],
  'Web API': ['The Design of Web APIs', 'Designing Web APIs'],
  AWS: ['Mastering Cloud Security Posture Management'],
  'IA: fundamentos y aplicaciones': ['Applied AI for Enterprise Java Development'],
  // Mismo libro que "A Student's Guide to Python for Physical Modeling" (sin la "A" inicial).
  Python: ['Student’s Guide to Python for Physical Modeling'],
};

// Libros que no se publican en la web por decisión del usuario (aunque sigan en el Excel).
// Formato: { "sección actual": ["título", ...] }.
export const EXCLUDE = {
  Python: ['Two Scoops of Django: Best Practices For Django 1.5'],
};

// Libros que aparecen dos veces en la misma sección con datos levemente distintos (otra editorial del
// mismo grupo, páginas distintas): se conserva solo la primera copia.
export const KEEP_ONE = [
  'Exploring Neural Networks with C#',
  'Practical Recommender Systems',
  'Building Data-Driven Applications with LlamaIndex',
  // Revisión final (2026-10-29): mismo libro dos veces con año o título levemente distinto
  'Get Your Hands Dirty on Clean Architecture',
  'Python One-Liners',
  'TCP IP Illustrated Volume 1, 2nd Edition',
];

export const RECLASSIFY = {
  // Revisión general de clasificación: errores claros de pestaña
  Android: { IOS: ['Beginning iPhone Development with Swift 5, 5th Edition'] },
  MSSQL: { MongoDB: ['High Performance with MongoDB'] },
  'C#': {
    Blazor: ['Microsoft Blazor, 2nd Edition'],
    'VB.NET': ['Programming with Microsoft Visual Basic 2015, 7th Edition'],
    IIS: ['Professional IIS 7 And ASP .NET Integrated Programming'],
    Ajax: ['ASP .NET AJAX Programmers Reference'],
    'Testing y calidad': [
      'The Art Of Unit Testing, 2nd Edition',
      'Unit Testing Principles, Practices, and Patterns',
      'The Unit Testing Practice Cookbook',
      'Software Testing with Visual Studio 2010',
    ],
    // El de Prasanna (Manning, 2009) usa Java (Guice, Spring): es diseño general, no de C#
    'Arq. y Mas': ['Dependency Injection'],
  },
  JavaScript: {
    'Testing y calidad': ['The Art of Unit Testing, 3rd Edition', 'Practical Test Automation'],
    APIS: ['Web API Cookbook'],
  },
  Java: {
    'Arq. y Mas': [
      'Fundamentals of Software Architecture, 2nd Edition',
      'Software Architecture The Hard Parts',
      // Revisión final (2026-10-29): diseño, SOA y mensajería independientes del lenguaje
      'Object Design Style Guide',
      'SOA Patterns',
      'SOA Governance in Action',
      'RabbitMQ in Action',
      'RabbitMQ in Depth',
      'Learning RabbitMQ',
    ],
  },
  // Revisión final (2026-10-29), con ayuda de las descripciones
  Python: {
    'Arq. y Mas': ['Simple Object-Oriented Design'],
    'Data Science': ['Mining Social Media'],
    // Criptografía; es la versión renovada de "Hacking Secret Ciphers with Python", que ya está en Seguridad
    Seguridad: ['Cracking Codes with Python'],
    // Adquisición de datos y control de instrumentos con hardware
    'Arduino y Mas': ['Real World Instrumentation with Python'],
    // Automatización de sistemas con Bash, PowerShell y Python: va con los libros de shell
    Linux: ['Scripting Automation with Bash, PowerShell, and Python'],
  },
  // Phoenix es el framework web de Elixir
  Ruby: { 'Otros lenguajes': ['Phoenix in Action'] },
  // Trata de manipular el DOM con JavaScript nativo
  HTML: { JavaScript: ['DOM Enlightenment'] },
  TypeScript: { 'Diseño de APIs y REST': ['API Design Patterns'] },
  // Diseño de APIs genérico (no específico de .NET ni del navegador)
  'Web API': {
    'Diseño de APIs y REST': [
      'Principles of Web API Design',
      'Service Design Patterns',
      'Pro RESTful APIs',
      'Designing APIs with Swagger and OpenAPI',
      'APIs',
      'REST API Design Rulebook',
      'REST in Practice',
      'RESTful Web APIs',
      'RESTful Web Clients',
      'RESTful Web Services Cookbook',
    ],
    Seguridad: ['API Security in Action', 'Hacking APIs'],
  },
  APIS: {
    'Diseño de APIs y REST': ['The Design of Web APIs', 'Designing Web APIs', 'Irresistible APIs'],
    Seguridad: [
      'Advanced API Security',
      'Advanced API Security, 2nd Edition',
      'OAuth 2.0 Identity and Access Management Patterns',
      'Getting Started with OAuth 2.0',
      'Mastering OAuth 2.0',
    ],
    'Visión por computadora': ['Microsoft Computer Vision APIs Distilled'],
    WebSocket: ['Socket.IO Real-time Web Application Development'],
  },
  Azure: {
    Seguridad: ['Beginning Security with Microsoft Technologies', 'Mastering Cloud Security Posture Management'],
  },
  AWS: {
    Seguridad: ['Learning Serverless Security', 'Security as Code'],
    'DevOps y Mas': ['Implementing GitOps with Kubernetes'],
    'Arq. y Mas': ['Building Multi-Tenant SaaS Architectures'],
  },
  'Cloud Otros': { Seguridad: ['Serverless Security'] },
  Mobile: {
    Seguridad: ['Mobile Application Security'],
    'Unity y mas': ['Mobile & Social Game Design, 2nd Edition'],
    'UX y UI': ['Mobile Design Pattern Gallery'],
  },
  HTML5: { 'UX y UI': ['Form Design Patterns'], HTML: ['HTML and CSS'] },
  // "Arq. y Mas" es arquitectura de software más algunos libros de otros temas
  'Arq. y Mas': {
    Seguridad: ['Grokking Web Application Security', 'Web Application Security, 2nd Edition'],
    'Testing y calidad': ['Learning Test-Driven Development'],
    'DevOps y Mas': ['Prometheus Up & Running, 2nd Edition', "The Platform Engineer's Handbook"],
    'UX y UI': ['Building Design Systems, 2nd Edition'],
    Algoritmos: ['Cracking the Coding Interview, 6th Edition'],
    Varios: ['Docs for Developers, 2nd Edition'],
    'Diseño de APIs y REST': [
      'Patterns for API Design',
      'Mastering REST APIs',
      'Continuous API Management, 2nd Edition',
      'Learning API Styles',
      'Mastering API Architecture',
      'RESTful Web API Patterns and Practices Cookbook',
      'What Are Asynchronous APIs',
    ],
  },
  Algoritmos: {
    'Machine Learning': ['Algorithms of the Intelligent Web, 2nd Edition'],
  },
  // Correcciones a la división automática de la pestaña "AI" (incluye libros que no son de IA)
  'IA: fundamentos y aplicaciones': {
    'IA generativa y LLMs': ['LLMOps'],
    'Testing y calidad': ['Embedded Software Testing'],
    'Arq. y Mas': ['The Effective Software Engineer', 'Solutions Architect’s Handbook, 3rd Edition'],
    Python: ['Build Python Web Apps with Streamlit'],
    'Data Science': ['Build A Career in Data Science'],
  },
  Varios: {
    // Libros de IA y datos que quedaban en "Otros temas" hasta que existió Lista_AI_Datos.xlsx
    'Machine Learning': ['Practical Recommender Systems', 'The Intelligent Web'],
    'Procesamiento de lenguaje natural (NLP)': ['Taming Text', 'Building an Enterprise Chatbot'],
    'Data Science': ['Data Visualization For Dummies'],
    'Big Data': ['Data as a Service', 'Building a Data Integration Team'],
    Redes: [
      'TCP IP Illustrated Volume 1, 2nd Edition',
      'TCP IP Illustrated Volume 2',
      'TCP/IP Illustrated Volume 3',
      'TCPIP Illustrated, Volume 1, 2nd Edition',
      'The TCP IP Guide',
      'Sams Teach Yourself TCPIP in 24 Hours, 4th Edition',
      'Computer Networking, 9th Edition',
      'Introduction to Computer Networks and Cybersecurity',
      'Computer, Network, Software, and Hardware Engineering with Applications',
      'Cognitive Networks',
      'Distributed Networks',
      'History of Wireless',
      'HTTP The Definitive Guide',
      'HTTP/2 in Action',
      'XMPP The Definitive Guide',
      'Practical XMPP',
      'Mobile and Web Messaging',
    ],
    Seguridad: [
      'Web Security',
      'Web Security for Developers',
      'Bug Bounty Hunting for Web Security',
      "The Browser Hacker's Handbook",
      'Identity Attack Vectors',
      'NTP Security',
      'PCI DSS',
      'Crypto 101',
      'Cryptography and Network Security, 6th Edition',
      'Implementing SSL TLS Using Cryptography and PKI',
      'Game Hacking',
      'The Ghidra Book The Definitive Guide',
    ],
    'Testing y calidad': [
      'Complete Guide to Test Automation',
      'BDD in Action',
      'Testing Microservices with Mountebank',
      'SoapUI Cookbook',
      'The Way of the Web Tester',
      'Leveraging the Wisdom of the Crowd in Software Testing',
    ],
    'Otros lenguajes': [
      'Beginning Ada Programming',
      'Beginning Ballerina Programming',
      'Beginning COBOL for Programmers',
      'Beginning Ring Programming',
      'Beginning x64 Assembly Programming',
      'Common Lisp Recipes',
      'The Common Lisp Condition System',
      'Introducing Vala Programming',
      'Raku Fundamentals, 2nd Edition',
      'Raku Recipes',
      'Elixir in Action',
      'Elixir in Action, 2nd Edition',
      'Elm in Action',
      'Erlang and OTP in Action',
      'Nim in Action',
      'Type-driven Development with Idris',
      'Think Julia',
      'The Transparent Web',
      'Beginning MATLAB and Simulink',
      'Practical MATLAB Modeling with Simulink',
      'Programming with Mathematica',
      'SAP ABAP Objects',
      'Object-Oriented Design with ABAP',
      'SAS Stored Processes',
      'Producing High-Quality Figures Using SASG RAPH and ODS Graphics Procedures',
      'Gnuplot in Action',
      'Processing A Programming Handbook for Visual Designers and Artists, 2 edition',
      'Programming Interactivity, 2nd Edition',
      'Programming 101',
    ],
    'Rendimiento web': [
      'High Performance Web Sites',
      'Even Faster Web Sites',
      'High Performance Browser Networking',
      'High Performance Mobile Web',
      'Web Performance in Action',
      'Web Performance Daybook',
      'Building Scalable Web Sites',
      'Developing Large Web Applications',
    ],
    'Arq. y Mas': [
      'Clean Code',
      'Clean Architecture',
      'Head First Design Patterns, 2nd Edition',
      'Sumergete en los patrones de diseño',
      'Learning Patterns',
      'The Object-Oriented Thought Process, 4th Edition',
      'Patterns, Principles and Practices of Domain Driven Design',
      'Microservice Architecture',
      'Microservices in Action',
      'Microservices for the Enterprise',
      'Microservices From Day One',
      'Advanced Microservices',
      'Production-Ready Microservices',
      'Architecting Applications for the Enterprise, 2nd Edition',
      'Architecting Mobile Solutions For The Enterprise',
      'Architecting Modern Data Platforms',
      'SPA Design and Architecture',
      'Reactive Web Applications',
      'Functional Reactive Programming',
      'Event Processing in Action',
      'DSLs in Action',
      'Re-Engineering Legacy Software',
      'Models to Code',
      'Software Engineering Design',
      'Software Essentials Design and Construction',
      'Software Development, Design and Coding, 2nd Edition',
      'Empirical Research in Software Engineering',
    ],
    CS: [
      'Compiladores Principios, Tecnicas y Herramientas',
      'Introduction to Programming Languages',
      'Programming Languages for MIS',
      'Essentials of Computer Architecture, 2nd Edition',
      'How Computers Really Work',
      'The Secret Life of Programs',
      'Write Great Code, Volume 1, 2nd Edition',
      'Write Great Code, Volume 2, 2nd Edition',
      'Building a Debugger',
      'Understanding Compression',
      'Absolute Beginners Guide to Computing',
      'Computing A Historical and Technical Perspective',
      'Fire in the Valley',
    ],
    Algoritmos: ['Algorithmic Thinking, 2nd Edition'],
    'DevOps y Mas': [
      'The Site Reliability Workbook',
      'OpenShift in Action',
      'Beginning Bazel',
      'Agile Project Management using Team Foundation Server 2015',
    ],
    Linux: ['Effective awk Programming, 4th Edition'],
    'Arduino y Mas': [
      'Building Embedded Systems',
      'Advanced Robotic Vehicles Programming',
      'USB Complete, 3rd Edition',
      'Microbit for Mad Scientists',
      'Intel Galileo Networking Cookbook',
      'Beginning NFC',
    ],
    'Bitcoin y Mas': ['Mastering Bitcoin, 2nd Edition'],
    'Cloud Otros': ['OpenStack in Action'],
    'Unity y mas': [
      'Make a 2D RPG in a Weekend, 2nd Edition',
      'Make Your Own PuzzleScript Games',
      'Unity Virtual Reality Projects',
      'Modeling and Animation Using Blender',
      'Blender for Animation and Film-Based Production',
      '3D Animation for the Raw Beginner Using Maya',
      'Essential Skills for 3D Modeling, Rendering, and Animation',
      'Virtual Character Design for Games and Interactive Media',
    ],
    Android: ['Beginning Google Glass Development'],
    'Varios JS': ['Kendo UI Cookbook', 'Hands On Sencha Touch 2', 'Sencha Touch Cookbook, 2nd Edition'],
    JavaScript: ['ECMA-262_2015'],
    HTML5: ['Progressive Web Apps', 'Offline First Web Development'],
    PostgreSQL: ['PostGIS in Action, 2nd Editio'],
    Scala: ['Introducing Play Framework, 2nd Edition', 'Scalatra in Action', 'Practical Probabilistic Programming'],
    APIS: ['Pro PayPal E-Commerce'],
  },
};
