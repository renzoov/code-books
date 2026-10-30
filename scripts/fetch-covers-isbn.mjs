// Descarga portadas por ISBN para los libros que aún no tienen.
//
// 1) Busca la obra en Open Library y lista sus ediciones (/works/…/editions.json).
// 2) Elige las ediciones que coinciden en título y año con el Excel (prioriza la editorial).
// 3) Prueba cada ISBN en tres fuentes: portadas de Open Library, catálogo de O'Reilly Learning e
//    imágenes de producto de Amazon. Guarda la primera imagen válida.
//
// Uso: node scripts/fetch-covers-isbn.mjs [--tech angular]
import { optimizeCovers } from './optimize-covers.mjs';
import { readFile, writeFile, readdir, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const COVERS_DIR = join(root, 'src', 'assets', 'covers');
const INDEX = join(root, 'src', 'data', 'covers.json');
const H = { headers: { 'User-Agent': 'CodeBooks/0.1 (catalogo informativo; portadas)' } };
const BROWSER = { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36' } };
const MIN_BYTES = 4000; // descarta marcadores vacíos (Amazon devuelve un GIF de 43 bytes)
// Imágenes genéricas de "sin portada" (SHA-1): la de Amazon "No Image Available" y la de Springer.
const PLACEHOLDERS = new Set([
  '47fec77555ad6044d0cb213d50800a3269b48f32',
  '604d60ab47ebb9c1f27e993841615a05063f2be7', // Springer: "cover not available" (5885 bytes)
]);

const args = process.argv.slice(2);
const TECH = args.includes('--tech') ? args[args.indexOf('--tech') + 1] : null;
// --redo slug1,slug2: vuelve a descargar portadas que salieron mal (conviene añadir antes su ISBN a MANUAL_ISBNS).
const REDO = new Set(args.includes('--redo') ? args[args.indexOf('--redo') + 1].split(',') : []);

const key = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const baseTitle = (t) => t.replace(/,?\s*\d+(st|nd|rd|th)\s+edition.*$/i, '').replace(/\s*[:(].*$/, '').trim();
const yearOf = (d) => Number(String(d ?? '').match(/\d{4}/)?.[0]) || null;

// ISBN-13 (978…) → ISBN-10, que es el que usa Amazon en sus URLs de imagen.
function isbn10(isbn13) {
  if (!/^978\d{10}$/.test(isbn13)) return null;
  const core = isbn13.slice(3, 12);
  const sum = [...core].reduce((s, d, i) => s + Number(d) * (10 - i), 0);
  const check = (11 - (sum % 11)) % 11;
  return core + (check === 10 ? 'X' : String(check));
}

async function json(url) {
  const r = await fetch(url, { ...H, signal: AbortSignal.timeout(30000) }).catch(() => null);
  return r?.ok ? r.json() : null;
}

// ISBN verificados manualmente (páginas de las editoriales) para ediciones que Open Library no tiene.
const MANUAL_ISBNS = {
  'Angular Shopping Store': ['9783384411549'],
  'Practical Angular Signals': ['9798868820069', '9798868820076'],
  'Mastering MEAN Stack': ['9789355510525', '9789355510600'],
  'AngularJS in Action': ['9781617291333'],
  'Pro Angular 16, 6th Edition': ['9781633436695', '9781638354451'],
  'Modern Web Development with Angular': ['9788196815097'],
  'AngularJS Up and Running': ['9781491901946'],
  'Angular Projects, 4th Edition': ['9781806668465'],
  'ASP.NET Core 6 and Angular 13, 5th Edition': ['9781803239705'],
  'ASP.NET Core 8 and Angular 17, 6th Edition': ['9781805129936'],
  'Building AI-Powered Apps with Angular': ['9781806383498', '9781806383481'],
  'AngularJS Novice to Ninja': ['9780992279455'],
  'Professional AngularJS': ['9781118832073'],
  // Backbone.js
  'Beginning Backbone.js': ['9781430263340'],
  'Developing Backbone.js Applications': ['9781449328252'],
  // D3.js
  'Learning d3.js Data Visualization, 2nd Edition': ['9781785889042', '9781785882791'],
  'Data Visualization with JavaScript': ['9781593276058'],
  // VueJS
  'Vue js Up and Running': ['9781491997246'],
  'Fullstack Vue 3 The Complete Guide to Vue.js': ['9781987595291'],
  // TypeScript (ISBN por edición: la búsqueda por título traía la portada de otra edición)
  'Mastering TypeScript': ['9781784399665'],
  'Effective TypeScript, 2nd Edition': ['9781098155063'],
  'Programming Typescript': ['9781492037651'],
  'The Ultimate TypeScript Developers Handbook': ['9798227431394'],
  // Open Library devolvía una página interior o la portada de otra edición
  'Test-Driven JavaScript Development': ['9780321683915'],
  'JavaScript for Absolute Beginners': ['9781430272199'],
  'Pro JavaScript Performance': ['9781430247494'],
  'JavaScript The Definitive Guide, 7th Edition': ['9781491952023'],
  'Ember.js Web Development with Ember CLI': ['9781784395841', '9781784392598'],
  'jQuery UI in Action': ['9781617291937'],
  'Pro MERN Stack': ['9781484226520'],
  'Learning React': ['9781491954621'],
  'React Application Architecture for Production': ['9781801070539'],
  'Head First JavaScript Programming': ['9781449340131'],
  'JavaScript jQuery The Missing Manual, 3rd Edition': ['9781491947074'],
  'JavaScript with Promises': ['9781449373214'],
  "You Don't Know JS. Up & Going": ['9781491924464'],
  "You Don't Know JS. Scope & Closures": ['9781449335588'],
  "You Don't Know JS. this & Object Prototypes": ['9781491904152'],
  "You Don't Know JS. Types & Grammar": ['9781491904190'],
  "You Don't Know JS. Async & Performance": ['9781491904220'],
  "You Don't Know JS. ES6 & Beyond": ['9781491904244'],
  'Mastering JavaScript Object-Oriented Programming': ['9781785889103'],
  'Mastering JavaScript Single Page Application Development': ['9781785881640'],
  'ASP.NET jQuery Cookbook, 2nd Edition': ['9781782173113'],
  'Creating Mobile Apps with jQuery Mobile, 2nd Edition': ['9781783555116', '9781783555123'],
  'jQuery Mobile in 24 Hours': ['9780672335945'],
  'React Up & Running, 2nd Edition': ['9781492051466'],
  'Practical hapi': ['9781484258040'],
  'Building Web Apps with Ember.js': ['9781449370923'],
  'Ember.js Application Development How-to': ['9781782163381', '9781782163398'],
  'Ext JS 4 Web Application Development Cookbook': ['9781849516860'],
  'Learning ExtJS, 4th Edition': ['9781784394387'],
  // Frontend web
  'Beginning CSS, 3rd Edition': ['9780470891520'],
  'CSS in Depth, 2nd Edition': ['9781633437555', '9781638355625'],
  'SVG Essentials, 2nd Edition': ['9781449374358'],
  'Head First HTML and CSS, 2nd Edition': ['9780596159900'],
  'HTML & CSS The Complete Reference, 5th Edition': ['9780071496292'],
  'HTML & CSS The Good Parts': ['9780596157609'],
  'HTML & XHTML Pocket Reference, 4th Edition': ['9780596805869'],
  'HTML & XHTML The Definitive Guide, 6th Edition': ['9780596527327'],
  'HTML, CSS  JavaScript Web Publishing in One Hour a Day, 7th Edition': ['9780672336232'],
  'HTML5 Up And Running': ['9780596806026'],
  'HTML5 Mastery Semantics, Standards, and Styling': ['9781430238614'],
  'Responsive Web Design with HTML5 and CSS3, 2nd Edition': ['9781784398934'],
  'HTML5 & CSS3 For The Real World, 2nd Edition': ['9780987467485'],
  'HTML5 and CSS3 Visual Quick Start Guide, 7th edition': ['9780321719614'],
  'HTML5 Web Application Development By Example': ['9781849695947'],
  'HTML5 Graphing and Data Visualization Cookbook': ['9781849693707'],
  'Learn HTML5 by Creating Fun Games': ['9781849696029'],
  'Mobile First Design With HTML5 And CSS3': ['9781849696463'],
  'CSS Pocket Reference, 5th Edition': ['9781492033394'],
  'CSS The Definitive Guide, 4th Edition': ['9781449393199'],
  'CSS The Definitive Guide, 5th Edition': ['9781098117610'],
  'CSS3 The Missing Manual, 3rd Edition': ['9781449325947'],
  'Sass and Compass in Action': ['9781617290145'],
  'Learning Bootstrap 4, 2nd Edition': ['9781785881008'],
  'Bootstrap for ASP.NET MVC, 2nd Edition': ['9781785889479'],
  'Information Architecture, 4th Edition': ['9781491911686'],
  'Designing Mobile Interfaces': ['9781449394639'],
  'Effective UI': ['9780596154783'],
  'Fonts & Encodings': ['9780596102425'],
  'Beginning Google Maps API 3': ['9781430228028'],
  'Foundations of Ajax': ['9781590595824'],
  'Ajax in Action': ['9781932394610'],
  'Ajax The Definitive Guide': ['9780596528386'],
  'The Definitive Guide to HTML5 WebSocket': ['9781430247401'],
  'WebGL Up And Running': ['9781449323578'],
  'OpenGL Programming Guide, 8th Edition': ['9780321773036'],
  'Interactive Computer Graphics, 6th Edition': ['9780132545235'],
  'Pro OpenGL ES for Android': ['9781430240020'],
  'XML Pocket Reference, 3rd Edition': ['9780596100506'],
  'Beginning XML, 5th Edition': ['9781118162132'],
  // Backend y otros lenguajes
  'Ruby on Rails Tutorial, 2nd Edition': ['9780321832054'],
  'Clojure in Action': ['9781935182597'],
  'Clojure Cookbook': ['9781449366179'],
  'Clojure Programming': ['9781449394707'],
  'Programming Clojure, 2nd Edition': ['9781934356869'],
  'Dart Up and Running': ['9781449330897'],
  '100 Go Mistakes and How to Avoid Them': ['9781617299599'],
  'Mastering Concurrency in Go': ['9781783983483'],
  'Java 8 in Action': ['9781617291999'],
  'JUnit in Action, 2nd Edition': ['9781935182023'],
  'Microservice Patterns': ['9781617294549'],
  'Netty in Action': ['9781617291470'],
  'Play for Java': ['9781617290909'],
  'RabbitMQ in Action': ['9781935182979'],
  'Spring in Action, 6th Edition': ['9781617297571'],
  'Spring Security in Action, 2nd Edition': ['9781633437975'],
  'Spring Start Here': ['9781617298691'],
  'Struts 2 in Action': ['9781933988078'],
  'The Java Module System': ['9781617294280'],
  'The Well-Grounded Java Developer, 2nd Edition': ['9781617298875'],
  'Spring Dynamic Modules in Action': ['9781935182306'],
  'Java Message Service, 2nd Edition': ['9780596522049'],
  'Java Performance The Definitive Guide': ['9781449358457'],
  'Java Web Services Up and Running, 2nd Edition': ['9781449365110'],
  'Reactive Programming with RxJava': ['9781491931653'],
  'RESTful Java with JAX-RS 2.0': ['9781449361341'],
  'Spock Up and Running': ['9781491923290'],
  'Spring Boot Up and Running': ['9781492076988'],
  'Spring Data': ['9781449323950'],
  'Murach’s Java Servlets and JSP, 3rd Edition': ['9781890774783'],
  'Gradle Effective Implementations Guide, 2nd Edition': ['9781784394974'],
  'Java EE Development with Eclipse, 2nd Edition': ['9781785285349'],
  'Building a RESTful Web Service with Spring': ['9781785285714'],
  'Learn Microservices with Spring Boot': ['9781484231647'],
  'The Definitive Guide to JSF in Java EE 8': ['9781484233863'],
  'Beginning EJB in Java EE 8, 3rd Edition': ['9781484235720'],
  'Starting Out with Java Early Objects, 5th Edition': ['9780133776744'],
  'Java in 21 Days, 7th Edition': ['9780672337109'],
  'Beginning Node.js': ['9781484201886'],
  'Perl and XML': ['9780596002053'],
  'Programming Perl, 4th Edition': ['9780596004927'],
  'Laravel Up and Running': ['9781491936085'],
  'PHP The Good Parts': ['9780596804374'],
  'PHP in Action': ['9781932394757'],
  'Pro PHP Programming': ['9781430235606'],
  'Plug-In PHP 100 Power Solutions': ['9780071666596'],
  'PHP and MongoDB Web Development': ['9781849513623'],
  'PHP Microservices': ['9781787125377'],
  'Programming with CodeIgniter MVC': ['9781849694704'],
  'Build Your Own Database Driven Web Site Using PHP & MySQL, 4th Edition': ['9780980576818'],
  'PHP & MySQL Novice to Ninja, 5th Edition': ['9780987153081'],
  'PHP Master': ['9780987090874'],
  'PHP6 and MySQL Bible': ['9780470384503'],
  'Beginning PHP 6, Apache, MySQL 6 Web Development': ['9780470391143'],
  'Python & XML': ['9780596001285'],
  'The Quick Python Book, 2nd Edition': ['9781935182207'],
  'Fast Python': ['9781617297939'],
  'Expert Python Programming, 2nd Edition': ['9781785886850'],
  'Learning Python Design Patterns, 2nd Edition': ['9781785888038'],
  'Rails 4 in Action, Second Edition': ['9781617291098'],
  'Using R for Introductory Statistics, 2nd Edition': ['9781466590731'],
  'R in 24 Hours': ['9780672338489'],
  'Processing A Programming Handbook for Visual Designers and Artists, 2nd Edition': ['9780262028288'],
  'Effective C++, 3rd Edition': ['9780321334879'],
  'Windows via C y C++, 5th Edition': ['9780735624245'],
  'C++ How to Program, 8th Edition': ['9780132662369'],
  'Modern C++ Programming with Test-Driven Development': ['9781937785482'],
  'Beginning Visual C++ 2010': ['9780470500880'],
  'Beginning Visual C++ 2012': ['9781118368084'],
  // Microsoft y .NET
  'Adaptive Code via C#': ['9780735683204'],
  'Functional Programming in C#, Second Edition': ['9781617299827'],
  'Pro ASP.NET 2.0 in C# 2005': ['9781590594964'],
  'Pro ASP.NET 4 in C# 2010, 4th Edition': ['9781430225294'],
  'Ultra Fast ASP .NET 4.5 2nd Edition': ['9781430243380'],
  'C# in Depth, 3rd Edition': ['9781617291340'],
  'Fast ASP .NET Websites': ['9781617291258'],
  'DSLs in Boo': ['9781933988603'],
  'ASP.NET 4 Step By Step': ['9780735627017'],
  'Parallel Programming With Visual Studio 2010': ['9780735640603'],
  'Async In C# 5.0': ['9781449337162'],
  'C# 3 Design Patterns': ['9780596527730'],
  'C# 6 Cookbook': ['9781491921463'],
  'C# 6 in a Nutshell': ['9781491927069'],
  'C# 6 Pocket Reference': ['9781491927410'],
  'C# 7 Pocket Reference': ['9781491988534'],
  'C# 8 in a Nutshell': ['9781492051138'],
  'Concurrency in C# Cookbook': ['9781449367565'],
  'Head First C#, 5th Edition': ['9781098141783'],
  'Programming C# 4, 6th Edition': ['9780596159832'],
  'Programming C# 8': ['9781492056812'],
  'Beginning ASP.NET 4.5.1 in C# and VB': ['9781118846773'],
  'Beginning ASP.NET Web Pages with WebMatrix': ['9781118050484'],
  'C# 2008 Programmer’s Reference': ['9780470285817'],
  'Expert VB 2008 Business Objects': ['9781430216384'],
  'Sams Teach Yourself Visual Basic 2015 in 24 Hours': ['9780672337451'],
  'Professional ASP.NET MVC 3': ['9781118076583'],
  'Professional ASP.NET MVC 4': ['9781118348468'],
  'Professional ASP.NET MVC 5': ['9781118794753'],
  'ASP.NET Core in Action, 3rd Edition': ['9781633438620'],
  'Building Web APIs with ASP.NET Core': ['9781633439481'],
  'Microservices in .NET, 2nd Edition': ['9781617297922'],
  'Entity Framework 4 in Action': ['9781935182184'],
  'Entity Framework Core in Action, 2nd Edition': ['9781617298363'],
  'Pro WF Windows Workflow In NET 3.5': ['9781430209751'],
  'Ilustrated WPF': ['9781430219101'],
  'Learning ASP.NET Core MVC Programming': ['9781786463838'],
  'ASP.NET 3.5 CMS Development': ['9781847193612'],
  "NHibernate 3 Beginner's Guide": ['9781849516020'],
  'NHibernate 2.x Beginner’s Guide': ['9781847198907'],
  'Entity Framework Core Cookbook, 2nd Edition': ['9781785883309'],
  'Entity Framework Tutorial, 2nd Edition': ['9781783550012'],
  'C# 6.0 and the .NET 5 Framework, 7th edition': ['9781484213339'],
  'C# 7.1 and .NET Core 2.0, 3rd Edition': ['9781788398077'],
  'An Atypical ASP.NET Core 6 Design Patterns Guide, 2nd Edition': ['9781803249841'],
  'Learning Object-oriented Programming in C# 5.0': ['9781285854564'],
  'Programming with Microsoft Visual Basic 2012': ['9781285077925'],
  // Bases de datos y reportes
  'Beginning SQL Queries- From Novice to Professional': ['9781590599433'],
  'Expert SQL Server 2008 Development': ['9781430272137'],
  'Pro Full-Text Search in SQL Server 2008': ['9781430215943'],
  'SQL Server 2012 T-SQL Recipes, 3rd Edition': ['9781430242000'],
  'SQL Server 2025 Unveiled': ['9798868818462', '9798868818479'],
  'SQL for IBM i': ['9781583474495'],
  'Introducing Microsoft SQL Server 2008 R2': ['9780735693883'],
  'Querying Microsoft SQL Server 2012': ['9780735666054'],
  'SQL Server 2012 Bible': ['9781118106877'],
  'SQL Server 2012 High Performance T-SQL Using Window Functions': ['9780735658363'],
  'SQL Server 2012 Internals': ['9780735658561'],
  'SQL Server 2012 Pocket Consultant': ['9780735663763'],
  'SQL Server 2012 Step By Step': ['9780735663862'],
  'SQL Server 2012 T-SQL Fundamentals': ['9780735658141'],
  'SQL Server 2022 Administration': ['9780137899975', '9780137900091'],
  'Head First SQL, 2nd Edition': ['9781098163648'],
  'SQL Server Execution Plans, 3rd Edition': ['9781910035245', '9781910035221'],
  'SQL in 10 Minutes, 5th Edition': ['9780135182796'],
  'Beginning T-SQL with Microsoft SQL Server 2005 and 2008': ['9780470257036'],
  'MySQL Cookbook, 2nd Edition': ['9780596527082'],
  'MySQL in a Nutshell, 2nd Edition': ['9780596514334'],
  'MySQL Pocket Reference, 2nd Edition': ['9780596514266'],
  'MySQL Stored Procedure Programming': ['9780596100896'],
  'Expert Oracle Database Architecture, 3rd Edition': ['9781430262985'],
  'Expert PLSQL Practices': ['9781430234852'],
  "Murach's Oracle SQL and PLSQL for Developers, 2nd Edition": ['9781890774806'],
  'Oracle Built-in Packages': ['9781565923751'],
  'Oracle PLSQL Language Pocket Reference, 5th Edition': ['9781491920008'],
  'Oracle PLSQL by Example, 5th Edition': ['9780133796780'],
  'Beginning PostgreSQL on the Cloud': ['9781484234464'],
  'Mastering PostgreSQL Administration': ['9798868815065', '9798868815072'],
  'PostgreSQL Query Optimization, 2nd Edition': ['9798868800689'],
  'PostGIS in Action': ['9781935182269'],
  'PostgreSQL Mistakes and How to Avoid Them': ['9781633436879'],
  'Building a Data and AI Platform with PostgreSQL': ['9798341621527'],
  'PostgreSQL Up and Running, 2nd Edition': ['9781449373191'],
  'PostgreSQL 9 Administration Cookbook, 2nd Edition': ['9781849519069'],
  'PostgreSQL High Availability Cookbook, 2nd Edition': ['9781787125537'],
  'PostgreSQL Replication, 2nd Edition': ['9781783550609'],
  'PostGIS in Action, 2nd Edition': ['9781617291395'],
  'MongoDB in Action, 2nd Edition': ['9781617291609'],
  'MongoDB Data Modeling': ['9781782175346'],
  'Professional Crystal Reports For Visual Studio .NET, 2nd.Edtion': ['9780764557309'],
  'Microsft Reporting Services in Action': ['9781932394221'],
  // Inteligencia artificial y datos
  'Beyond Vibe Coding': ['9798341634749', '9798341634756'],
  'Learning GitHub Copilot': ['9781098164645', '9781098164652'],
  'LangChain for Life Sciences and Healthcare': ['9781098162627', '9781098162634'],
  'Unlocking Data with Generative AI and RAG': ['9781835887905', '9781835887912'],
  'LLM Design Patterns': ['9781836207030'],
  'Building LLMs for Production': ['9798324731472'],
  'Vector Databases': ['9781098177584'],
  'Data Engineering for Multimodal AI': ['9781098190774', '9781098190781'],
  'Transformers - The Definitive Guide': ['9781098167004'],
  'Generative AI on Kubernetes': ['9781098171919', '9781098171889'],
  'rag-with-python-cookbook-2026-2': ['9798341600553'],
  'Large Language Models The Hard Parts': ['9798341622517', '9798341622524'],
  'Generative AI Design Patterns': ['9798341622661'],
  'Vision Language Models': ['9798341624016', '9798341624023'],
  'ML and Generative AI in the Data Lakehouse': ['9781098178451'],
  'The Craft of Post-Training': ['9781718505216'],
  'Learn Mistral': ['9781835888650'],
  'UX for Enterprise ChatGPT Solutions': ['9781835463802'],
  'Practical Generative AI with ChatGPT, 2nd Edition': ['9781836647843'],
  'RAG-Driven Generative AI, 2nd Edition': ['9781807424947'],
  'Generative AI with LangChain, 2nd Edition': ['9781837022014'],
  'Building AI Applications with OpenAI APIs': ['9781835884003', '9781835884010'],
  'Generative AI on Google Cloud with LangChain': ['9781835889329', '9781835889336'],
  'Kubernetes for Generative AI Solutions': ['9781836209935', '9781836209928'],
  'Building Business-Ready Generative AI Systems': ['9781837020690', '9781837020683'],
  'Azure OpenAI Essentials': ['9781805125068'],
  'AI-Assisted Programming for Web and Machine Learning': ['9781835083895', '9781835086056'],
  'Using Generative AI for SEO': ['9781098167196', '9781098167202'],
  'Architecting Generative AI Applications': ['9781806678655'],
  'Generative AI with Python': ['9781493226900', '9781807780210'],
  'Generative AI System Design Interview': ['9781736049143'],
  'Building Agentic AI Systems': ['9781803238753'],
  'AI Agents in Practice': ['9781805801351', '9781805801344'],
  'Building AI Agents with LLMs, RAG, and Knowledge Graphs': ['9781835087060', '9781835080382'],
  'Context Engineering for Multi-Agent Systems': ['9781806690053', '9781807304188'],
  'Managing Memory for AI Agents': ['9798341661257'],
  'Designing Multi-Agent Systems': ['9798993101200'],
  'Artificial Intelligence A Modern Approach, 3rd Edition': ['9780136042594'],
  'NumPy Beginners Guide, 3rd Edition': ['9781785281969'],
  'Data Mining Theories, Algorithms, and Examples': ['9781439808382'],
  'Data Science with Python and Dask': ['9781617295607'],
  'Practical Data Science with R': ['9781617291562'],
  'Oracle Big Data Handbook': ['9780071827263'],
  'Python Natural Language Processing Cookbook, 2nd Edition': ['9781803245744'],
  'The AI Book': ['9781119551904'],
  'AI Agents in Action': ['9781633436343'],
  'AWS Certified Cloud Practitioner Practice Tests': ['9798671834796'],
  'Graph-Powered Machine Learning': ['9781617295645'],
  'Math and Architectures of Deep Learning': ['9781617296482'],
  'Natural Language Processing Recipes': ['9781484242667'],
  'Transforming Conversational AI': ['9798868801099'],
  'Mastering NLP From Foundations to Agents, 2nd Edition': ['9781806106127'],
  'Image Processing Masterclass with Python': ['9789389898651'],
  'Image Processing and CV with Python, 2nd Edition': ['9789365890037'],
  'A Developer’s Guide to Integrating Generative AI into Applications': ['9781394373130', '9781394373147'],
  // Verificados en fichas de editoriales y librerías (búsqueda web)
  'a-practical-guide-to-generative-ai-using-amazon-bedrock-2025': ['9798868814143', '9798868814136'],
  'building-and-training-generative-ai-models-2026': ['9798868823312'],
  'generative-ai-for-full-stack-development-2026': ['9798868820748', '9798868820731'],
  'generative-ai-for-game-development-2026': ['9798868824388'],
  'introduction-to-generative-ai-with-julia-and-python-2026': ['9798868823299', '9798868823282'],
  'large-language-model-recipes-2026': ['9798868826078', '9798868826061'],
  'observability-for-large-language-models-2026': ['9798868828270', '9798868828263'],
  'practical-generative-ai-2026': ['9798868814785'],
  'prompt-engineering-for-everyone-2026': ['9798868823374'],
  'scaling-enterprise-solutions-with-llms-2025': ['9798868811548', '9798868811531'],
  'mastering-claude-ai-2025': ['9798868820014', '9798868820007'],
  'generative-ai-essentials-2025': ['9789365897074'],
  'python-3-using-chatgpt-and-gpt-4-2024': ['9781501522284', '9781836647867'],
  'mastering-large-language-models-2026': ['9798868827334', '9798868827327'],
  'the-practical-guide-to-large-language-models-2025': ['9798868822162', '9798868822155'],
  'vibe-coding-done-right-2026': ['9798868824951', '9798868824944'],
  'a-generative-journey-to-ai-2025': ['9789365890846', '9789365893496'],
  'building-generative-ai-applications-with-open-source-libraries-2025': ['9789365896282', '9789365899788'],
  'creating-websites-with-ai-2027': ['9781041213307', '9781041213314'],
  'future-of-learning-with-large-language-models-2026': ['9781032934327', '9781003567257'],
  'future-ready-with-generative-ai-2026': ['9781032975337', '9781032979939', '9781003596530'],
  'generative-ai-tools-2026': ['9781032745909'],
  'introduction-to-generative-ai-2026': ['9781032988481'],
  'ai-assisted-python-for-nonprogrammers-2026': ['9798341661622', '9798341661639'],
  'ai-assisted-statistics-for-data-scientists-3rd-edition-2026': ['9798341666269', '9798341666283'],
  'genai-on-google-cloud-2026': ['9798341623842', '9798341623859'],
  'generative-ai-on-microsoft-azure-2026': ['9798341623279'],
  'hands-on-llm-serving-and-optimization-2026': ['9798341621480', '9798341621497'],
  'hands-on-rag-for-production-2026': ['9798341621701', '9798341621718'],
  'privacy-and-security-for-large-language-models-2026': ['9781098160845', '9781098160838'],
  'video-generation-with-ai-2026': ['9798341653313', '9798341653337', '9798341653344'],
  'vision-language-models-2026': ['9798341624030', '9798341624016'],
  'generative-ai-design-patterns-2026': ['9798341622654', '9798341622661'],
  'ml-and-generative-ai-in-the-data-lakehouse-2026': ['9781098178482', '9781098178499'],
  'the-craft-of-post-training-2026': ['9781718505209', '9781718505216'],
  'ux-for-enterprise-chatgpt-solutions-2024': ['9781835461198', '9781835463802'],
  'claude-code-in-action-2026': ['9781807781781', '9781807781798'],
  'building-claude-skills-2026': ['9781808492846', '9781808492853'],
  'claude-visual-bible-2026': ['9781808658389', '9781808658396'],
  'creating-custom-gpt-with-openai-gpt-builder-2026': ['9781836643371'],
  'fairness-in-generative-ai-2026': ['9781807304867', '9781807304874', '9781807304836'],
  'large-language-models-in-finance-2026': ['9781837024520', '9781837024537'],
  'llms-for-modern-software-delivery-and-devops-2026': ['9781807609184', '9781807609191'],
  'multimodal-generative-ai-in-the-enterprise-2026': ['9781806111671', '9781806111664'],
  'practical-generative-ai-with-chatgpt-2nd-edition-2025': ['9781836647850', '9781836647843'],
  'learn-mistral-2025': ['9781835888650', '9781835888643'],
  'rag-driven-generative-ai-2nd-edition-2026': ['9781807424947', '9781807424954'],
  // Verificados en fichas de editoriales y librerías (búsqueda web)
  'practical-llm-evaluation-for-production-systems-2026': ['9781807423889', '9781807423896'],
  'rag-from-first-principles-2026': ['9781835888674', '9781835888667'],
  'the-claude-code-operating-model-2026': ['9781808082702', '9781808082719'],
  'the-generative-ai-career-masterplan-2026': ['9781806691449'],
  'web-dev-with-an-ai-sidekick-2026': ['9781806111244', '9781806111251'],
  'generative-ai-tools-for-developers-2023': ['9781925836592'],
  'beginning-big-data-with-power-bi-and-excel-2013-2013': ['9781484205303', '9781484205297'],
  'big-data-and-the-internet-of-things-2015': ['9781484209875', '9781484209868'],
  'practical-web-scraping-for-data-science-2018': ['9781484235812', '9781484235829'],
  'cognitive-computing-recipes-2019': ['9781484241059', '9781484241066'],
  'data-mining-the-textbook-2015': ['9783319141411', '9783319141428'],
  'machine-learning-with-r-tidyverse-and-mlr-2020': ['9781617296574'],
  'generative-ai-techniques-models-and-applications-2025': ['9783031820625', '9783031820618'],
  'guide-to-using-generative-ai-in-programming-2026': ['9783032074539', '9783032074522'],
  'large-language-models-2026': ['9789819662593', '9789819662586'],
  'large-language-models-a-deep-dive-2024': ['9783031656477', '9783031656460'],
  'multimodal-large-models-2026': ['9789819549283'],
  'learn-model-context-protocol-with-typescript-2025': ['9781806661398', '9781806661381'],
  'building-mcp-servers-with-c-2026': ['9798868830105', '9798868830099'],
  'a-complete-guide-to-agentforce-2026': ['9798868824715', '9798868824708'],
  'ai-agents-for-secure-and-sdn-2026': ['9798868823589', '9798868823572'],
  'creative-ai-agents-with-copilot-studio-2026': ['9798868827792', '9798868827785'],
  'data-engineering-with-generative-and-agentic-ai-on-aws-2026': ['9798868821998', '9798868821981'],
  'enterprise-guide-for-implementing-generative-ai-and-agentic-ai-2026': ['9798868816031', '9798868816024'],
  'the-mcp-standard-2026': ['9798868823640', '9798868823633'],
  'agentic-graphrag-2026': ['9798341623163', '9798341623170'],
  'agentic-mesh-2026': ['9798341621633', '9798341621619'],
  'ai-agents-the-definitive-guide-2026': ['9798341666917', '0642572247775'],
  'ai-agents-with-mcp-2026': ['9798341639546'],
  'an-illustrated-guide-to-ai-agents-2026': ['9798341662681', '9798341662698'],
  'building-agentic-solutions-with-microsoft-foundry-2026': ['0642572309817', '9798341673304'],
  '30-agents-every-ai-engineer-must-build-2026': ['9781806109012', '9781806109005'],
  'agentic-ai-for-devops-engineers-2026': ['9781808083570', '9781808083563'],
  'agentic-ai-for-platform-engineering-2026': ['9781806386659', '9781806386642'],
  'agentic-architectural-patterns-for-building-multi-agent-systems-2026': ['9781806029570', '9781806029563'],
  'agentic-coding-with-claude-code-2025': ['9781806022595'],
  'ai-agents-harnesses-foundations-2026': ['9781808087301'],
  'ai-agents-on-aws-2026': ['9781806387212', '9781806387205'],
  'building-agent-powered-applications-2026': ['9781807605179'],
  'building-ai-agents-for-network-operations-2026': ['9781808346835', '9781808346828'],
  'building-production-ai-agents-for-the-web-2026': ['9781806103324'],
  'building-the-agentic-enterprise-2026': ['9781807604455'],
  'design-multi-agent-ai-systems-using-mcp-and-a2a-2026': ['9781806116478', '9781806116461'],
  'enterprise-vibe-coding-for-agentic-engineering-2026': ['9781808087394', '9781808087387'],
  'from-systems-of-record-to-agentic-systems-of-action-2026': ['9781807783891'],
  'multi-agent-ai-engineering-2026': ['9781806690879', '9781806690862'],
  'generative-ai-and-agentic-operations-2026': ['9781394451739'],
  'machine-learning-for-trading-3rd-edition-2026': ['9781803246970'],
  'mastering-spacy-2nd-edition-2025': ['9781835880470', '9781835880463'],
  'mastering-opencv-with-python-2023': ['9789390475797', '9789390475872'],
  'digital-image-processing-2026': ['9781394240449'],
  'building-ai-intensive-python-applications-2024': ['9781836207245', '9781836207252'],
  'ai-driven-software-testing-2025': ['9798868818295', '9798868818288'],
  'building-ai-systems-with-python-2026': ['9798868827587'],
  'building-distributed-systems-in-the-age-of-ai-2026': ['9798868823947', '9798868823930'],
  'extracting-intelligence-from-rss-news-feeds-using-python-and-ai-2026': ['9798868827730', '9798868827723'],
  'governance-first-ai-2026': ['9798868831171'],
  'the-value-vector-2025': ['9798868818790'],
  'grokking-ai-algorithms-2nd-edition-2026': ['9781633434813'],
  'embedded-ai-2026': ['9781718504905', '9781718504912'],
  'the-developer-s-guide-to-ai-2026': ['9781718504769', '9781718504776', '0642572230333'],
  'ai-systems-performance-engineering-2026': ['9798341627772', '9798341627789'],
  'ai-native-software-delivery-2025': ['9781098171988', '9781098171957'],
  'ai-ready-data-blueprints-2026': ['9798341631786', '9798341631793'],
  'designing-ai-interfaces-2026': ['9798341639812', '9798341639829'],
  'managing-ai-projects-2026': ['9798341640993', '9798341641013', '9798341640986'],
  'real-time-intelligence-with-microsoft-fabric-2026': ['9781098178543', '9781098178581', '9781098178550'],
  'web-performance-engineering-in-the-age-of-ai-2026': ['9798341660199', '9798341660168'],
  'ai-for-everyday-automation-2026': ['9781808089817', '9781808089800'],
  'ai-under-attack-2026': ['9781806119936'],
  'hands-on-ai-development-with-python-2026': ['9781808088537'],
  'microsoft-foundry-in-action-2026': ['9781835888681', '9781835888698'],
  'operational-ai-with-docker-2026': ['9781807301095'],
  'the-ai-optimization-playbook-2025': ['9781806115112', '9781806115105'],
  'the-profitable-ai-advantage-2025': ['9781836205890', '9781836205883'],
  'the-ultimate-ai-guide-for-linux-engineers-2026': ['9781806664238', '9781806664221'],
  'a-common-sense-guide-to-ai-engineering-2026': ['9798888651933'],
  'untangling-ai-2026': ['9781394394388', '9781394394401'],
  'build-a-text-to-image-generator-2025': ['9781633435421'],
  'build-an-ai-agent-2026': ['9781633434615'],
  'python-pandas-for-beginners-2021': ['9781956591101'],
  'data-analysis-foundations-with-python-2023': ['9781836209072', '9781836209065'],
  // Revisión 2026-10-24 (Bases de datos → Plataformas): ISBN verificados en Open Library
  'amazon-web-services-in-action-3rd-edition-2023': ['9781633439160'],
  'the-art-of-unit-testing-3rd-edition-2024': ['9781617297489'],
  'the-art-of-unit-testing-2nd-edition-2014': ['9781617290893'],
  'clean-architecture-2018': ['9780134494166'],
  'black-hat-python-2015': ['9781593275907'],
  'cloud-computing-demystified-for-aspiring-professionals-2023': ['9781803243313'],
  'understanding-compression-2016': ['9781491961537'],
  'pro-drupal-7-for-windows-developers-2011': ['9781430231530'],
  'learn-ai-assisted-python-programming-2nd-edition-2024': ['9781633435995', '9781638355779'],
  'hardening-azure-applications-2015': ['9781484209233'],
  'react-and-react-native-6th-edition-2026': ['9781837020287'],
  'algorithhms-4th-edition-2011': ['9780321573513'],
  'tcpip-illustrated-volume-1-2nd-edition-2011': ['9780321336316'],
  'tcp-ip-illustrated-volume-3-1996': ['9780201634952'],
  'murachs-android-programming-2013': ['9781890774714'],
  'android-application-development-2009': ['9780596521479'],
  'microbit-for-mad-scientists-2019': ['9781593279745'],
  'head-first-git-2022': ['9781492092513'],
  'jenkins-the-definitive-guide-2011': ['9781449305352'],
  'the-site-reliability-workbook-2018': ['9781492029502'],
  'prometheus-up-running-2nd-edition-2023': ['9781098131142'],
  '97-things-every-programmer-should-know-2010': ['9780596809485'],
  'bash-pocket-reference-2nd-edition-2016': ['9781491941591'],
  'ubuntu-made-easy-2012': ['9781593274252'],
  'arduino-workshop-2013': ['9781593274481'],
  'web-security-for-developers-2020': ['9781593279943'],
  'the-ghidra-book-the-definitive-guide-2020': ['9781718501027'],
  'using-drupal-2nd-edition-2012': ['9781449390525'],
  'learn-windows-powershell-3-in-a-month-of-lunches-2nd-edition-2012': ['9781617291081'],
  'programming-android-2nd-edition-2012': ['9781449316648'],
  'android-programming-the-big-nerd-ranch-guide-2nd-edition-2015': ['9780134171456'],
  'android-how-to-program-2nd-edition-2014': ['9780133764031'],
  'android-hacker-s-handbook-2014': ['9781118608647'],
  'liferay-in-action-2011': ['9781935182825'],
  'system-design-interview-2nd-edition-2020': ['9798664653403'],
  'system-design-interview-volume-2-2022': ['9781736049112'],
  'the-object-oriented-thought-process-4th-edition-2013': ['9780321861276'],
  'exam-ref-70-483-programming-in-c-2013': ['9780735676824'],
  'exam-ref-70-486-developing-asp-net-mvc-4-web-applications-2013': ['9780735677227'],
  'mobile-application-security-2010': ['9780071633567'],
  'excel-dashboards-and-reports-for-dummies-3th-edition-2016': ['9781119076766'],
  'excel-formulas-and-functions-for-dummies-4th-edition-2015': ['9781119076780'],
  'arduino-for-dummies-2nd-edition-2018': ['9781119489542'],
  'beginning-nfc-2014': ['9781449372064'],
  'abusing-the-internet-of-things-blackouts-freakouts-and-stakeouts-2015': ['9781491902332'],
  'understanding-azure-data-factory-2019': ['9781484241219'],
  'azure-in-action-2010': ['9781935182481'],
  'azure-storage-streaming-and-batch-analytics-2020': ['9781617296307'],
  'learn-azure-in-a-month-of-lunches-2nd-edition-2020': ['9781617297625'],
  'microsoft-azure-essentials-2015': ['9780735697225'],
  'a-developer-s-guide-to-cloud-apps-using-microsoft-azure-2023': ['9781804614303'],
  'azure-for-developers-2nd-edition-2022': ['9781803240091'],
  'a-developer-s-guide-to-amazon-simpledb-2010': ['9780321623638'],
  'migrating-to-aws-a-manager-s-guide-2020': ['9781492074243'],
  'beginning-android-5th-edition-2016': ['9781430246862', '9781430246879'],
  'android-application-development-cookbook-2nd-edition-2016': ['9781785886195'],
  'android-fragmentation-management-how-to-2013': ['9781782160861', '9781782160878'],
  'android-ndk-beginner-s-guide-2nd-edition-2015': ['9781783989645', '9781783989652'],
  'creating-dynamic-ui-with-android-fragments-2nd-edition-2016': ['9781785889592'],
  'the-core-ios-developer-s-cookbook-5th-edition-2014': ['9780321948106', '9780133510058'],
  'swift-4-for-absolute-beginners-4th-edition-2018': ['9781484230626'],
  'the-art-of-the-app-store-2011': ['9780470952788', '9781118221129'],
  'ios-9-application-development-in-24-hours-7th-edition-2016': ['9780672337673'],
  'react-native-for-ios-development-2015': ['9781484213964'],
  'xamarin-cross-platform-application-development-2nd-edition-2015': ['9781784397883', '9781784399573'],
  'xamarin-studio-for-android-programming-a-c-cookbook-2015': ['9781849691406', '9781849691413'],
  'learn-ionic-2-2017': ['9781484226162'],
  'ai-agents-harnesses-foundations-2026': ['9781808087301', '9781808087318'],
  'building-production-ai-agents-for-the-web-2026': ['9781806103324', '9781806103331'],
  'data-structures-algorithms-in-python-2023': ['9780134855684'],
  'message-and-event-driven-systems-with-cqrs-and-event-sourcing-2026': ['9780137998616'],
  'software-engineering-design-2012': ['9781439851685'],
  'software-essentials-design-and-construction-2014': ['9781439841204'],
  'architecting-applications-for-the-enterprise-2nd-edition-2014': ['9780735685352'],
  'the-definitive-guide-to-drupal-7-2011': ['9781430231356'],
  'using-gatsby-and-netlify-cms-2020': ['9781484262962'],
  'using-joomla-2nd-edition-2014': ['9781449345396'],
  'building-your-online-store-with-wordpress-and-woocommerce-2018': ['9781484238455'],
  'wordpress-theme-development-3rd-edition-2013': ['9781849514231'],
  'wordpress-web-application-development-2nd-edition-2016': ['9781782174394', '9781783988563'],
  'microsoft-sharepoint-2013-administration-inside-out-2014': ['9780735675391'],
  'professional-sharepoint-2013-development-2013': ['9781118495827'],
  'game-ai-pro-2-collected-wisdom-of-game-ai-professionals-2015': ['9781482254792'],
  'unreal-engine-essentials-2016': ['9781784391966', '9781784398453'],
  'mobile-social-game-design-2nd-edition-2014': ['9781466598683'],
  'make-your-own-puzzlescript-games-2019': ['9781593279448'],
  'beginning-c-for-arduino-2nd-edition-2015': ['9781484209417'],
  'intel-galileo-networking-cookbook-2015': ['9781785281198'],
  'chatgpt-visual-bible-2026': ['9781808655159', '9781808655142'],
  'the-generative-ai-career-masterplan-2026': ['9781806691449', '9781806691456'],
  'azure-sql-revealed-2nd-edition-2024': ['9798868809736', '9798868809743'],
  'rethinking-the-internet-of-things-2014': ['9781430257400'],
  'blockchain-enabled-applications-2017': ['9781484230800'],
  'iot-ai-and-blockchain-for-net-2018': ['9781484237083'],
  'pic-2-linux-professional-institute-certification-study-guide-2nd-edition-2016': ['9781119150794'],
  'mcpd-exam-ref-70-518-windows-application-net-framework-4-2011': ['9780735657236'],
  'mcpd-exam-ref-70-519-web-applications-net-framework-4-2011': ['9780735657267'],
  'mcts-self-paced-training-kit-exam-70-511-2011': ['9780735627420'],
  'extending-jenkins-2016': ['9781785284243'],
  'azure-web-apps-for-developers-2015': ['9781509300594'],
  'data-visualization-in-excel-2016-2nd-edition-2016': ['9781484223994', '9781484224007'],
  'the-platform-engineer-s-handbook-2026': ['9781806380121', '9781806380138'],
  'nginx-http-server-3rd-edition-2015': ['9781785280337'],
  'kali-linux-2-assuring-security-by-penetration-testing-3rd-edition-2016': ['9781785888427'],
  'kali-linux-2-windows-penetration-testing-2016': ['9781782168492'],
  'serverless-security-2020': ['9781484260999'],
  'github-essential-2015': ['9781783553716'],
  'introducing-linux-distros-2016': ['9781484213933'],
  'practical-linux-topic-2016': ['9781484217719'],
  'pro-bash-programming-2nd-edition-2015': ['9781484201220'],
  'centos-7-linux-server-cookbook-2nd-edition-2016': ['9781785887284'],
  'mastering-github-enterprise-management-2024': ['9798868803680'],
  'cryptography-in-c-c-2nd-edition-2013': ['9781430250982'],
  // Springer devolvía su imagen "sin portada" con el e-ISBN: se usa el impreso
  'android-quick-apis-reference-2015': ['9781484205242'],
  'learn-java-for-android-development-3rd-edition-2014': ['9781430264545'],
  'pro-android-augmented-reality-2012': ['9781430239451'],
  'docker-for-data-science-2017': ['9781484230114'],
  'basic-linux-terminal-tips-and-tricks-2020': ['9781484260340'],
  'pro-powershell-for-microsoft-azure-2015': ['9781484206669'],
  'beginning-drupal-7-2010': ['9781430228592'],
  'building-javascript-games-2014': ['9781430265382'],
  'practical-deep-learning-2nd-edition-2025': ['9781718504202', '9781718504219'],
  'balancing-coupling-in-software-design-2024': ['9780137353538', '9780137353514'],
  'computing-a-historical-and-technical-perspective-2014': ['9781482227413'],
  'adaptive-systems-with-domain-driven-design-wardley-mapping-and-team-topologies-2025': ['9780137393039'],
  'the-internet-of-things-2017': ['9781498761284'],
  'optimizing-cost-for-ms-workloads-on-aws-2025': ['9798868817656', '9798868817663'],
  'the-definitive-guide-to-ml-operations-in-aws-2024': ['9798868810756', '9798868810763'],
  'learning-serverless-security-2026': ['9781098149017', '9781098149000'],
  'what-are-asynchronous-apis-2023': ['9781098147471', '9781098147464'],
};

// Último recurso, para autopublicados sin ISBN o ediciones no catalogadas: la ficha del libro en
// Goodreads. Solo se acepta si el título de la ficha coincide con el del Excel.
async function goodreadsCover(book, file) {
  const q = encodeURIComponent(`${baseTitle(book.titulo)} ${book.autores[0] ?? ''}`);
  const search = await fetch(`https://www.goodreads.com/search?q=${q}`, { ...BROWSER, signal: AbortSignal.timeout(30000) })
    .then((r) => (r.ok ? r.text() : ''))
    .catch(() => '');
  const href = search.match(/href="(\/book\/show\/[^"?]+)/)?.[1];
  if (!href) return null;
  const page = await fetch(`https://www.goodreads.com${href}`, { ...BROWSER, signal: AbortSignal.timeout(30000) })
    .then((r) => (r.ok ? r.text() : ''))
    .catch(() => '');
  const ogTitle = page.match(/property="og:title"\s+content="([^"]+)"/)?.[1] ?? '';
  const ogImage = page.match(/property="og:image"\s+content="([^"]+)"/)?.[1];
  // Goodreads usa su logo o una silueta genérica cuando no tiene portada: se descarta.
  if (ogImage && /nophoto|goodreads-logo|\/assets\//i.test(ogImage)) return null;
  if (!ogImage || !key(ogTitle).startsWith(key(baseTitle(book.titulo)).slice(0, 25))) return null;
  return (await download(ogImage, file)) ? { file: `${book.slug}.jpg`, source: 'goodreads', url: `https://www.goodreads.com${href}` } : null;
}

