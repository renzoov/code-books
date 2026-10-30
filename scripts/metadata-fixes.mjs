// Correcciones de metadatos verificadas (autores, editorial, año), por título. El importador las
// aplica sobre lo que viene en el Excel. Los coautores añadidos salieron de una consulta a Open Library
// revisada a mano (Open Library mezcla prologuistas y revisores, así que nada se aplica sin revisar).
//
// Formato: { "título": { titulo?: "...", autores?: [...], editorial?: "...", anio?: 2020, nivel?: "Básico", soloEditorial?: "..." } }
// nivel solo se respeta si el título no lo contradice (ver "Validación de niveles" en import-books.mjs).
// Cambiar el título cambia el identificador (slug): hay que renombrar su portada en covers.json.
// soloEditorial limita la corrección al libro de esa editorial (hay títulos compartidos por libros distintos).

export const METADATA_FIXES = {
  'Manual de jQuery': { autores: ['Miguel Ángel Álvarez'] },
  // El Excel tenía "HDInsight Essentials" (título de otro libro) como autor.
  'PHP Microservices': { autores: ['Carlos Pérez Sánchez', 'Pablo Solar Vilariño'] },
  // Nombre completo según la portada (el Excel solo dice "Ramesh").
  'Node.js for Cross-Platform App Development': { autores: ['Ramesh Kumar'] },
  // El Excel tenía al prologuista (Ben Alex) como autor; los autores según la portada de Manning.
  'Spring Roo in Action': { autores: ['Ken Rimple', 'Srini Penchikala'] },
  // El Excel escribe "Aneeev"; Adrien Treuille es el prologuista, no autor.
  'Build Python Web Apps with Streamlit': { autores: ['Aneev Kochakadan'] },
  // Edición en español de Pearson Educación (el Excel pone Addison Wesley, sello de Pearson).
  'C# Para estudiantes': { editorial: 'Pearson' },
  // Título completo según la portada (el Excel lo acorta). Es para principiantes ("A Beginner's Journey").
  'Mastering Django': { titulo: 'Mastering Django 4: Projects for Beginners', nivel: 'Básico', soloEditorial: 'Aditya Dhandi' },
  'Manual de Mootools': { autores: ['Miguel Ángel Álvarez'] },
  'ECMA-262_2015': { autores: ['Ecma International'], editorial: 'Ecma International', anio: 2015 },
  'Visual Basic in easy steps': { autores: ['Mike McGrath'], editorial: 'In Easy Steps' },
  'RadControls for ASP NET AJAX': { autores: ['Telerik'], editorial: 'Telerik' },
  'RadControls for Winforms': { autores: ['Telerik'], editorial: 'Telerik' },
  'Telerik Reporting': { autores: ['Telerik'], editorial: 'Telerik' },
  // Autopublicado ("Independently Published", 2023, según la ficha de Alibris): como los demás
  // autopublicados del catálogo, la editorial es el propio autor.
  'Practical Operating Systems': { editorial: 'Amir Keivan Shafiei' },
  'Manual del desarrollador del SDK .Net de SAP Crystal Reports para Visual Studio': { autores: ['SAP'] },
  'Portable Document Format Specification 1.7 (2008)': { autores: ['Adobe Systems'], anio: 2008 },
  'Crypto 101': { autores: ['Laurens Van Houtven'], editorial: 'Laurens Van Houtven' },
  'Building large scale web apps': { anio: 2024 },
  // El Excel tenía el año incompleto ("202"); años según la página de copyright, verificados por el usuario.
  '200 JavaScripts Programs for Beginners': { anio: 2024 },
  'Modern Tkinter Python for Developers': { anio: 2024 },
  'Python Web Applications with Flask': { anio: 2024 },
  'Professional REST API Development with Flask': { anio: 2024 },
  'Learn OpenCV with Python by Exercises': { anio: 2024 },
  'Design Patterns Simplified': { anio: 2025 },
  // 5.ª edición: Wiley, septiembre de 2023, 1104 págs. (Wiley-VCH y O'Reilly); el Excel decía 2022 y 1531.
  'Professional JavaScript for Web Developers, 5th Edition': { anio: 2023, paginas: 1104 },
  // Revisión de descripciones de otro libro (2026-10-29): datos según el editor
  'C++ CLI Primer': { titulo: 'C++/CLI Primer' },
  'C++ Windows Programming': { paginas: 588 },
  'Learning Node.js for .NET Developers': { paginas: 248 },
  'Computer Fundamentals and Programming in C': { titulo: 'Computer Fundamentals and Programming in C, 2nd Edition', paginas: 479 },
  'Zend PHP 5 Certification Study Guide, 3rd Edition': { paginas: 346 },
  'Professional PHP6': { autores: ['Ed Lecky-Thompson', 'Steven D. Nowicki', 'Thomas Myer'] },
  'Pro Android 5': { autores: ['Dave MacLean', 'Satya Komatineni', 'Grant Allen'] },
  // Faltaba el espacio antes de ".NET"
  'Hands-On Software Architecture with C# 8 and.NET Core 3': { titulo: 'Hands-On Software Architecture with C# 8 and .NET Core 3' },
  // Serie "Programmer to Programmer" de Wrox (el Excel pone otra editorial)
  'Professional LINQ': { editorial: 'Wrox' },
  'Professional Java for Web Applications': { editorial: 'Wrox' },
  // La portada de la edición 2010 nombra solo a estos dos (MacDonald y Rajan firmaron ediciones anteriores)
  'Visual C# 2010 Recipes': { autores: ['Allen Jones', 'Adam Freeman'] },
  // ".NET" en mayúsculas, como en la portada
  'Pro .Net Memory Management, 2nd Edition': { titulo: 'Pro .NET Memory Management, 2nd Edition' },
  // Título completo según la portada (hay otra edición distinta para C# 2008).
  'Pro LINQ': { titulo: 'Pro LINQ: Language Integrated Query in VB 2008', soloEditorial: 'Apress' },
  // El Excel perdió el "++" del título (la portada dice "Clean C++").
  'Clean C': { titulo: 'Clean C++', soloEditorial: 'Apress' },
  // 2.ª edición: BPB, 2025, 364 págs. (ficha de BPB); el Excel tenía el año y las páginas de la 1.ª (2021).
  'Learning Go Programming, 2nd Edition': { anio: 2025, paginas: 364 },
  // --- Revisión de ediciones (2026-10-29): año/páginas de la edición correcta según el editor ---
  // Año del editor cuando el Excel tenía el de otra edición (no se cambia si solo difiere el copyright).
  'Continuous API Management, 2nd Edition': { anio: 2021, paginas: 357 },
  'Beginning Android Games, 3rd Edition': { anio: 2016 },
  'Beginning Android, 5th Edition': { anio: 2015 },
  'Bootstrap for ASP.NET MVC, 2nd Edition': { anio: 2016, paginas: 186 },
  // Packt: noviembre de 2022; 2020 no corresponde a ninguna edición (la 1.ª es de 2019).
  'The Python Workshop, 2nd Edition': { anio: 2022 },
  'Learn AI with Python': { anio: 2021, paginas: 270, soloEditorial: 'BPB' },
  // Solo páginas
  'Learn AI with Python, 2nd Edition': { paginas: 290 },
  'Think Python, 3rd Edition': { paginas: 326 },
  'Swift Essentials, 2nd Edition': { paginas: 248 },
  'Core Java, Volume I, 13th Edition': { paginas: 840 },
  'Core Java, Volume I, 14th Edition': { paginas: 816 },
  'Microsoft Visual C# Step by Step, 9th Edition': { paginas: 832 },
  'C# 24 Hour Trainer, 2nd Edition': { paginas: 600 },
  'Learn AI-assisted Python Programming, 2nd Edition': { paginas: 336 },
  'Learning React, 2nd Edition': { paginas: 310 },
  'CSS The Definitive Guide, 5th Edition': { paginas: 1126 },
  'Pandas for Everyone, 2nd Edition': { paginas: 512 },
  'AI-Assisted Statistics for Data Scientists, 3rd Edition': { paginas: 505 },
  'TCP IP Illustrated Volume 1, 2nd Edition': { paginas: 1056 },
  'Designing Data-Intensive Applications, 2nd Edition': { paginas: 670 },
  'AWS Certified Developer Study Guide, 2nd Edition': { paginas: 800 },
  'AWS Certified Security Study Guide, 2nd Edition': { paginas: 544 },
  'Xamarin Cross Platform Application Development, 2nd Edition': { paginas: 312, autores: ['Jonathan Peppers'] },
  'System Design Interview, 2nd Edition': { paginas: 309 },
  'Pro PHP Security, 2nd Edition': { paginas: 345 },
  // Apellido mal escrito en el Excel ("Vesselovis")
  'Building Design Systems, 2nd Edition': { autores: ['Sarrah Vesselov'] },
  // Es la 4.ª edición (No Starch, 2016), de 376 páginas; el Excel decía 50.
  'Invent Your Own Computer Games with Python': { paginas: 376 },
  // El Excel pone un punto al final del nombre del autor y acorta el título (la portada dice
  // "Node.js: The Comprehensive Guide").
  'Node.js': {
    titulo: 'Node.js: The Comprehensive Guide',
    autores: ['Sebastian Springer'],
    soloEditorial: 'Rheinwerk',
  },
  // Versión 2.0 (octubre de 2023, según el repositorio del autor)
  'Understanding JavaScript RegExp': { anio: 2023 },

  // --- Nombres de autor mal escritos en el Excel ---
  'Applied Reinforcement Learning with Python': { autores: ['Taweh Beysolow II'] },
  'Learning SQLite for iOS': { autores: ['Gene Da Rocha'] },
  'Core Data by Tutorials, 5th Edition': { autores: ['Aaron Douglas', 'Saul Mora', 'Matthew Morey', 'Pietro Rea'] },
  'Python and SQL Bible': { autores: ['Cuantum Technologies'], editorial: 'Cuantum Technologies' },
  'Algorithms and Data Structures with Python': { autores: ['Cuantum Technologies'], editorial: 'Cuantum Technologies' },
  'Data Analysis Foundations with Python': { autores: ['Cuantum Technologies'], editorial: 'Cuantum Technologies' },
  'Learn Microservices with Spring Boot': { autores: ['Moisés Macero García'] },
  'Large Language Models The Hard Parts': { autores: ['Tharsis T. P. Souza', 'Jonathan K. Regenstein Jr.'] },

  // --- Coautores faltantes (candidatos de Open Library revisados a mano; se descartaron prologuistas,
  // revisores y autores de otras ediciones) ---
  'JavaScript Regular Expressions': { autores: ['Loiane Groner', 'Gabriel Manricks'] },
  'Mastering jQuery Mobile': { autores: ['Chip Lambert', 'Shreerang Patwardhan'] },
  'Designing Social Interfaces, 2nd Edition': { autores: ['Christian Crumlish', 'Erin Malone'] },
  'Java Concurrency in Practice': {
    autores: ['Brian Goetz', 'Tim Peierls', 'Joshua Bloch', 'Joseph Bowbeer', 'David Holmes', 'Doug Lea'],
  },
  'Beginning Spring 6, 2nd Edition': { autores: ['Joseph B. Ottinger', 'Andrew Lombardi'] },
  'Murach’s Beginning Java with Eclipse': { autores: ['Joel Murach', 'Michael Urban'] },
  'Murach’s Beginning Java with NetBeans': { autores: ['Joel Murach', 'Michael Urban'] },
  'Optimizing Cloud Native Java, 2nd Edition': { autores: ['Benjamin J. Evans', 'James Gough'] },
  'Learning Django Web Development': { autores: ['Sanjeev Jaiswal', 'Ratan Kumar'] },
  'Mastering Probabilistic Graphical Models using Python': { autores: ['Ankur Ankan', 'Abinash Panda'] },
  'Programming Rust, 2nd Edition': { autores: ['Jim Blandy', 'Jason Orendorff', 'Leonora F. S. Tindall'] },
  'ADO.NET Examples and Best Practices for C# Programmers': { autores: ['William R. Vaughn', 'Peter Blackburn'] },
  'Building Maintainable Software, C# Edition': {
    autores: ['Joost Visser', 'Sylvan Rigal', 'Gijs Wijnholds', 'Pascal van Eck', 'Rob van der Leek'],
  },
  'Real World Implementation of C# Design Patterns': { autores: ['Bruce M. Van Horn II', 'Van Symons'] },
  'Effective SQL': { autores: ['John L. Viescas', 'Douglas J. Steele', 'Ben G. Clothier'] },
  'T-SQL Querying': { autores: ['Itzik Ben-Gan', 'Dejan Sarka', 'Adam Machanic', 'Kevin Farlee'] },
  'PostgreSQL 9 Administration Cookbook, 2nd Edition': { autores: ['Simon Riggs', 'Gianni Ciolli', 'Gabriele Bartolini'] },
  'Kafka in Action': { autores: ['Dylan Scott', 'Viktor Gamov', 'Dave Klein'] },
  'Hyperautomation with Generative AI': { autores: ['Navdeep Singh Gill', 'Jagreet Kaur'] },
  'Generative AI on AWS': { autores: ['Chris Fregly', 'Antje Barth', 'Shelbee Eigenbrode'] },
  'Ensemble Learning for AI Developers': { autores: ['Alok Kumar', 'Mayank Jain'] },
  'Deep Learning with JavaScript': { autores: ['Shanqing Cai', 'Stanley Bileschi', 'Eric Nielsen', 'François Chollet'] },
  'Deep Learning with Pytorch': { autores: ['Eli Stevens', 'Luca Antiga', 'Thomas Viehmann'] },
  'Hands-On Computer Vision with Detectron2': { autores: ['Van Vung Pham', 'Tommy Dang'] },
  'Building AI Intensive Python Applications': {
    autores: ['Rachelle Palmer', 'Ben Perlmutter', 'Ashwin Gangadhar', 'Nicholas Larew', 'Sigfrido Narváez'],
  },
  'Data Visualization For Dummies': { autores: ['Mico Yuk', 'Stephanie Diamond'] },
  'Pro Database Migration to Azure': { autores: ['Kevin Kline', 'Denis McDowell', 'Dustin Dorsey'] },
  'Azure AI Services at Scale for Cloud, Mobile, and Edge': {
    autores: ['Simon Bisson', 'Mary Branscombe', 'Chris Hoder', 'Anand Raman'],
  },
  'Introducing Disaster Recovery with Microsoft Azure': { autores: ['Bapi Chakraborty', 'Yashajeet Chowdhury'] },
  'Understanding Azure Monitoring': { autores: ['Bapi Chakraborty', 'Shijimol Ambi Karthikeyan'] },
  'Practical Guide to Azure Cognitive Services': { autores: ['Chris Seferlis', 'Christopher Nellis', 'Andy Roberts'] },
  'The Azure Cloud Native Architecture Mapbook, 2nd Edition': { autores: ['Stéphane Eyskens', 'Ed Price'] },
  'Serverless Web Applications with AWS Amplify': { autores: ['Akshat Paul', 'Mahesh Haldar'] },
  'Amazon Web Services in Action, 3rd Edition': { autores: ['Andreas Wittig', 'Michael Wittig'] },
  'Serverless Architectures on AWS': { autores: ['Peter Sbarski', 'Sam Kroonenburg'] },
  'AWS Certified Data Engineer Associate Study Guide': { autores: ['Sakti Mishra', 'Dylan Qu', 'Anusha Challa'] },
  'Engineering Resilient Systems on AWS': { autores: ['Kevin Schwarz', 'Jennifer Moran', 'Nate Bachmeier'] },
  'Programming AWS Lambda': { autores: ['John Chapin', 'Mike Roberts'] },
  'Serverless Development on AWS': { autores: ['Sheen Brisals', 'Luke Hedger'] },
  'System Design on AWS': { autores: ['Jayanth Kumar', 'Mandeep Singh'] },
  'Applied Machine Learning and High-Performance Computing on AWS': {
    autores: ['Mani Khanuja', 'Farooq Sabir', 'Shreyas Subramanian', 'Trenton Potgieter'],
  },
  'AWS Cloud Projects': { autores: ['Ivo Pinto', 'Pedro Santos'] },
  'Implementing AWS': { autores: ['Yohan Wadia', 'Rowan Udell', 'Lucas Chan', 'Udita Gupta'] },
  'Learning AWS': { autores: ['Aurobindo Sarkar', 'Amit Shah'] },
  'Mastering Elastic Kubernetes Service on AWS': { autores: ['Malcolm Orr', 'Yang-Xin Cao'] },
  'AWS Certified Cloud Practitioner Study Guide, 2nd Edition': { autores: ['Ben Piper', 'David Clinton'] },
  'AWS Certified Solutions Architect Study Guide, 3rd Edition': { autores: ['Ben Piper', 'David Clinton'] },
  'Computer Science  An Overview, 12th Edition': { autores: ['J. Glenn Brookshear', 'Dennis Brylow'] },
  'Mastering Python Regular Expressions': { autores: ['Félix López', 'Víctor Romero'] },
  'Fundamentals of Software Architecture, 2nd Edition': { autores: ['Mark Richards', 'Neal Ford'] },
  'Software Architecture The Hard Parts': {
    autores: ['Neal Ford', 'Mark Richards', 'Pramod Sadalage', 'Zhamak Dehghani'],
  },
  'Head First Design Patterns, 2nd Edition': {
    autores: ['Eric Freeman', 'Elisabeth Robson', 'Kathy Sierra', 'Bert Bates'],
  },
  'Implementing GitOps with Kubernetes': { autores: ['Pietro Libro', 'Artem Lajko'] },
  'Network Programming with Go': { autores: ['Jan Newmarch', 'Ronald Petty'] },
  'Cryptography and Cryptanalysis in Java, 2nd Edition': {
    autores: ['Stefania Loredana Nita', 'Marius Iulian Mihailescu'],
  },
  'Microservices Security in Action': { autores: ['Prabath Siriwardena', 'Nuwan Dias'] },
  'Python Web Penetration Testing Cookbook': {
    autores: ['Cameron Buchanan', 'Terry Ip', 'Andrew Mabbitt', 'Benjamin May', 'Dave Mound'],
  },
  'Security as Code': { autores: ['BK Sarthak Das', 'Virginia Chu'] },
  'Python Game Programming By Example': { autores: ['Alejandro Rodas de Paz', 'Joseph Howse'] },
  'IoT Development for ESP32 and ESP8266 with JavaScript': { autores: ['Peter Hoddie', 'Lizzie Prader'] },
  'Rethinking the Internet of Things': { autores: ['Francis daCosta', 'Byron Henderson'] },
  // Open Library lo confundía con otro libro; es el de Nathan Marz y James Warren (Manning, 2015).
  'Big Data': { soloEditorial: 'Manning', autores: ['Nathan Marz', 'James Warren'] },
  // La portada indica 'Second Edition' (Code Maze, 2022, .NET 6).
  'Ultimate ASP.NET Core Web API': { titulo: 'Ultimate ASP.NET Core Web API, 2nd Edition' },
  // Es la edición de 2015 con ER/Studio (Technics, ISBN 9781634620925), no la de 2009.
  'Data Modeling Made Simple, 2nd Edition': { titulo: 'Data Modeling Made Simple with ER/Studio Data Architect, 2nd Edition' },
  // 1.ª edición (Manning, 2025, ISBN 9781633436343): 344 páginas según manning.com.
  'AI Agents in Action': { paginas: 344 },
  // Subtítulo de la portada; distingue este libro del 'Large Language Models' de Springer (2026).
  'Large Language Models': { titulo: 'Large Language Models: Concepts, Techniques and Applications', soloEditorial: 'CRC Press' },
  // Nombres y orden de la portada.
  'Android in Action, 3rd Edition': { autores: ['W. Frank Ableson', 'Robi Sen', 'Chris King', 'C. Enrique Ortiz'] },
  // Título y coautor según la portada (CRC Press, 2024).
  'A Beginners Guide to Amazon Web Services': { titulo: "A Beginner's Guide to Amazon Web Services", autores: ['Parul Dubey', 'Rohit Raja'] },
  // ISBN 9798671834796 (Neal Davis, edición vigente): 298 páginas según Amazon, Barnes & Noble y AbeBooks.
  'AWS Certified Cloud Practitioner Practice Tests': { paginas: 298 },
  // La portada y el ISBN 9781435454170 son de Course Technology (Cengage).
  'Multi-Threaded Game Engine Design': { editorial: 'Course Technology' },
  // El usuario tiene la edición original en un solo volumen (Leanpub, última versión 2014, 233 páginas según Goodreads), no el Volumen 1 de 2016.
  'Software Architecture for Developers': { anio: 2014, paginas: 233, soloEditorial: 'Leanpub' },
  // 584 páginas según nostarch.com.
  'Practical Deep Learning, 2nd Edition': { paginas: 584 },
};
