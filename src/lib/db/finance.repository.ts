/**
 * Finance Repository
 * ------------------
 * Consultas directas a la tabla `fuente_financiamiento`.
 *
 * IMPORTANTE:
 *  - No incluir lógica de negocio
 *  - No transformar datos
 *  - SOLO consultas puras a Supabase
 */

import { supabase } from './supabase.client';

export const FinanceRepository = {
  // Obtener fuente de financiamiento por id
  async getById(id: number) {
    const { data, error } = await supabase
      .from('fuente_financiamiento')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ FinanceRepository.getById():', error);
      return null;
    }

    return data;
  },

  // Obtener todas las fuentes de financiamiento
  async getAll() {
    const { data, error } = await supabase.from('fuente_financiamiento').select('*');

    if (error) {
      console.error('❌ FinanceRepository.getAll():', error);
      return [];
    }

    return data ?? [];
  },

  // Obtener fuentes con filtros básicos
  async getWithFilters(filters: { nombre?: string }) {
    let query = supabase.from('fuente_financiamiento').select('*');

    if (filters.nombre) {
      query = query.ilike('nombre', `%${filters.nombre}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ FinanceRepository.getWithFilters():', error);
      return [];
    }

    return data ?? [];
  }
};