// Libros de Apress/Springer: la portada oficial del CDN de Springer Nature, cuyo nombre es el ISBN con
// guiones (normalmente el del e-book). Se prueba cada ISBN candidato y su "vecino" (en Apress el e-ISBN
// suele ser el impreso + 1 en el bloque de título). La ficha de link.springer.com no se consulta: tiene
// protección anti-bots.
const SPRINGER_PREFIXES = ['979-8-8688', '978-1-4842', '978-1-4302', '978-1-59059', '978-3-319', '978-3-030', '978-3-031', '978-3-032', '978-3-658', '978-981-', '978-1-4471', '978-1-4614', '978-1-4419'];
function hyphenate(isbn) {
  for (const pre of SPRINGER_PREFIXES) {
    const digits = pre.replace(/-/g, '');
    if (!isbn.startsWith(digits)) continue;
    const head = pre.endsWith('-') ? pre.slice(0, -1) : pre;
    const tl = isbn.slice(digits.length, 12);
    // 978-981 tiene bloques de editor variables; para él se usa 978-981-NN-NNNN-C (el de Springer).
    if (pre === '978-981-') return `978-981-${isbn.slice(6, 8)}-${isbn.slice(8, 12)}-${isbn[12]}`;
    return `${head}-${tl}-${isbn[12]}`;
  }
  return null;
}
function isbn13Check(d12) {
  const sum = [...d12].reduce((s, d, i) => s + Number(d) * (i % 2 ? 3 : 1), 0);
  return String((10 - (sum % 10)) % 10);
}
async function springerCover(book, file, isbns) {
  if (!/apress|springer/i.test(book.editorial ?? '')) return null;
  const tries = [];
  for (const i of isbns.filter((x) => x.length === 13)) {
    tries.push(i);
    const next = String(Number(i.slice(0, 12)) + 1);
    tries.push(next + isbn13Check(next));
  }
  for (const i of [...new Set(tries)]) {
    const id = hyphenate(i);
    if (!id) continue;
    const img = `https://media.springernature.com/full/springer-static/cover-hires/book/${id}`;
    if (await download(img, file)) return { file: `${book.slug}.jpg`, source: 'springer', isbn: i };
  }
  return null;
}

