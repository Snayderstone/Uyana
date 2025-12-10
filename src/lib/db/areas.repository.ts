/**
 * Areas Repository
 * ----------------
 * Consultas directas a la tabla `areas_conocimiento`.
 *
 * IMPORTANTE:
 *  - No incluir lógica de negocio
 *  - No transformar datos
 *  - SOLO consultas puras a Supabase
 */

import { supabase } from './supabase.client';

export const AreaRepository = {
  // Obtener área por id
  async getById(id: number) {
    const { data, error } = await supabase
      .from('areas_conocimiento')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ AreaRepository.getById():', error);
      return null;
    }

    return data;
  },

  // Obtener todas las áreas
  async getAll() {
    const { data, error } = await supabase.from('areas_conocimiento').select('*');

    if (error) {
      console.error('❌ AreaRepository.getAll():', error);
      return [];
    }

    return data ?? [];
  },

  // Obtener áreas con filtros básicos
  async getWithFilters(filters: { nombre?: string }) {
    let query = supabase.from('areas_conocimiento').select('*');

    if (filters.nombre) {
      query = query.ilike('nombre', `%${filters.nombre}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ AreaRepository.getWithFilters():', error);
      return [];
    }

    return data ?? [];
  }
};
