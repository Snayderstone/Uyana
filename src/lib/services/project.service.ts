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
import type { ProjectFilters } from '$lib/models/filters.model';
import { ProjectDatasource } from '$lib/db/project.datasource';

// =========================
// 🔹 Helpers para filtros
// =========================

/** Devuelve true si NO hay ningún filtro activo */
function isEmptyFilters(filters?: ProjectFilters): boolean {
  if (!filters) return true;

  return (
    !filters.institutionId &&
    !filters.facultyId &&
    !filters.areaId &&
    !filters.lineId &&
    !filters.typeId &&
    !filters.stateId
  );
}

/**
 * 🔹 Devuelve el conjunto de IDs de proyectos que cumplen los filtros.
 *    - Si no hay filtros activos → devuelve null (equivale a "no filtrar").
 *
 *    OJO:
 *    - Aquí usamos solo tablas normalizadas:
 *      proyectos, proyecto_institucion, proyecto_area_conocimiento,
 *      proyecto_linea_investigacion, proyecto_tipo, proyecto_fuente_financiamiento,
 *      facultades → carreras → participantes → proyecto_participante
 */
async function getFilteredProjectIds(
  filters?: ProjectFilters
): Promise<Set<number> | null> {
  if (isEmptyFilters(filters)) return null;

  // 1) Empezamos con TODOS los proyectos (tabla proyectos)
  const allProjects = await ProjectDatasource.getAllProjects();
  let currentIds = new Set<number>(allProjects.map((p: any) => p.id as number));

  // 2) Filtro por estado (columna estado_id en proyectos)
  if (filters?.stateId) {
    const idsEstado = new Set<number>(
      allProjects
        .filter((p: any) => p.estado_id === filters.stateId)
        .map((p: any) => p.id as number)
    );

    currentIds = new Set([...currentIds].filter((id) => idsEstado.has(id)));
  }

  // 3) Filtro por institución (tabla proyecto_institucion)
  if (filters?.institutionId) {
    const rels = await ProjectDatasource.getProjectInstitutions();
    const idsInstitucion = new Set<number>(
      rels
        .filter((r: any) => r.institucion_id === filters.institutionId)
        .map((r: any) => r.proyecto_id as number)
    );

    currentIds = new Set([...currentIds].filter((id) => idsInstitucion.has(id)));
  }

  // 4) Filtro por facultad (facultades → carreras → participantes → proyecto_participante)
  if (filters?.facultyId) {
    const faculties = await ProjectDatasource.getFacultiesFull();
    const idsFacultad = new Set<number>();

    for (const fac of faculties ?? []) {
      if (fac.id !== filters.facultyId) continue;

      const carreras = fac.carreras ?? [];
      for (const carrera of carreras) {
        const participantes = carrera.participantes ?? [];
        for (const part of participantes) {
          const proyParts = part.proyecto_participante ?? [];
          for (const rel of proyParts) {
            if (rel.proyecto_id != null) {
              idsFacultad.add(rel.proyecto_id as number);
            }
          }
        }
      }
    }

    currentIds = new Set([...currentIds].filter((id) => idsFacultad.has(id)));
  }

  // 5) Filtro por área de conocimiento
  if (filters?.areaId) {
    const rels = await ProjectDatasource.getProjectAreas();
    const idsArea = new Set<number>(
      rels
        .filter((r: any) => r.area_conocimiento_id === filters.areaId)
        .map((r: any) => r.proyecto_id as number)
    );

    currentIds = new Set([...currentIds].filter((id) => idsArea.has(id)));
  }

  // 6) Filtro por línea de investigación
  if (filters?.lineId) {
    const rels = await ProjectDatasource.getProjectLines();
    const idsLinea = new Set<number>(
      rels
        .filter((r: any) => r.linea_investigacion_id === filters.lineId)
        .map((r: any) => r.proyecto_id as number)
    );

    currentIds = new Set([...currentIds].filter((id) => idsLinea.has(id)));
  }

  // 7) Filtro por tipo de proyecto
  if (filters?.typeId) {
    const rels = await ProjectDatasource.getProjectTypes();
    const idsTipo = new Set<number>(
      rels
        .filter((r: any) => r.tipo_id === filters.typeId)
        .map((r: any) => r.proyecto_id as number)
    );

    currentIds = new Set([...currentIds].filter((id) => idsTipo.has(id)));
  }

  // 👉 Aquí podrías añadir más filtros en el futuro (financiamiento, etc.)

  return currentIds;
}
// =========================
export const ProjectService = {
  /**
 * Mapa de proyectos por INSTITUCIÓN (con soporte de filtros)
 */
  async getProjectsByInstitutionForMap(
    filters?: ProjectFilters
  ): Promise<ProjectMapModel[]> {
    // 1. Instituciones con geometry
    const institutions = await ProjectsRepository.getAllInstitutions();
    const countMap = new Map<number, number>();

    if (isEmptyFilters(filters)) {
      // 🔹 Caso sin filtros → usamos el agregador rápido existente
      const counts = await ProjectsRepository.getProjectCountByInstitution();

      counts.forEach((item: any) => {
        countMap.set(item.institucion_id, item.count);
      });
    } else {
      // 🔹 Caso con filtros → contamos solo proyectos permitidos
      const allowedIds = await getFilteredProjectIds(filters);
      const pairs = await ProjectsRepository.getProjectInstitutionPairs();

      pairs.forEach((row: any) => {
        const projectId = row.proyecto_id as number;
        const instId = row.institucion_id as number;

        if (allowedIds && !allowedIds.has(projectId)) return;

        countMap.set(instId, (countMap.get(instId) || 0) + 1);
      });
    }

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
 * Mapa de proyectos por FACULTAD (con soporte de filtros)
 */
  async getProjectsByFacultyForMap(
    filters?: ProjectFilters
  ): Promise<ProjectMapModel[]> {
    // Sin filtros → usamos el método actual del repositorio
    if (isEmptyFilters(filters)) {
      return ProjectsRepository.getProjectCountByFacultyForMap();
    }

    // Con filtros → usamos el mapeo facultad → proyectos
    const allowedIds = await getFilteredProjectIds(filters);
    const rows = await ProjectsRepository.getProjectIdsByFaculty();

    const result: ProjectMapModel[] = rows.map((row: any) => {
      const projectIds: number[] = row.projectIds ?? [];
      const filteredCount = allowedIds
        ? projectIds.filter((id) => allowedIds.has(id)).length
        : projectIds.length;

      return {
        id: row.facultadId,
        titulo: row.facultadNombre,
        geometry: row.geometry ?? null,
        projectCount: filteredCount,
        level: 'faculty' as const
      };
    });

    return result;
  },

  /**
   * getProjectsForMap
   * -----------------
 * -----------------
 * Versión genérica con filtros opcionales.
 *
 *  - level: 'institution' | 'faculty'
 *  - filters: ProjectFilters (todos opcionales)
 *
 * Si NO pasas filters → se comporta igual que antes.
 */
  async getProjectsForMap(
    level: MapLevel,
    filters?: ProjectFilters
  ): Promise<ProjectMapModel[]> {
    if (level === 'institution') {
      return this.getProjectsByInstitutionForMap(filters);
    }

    // Por defecto, usamos facultad
    return this.getProjectsByFacultyForMap(filters);
  }

};
