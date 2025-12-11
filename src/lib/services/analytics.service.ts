/**
 * Analytics Service
 * -----------------
 * Servicio para generar estadísticas globales, comparativas, tendencias, etc.
 *
 * Archivo: src/lib/services/analytics.service.ts
 */

import { RelacionesSQLRepository } from '$lib/db/relations.repository';
import { ProjectsRepository } from '$lib/db/projects.repository';

// Tipo de retorno para las estadísticas globales.
// Está inspirado en tu antigua `obtenerEstadisticasGenerales`,
// pero ampliado con más info útil para dashboards.
export interface GlobalStats {
  totalProyectos: number;
  proyectosActivos: number;
  proyectosCerrados: number;
  investigadoresAcreditados: number;

  // Nuevos campos para dashboards más ricos
  proyectosPorEstado: { estado: string; cantidad: number }[];
  proyectosPorTipo: { tipo: string; cantidad: number }[];

  // Mantiene la idea de "tipo principal" (top 1 por cantidad)
  proyectosPorTipoPrincipal: { tipo: string; cantidad: number } | null;
}

// =========================================================
// 🔹 HELPERS INTERNOS (no exportados)
// =========================================================

/**
 * Agrupa proyectos por estado (usando p.estado?.nombre).
 */
function buildEstadoCounts(projects: any[]): { estado: string; cantidad: number }[] {
  const counts: Record<string, number> = {};

  projects.forEach((p: any) => {
    const nombreEstado: string = p.estado?.nombre ?? 'Sin estado';
    counts[nombreEstado] = (counts[nombreEstado] || 0) + 1;
  });

  return Object.entries(counts).map(([estado, cantidad]) => ({ estado, cantidad }));
}

/**
 * Agrupa relaciones proyecto_tipo por nombre de tipo.
 */
