---
slug: DireccionInvestigacion
title: Dirección de Investigación
date: 2025-08-22T21:55:21.800Z
excerpt: Universidad Central del Ecuador. Dirección de Investigación tiene por objetivo orientar, promover y coordinar la actividad investigativa en la UCE.
coverImage: /images/posts/blogUce01.jpg
tags:
  - Dirección
---
<script>
  import FloatingImage from "$lib/components/atoms/FloatingImage.svelte";
  import MissionVision from "$lib/components/atoms/MissionVision.svelte";
  import CardTabs from "$lib/components/atoms/FancyCardTabs.svelte"
  import TableChain from "$lib/components/atoms/TableChain.svelte"

  let columns = ['Unidad', 'Sigla', 'Cargo', 'Nombre'];
  let rows = [
    ['Dirección General de Investigación', 'DI', 'Directora de Investigación', 'Ing. Carolina Montero C., Ph.D.'],
    ['Unidad de Administración Financiera', 'UAF', 'Guardalmacén','Ing. David Vélez'],
    ['Unidad de Administración Financiera', 'UAF', 'Analista unidad financiera','Ing. Diana Taipe'],
    ['Unidad de Investigación Formativa', 'UEF', 'Coordinadora general','Arq. Janaina Marx Pinheiro PhD.'],
    ['Unidad de Investigación Formativa', 'UEF', 'Coordinador área de Ciencias Exactas','Arq. Roberto de la Torre N.'],
    ['Unidad de Investigación Formativa', 'UEF', 'Coordinador área de Ciencias Exactas', 'Arq. Luis Bossano R.'],
    ['Unidad de Investigación Formativa', 'UEF', 'Asistente financiera / Administrativa / Secretaría','Ing. Mónica Pulupa'],
    ['Unidad de Formación Continua en Investigación', 'UEFCI', 'Coordinador',  'Arq. Roberto De la Torre MSc.'],
    ['Unidad de Formación Continua en Investigación', 'UEFCI', 'Coordinador',  'Arq. Luis Bossano Rivadeneira MSc.'],
    ['Unidad de Proyectos Avanzados', 'UPRA',  'Coordinador', 'Dr. Angel Freddy Rodríguez PhD.'],
    ['Unidad de Proyectos Avanzados', 'UPRA',  'Analista de Planificación', 'MGs. Eulalia Hurtado Moreno'],
    ['Unidad de Divulgación Científica', 'UDC', 'Coordinador', 'Dr. Juan Viteri Moya MSc PhD (c)'],
    ['Unidad de Divulgación Científica', 'UDC', 'Técnica Docente en Investigacióni', 'MSc. Mariana Pallasco R.'],
    ['Unidad de Divulgación Científica', 'UDC', 'Asistente de Comunicación', 'Srta. Hanny Paredes Ch.'],
  ];
  let columnsInvestigadores = ['Nombre', 'Correo', 'Rama', 'Facultad'];
  let rowsInvestigadores = [
    ['Ivan Vinicio Jacome Negrete', 'jvjacome@uce.edu.ec', 'Etnobiología, manejo de la biodiversidad, faunista amazónica desde cosmovisión local', 'Facultad de Ciencias Biológicas'],
    ['Francisco Jose Alvarez Nava', 'fjalvarez@uce.edu.ec', 'Genética Humana','Facultad de Ciencias Bilógicas'],
    ['Maria Gabriela Leal Reverol', 'mgleal@uce.edu.ec', 'Cristalografía/materiales solidos funcionalesnteractiva; escultura lúcida; metodos creativos en las artes; métodos de enseñanza en las artes.','Facultad de Ciencias Químicas'],
    ['Patricia Rosalia Jimbo Santana', 'prjimbo@uce.edu.ec', 'Inteligencia Artificial - Mineria de datos - Big Data - Riesgo - Tecnologías en información y Comunicación','Facultad de Ciencias Administrativas'],
  ];
</script>

La Universidad Central del Ecuador [UCE]() es la universidad más antigua del país y, por matrícula, la segunda más grande del sistema ecuatoriano de educación superior; además, mantiene actividad académica continua desde el siglo XIX y una oferta amplia de carreras de grado y posgrado.

En este marco, la investigación universitaria constituye una función sustantiva institucional, articulada mediante órganos especializados que orientan, promueven y coordinan la producción de conocimiento científico y su difusión.

