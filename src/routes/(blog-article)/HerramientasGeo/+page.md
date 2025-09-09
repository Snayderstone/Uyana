---
slug: HerramientasGeo
title: Herramientas para la represenatión visual en Mapas
date: 2025-08-22T21:55:21.800Z
excerpt: Las herramientas para visualización esp  /* Que cada ítem se comporte como "bloque" fijo (no se estire) */
  .image-row :global(*) {
    flex: 0 0 auto;
    scroll-snap-align: center;
  } /* Que cada ítem se comporte como "bloque" fijo (no se estire) */
  .image-row :global(*) {
    flex: 0 0 auto;
    scroll-snap-align: center;
  }agrupan en varios "sabores" que cubren todo el flujo de trabajo
coverImage: /images/posts/imgGIS.png
tags:
  - Herramientas
---

<script>
    import FloatingImage from "$lib/components/atoms/FloatingImage.svelte";
    import TableChain from "$lib/components/atoms/TableChain.svelte"
    let columns = [
  'Herramienta',
  'Tipo',
  'Open Source',
  'Licencia / Modelo',
  'Precio base (USD)*',
  'Versión actual / canal',
  'Año (si disponible)',
  'Robustez (cualitativa)',
  'Plataforma',
  'Notas'
];

let rows = [
  ['ArcGIS Pro', 'GIS de escritorio', 'No', 'User types (ArcGIS Online/Enterprise) + opción Personal Use', 'Personal Use ~100/año; empresarial: cotizar', '3.x (rama actual)', '2015', 'Muy alta (suite completa Esri)', 'Windows', 'Incluye 2D/3D, Python; licenciamiento por niveles Basic/Standard/Advanced'],
  ['ArcGIS Online', 'SaaS de mapeo', 'No', 'User types + créditos de consumo', 'Cotizar (según user type) + créditos', 'Servicio continuo (SaaS)', '2012', 'Muy alta (plataforma nube Esri)', 'Web', 'Créditos por análisis/almacenamiento; integra apps (Dashboards, StoryMaps)'],
  ['ArcGIS StoryMaps', 'Narrativa cartográfica', 'No', 'Incluido con ArcGIS Online', 'Incluido (según user type)', 'Servicio continuo (SaaS)', '2019', 'Alta (comunicación)', 'Web', 'Constructor de historias con mapas, multimedia y bloques'],
  ['ArcGIS Dashboards', 'Dashboards geoespaciales', 'No', 'Incluido con ArcGIS Online', 'Incluido (según user type)', 'Servicio continuo (SaaS)', '—', 'Alta (operacional)', 'Web', 'Widgets, filtros, vistas móviles; parte del ecosistema ArcGIS'],
  ['Mapbox Studio', 'Diseño de mapas web', 'No (lib OSS adjuntos)', 'Pago por uso (APIs/MAU) con tier gratis', 'Ej.: Directions $2/1000 req; MAU móviles desde $0.30', 'Servicio continuo (SaaS)', '2014–2015 (relanzado web)', 'Alta (desarrolladores)', 'Web', 'Amplio free tier, pricing granular por API; GL JS/SDKs'],
  ['CARTO', 'Location Intelligence (SaaS)', 'No', 'Consumo anual (usage-based) / contrato', 'Cotizar', 'Servicio continuo (SaaS)', '2012', 'Alta (analítica empresarial)', 'Web', 'Colaboración en tiempo real, data enrichment, cloud native'],
  ['Kepler.gl', 'Vis analítica WebGL', 'Sí (MIT)', 'Libre', 'Gratis', 'Releases activos', '2018', 'Alta (datasets grandes)', 'Web (lib/repositorio)', 'Proyecto OSS (Urban Computing Foundation); embebible/plug-and-play'],
  ['Google Earth Pro', 'Globo 3D de escritorio', 'No', 'Gratuito', 'Gratis (desde 2015)', '7.3.6 (línea 7.3.x)', '—', 'Media-alta (visualización)', 'Windows/macOS/Linux', 'Mediciones, importación GIS, exportación, captura alta resolución'],
  ['Google My Maps', 'Mapeo simple', 'No', 'Gratuito (cuenta Google)', 'Gratis', 'Servicio continuo (web)', '—', 'Media (simplicidad)', 'Web', 'Creación/compartición de mapas básicos; sin análisis avanzado'],
  ['Google Earth Engine', 'Análisis EO en nube', 'No', 'Planes con tarifa mensual + uso (EECU) y plan Limited', 'Básico $500/mes; Profesional $2000/mes; Online $1.33/EECU-h; Batch $0.40/EECU-h', 'Servicio continuo (SaaS)', '—', 'Muy alta (EO a escala)', 'Web/API', 'Investigación/ONG: sin costo no comercial; cambios de precio anunciados para 2025-09-01'],
  ['Global Mapper', 'GIS generalista', 'No', 'Licencia perpetua/suscripción (fabricante) ', 'Mercado reporta ~$700–$1,050 según edición', 'v25–26 (línea Pro)', '—', 'Alta (rasters/terreno)', 'Windows', 'Versión móvil: base gratis; Pro móvil ~$50 por dispositivo'],
  ['MapInfo Pro', 'GIS de escritorio', 'No', 'Suscripción corporativa', 'Cotizar', 'Rama anual', '—', 'Alta (corporativo)', 'Windows', 'Producto de Precisely; foco en negocio y cartografía temática'],
  ['Maptitude', 'GIS + LI', 'No', 'Compra única o suscripción', 'Desde ~$420 (según listados públicos)', 'Edición 2025', '—', 'Alta (negocio/territorios)', 'Windows + Web', 'Incluye datasets y paquetes país; licencias flexibles'],
  ['GRASS GIS', 'GIS científico', 'Sí (GPL)', 'Libre', 'Gratis', '8.4.1 (2025)', '—', 'Muy alta (geoprocesamiento)', 'Windows/macOS/Linux', 'Histórico en análisis espacial/ráster; comunidad OSGeo'],
  ['SAGA GIS', 'GIS y geoanálisis', 'Sí (GPL)', 'Libre', 'Gratis', '8.x (activo)', '—', 'Alta (módulos)', 'Windows/Linux', 'Fuerte en terreno/hidrología; extensible por API C++'],
  ['gvSIG', 'GIS de escritorio', 'Sí (GPL)', 'Libre', 'Gratis', '2.x (activo)', '—', 'Alta (comunidad hispana)', 'Windows/Linux/macOS', 'Ecosistema de extensiones; administración pública'],
  ['uDig', 'GIS liviano', 'Sí (EPL/LGPL)', 'Libre', 'Gratis', '1.x–2.0 RC', '—', 'Media (cliente ligero)', 'Windows/Linux/macOS', 'Basado en Eclipse/GeoTools; estado de releases RC 2.0'],
  ['GeoDa', 'Exploración geo-estadística', 'Sí (GPL)', 'Libre', 'Gratis', '1.x (activo)', '—', 'Alta (análisis espacial)', 'Windows/macOS/Linux', 'Clustering, autocorrelación, LISA; académico'],
  ['QField', 'Levantamiento móvil (QGIS)', 'Sí (GPLv2+)', 'App gratis; QFieldCloud con planes', 'App: gratis; QFieldCloud: free tier + planes de pago', '3.7.5 (ago-2025)', '—', 'Alta (campo-oficina)', 'Android/iOS/Windows/macOS/Linux', 'Sincroniza con QGIS; QFieldCloud por usuarios activos/almacenamiento'],
  ['Avenza Maps', 'Cartografía móvil', 'No', 'Suscripción Plus/Pro; enterprise', 'Plus/Pro: precios anuales por dispositivo (tabla oficial, moneda local)', '4.x (app)', '—', 'Alta (offline/terreno)', 'Android/iOS/Windows', 'Pro con geofences, soporte prioritario; precios varían por región/volumen'],
  ['Sentinel Hub EO Browser', 'Visualización EO', 'No', 'EO Browser gratis; APIs de pago (PUs/requests)', 'Gratis (EO Browser); planes comerciales: cotizar', 'Servicio continuo (web)', '—', 'Alta (satélites multi-misión)', 'Web', 'Procesamiento/descarga/timelapse; planes con PUs y cuotas'],
  ['Cesium ion', '3D Tiles/streaming 3D', 'No (CesiumJS sí OSS)', 'SaaS por plan', 'Gratis (Community) + Starter ~$15/mes; Plus ~$48/mes; Pro ~$199/mes', 'Servicio continuo (SaaS)', '—', 'Alta (3D web)', 'Web/API', 'Hosting y conversión a 3D Tiles; ecosistema open (CesiumJS)'],
  ['NASA WorldWind', 'SDK globo 3D', 'Sí (NASA/Apache)', 'Libre', 'Gratis', 'Java/.NET ramas activas', '—', 'Media-alta (SDK)', 'SDK (Java/JavaScript)', 'Motor para apps 3D; no es un SaaS'],
  ['Tableau', 'BI con mapas', 'No', 'Suscripción por rol (Creator/Explorer/Viewer)', 'Precios públicos por rol (ver sitio oficial)', 'Ramas 2024–2025', '—', 'Muy alta (BI empresarial)', 'Windows/macOS/Web', 'Mapas nativos, geocodificación, extensiones espaciales'],
  ['Microsoft Power BI', 'BI con mapas', 'No', 'Pro / Premium per user (PPU) / Capacidades', 'Pro $14/usuario/mes; PPU $24/usuario/mes (desde 2025-04-01)', 'Release mensual', '2015 (lanzamiento)', 'Muy alta (ecosistema MS)', 'Windows/Web', 'Fabric/Capacidades; actualización de precios comunicada por Microsoft']
];

