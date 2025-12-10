/**
 * Projects Repository
 * -------------------
 * Este repositorio contiene TODAS las consultas directas a la base
 * relacionadas con la tabla `proyectos` y sus tablas puente.
 * Repositorio encargado de obtener proyectos y sus relaciones mínimas
 * para alimentar servicios más especializados (mapas, análisis, etc.).
 *
 * IMPORTANTE:
 *  - No incluir lógica de negocio
 *  - No transformar datos
 *  - No agregar filtros complejos
 *  - SOLO consultas puras a Supabase (BASE DE DATOS)
 * Esta versión implementa:
 *  - Obtener todos los proyectos con sus instituciones asociadas
 *  - Obtener conteos de proyectos agrupados por institución
 */
// src/lib/db/projects.repository.ts
/**
 * Projects Repository
 * -------------------
 * Consultas directas a la BD relacionadas con proyectos
 */

import { supabase } from './supabase.client';
import type { ProjectMapModel } from '$lib/models/map.model';

export const ProjectsRepository = {
  /**
   * Obtiene pares (proyecto_id, institucion_id)
   * desde la tabla puente proyecto_institucion.
   */
  async getProjectInstitutionPairs() {
    const { data, error } = await supabase
      .from('proyecto_institucion')
      .select('proyecto_id, institucion_id');

    if (error) {
      console.error('Error al obtener proyecto_institucion:', error);
      return [];
    }

    return data;
  },

  /**
   * Obtiene todas las instituciones y su geometría.
   */
  async getAllInstitutions() {
    const { data, error } = await supabase
      .from('instituciones')
      .select('id, nombre, geometry');

    if (error) {
      console.error('Error al obtener instituciones:', error);
      return [];
    }

    return data;
  },

  /**
   * Obtiene el conteo de proyectos por institución.
   * Devuelve:
   *   { institucion_id: number, count: number }
   */
  async getProjectCountByInstitution() {
    const { data, error } = await supabase
      .from('proyecto_institucion')
      .select('institucion_id, proyecto_id');

    if (error) {
      console.error('Error al obtener conteos de proyectos:', error);
      return [];
    }

    const counts = new Map<number, number>();

    data.forEach((row: any) => {
      const id = row.institucion_id;
      counts.set(id, (counts.get(id) || 0) + 1);
    });

    return Array.from(counts.entries()).map(([institucion_id, count]) => ({
      institucion_id,
      count
    }));
  },

  /**
   * Obtiene el conteo de proyectos por facultad
   * para visualización en mapas.
   * Recorre las relaciones:
   *  facultades → carreras → participantes → proyecto_participante
   */
  async getProjectCountByFacultyForMap(): Promise<ProjectMapModel[]> {
    const { data, error } = await supabase
      .from('facultades')
      .select(`
        id,
        nombre,
        geometry,
        carreras (
          participantes (
            proyecto_participante (
              proyecto_id
            )
          )
        )
      `);

    if (error) {
      console.error('Error getProjectCountByFacultyForMap:', error);
      throw error;
    }

    return (data ?? []).map((fac: any) => {
      const carreras = fac.carreras ?? [];
      const projectIdsSet = new Set<number>();

      for (const carrera of carreras) {
        const participantes = carrera.participantes ?? [];
        for (const part of participantes) {
          const proyPart = part.proyecto_participante ?? [];
          for (const rel of proyPart) {
            if (rel.proyecto_id) {
              projectIdsSet.add(rel.proyecto_id);
            }
          }
        }
      }

      const model: ProjectMapModel = {
        id: fac.id,
        titulo: fac.nombre,
        geometry: fac.geometry,
        projectCount: projectIdsSet.size,
        level: 'faculty'
      };

      return model;
    });
  },
  /**
   * Devuelve los proyectos con su estado_id (lo mínimo necesario
   * para estadísticas por estado).
   *
   * Tabla: proyectos
   * Columnas: id, estado_id
   */
  async getAllProjectsBasic() {
    const { data, error } = await supabase
      .from('proyectos')
      .select('id, estado_id');

    if (error) {
      console.error('Error ProjectsRepository.getAllProjectsBasic():', error);
      return [];
    }

    return data;
  },

  /**
   * Devuelve todos los estados disponibles.
   *
   * Tabla: estado
   * Columnas: id, nombre
   */
  async getAllStates() {
    const { data, error } = await supabase
      .from('estado')
      .select('id, nombre');

    if (error) {
      console.error('Error ProjectsRepository.getAllStates():', error);
      return [];
    }

    return data;
  },
    /**
   * Mapea cada facultad a los IDs de proyectos relacionados.
   *
   * Recorre:
   *  facultades → carreras → participantes → proyecto_participante → proyectos
   *
   * Devuelve:
   *  [
   *    {
   *      facultadId: number;
   *      facultadNombre: string;
   *      projectIds: number[];
   *    },
   *    ...
   *  ]
   */
  async getProjectIdsByFaculty() {
    const { data, error } = await supabase
      .from('facultades')
      .select(`
        id,
        nombre,
        carreras (
          participantes (
            proyecto_participante (
              proyecto_id
            )
          )
        )
      `);

    if (error) {
      console.error('Error ProjectsRepository.getProjectIdsByFaculty():', error);
      return [];
    }

    return (data ?? []).map((fac: any) => {
      const carreras = fac.carreras ?? [];
      const projectIdsSet = new Set<number>();

      for (const carrera of carreras) {
        const participantes = carrera.participantes ?? [];
        for (const part of participantes) {
          const rels = part.proyecto_participante ?? [];
          for (const rel of rels) {
            if (rel.proyecto_id != null) {
              projectIdsSet.add(rel.proyecto_id as number);
            }
          }
        }
      }

      return {
        facultadId: fac.id as number,
        facultadNombre: fac.nombre as string,
        projectIds: Array.from(projectIdsSet)
      };
    });
  }

};

