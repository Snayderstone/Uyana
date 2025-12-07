/**
 * Project Service
 * ---------------
 * Se encarga de orquestar datos provenientes de múltiples repositorios
 * para construir un ProjectModel completamente armado.
 *
 * NO consulta directamente a Supabase.
 * SOLO usa repositorios.
 */

import { ProjectsRepository } from '$lib/db/projects.repository';
import type { ProjectMapModel } from '$lib/models/map.model';

export const ProjectService = {

  /**
   * Retorna un arreglo de instituciones con:
   *  - su geometría
   *  - el total de proyectos asociados
   *
   * Formato final (ProjectMapModel):
   * [
   *   {
   *     id: 415,
   *     titulo: "Universidad Nacional",
   *     geometry: {...},
   *     projectCount: 8
   *   }
   * ]
   */
  async getProjectsForMap(): Promise<ProjectMapModel[]> {

    // 1. Obtener instituciones
    const institutions = await ProjectsRepository.getAllInstitutions();

    // 2. Obtener conteos de proyectos agrupados
    const counts = await ProjectsRepository.getProjectCountByInstitution();

    // Convertir a mapa para acceso rápido
    const countMap = new Map<number, number>();
    counts.forEach(item => {
      countMap.set(item.institucion_id, item.count);
    });

    // 3. Construir modelo para el mapa
    const result: ProjectMapModel[] = institutions.map(inst => ({
      id: inst.id,
      titulo: inst.nombre,
      geometry: inst.geometry,
      projectCount: countMap.get(inst.id) || 0
    }));

    return result;
  },

};
