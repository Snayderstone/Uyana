import type { Feature } from "$lib/utils/types";

export default [ 
  {
    name: 'Mapa Interactivo',
    description:
      'Los mapas interactivos permiten a los usuarios explorar datos geoespaciales de manera visual e intuitiva.',
    image: 'images/features/interactive_map.gif',
    tags: [{ label: 'Powered by Leaflet' }]
  }, 
  {
    name: 'Dashbboards',
    description:
      'Los dashboards proporcionan una vista consolidada de métricas clave y datos importantes para la toma de decisiones.',
    image: 'images/features/interactive_dashboard.gif',
    tags: [{ label: 'Primary Color' }, { label: 'Secondary Color', color: 'secondary' }]
  }, 
  {
    name: 'Investigaciones',
    description:
      'Sección dedicada a la presentación y análisis de investigaciones realizadas en diversas áreas del conocimiento.',
    image: 'images/features/interactive_investigadores.gif',
  }, 
  {
    name: 'Revista de la Dirección de Investigación',
    description:
      'Esta revista presenta investigaciones y estudios realizados por la Dirección de Investigación, abarcando diversas áreas del conocimiento.',
    image: 'images/features/interactive_revista.gif',
    tags: [{ label: 'Revista' }]
  }, 
  {
    name: 'Blog',
    description:
      'El blog ofrece artículos, noticias y actualizaciones sobre temas relevantes, proporcionando una plataforma para compartir conocimientos y experiencias.',
    image: 'images/features/interactive_blog.gif',
  },
  {
    name: 'Chat',
    description:
      'El chat permite solventar dudas del usuario sobre los datos presentados en el mapa interactivo y otras secciones de la plataforma.',
    image: 'images/features/interactive_chat.gif',
    tags: [{ label: 'AI Powered' }]
  },
] as Feature[];