function buildTipoCounts(projectTypes: any[]): { tipo: string; cantidad: number }[] {
  const tipoCount: Record<string, number> = {};

  projectTypes.forEach((row: any) => {
    const nombreTipo: string = row.tipos?.nombre ?? 'Sin tipo';
    tipoCount[nombreTipo] = (tipoCount[nombreTipo] || 0) + 1;
  });

  return Object.entries(tipoCount)
    .map(([tipo, cantidad]) => ({ tipo, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad);
}

// =========================================================
// 🔹 SERVICIO PRINCIPAL
// =========================================================

export const AnalyticsService = {
  /**
   * Estadísticas globales a partir de la BD normalizada:
   *  - proyectos por estado
   *  - proyectos activos/cerrados
   *  - proyectos por tipo
   *  - proyectos con al menos un participante acreditado
   */
  async getGlobalStats(): Promise<GlobalStats> {
    // 1) Traemos TODO lo que necesitamos en paralelo
    const [projects, projectTypes, projectParticipants] = await Promise.all([
      RelacionesSQLRepository.getAllProjectsWithEstado(),
      RelacionesSQLRepository.getProjectTypesWithNames(),
      RelacionesSQLRepository.getProjectParticipantsWithAcreditado()
    ]);

    // A) Conteo básico de proyectos
    const totalProyectos = projects.length;

    // B) Proyectos por estado
    const proyectosPorEstado = buildEstadoCounts(projects);

    // C) Proyectos activos / cerrados (basado en el nombre del estado)
    const ESTADOS_ACTIVOS = new Set(['En ejecución', 'En cierre', 'En proceso']);
    const ESTADOS_CERRADOS = new Set(['Cerrado', 'Finalizado']);

    let proyectosActivos = 0;
    let proyectosCerrados = 0;

    projects.forEach((p: any) => {
      const nombreEstado: string = p.estado?.nombre ?? '';

      if (ESTADOS_ACTIVOS.has(nombreEstado)) {
        proyectosActivos++;
      } else if (ESTADOS_CERRADOS.has(nombreEstado)) {
        proyectosCerrados++;
      }
    });

    // D) Proyectos por tipo (usando proyecto_tipo + tipos)
    const proyectosPorTipo = buildTipoCounts(projectTypes);
    const proyectosPorTipoPrincipal =
      proyectosPorTipo.length > 0 ? proyectosPorTipo[0] : { tipo: 'No hay datos', cantidad: 0 };

    // E) Proyectos con al menos 1 participante acreditado
    const proyectosConAcreditados = new Set<number>();

    projectParticipants.forEach((row: any) => {
      if (row.acreditado === true) {
        proyectosConAcreditados.add(row.proyecto_id);
      }
    });

    const investigadoresAcreditados = proyectosConAcreditados.size;

    // Resultado final
    return {
      totalProyectos,
      proyectosActivos,
      proyectosCerrados,
      investigadoresAcreditados,
      proyectosPorEstado,
      proyectosPorTipo,
      proyectosPorTipoPrincipal
    };
  },

  /**
   * Proyectos agrupados por estado.
   *
   * Usa la BD normalizada:
   *  - proyectos + join a estado (a través de RelacionesSQLRepository)
   */
  async getProjectsByState(): Promise<{ estado: string; cantidad: number }[]> {
    const projects = await RelacionesSQLRepository.getAllProjectsWithEstado();

    if (!projects.length) return [];

    return buildEstadoCounts(projects);
  },

  /**
   * Proyectos agrupados por tipo de proyecto.
   *
   * Usa la relación:
   *  - proyecto_tipo
   *  - tipos (catálogo, campo `nombre`)
   */
  async getProjectsByType(): Promise<{ tipo: string; cantidad: number }[]> {
    const projectTypes = await RelacionesSQLRepository.getProjectTypesWithNames();

    if (!projectTypes.length) return [];

    return buildTipoCounts(projectTypes);
  },

  /**
   * Proyectos agrupados por facultad (BD normalizada).
   *
   * Usa la relación:
   *  facultades → carreras → participantes → proyecto_participante
   * a través de `ProjectsRepository.getProjectCountByFacultyForMap()`.
   */
  async getProjectsByFaculty(): Promise<{ facultad: string; cantidad: number }[]> {
    const facultiesForMap = await ProjectsRepository.getProjectCountByFacultyForMap();

    if (!facultiesForMap.length) {
      return [];
    }

    return facultiesForMap
      .map((fac) => ({
        facultad: fac.titulo,      // usamos el nombre que ya viene del mapa
        cantidad: fac.projectCount // número de proyectos únicos por facultad
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  },

  /**
   * Proyectos agrupados por facultad (overview simple).
   *
   * Usa la BD normalizada:
   *  - facultades → carreras → participantes → proyecto_participante
   *
   * ⚠️ Se mantiene separado de getProjectsByFaculty()
   *    por compatibilidad con código existente.
   */
  async getProjectsByFacultyOverview(): Promise<{ facultad: string; cantidad: number }[]> {
    const facultyProjects = await ProjectsRepository.getProjectIdsByFaculty();

    if (!facultyProjects.length) {
      return [];
    }

    return facultyProjects
      .map((fac) => ({
        facultad: fac.facultadNombre,
        cantidad: fac.projectIds.length
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  },

  // TODO: estadísticas por institución (placeholder)
  async getInstitutionStats() {
    console.warn('AnalyticsService.getInstitutionStats() aún no está implementado');
    return null;
  },

  /**
   * Estadísticas por facultad (versión normalizada)
   *
   * Devuelve:
   *  {
   *    totalProyectos: number;      // total global en la BD
   *    cantidadFacultad: number;    // proyectos asociados a esa facultad
   *    estados: {
   *      ejecucion: number;
   *      cierre: number;
   *      cerrados: number;
   *    }
   *  }
   */
  async getFacultyStats(nombreFacultad: string): Promise<{
    totalProyectos: number;
    cantidadFacultad: number;
    estados: {
      ejecucion: number;
      cierre: number;
      cerrados: number;
    };
  }> {
    // 1) Mapeo facultad → projectIds (ya deduplicados)
    const facultyProjects = await ProjectsRepository.getProjectIdsByFaculty();

    const facEntry = facultyProjects.find(
      (f) => f.facultadNombre.toLowerCase() === nombreFacultad.toLowerCase()
    );

    // 2) Traemos todos los proyectos con su estado (JOIN a tabla estado)
    const allProjects = await RelacionesSQLRepository.getAllProjectsWithEstado();
    const totalProyectos = allProjects.length;

    // Si no encontramos esa facultad, devolvemos ceros pero con el total global
    if (!facEntry) {
      return {
        totalProyectos,
        cantidadFacultad: 0,
        estados: {
          ejecucion: 0,
          cierre: 0,
          cerrados: 0
        }
      };
    }

    const projectsIdsSet = new Set<number>(facEntry.projectIds);

    // 3) Filtramos solo proyectos asociados a esa facultad
    const proyectosFacultad = allProjects.filter((p: any) =>
      projectsIdsSet.has(p.id as number)
    );

    const estados = {
      ejecucion: 0,
      cierre: 0,
      cerrados: 0
    };

    proyectosFacultad.forEach((p: any) => {
      const nombreEstado: string = p.estado?.nombre ?? '';

      if (nombreEstado === 'En ejecución') {
        estados.ejecucion++;
      } else if (nombreEstado === 'En cierre') {
        estados.cierre++;
      } else if (nombreEstado === 'Cerrado' || nombreEstado === 'Finalizado') {
        estados.cerrados++;
      }
    });

    return {
      totalProyectos,
      cantidadFacultad: proyectosFacultad.length,
      estados
    };
  },

  /** Proyectos agrupados por área de conocimiento */
  async getProjectsByArea(): Promise<{ area: string; cantidad: number }[]> {
    const projectAreas = await RelacionesSQLRepository.getProjectAreasWithNames();
    if (!projectAreas.length) return [];

    const areaCount: Record<string, number> = {};
    projectAreas.forEach((row: any) => {
      const nombreArea: string = row.area?.nombre ?? 'Sin área';
      areaCount[nombreArea] = (areaCount[nombreArea] || 0) + 1;
    });

    return Object.entries(areaCount)
      .map(([area, cantidad]) => ({ area, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  },

  /** Proyectos agrupados por fuente de financiamiento */
  async getProjectsByFundingSource(): Promise<{ fuente: string; cantidad: number }[]> {
    const fundingRows = await RelacionesSQLRepository.getProjectFundingWithNames();
    if (!fundingRows.length) return [];

    const fuenteCount: Record<string, number> = {};
    fundingRows.forEach((row: any) => {
      const nombreFuente: string = row.fuente?.nombre ?? 'Sin fuente';
      fuenteCount[nombreFuente] = (fuenteCount[nombreFuente] || 0) + 1;
    });

    return Object.entries(fuenteCount)
      .map(([fuente, cantidad]) => ({ fuente, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }
};