let columnsOpenGis = [
  'Herramienta',
  'OSS / Gratis',
  '¿Dibuja fronteras en la app?',
  'Topología / validación',
  'Exporta (ej.)',
  'Offline / Self-host',
  'Notas clave'
];

let rowsOpenGis = [
  ['QGIS', 'OSS (GPL)', 'Sí: edición completa (snapping, reglas)', 'Sí: reglas/topología y validación', 'GeoJSON, GPKG, Shapefile, KML', 'Sí', 'Ideal para crear límites exclusivos con control de calidad'],
  ['GRASS GIS', 'OSS (GPL)', 'Sí (digitizer wxGUI)', 'Sí: modelo vectorial topológico', 'v.out.ogr → GeoJSON/GPKG/Shapefile', 'Sí', 'Topología nativa: una única frontera compartida entre polígonos'],
  ['gvSIG', 'OSS (GPL)', 'Sí (herramientas de edición)', 'Parcial: framework de topología', 'GeoJSON, Shapefile, GPKG', 'Sí', 'Buen editor de escritorio con extensiones'],
  ['uDig', 'OSS (EPL/LGPL)', 'Sí (creation/edit tools)', 'Básico', 'Shapefile/GeoPackage (vía GeoTools)', 'Sí', 'Cliente ligero; edición funcional para polígonos'],
  ['GeoDa', 'OSS (GPL)', 'No (enfoque análisis ESDA)', '—', 'Limitado (trabaja con datos ya creados)', 'Sí', 'Úsalo para análisis; crea/edita límites en QGIS/otros'],
  ['kepler.gl', 'OSS (MIT)', 'No (consume GeoJSON; filtros por polígono)', '—', 'Exporta GeoJSON/HTML', 'Sí (local) / Web', 'Excelente para visualizar y filtrar, no para digitalizar'],
  ['Google My Maps', 'Gratis (no OSS)', 'Sí (dibujar líneas/polígonos)', 'No', 'KML/KMZ', 'Web (online)', 'Rápido para mapeo ligero y compartición'],
  ['Google Earth Pro', 'Gratis (no OSS)', 'Sí (polígonos/mediciones)', 'No', 'KML/KMZ', 'Sí (escritorio)', 'Útil para delineación visual y captura rápida'],
  ['NASA WorldWind (SDK)', 'OSS (Apache/NASA)', 'Requiere código (UI propia)', 'Depende de tu implementación', 'Lo que programes', 'Sí (self-host)', 'Motor 3D para construir tu herramienta propia'],
  ['CesiumJS (librería)', 'OSS (Apache-2.0)', 'Requiere código o plugins', 'Depende de tu implementación', 'Lo que programes', 'Sí (self-host)', 'Excelente para 3D; editores de dibujo vía plugins'],
  ['Stack propio (Leaflet + PostGIS + QGIS Server)', 'OSS (todo)', 'Sí (si implementas editor o usas QGIS)', 'Sí (validas en BD/reglas)', 'GeoJSON/WFS/WMS/GPKG', 'Sí (100% control)', 'Control total, sin vendor lock-in; requiere equipo para mantener']
];
</script>

