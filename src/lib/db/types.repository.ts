/**
 * Tipo Repository
 * ---------------
 * Consultas directas a la tabla `tipos`.
 */

import { supabase } from './supabase.client';

export const TipoRepository = {
  // Obtener tipo por id
  async getById(id: number) {
    const { data, error } = await supabase
      .from('tipos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ TipoRepository.getById():', error);
      return null;
    }

    return data;
  },

  // Obtener todos los tipos
  async getAll() {
    const { data, error } = await supabase.from('tipos').select('*');

    if (error) {
      console.error('❌ TipoRepository.getAll():', error);
      return [];
    }

    return data ?? [];
  },

  // Obtener tipos con filtros básicos
  async getWithFilters(filters: { nombre?: string }) {
    let query = supabase.from('tipos').select('*');

    if (filters.nombre) {
      query = query.ilike('nombre', `%${filters.nombre}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ TipoRepository.getWithFilters():', error);
      return [];
    }

    return data ?? [];
  }
};
