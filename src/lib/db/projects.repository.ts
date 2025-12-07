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

import { supabase } from './supabase.client';

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
   * Esto es necesario para generar mapas temáticos.
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

    // Agrupar manualmente porque Supabase no permite count + group sin RPC
    const counts = new Map<number, number>();

    data.forEach(row => {
      const id = row.institucion_id;
      counts.set(id, (counts.get(id) || 0) + 1);
    });

    return Array.from(counts.entries()).map(([institucion_id, count]) => ({
      institucion_id,
      count
    }));
  }

};