Las herramientas para visualización geoespacial se agrupan en varios `“sabores”` que cubren todo el flujo de trabajo: los GIS de escritorio (p. ej., QGIS, ArcGIS Pro, GRASS, SAGA, gvSIG, MapInfo, Global Mapper) ofrecen análisis profundo sobre datos vectoriales y ráster, manejo de proyecciones y geoprocesos (buffers, uniones espaciales, interpolación, análisis de redes, modelos de terreno); las plataformas web/cloud (ArcGIS Online, Mapbox Studio, CARTO, Kepler.gl, Cesium ion, Google My Maps) priorizan publicación y rendimiento con teselas vectoriales (MVT), servicios OGC (WMS/WFS/WMTS) e interactividad en el navegador; los entornos de observación de la Tierra (Google Earth Engine, Sentinel Hub EO Browser, NASA WorldWind) permiten trabajar con series temporales satelitales y derivados (NDVI, humedad del suelo) a escala continental; y las capas de `“storytelling”` y BI (ArcGIS StoryMaps, ArcGIS Dashboards, Tableau, Power BI) conectan mapas, gráficos y KPIs para audiencias no técnicas. En movilidad, QField y Avenza posibilitan captura de datos en campo (offline/online) y sincronización con el escritorio o la nube. Elegir bien depende del tipo de dato (vector vs. ráster), la necesidad de 2D/3D/tiempo real, el tamaño del dataset (GPU en navegador como Kepler.gl vs. cómputo en la nube como Earth Engine), la integración empresarial (p. ej., ArcGIS) y el ecosistema de complementos (QGIS tiene miles).

