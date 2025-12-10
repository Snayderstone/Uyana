/**
 * Project Service
 * ---------------
 * Orquesta datos provenientes de múltiples repositorios
 * para construir modelos listos para mapas y análisis.
 *
 * IMPORTANTE:
 *  - NO consulta directamente a Supabase.
 *  - SOLO usa repositorios (ProjectsRepository).
 *  - Aquí sí podemos combinar datos y transformarlos.
 *
 * NOTA:
 *  - Este servicio ya NO construye GeoJSON.
 *    Solo devuelve arreglos de ProjectMapModel.
 *  - El GeoJSON ahora se construye en el frontend
 *    (por ejemplo, en ProjectsChoropleth.svelte).
 */

// src/lib/services/project.service.ts

import { ProjectsRepository } from '$lib/db/projects.repository';
import type { MapLevel, ProjectMapModel } from '$lib/models/map.model';

export const ProjectService = {
  /**
   * Mapa de proyectos por INSTITUCIÓN
   * ---------------------------------
   * Usa:
   *  - instituciones (id, nombre, geometry)
   *  - proyecto_institucion (conteo de proyectos por institucion_id)
   *
   * Devuelve un arreglo de ProjectMapModel:
   *  [
   *    {
   *      id: number,           // id de la institución
   *      titulo: string,       // nombre de la institución
   *      geometry: any,        // geometry tal como viene de la BD (jsonb)
   *      projectCount: number, // cantidad de proyectos asociados
   *      level: 'institution'
   *    },
   *    ...
   *  ]
   *
   * NOTA:
   *  - Aquí NO filtramos geometrías nulas.
   *    Si en el frontend no quieres dibujar puntos/áreas sin geometry,
   *    allí puedes hacer .filter(row => !!row.geometry).
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
    const result: ProjectMapModel[] = (institutions ?? []).map((inst: any) => ({
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
   * ------------------------------
   * Delegamos directo al repositorio, que ya devuelve
   * ProjectMapModel[] con:
   *  - id
   *  - titulo (nombre de la facultad)
   *  - geometry (de la tabla facultades)
   *  - projectCount
   *  - level: 'faculty'
   */
  async getProjectsByFacultyForMap(): Promise<ProjectMapModel[]> {
    return ProjectsRepository.getProjectCountByFacultyForMap();
  },

  /**
   * getProjectsForMap
   * -----------------
   * Función genérica para obtener datos de proyectos para mapa.
   *
   * Parámetro:
   *  - level: 'institution' | 'faculty'
   *
   * Uso típico desde el frontend:
   *  const filas = await ProjectService.getProjectsForMap(level);
   *  // luego en el componente construyes el GeoJSON
   */
  async getProjectsForMap(level: MapLevel): Promise<ProjectMapModel[]> {
    if (level === 'institution') {
      return this.getProjectsByInstitutionForMap();
    }

    // Por defecto, usamos facultad
    return this.getProjectsByFacultyForMap();
  }
};
