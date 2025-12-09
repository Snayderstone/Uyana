/**
 * Project Service
 * ---------------
 * Se encarga de orquestar datos provenientes de múltiples repositorios
 * para construir modelos listos para mapas y análisis.
 *
 * IMPORTANTE:
 *  - NO consulta directamente a Supabase.
 *  - SOLO usa repositorios (ProjectsRepository).
 *  - Aquí sí podemos combinar datos y transformarlos.
 */

// src/lib/services/project.service.ts

import { ProjectsRepository } from '$lib/db/projects.repository';
import type { MapLevel, ProjectMapModel } from '$lib/models/map.model';

/**
 * Utilidad interna:
 * Normaliza el nombre de facultad para que coincida
 * con el formato usado en el GeoJSON y en el mapa.
 *
 * IMPORTANTE:
 *  - Debe estar en sincronía con la función homónima
 *    que tienes en `ProjectsChoropleth.svelte`.
 */
function normalizarNombreFacultad(nombre: string): string {
  if (!nombre) return 'No especificada';

  let s = nombre.trim().toLowerCase();

  // Quitamos prefijos "facultad de" o "facultad"
  s = s.replace(/^facultad\s+de\s+/, '');
  s = s.replace(/^facultad\s+/, '');

  // Normalizamos espacios
  s = s.replace(/\s+/g, ' ');

  // Capitalizamos cada palabra ("ciencias agrícolas" → "Ciencias Agrícolas")
  const title = s
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  // Formato final:
  // "Facultad De Ciencias Agrícolas"
  return `Facultad De ${title}`;
}
/**
 * Normaliza una geometry que viene desde la BD (jsonb)
 * a un objeto GeoJSON válido para Leaflet:
 *  - { type: 'Polygon' | 'MultiPolygon', coordinates: [...] }
 *  - Si viene envuelta como Feature o FeatureCollection, la desempaqueta.
 *  - Si no se puede usar, devuelve null.
 */
function normalizeGeometry(raw: any): any | null {
  if (!raw) return null;

  // Caso 1: ya es geometry válida
  if (raw.type && Array.isArray(raw.coordinates)) {
    return raw;
  }

  // Caso 2: viene como Feature
  if (raw.type === 'Feature' && raw.geometry) {
    if (raw.geometry.type && Array.isArray(raw.geometry.coordinates)) {
      return raw.geometry;
    }
  }

  // Caso 3: viene como FeatureCollection, tomamos la primera geometry válida
  if (raw.type === 'FeatureCollection' && Array.isArray(raw.features)) {
    const firstWithGeom = raw.features.find(
      (f: any) => f?.geometry?.type && Array.isArray(f.geometry.coordinates)
    );
    if (firstWithGeom) {
      return firstWithGeom.geometry;
    }
  }

  // Cualquier otro caso → no lo usamos
  return null;
}

export const ProjectService = {
  /**
   * Mapa de proyectos por INSTITUCIÓN
   * Usa:
   *  - instituciones (id, nombre, geometry)
   *  - proyecto_institucion (conteo de proyectos por institucion_id)
   */
  async getProjectsByInstitutionForMap(): Promise<ProjectMapModel[]> {
    // 1. Instituciones con geometry
    const institutions = await ProjectsRepository.getAllInstitutions();

    // 2. Conteos de proyectos por institución
    const counts = await ProjectsRepository.getProjectCountByInstitution();
    const countMap = new Map<number, number>();
    counts.forEach((item: any) => {
      countMap.set(item.institucion_id, item.count);
    });

    // 3. Construimos el modelo unificado para el mapa
    const result: ProjectMapModel[] = institutions.map((inst: any) => ({
      id: inst.id,
      titulo: inst.nombre,
      geometry: inst.geometry,
      projectCount: countMap.get(inst.id) || 0,
      level: 'institution'
    }));

    return result;
  },

  /**
   * Mapa de proyectos por FACULTAD
   * Delegamos directo al repositorio que ya construye ProjectMapModel.
   */
  async getProjectsByFacultyForMap(): Promise<ProjectMapModel[]> {
    return ProjectsRepository.getProjectCountByFacultyForMap();
  },

  /**
   * Función genérica para obtener datos de proyectos para mapa.
   *
   *  - level: 'institution' | 'faculty'
   *
   * Esto es lo que usas desde componentes Svelte cuando solo
   * necesitas la lista de entidades + conteo (no el GeoJSON).
   */
  async getProjectsForMap(level: MapLevel): Promise<ProjectMapModel[]> {
    if (level === 'institution') {
      return this.getProjectsByInstitutionForMap();
    }

    // Por defecto, usamos facultad
    return this.getProjectsByFacultyForMap();
  },

  /**
   * NUEVO:
   * Construye un GeoJSON listo para Leaflet para el nivel "facultad".
   *
   * Usa:
   *  - ProjectsRepository.getProjectCountByFacultyForMap()
   *
   * Devuelve:
   *  {
   *    type: 'FeatureCollection',
   *    features: [
   *      {
   *        type: 'Feature',
   *        geometry: { ... },
   *        properties: {
   *          id: number,
   *          nombre_original: string,
   *          facultad: string, // normalizado
   *          facultad_o_entidad_o_area_responsable: string, // normalizado (clave que usa el mapa)
   *          projectCount: number,
   *          level: 'faculty'
   *        }
   *      },
   *      ...
   *    ]
   *  }
   */
    async getProjectsByFacultyGeoJsonForMap(): Promise<any> {
    const rows = await ProjectsRepository.getProjectCountByFacultyForMap();

    const features = (rows ?? [])
      .map((row) => {
        const geom = normalizeGeometry(row.geometry);
        if (!geom) {
          // Ignoramos filas sin geometry válida
          return null;
        }

        const nombreOriginal = row.titulo ?? 'Sin nombre';
        const nombreNormalizado = normalizarNombreFacultad(nombreOriginal);

        return {
          type: 'Feature',
          geometry: geom,
          properties: {
            id: row.id,
            nombre_original: nombreOriginal,
            facultad: nombreNormalizado,
            facultad_o_entidad_o_area_responsable: nombreNormalizado,
            projectCount: row.projectCount ?? 0,
            level: row.level ?? 'faculty'
          }
        };
      })
      .filter((f): f is { type: 'Feature'; geometry: any; properties: any } => f !== null);

    return {
      type: 'FeatureCollection',
      features
    };
  },
    /**
   * GeoJSON para mapa por INSTITUCIÓN
   */
  async getProjectsByInstitutionGeoJsonForMap(): Promise<any> {
    // Reutilizamos los métodos del repositorio que ya tienes
    const institutions = await ProjectsRepository.getAllInstitutions();
    const counts = await ProjectsRepository.getProjectCountByInstitution();

    const countMap = new Map<number, number>();
    counts.forEach((item: any) => {
      countMap.set(item.institucion_id, item.count);
    });

    const features = (institutions ?? [])
      .map((inst: any) => {
        const geom = normalizeGeometry(inst.geometry);
        if (!geom) {
          // Nada de geometrías null o inválidas
          return null;
        }

        const nombre = inst.nombre ?? 'Sin nombre';

        return {
          type: 'Feature',
          geometry: geom,
          properties: {
            id: inst.id,
            nombre_original: nombre,
            facultad_o_entidad_o_area_responsable: nombre, // para que GeoJsonChoropleth lo use igual
            projectCount: countMap.get(inst.id) ?? 0,
            level: 'institution'
          }
        };
      })
      .filter((f): f is { type: 'Feature'; geometry: any; properties: any } => f !== null);

    return {
      type: 'FeatureCollection',
      features
    };
  }

};