Para sacarles verdadero valor, decide según la tarea: análisis pesado y reproducible → GIS de escritorio con modelos/py scripts; escalabilidad y colaboración → plataformas cloud con catálogos y control de acceso; comunicación ejecutiva → dashboards/StoryMaps con indicadores bien definidos; trabajo de campo → apps móviles con formularios y geovallas. Aplica buenas prácticas: normaliza tasas por población/área (evita coropletas engañosas), alerta del MAUP/zonificación, muestra incertidumbre cuando proceda, elige paletas perceptualmente uniformes y accesibles, cuida proyecciones (no mezclar EPSG sin reproyectar), documenta metadatos y linaje, y usa servicios estándar para interoperar. En dominios como telecom (p. ej., enrutamiento de fibra, cobertura 4G/5G, line-of-sight con MDT/DEM, análisis de “drive tests”), combina modelado de terreno (Global Mapper, SAGA/GRASS), planificación/redes en GIS (QGIS/ArcGIS) y tableros web (ArcGIS Dashboards/Power BI) para cerrar el ciclo: capturar→analizar→publicar→decidir. Con esta brújula, elegirás la herramienta adecuada a los datos, la escala y el público, evitando mapas bonitos pero poco útiles.

---

<!-- Fila centrada, en una sola línea (con scroll horizontal si no cabe) -->
<div class="image-row">
  <FloatingImage 
    src="/images/posts/imgArcGisProBlog.png" alt="UCE"
    style="max-width: 220px"
    fit="cover"
    amplitude={8}
    duration={1000}
    hoverScale={1.03}
    shadow="0 0 0 20px var(--color--primary),
            0 200px 40px color-mix(in oklab, var(--color--primary) 90%, transparent)"
  />
  <FloatingImage 
    src="/images/posts/imgCesiumBlog.png" alt="UCE"
    style="max-width: 220px"
    fit="cover"
    amplitude={8}
    duration={1000}
    hoverScale={1.03}
    shadow="0 0 0 20px var(--color--primary),
            0 200px 40px color-mix(in oklab, var(--color--primary) 90%, transparent)"
  />
  <FloatingImage 
    src="/images/posts/imgMaptitudeBlog.png" alt="UCE"
    style="max-width: 220px"
    fit="cover"
    amplitude={8}
    duration={1000}
    hoverScale={1.03}
    shadow="0 0 0 20px var(--color--primary),
            0 200px 40px color-mix(in oklab, var(--color--primary) 90%, transparent)"
  />