## DIRECCIÓN DE INVESTIGACIÓN
En concordancia con su mandato institucional, la Dirección de investiación tiene por objetivo orientar, promover y coordinar la actividad investigativa en la UCE, canalizando apoyos mediante convocatorias competitivas y la articulación de unidades funcionales dedicadas a la formación, el fomento y la divulgación científica [[1]](https://www.uce.edu.ec/web/di/home).

<FloatingImage 
  src="/images/posts/logoDI.PNG" alt="UCE" 
  style="display:block; margin-inline:auto; max-width: 320px"
  fit="cover"
  amplitude={8}
  duration={1000}
  hoverScale={1.03}
  shadow="0 0 0 20px var(--color--primary),
          0 200px 40px color-mix(in oklab, var(--color--primary) 90%, transparent)"
/>

<MissionVision
  text='Misión: “Promover, formar, fortalecer y vigilar el desarrollo de la investigación científica y tecnológica a través de convocatorias anuales obteniendo un mejor aprovechamiento de los recursos naturales que correspondan a las necesidades de generación de conocimiento, desarrollo tecnológico y solución de problemas de la sociedad ecuatoriana, potenciando a la Universidad Central del Ecuador en el desarrollo de la ciencia y el conocimiento” [1].'
/>
<MissionVision
  text='Visión: “Ser un referente en investigación a nivel local y regional con resultados difundidos, reconocidos y valorados dentro y fuera del mundo académico” [1].'
/>

### UNIDADES

Estas unidades son responsables de la gestión administrativa y técnica, la formación en investigación, el desarrollo de proyectos y la difusión científica en toda la institución [[1]](https://www.uce.edu.ec/web/di/home).

<CardTabs/>

### ORGANIZACIÓN

 Estructura Organizativa
<TableChain {columns} {rows} accent="var(--color--primary)" headerBorder="#fff" />

### INDICADORES.
La Dirección de Investigación de la Universidad Central del Ecuador utiliza indicadores institucionale que son herramientas de medición y evaluación que permiten determinar el grado de cumplimiento de las políticas, planes, procesos y resultados vinculados a la investigación e innovación institucional. Estos indicadores reflejan tanto aspectos cualitativos (como la existencia de normativa, planificación, gestión responsable y acciones de mejora) como cuantitativos (por ejemplo, número de proyectos con financiamiento externo, producción académica, propiedad intelectual o participación en redes). Su objetivo es asegurar que la investigación se organice y ejecute de manera planificada, alineada a la misión, visión y líneas de investigación de la UCE, considerando además el impacto social, cultural y científico de sus resultados. En esencia, sirven como mecanismos para el seguimiento, evaluación y mejora continua de la función sustantiva de investigación, garantizando transparencia, pertinencia y calidad en el quehacer investigativo de la universidad [[1]](https://www.uce.edu.ec/web/di/home).

### FORMATOS DI-UCE.
La DI cuenta con un conjunto de formatos estandarizados que regulan y facilitan la presentación, evaluación y seguimiento de los proyectos de investigación. Estos incluyen plantillas para el registro inicial, presupuestos, cronogramas, reportes de avance, informes finales, así como declaraciones de aspectos éticos y de difusión de resultados. La existencia de estos formatos asegura uniformidad, transparencia y cumplimiento de las normativas institucionales [[1]](https://www.uce.edu.ec/web/di/home).

### REVISTA INVESTIGA UCE.
La Revista Investiga UCE es una publicación científica arbitrada editada por la Dirección de Investigación, que difunde los resultados de la producción académica de la comunidad universitaria. Su objetivo es visibilizar investigaciones originales en diversas áreas del conocimiento, contribuyendo a la proyección académica de la UCE y fortaleciendo su presencia en redes de investigación nacionales e internacionales. La revista se ajusta a estándares editoriales internacionales y está orientada a fomentar la comunicación científica y el intercambio de saberes [[1]](https://www.uce.edu.ec/web/di/home).

<FloatingImage 
  src="/images/posts/revistaIngenio.png" alt="UCE" 
  style="display:block; margin-inline:auto; max-width: 220px"
  fit="cover"
  amplitude={8}
  duration={1000}
  hoverScale={1.03}
  shadow="0 0 0 20px var(--color--primary),
          0 200px 40px color-mix(in oklab, var(--color--primary) 90%, transparent)"
/>

### INVESTIGADORES.
A continuación se presentan  algunos de los investigadores activos

<TableChain
  columns={columnsInvestigadores}
  rows={rowsInvestigadores}
  accent="var(--color--primary)"
  headerBorder="#fff"
/>

### SITUACIÓN ACTUAL
En la actualidad, el área de investigación de la Universidad Central del Ecuador, a través de la Dirección de Investigación, presenta debilidades significativas en su plataforma web institucional. La sección correspondiente a esta dependencia muestra un contenido desactualizado, poco estructurado y con deficiencias notables en experiencia de usuario. La información disponible resulta confusa, incompleta y, en algunos casos, inexacta, lo que limita la comprensión de los procesos, convocatorias, formatos y logros de la unidad.
Esta situación afecta la visibilidad y accesibilidad de los servicios y productos generados por la DI, dificultando que docentes, investigadores, estudiantes y actores externos accedan de manera ágil y confiable a la información necesaria para participar en convocatorias, conocer resultados o acceder a herramientas de gestión investigativa.