/**
 * Institucion Repository
 * -------------------
 * Este repositorio contiene TODAS las consultas directas a la base
 * relacionadas con la tabla `Institucion` y sus tablas puente.
 *
 * IMPORTANTE:
 *  - No incluir lógica de negocio
 *  - No transformar datos
 *  - No agregar filtros complejos
 *  - SOLO consultas puras a Supabase (BASE DE DATOS)
 */

import { supabase } from './supabase.client';

export const InstitucionRepository = {
  // Obtener una institución por id
  async getById(id: number) {
    const { data, error } = await supabase
      .from('instituciones')
      .select('id, nombre, geometry')
      .eq('id', id)
      .maybeSingle(); // o .single() si estás seguro

    if (error) {
      console.error('Error InstitucionRepository.getById():', error);
      return null;
    }

    return data;
  },

  // Obtener todas las instituciones
  async getAll() {
    const { data, error } = await supabase
      .from('instituciones')
      .select('id, nombre, geometry');

    if (error) {
      console.error('Error InstitucionRepository.getAll():', error);
      return [];
    }

    return data ?? [];
  },

  // Filtros básicos (de momento opcional, puedes adaptarlo a tus columnas reales)
  async getWithFilters(filters: { nombreContiene?: string } = {}) {
    let query = supabase
      .from('instituciones')
      .select('id, nombre, geometry');

    if (filters.nombreContiene) {
      query = query.ilike('nombre', `%${filters.nombreContiene}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error InstitucionRepository.getWithFilters():', error);
      return [];
    }

    return data ?? [];
  }
};