</div>

---

<div class="table-wrap" style="--min-table-width: 1400px;">
  <TableChain {columns} {rows} accent="var(--color--primary)" headerBorder="#fff" />
</div>

Usar apps abiertas o gratuitas no te blinda del “abandono”: si baja la participación de mantenedores, aparecen riesgos prácticos—parches de seguridad tardíos, incompatibilidades con nuevos SO, APIs externas que cambian, deuda técnica y el clásico “bus factor” (pocos devs críticos). La literatura y casos reales muestran que el abandono o incidentes en dependencias puede tumbar cadenas completas (p. ej., el caso “left-pad” en npm) y que la sostenibilidad del código abierto exige respaldo institucional, gobernanza y planes de mantenimiento, no solo lanzamientos nuevos. Mitigar esto implica políticas de versiones congeladas/LTS, espejos y backups, criterios de salud del proyecto (actividad en repos, releases firmadas, número de mantenedores), y, cuando tu riesgo es alto, montar piezas core en tu propia infraestructura.

Dibujar tus propias fronteras (polígonos exclusivos como facultades) aporta control semántico y jurídico: delimitas exactamente lo que necesitas, con reglas topológicas para que no haya solapes, y dejas trazabilidad (metadatos) para auditoría. ¿Qué herramientas (abiertas/gratis) lo permiten? QGIS ofrece edición robusta con “snapping” y reglas topológicas; GRASS usa un modelo vectorial topológico (la frontera común se almacena una sola vez); gvSIG y uDig incluyen herramientas de edición; Google My Maps y Google Earth Pro permiten trazar polígonos de forma sencilla (útiles para trabajo ligero); kepler.gl no es un editor, pero consume GeoJSON (y tiene filtros por polígono para análisis visual); GeoDa es principalmente de análisis estadístico espacial, no un editor geométrico. Si buscas control total y continuidad, una vía es construir tu solución propia (Leaflet/CesiumJS en el front + PostGIS + QGIS Server/OGC en el back), que te deja auto-alojar y versionar tus límites para siempre.

<div class="table-wrap" style="--min-table-width: 1400px;">
<TableChain
  columns={columnsOpenGis}
  rows={rowsOpenGis}
  accent="var(--color--primary)"
  headerBorder="#fff"
/>
</div>

Primero, “open source ≠ riesgo cero” pero sí te da palancas de control que no existen en SaaS: si un proyecto pierde tracción, puedes inmovilizar una versión LTS, espejar repos, compilar binarios firmados, y mantener parches críticos tú mismo o vía soporte comercial (p. ej., empresas que dan soporte a QGIS/GRASS). Lo realmente nuevo a vigilar no es solo la actividad en GitHub, sino la salud del ecosistema: cuántos mantenedores activos hay, si pertenece a una fundación (OSGeo), si publica hojas de ruta, si firma releases (supply-chain), y si ofrece formatos estándar (OGC API, MVT, 3D Tiles, COG, STAC). Con eso, la decisión “herramienta abierta vs. cerrada” deja de ser ideológica y se vuelve una gestión de riesgo cuantificable (qué pasa si mañana cambia el pricing o desaparece el servicio, cuánto me cuesta migrar, qué exportaciones tengo).