// Libros de BPB: la tienda oficial (Shopify) expone la ficha en JSON en /products/<slug>.json; la
// primera imagen es la portada. Solo se acepta si el título de la ficha coincide con el del Excel.
async function bpbCover(book, file) {
  if (!/^bpb/i.test(book.editorial ?? '')) return null;
  const slugify = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  for (const s of [...new Set([slugify(book.titulo), slugify(baseTitle(book.titulo))])]) {
    for (const host of ['bpbonline.com', 'in.bpbonline.com']) {
      const data = await json(`https://${host}/products/${s}.json`);
      const p = data?.product;
      if (!p || !key(p.title).startsWith(key(baseTitle(book.titulo)).slice(0, 25))) continue;
      const src = p.image?.src ?? p.images?.[0]?.src;
      if (src && (await download(src, file))) return { file: `${book.slug}.jpg`, source: 'bpb', url: `https://${host}/products/${s}` };
    }
  }
  return null;
}

// Fichas oficiales verificadas a mano (Manning) para libros cuya URL no sale del título.
const MANUAL_PAGES = {
  'Build a Reasoning Model': 'https://www.manning.com/books/build-a-reasoning-model-from-scratch',
  "Sutskever's List": 'https://www.manning.com/books/sutskevers-list',
};

// Libros de Manning: la portada de su ficha en manning.com (la URL se deduce del título). La imagen
// og:image suele ser un banner promocional; la portada es la imagen de libro que más se repite.
async function manningCover(book, file) {
  if (!/manning/i.test(book.editorial ?? '')) return null;
  const slugify = (s) => s.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const urls = MANUAL_PAGES[book.titulo]
    ? [MANUAL_PAGES[book.titulo]]
    : [...new Set([slugify(book.titulo), slugify(baseTitle(book.titulo))])].map((s) => `https://www.manning.com/books/${s}`);
  for (const url of urls) {
    const r = await fetch(url, { ...BROWSER, signal: AbortSignal.timeout(30000) }).catch(() => null);
    if (!r?.ok) continue;
    const page = await r.text();
    const ogTitle = page.match(/property="og:title"\s+content="([^"]+)"/)?.[1] ?? '';
    if (!MANUAL_PAGES[book.titulo] && !key(ogTitle).startsWith(key(baseTitle(book.titulo)).slice(0, 25))) continue;
    const counts = {};
    for (const m of page.matchAll(/images\.manning\.com\/\d+\/\d+\/(?:resize|crop)\/(book\/[^"'\s)]+?\.(?:png|jpe?g))/gi))
      counts[m[1]] = (counts[m[1]] ?? 0) + 1;
    const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (best && (await download(`https://images.manning.com/600/800/resize/${best}`, file)))
      return { file: `${book.slug}.jpg`, source: 'manning', url };
  }
  return null;
}

async function candidateIsbns(book) {
  // Se busca primero por slug (para títulos repetidos entre editoriales) y luego por título.
  const manual = MANUAL_ISBNS[book.slug] ?? MANUAL_ISBNS[book.titulo];
  if (manual) return manual;
  const surname = book.autores[0]?.split(' ').pop() ?? '';
  const s = await json(
    `https://openlibrary.org/search.json?title=${encodeURIComponent(baseTitle(book.titulo))}&author=${encodeURIComponent(surname)}&fields=key&limit=5`,
  );
  const want = key(baseTitle(book.titulo));
  const scored = [];
  for (const doc of s?.docs ?? []) {
    const eds = await json(`https://openlibrary.org${doc.key}/editions.json?limit=50`);
    for (const e of eds?.entries ?? []) {
      const isbns = [...(e.isbn_13 ?? []), ...(e.isbn_10 ?? [])];
      if (!isbns.length || key(baseTitle(e.title ?? '')) !== want) continue;
      const y = yearOf(e.publish_date);
      if (book.anio && y && Math.abs(y - book.anio) > 1) continue; // otra edición
      const samePublisher = (e.publishers ?? []).some((p) => key(p).includes(key(book.editorial).slice(0, 5)));
      scored.push({ isbns, score: (y === book.anio ? 2 : 0) + (samePublisher ? 1 : 0) });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  return [...new Set(scored.flatMap((x) => x.isbns))];
}

async function download(url, file) {
  const r = await fetch(url, { ...BROWSER, signal: AbortSignal.timeout(30000) }).catch(() => null);
  if (!r?.ok || !(r.headers.get('content-type') ?? '').startsWith('image/')) return false;
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < MIN_BYTES) return false;
  if (PLACEHOLDERS.has(createHash('sha1').update(buf).digest('hex'))) return false;
  await writeFile(file, buf);
  return true;
}

async function coverFor(book) {
  const file = join(COVERS_DIR, `${book.slug}.jpg`);
  const isbns = await candidateIsbns(book);
  const springer = await springerCover(book, file, isbns);
  if (springer) return springer;
  for (const raw of isbns) {
    const i13 = raw.length === 13 ? raw : null;
    const i10 = raw.length === 10 ? raw : isbn10(raw);
    // Open Library va al final: a veces guarda escaneos de páginas interiores en vez de la portada.
    const sources = [
      i13 && ['oreilly', `https://learning.oreilly.com/covers/urn:orm:book:${i13}/800w/`],
      i10 && ['amazon', `https://images-na.ssl-images-amazon.com/images/P/${i10}.01.LZZZZZZZ.jpg`],
      ['openlibrary', `https://covers.openlibrary.org/b/isbn/${raw}-L.jpg?default=false`],
    ].filter(Boolean);
    for (const [source, url] of sources) {
      if (await download(url, file)) return { file: `${book.slug}.jpg`, source, isbn: raw };
    }
  }
  // O'Reilly cataloga sus libros por el ISBN del e-book, que suele ser el impreso − 1 (o − 2) en el
  // bloque de título: se prueban esos "vecinos" solo para libros de O'Reilly. Packt (que también está
  // en O'Reilly Learning) usa el impreso + 1 para el e-book. Un vecino podría ser otro libro: la portada
  // se revisa a ojo como todas.
  const pub = book.editorial ?? '';
  if (/o'?reilly|packt/i.test(pub)) {
    for (const raw of isbns.filter((x) => x.length === 13)) {
      for (const off of /packt/i.test(pub) ? [-1, -2] : [1, 2]) {
        const d = String(Number(raw.slice(0, 12)) - off);
        const i = d + isbn13Check(d);
        if (await download(`https://learning.oreilly.com/covers/urn:orm:book:${i}/800w/`, file)) return { file: `${book.slug}.jpg`, source: 'oreilly', isbn: i };
      }
    }
  }
  return (await manningCover(book, file)) ?? (await bpbCover(book, file)) ?? goodreadsCover(book, file);
}

const books = JSON.parse(await readFile(join(root, 'src', 'data', 'books.json'), 'utf8'));
const index = existsSync(INDEX) ? JSON.parse(await readFile(INDEX, 'utf8')) : {};
const have = new Set((await readdir(COVERS_DIR)).map((f) => f.replace(/\.[^.]+$/, '')));
// Un índice con muchas menos entradas que portadas en disco es una versión vieja (p. ej. restaurada por
// OneDrive): se aborta antes de descargar nada para no perder metadatos.
if (Object.keys(index).length < have.size * 0.9) {
  throw new Error(`covers.json tiene ${Object.keys(index).length} entradas para ${have.size} portadas: parece truncado`);
}
// Se filtra por sección antes de quitar repetidos: un libro presente en dos secciones debe procesarse en ambas.
const pending = [
  ...new Map(books.filter((b) => (REDO.size ? REDO.has(b.slug) : !TECH || b.techSlug === TECH)).map((b) => [b.slug, b])).values(),
].filter((b) => REDO.has(b.slug) || !have.has(b.slug))
  // Las portadas que aportó el usuario nunca se vuelven a descargar.
  .filter((b) => index[b.slug]?.source !== 'proporcionada por el usuario');
console.log(`${pending.length} libros sin portada${TECH ? ` en "${TECH}"` : ''}`);

let found = 0;
const updates = {};
for (const book of pending) {
  const result = await coverFor(book).catch(() => null);
  if (result) {
    updates[book.slug] = result;
    found++;
    console.log(`  ✓ ${book.titulo} (${result.source}${result.isbn ? `, ISBN ${result.isbn}` : ""})`);
  } else {
    console.log(`  · ${book.titulo}: sin portada encontrada`);
  }
}
// Se relee el índice antes de escribir: otro proceso pudo añadir portadas mientras se descargaba.
// Si no se puede leer (o vino casi vacío por una escritura a medias), se aborta en vez de pisarlo.
const latest = existsSync(INDEX) ? JSON.parse(await readFile(INDEX, 'utf8')) : {};
if (Object.keys(latest).length < Object.keys(index).length * 0.9) {
  throw new Error(`covers.json tiene ${Object.keys(latest).length} entradas (antes ${Object.keys(index).length}); no se sobrescribe`);
}
for (const [slug, result] of Object.entries(updates)) {
  if (latest[slug]?.source !== 'proporcionada por el usuario') latest[slug] = result;
}
await writeFile(`${INDEX}.tmp`, JSON.stringify(latest, null, 2) + '\n');
await rename(`${INDEX}.tmp`, INDEX);
console.log(`✔ ${found} portadas nuevas de ${pending.length}`);

// Las portadas descargadas (JPG/PNG) se convierten a WebP, más liviano.
await optimizeCovers();
