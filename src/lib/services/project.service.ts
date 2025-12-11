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
import type { ProyectoFlat } from '$lib/models/project.model';
import { RelacionesSQLRepository } from '$lib/db/relations.repository';

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
/** 🔹 Helper interno: decide si un cargo indica rol de líder del proyecto */
function esRolLider(cargoNombre?: string | null): boolean {
  if (!cargoNombre) return false;
  const texto = cargoNombre.toLowerCase();

  return (
    texto.includes('director') ||
    texto.includes('directora') ||
    texto.includes('coordinador') ||
    texto.includes('coordinadora') ||
    texto.includes('investigador principal') ||
    texto.includes('responsable')
  );
}
// =========================
// 🔹 Helper interno para construir ProyectoFlat[]
// =========================
async function buildFlatProjects(): Promise<ProyectoFlat[]> {
  // 1) Traemos todos los datasets necesarios en paralelo
  const [
    projects,
    projectTypes,
    projectAreas,
    fundingRows,
    participantsDetails,
    participantsAcreditado,
    institutions,
    projectInstitutionPairs
  ] = await Promise.all([
    RelacionesSQLRepository.getAllProjectsWithEstado(),
    RelacionesSQLRepository.getProjectTypesWithNames(),
    RelacionesSQLRepository.getProjectAreasWithNames(),
    RelacionesSQLRepository.getProjectFundingWithNames(),
    RelacionesSQLRepository.getProjectParticipantsWithDetails(),
    RelacionesSQLRepository.getProjectParticipantsWithAcreditado(),
    ProjectsRepository.getAllInstitutions(),          // ya lo usas en el mapa
    ProjectsRepository.getProjectInstitutionPairs()   // también ya existe
  ]);


  console.log('[ProjectService.getFlatProjectsForUI] datasets cargados:', {
    projects: projects.length,
    projectTypes: projectTypes.length,
    projectAreas: projectAreas.length,
    fundingRows: fundingRows.length,
    participantsDetails: participantsDetails.length,
    participantsAcreditado: participantsAcreditado.length,
    institutions: institutions.length,
    projectInstitutionPairs: projectInstitutionPairs.length
  });


  // 2) Índices auxiliares por proyecto_id ==========================

  // Tipo de proyecto (tomamos el primero como “principal”)
  const tipoByProject = new Map<number, string>();
  projectTypes.forEach((row: any) => {
    const projectId = row.proyecto_id as number;
    const nombreTipo: string = row.tipos?.nombre ?? '';
    if (!projectId || !nombreTipo) return;
    if (!tipoByProject.has(projectId)) {
      tipoByProject.set(projectId, nombreTipo);
    }
  });

  // Área de conocimiento (la usamos como campo_amplio)
  const areaByProject = new Map<number, string>();
  projectAreas.forEach((row: any) => {
    const projectId = row.proyecto_id as number;
    const nombreArea: string = row.area?.nombre ?? '';
    if (!projectId || !nombreArea) return;
    if (!areaByProject.has(projectId)) {
      areaByProject.set(projectId, nombreArea);
    }
  });

  // Fuente(s) de financiamiento (posible lista separada por comas)
  const fundingByProject = new Map<number, string>();
  fundingRows.forEach((row: any) => {
    const projectId = row.proyecto_id as number;
    const nombreFuente: string = row.fuente?.nombre ?? '';
    if (!projectId || !nombreFuente) return;

    const prev = fundingByProject.get(projectId);
    if (!prev) {
      fundingByProject.set(projectId, nombreFuente);
    } else if (!prev.split(', ').includes(nombreFuente)) {
      fundingByProject.set(projectId, `${prev}, ${nombreFuente}`);
    }
  });

  // Facultad responsable y coordinador/director
  const facultadByProject = new Map<number, string>();
  const coordinadorByProject = new Map<number, { nombre: string; email: string }>();

  participantsDetails.forEach((row: any) => {
    const projectId = row.proyecto_id as number;
    if (!projectId) return;

    const facultad: string = row.facultad ?? '';
    const esLider = esRolLider(row.cargo_nombre);

    if (esLider) {
      // Preferimos facultad del líder
      if (facultad) {
        facultadByProject.set(projectId, facultad);
      }
      const nombre: string = row.participante_nombre ?? '';
      const email: string = row.participante_email ?? '';
      if (nombre) {
        coordinadorByProject.set(projectId, { nombre, email });
      }
    } else {
      // Si aún no hay facultad asignada, usamos la primera que aparezca
      if (facultad && !facultadByProject.has(projectId)) {
        facultadByProject.set(projectId, facultad);
      }
    }
  });

  // Nº de participantes acreditados por proyecto
  const acreditadosByProject = new Map<number, number>();
  participantsAcreditado.forEach((row: any) => {
    if (row.acreditado === true) {
      const projectId = row.proyecto_id as number;
      if (!projectId) return;
      acreditadosByProject.set(
        projectId,
        (acreditadosByProject.get(projectId) ?? 0) + 1
      );
    }
  });
  // Instituciones: id -> { nombre, pais }
  const institutionById = new Map<number, { nombre: string; pais: string | null }>();
  (institutions ?? []).forEach((inst: any) => {
    const id = inst.id as number;
    if (!id) return;
    institutionById.set(id, {
      nombre: inst.nombre ?? '',
      pais: inst.pais ?? null
    });
  });

  // Institución principal por proyecto (tomamos la primera relación)
  const institutionByProject = new Map<number, { nombre: string; pais: string | null }>();
  (projectInstitutionPairs ?? []).forEach((row: any) => {
    const projectId = row.proyecto_id as number;
    const instId = row.institucion_id as number;
    if (!projectId || !instId) return;

    // Si un proyecto tiene varias instituciones, usamos la primera que aparezca.
    if (institutionByProject.has(projectId)) return;

    const instInfo = institutionById.get(instId);
    if (!instInfo) return;

    institutionByProject.set(projectId, instInfo);
  });

  // 3) Construimos el array “plano” de ProyectoFlat ====================
  const proyectos: ProyectoFlat[] = projects.map((p: any) => {
    const projectId = p.id as number;

    const tipo = tipoByProject.get(projectId) ?? 'No especificado';
    const area = areaByProject.get(projectId) ?? 'No especificado';
    const fuente = fundingByProject.get(projectId) ?? 'Sin fuente';
    const facultad = facultadByProject.get(projectId) ?? 'Sin facultad';
    const coord = coordinadorByProject.get(projectId) ?? { nombre: '', email: '' };
    const acreditadosCount = acreditadosByProject.get(projectId) ?? 0;
    const instInfo = institutionByProject.get(projectId);
    const institucionNombre = instInfo?.nombre ?? 'Sin institución';
    const institucionPais = instInfo?.pais ?? 'Sin país';

    // Año de inicio (derivado de fecha_inicio_planeada)
    const fechaInicioPlaneada: string | null = p.fecha_inicio_planeada ?? null;
    let anioInicio: number | null = null;
    if (fechaInicioPlaneada) {
      const fecha = new Date(fechaInicioPlaneada);
      if (!Number.isNaN(fecha.getTime())) {
        anioInicio = fecha.getFullYear();
      }
    }

    const tieneAcreditados = acreditadosCount > 0;

    return {
      id: projectId,
      codigo: p.codigo ?? '',
      titulo: p.titulo ?? '',
      objetivo: p.objetivo ?? '',

      tipo_proyecto: tipo,
      estado: p.estado?.nombre ?? 'Sin estado',
      facultad_o_entidad_o_area_responsable: facultad,

      fecha_inicio: fechaInicioPlaneada ?? '',
      fecha_fin_planeado: p.fecha_fin_planeada ?? '',

      coordinador_director: coord.nombre,
      correo_electronico_coordinador: coord.email,

      campo_amplio: area,
      campo_especifico: '',
      campo_detallado: '',

      // Se mantiene vacío porque no hay datos en la BD
      alcance_territorial: '',

      // Texto legible para la UI
      investigadores_acreditados_senescyt: tieneAcreditados
        ? `Sí (${acreditadosCount})`
        : 'No',

      fuente_financiamiento: fuente,

      // Nuevos campos para filtros
      anio_inicio: anioInicio,
      tiene_investigadores_acreditados: tieneAcreditados,
      numero_investigadores_acreditados: acreditadosCount,
      para_siies: !!p.para_siies,
      // Datos de institución (para filtros a nivel institución)
      institucion: institucionNombre,
      pais_institucion: institucionPais
    };
  });

  console.log('[ProjectService.getFlatProjectsForUI] proyectos normalizados:', {
    total: proyectos.length,
    ejemplo: proyectos[0]
  });

  return proyectos;
}
// =========================
export const ProjectService = {
  /**
 * Mapa de proyectos por INSTITUCIÓN (con soporte de filtros)
 */
  async getProjectsByInstitutionForMap(
    filters?: ProjectFilters
  ): Promise<ProjectMapModel[]> {
    // 1) Traemos instituciones y pares proyecto–institución
    const institutions = await ProjectsRepository.getAllInstitutions();
    const pairs = await ProjectsRepository.getProjectInstitutionPairs();

    // 2) Mapa proyecto_id -> institución principal (la primera que aparezca)
    const mainInstitutionByProject = new Map<number, number>();

    (pairs ?? []).forEach((row: any) => {
      const projectId = row.proyecto_id as number;
      const instId = row.institucion_id as number;
      if (!projectId || !instId) return;

      // Solo asignamos la PRIMERA que aparece como "principal"
      if (!mainInstitutionByProject.has(projectId)) {
        mainInstitutionByProject.set(projectId, instId);
      }
    });

    // 3) IDs permitidos según filtros (mismo helper que ya usas en el servicio)
    const allowedIds = await getFilteredProjectIds(filters);

    // 4) Conteo por institución usando SOLO la institución principal del proyecto
    const countMap = new Map<number, number>();

    for (const [projectId, instId] of mainInstitutionByProject.entries()) {
      if (allowedIds && !allowedIds.has(projectId)) continue;

      countMap.set(instId, (countMap.get(instId) || 0) + 1);
    }

    // 5) Construimos el modelo para el mapa
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
    // 1) Todas las facultades con geometry
    const faculties = await ProjectDatasource.getFacultiesFull();

    // 2) Modelo plano que ya define la facultad responsable (líder + fallback)
    const flatProjects = await buildFlatProjects();

    // 3) IDs permitidos por filtros (puede ser null = sin filtros)
    const allowedIds = await getFilteredProjectIds(filters);

    // 4) Para cada facultad, contamos SOLO los proyectos donde
    //    facultad_o_entidad_o_area_responsable === nombre de esa facultad
    const result: ProjectMapModel[] = (faculties ?? []).map((fac: any) => {
      const facultadNombre: string = fac.nombre ?? '';

      const count = flatProjects.filter((p) => {
        if (!facultadNombre) return false;

        // Si hay filtros, respetamos el subconjunto permitido
        if (allowedIds && !allowedIds.has(p.id)) return false;

        // 👇 Clave: usamos la misma lógica que ProyectoFlat
        return p.facultad_o_entidad_o_area_responsable === facultadNombre;
      }).length;

      return {
        id: fac.id as number,
        titulo: facultadNombre,
        geometry: fac.geometry ?? null,
        projectCount: count,
        level: 'faculty'
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
  },
  /**
 * 🔹 Modelo "plano" de proyectos para la UI
 */
  async getFlatProjectsForUI(): Promise<ProyectoFlat[]> {
    return buildFlatProjects();
  }
};