Segundo, dibujar fronteras propias (facultades, campus, áreas de servicio) aporta poder semántico y jurídico, pero exige gobernanza: usa topología estricta (sin solapes/lagunas), versionado temporal (valid_from/valid_to) para evitar “boundary drift” cuando compares series históricas, y metadatos de procedencia (quién, cuándo, con qué criterio). Define una norma interna de color y simbología (“maps-as-code”: estilos versionados), pruebas automáticas de geometría en CI (área mínima/máxima, cierre de anillos, tolerancias), y una API autoritativa de límites (WFS/OGC API Features o tiles vectoriales) para que todas las apps consuman el mismo canon. Esto evita inconsistencias entre BI, web y móvil y reduce riesgos de auditoría. Si necesitas fronteras exclusivas que un SaaS no modela (p. ej., subfacultades), la ruta autoservicio con QGIS/GRASS + PostGIS te garantiza expresividad total y persistencia en el tiempo.

Tercero, el benchmark estratégico no es “qué app tiene más botones” sino quién controla el plano de datos. Un patrón ganador es híbrido: datos y límites bajo tu control (PostGIS + QGIS/GRASS para edición/QA, servidores propios OGC/MVT para publicar) y, si conviene, usar visores o CDNs externos como capa de distribución intercambiable. Define KPIs de sostenibilidad (tiempo de actualización de un límite, cobertura de tests topológicos, MTTR ante vulnerabilidades, portabilidad: ¿puedo exportar todo a GeoPackage/GeoJSON hoy?). Si esos KPIs son verdes, tu stack abierto es “para siempre” en la práctica; si no, cualquier suite—abierta o cerrada—te ata por caminos menos visibles (formatos opacos, deuda operativa o dependencia de terceros). En corto: controla el dato, el esquema y los estilos; el visor es reemplazable, tu cartografía autoritativa no.

<style>
  /* Contenedor de la fila */
  .image-row {
    /* Si usas --color--secundary, cámbialo aquí si lo necesitas */
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 24px;
    padding: 8px 6px;

    /* Mantener TODO en una fila incluso en móviles:
       si no entra, permite scroll horizontal suave */
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scroll-snap-type: x proximity;
  }

  /* Que cada ítem se comporte como “bloque” fijo (no se estire) */
  .image-row > * {
    flex: 0 0 auto;
    scroll-snap-align: center;
  }

  /* Opcional: tamaño responsive consistente sin tocar cada style inline
     (si quieres usarlo, cambia max-width: var(--img-size) en los 3 FloatingImage) */
  /* 
  .image-row {
    --img-size: clamp(160px, 22vw, 220px);
  }
  */
  /* Contenedor scrolleable y centrado */

/* Contenedor scrolleable y centrado */
  .table-wrap{
    overflow-x:auto;
    -webkit-overflow-scrolling:touch;
    max-width:100%;
    margin:0 auto;
    padding-bottom:10px;
    /* sombras en bordes para insinuar que hay más contenido */
    mask-image:linear-gradient(to right, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%);
  }

  /* Fuerza ancho mínimo en la tabla interna para que aparezca scroll horizontal.
     Si tu TableChain usa la clase .glow-table (como en mis ejemplos),
     esta regla la toma. Si no, la segunda línea alcanza a cualquier <table>. */
  .table-wrap :global(.glow-table),
  .table-wrap :global(table){
    width:max(100%, var(--min-table-width, 1100px));
    table-layout:auto; /* usa 'fixed' si quieres truncar y equilibrar anchos */
  }

  /* Header pegajoso (se queda visible al scrollear) */
  .table-wrap :global(thead th){
    position:sticky;
    top:0;
    z-index:3;
    /* Asegura fondo para que no “veas” las filas detrás */
    background: var(--color--post-page-background, #111);
    /* opcional: blur bonito */
    backdrop-filter: blur(4px);
  }

  /* Primera columna fija (útil con muchas columnas) */
  .table-wrap :global(th:first-child),
  .table-wrap :global(td:first-child){
    position:sticky;
    left:0;
    z-index:2;
    background: var(--color--post-page-background, #111); /* sólido para tapar debajo */
  }

  /* Hint visual en pantallas pequeñas */
  @media (max-width: 900px){
    .table-wrap{ padding-bottom:14px; }
  }

</style>
