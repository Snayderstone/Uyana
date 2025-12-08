/**
 * Project Service
 * ---------------
 * Se encarga de orquestar datos provenientes de múltiples repositorios
 * para construir un ProjectMapModel completamente armado.
 *
 *   IMPORTANTE:
 * - Este servicio **NO consulta directamente a Supabase**
 * - SOLO utiliza métodos del ProjectsRepository
 * - Aquí se hace la lógica de transformación y unión de datos
 *
 * Este servicio se usa principalmente desde los componentes del MAPA:
 *  - ProjectMapExplorer.svelte
 *  - ProjectsChoropleth.svelte (cuando lo actualicemos a geometry real)
 *  - Otros componentes relacionados con visualización geoespacial
 * Project Service
 * ---------------
 * Orquesta todos los datos provenientes de ProjectDatasource
 * y construye modelos completos o ligeros para el mapa.
 */

import { ProjectDatasource } from '$lib/db/project.datasource';
import type { MapLevel, ProjectFullModel, ProjectMapModel } from '$lib/models/project.model';

export const ProjectService = {

  /** 🔵 MODELO LIGERO PARA EL MAPA — nivel institución */
  async getProjectsByInstitutionForMap(): Promise<ProjectMapModel[]> {
    const institutions = await ProjectDatasource.getInstitutions();
    const pairs = await ProjectDatasource.getProjectInstitutions();

    const countMap = new Map<number, number>();

    pairs.forEach(p => {
      countMap.set(p.institucion_id, (countMap.get(p.institucion_id) || 0) + 1);
    });

    return institutions.map(inst => ({
      id: inst.id,
      titulo: inst.nombre,
      geometry: inst.geometry,
      projectCount: countMap.get(inst.id) || 0,
      level: 'institution'
    }));
  },

  /** 🟣 MODELO LIGERO PARA EL MAPA — nivel facultad */
  async getProjectsByFacultyForMap(): Promise<ProjectMapModel[]> {
    const faculties = await ProjectDatasource.getFacultiesFull();

    return faculties.map((f: any) => {
      const projectIds = new Set<number>();

      f.carreras?.forEach((car: any) => {
        car.participantes?.forEach((p: any) => {
          p.proyecto_participante?.forEach((rel: any) => {
            if (rel.proyecto_id) projectIds.add(rel.proyecto_id);
          });
        });
      });

      return {
        id: f.id,
        titulo: f.nombre,
        geometry: f.geometry,
        projectCount: projectIds.size,
        level: 'faculty'
      };
    });
  },

  /** 📌 Función pública usada por la UI del mapa */
  async getProjectsForMap(level: MapLevel): Promise<ProjectMapModel[]> {
    return level === 'institution'
      ? this.getProjectsByInstitutionForMap()
      : this.getProjectsByFacultyForMap();
  },

  /** 🔥 MODELO ULTRA COMPLETO PARA DASHBOARD */
  async getAllProjectsFull(): Promise<ProjectFullModel[]> {
    const base = await ProjectDatasource.getAllProjects();
    const institutions = await ProjectDatasource.getProjectInstitutions();
    const areas = await ProjectDatasource.getProjectAreas();
    const lines = await ProjectDatasource.getProjectLines();
    const types = await ProjectDatasource.getProjectTypes();
    const finance = await ProjectDatasource.getProjectFinancing();
    const participants = await ProjectDatasource.getProjectParticipants();

    return base.map((p: any) => ({
      ...p,
      instituciones: institutions.filter(i => i.proyecto_id === p.id).map(i => i.institucion_id),
      areas: areas.filter(i => i.proyecto_id === p.id).map(i => i.area_conocimiento_id),
      lineas: lines.filter(i => i.proyecto_id === p.id).map(i => i.linea_investigacion_id),
      tipos: types.filter(i => i.proyecto_id === p.id).map(i => i.tipo_id),
      financiamiento: finance.filter(i => i.proyecto_id === p.id).map(i => i.fuente_financiamiento_id),
      participantes: participants.filter(i => i.proyecto_id === p.id).map(i => i.participante_id),

      facultades: [],   // se llenará en versión avanzada
      carreras: []      // se llenará en versión avanzada
    }));
  },

  /** Obtener un proyecto ULTRA completo por ID */
  async getProjectFullById(id: number): Promise<ProjectFullModel | null> {
    const all = await this.getAllProjectsFull();
    return all.find(p => p.id === id) || null;
  }
};
