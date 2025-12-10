/**
 * Participantes Repository
 * ------------------------
 * Consultas directas a la tabla `participantes`.
 *
 * IMPORTANTE:
 *  - NO lógica de negocio
 *  - NO agregaciones complejas
 *  - SOLO consultas puras a Supabase
 *
 * Archivo: src/lib/db/participants.repository.ts
 */

import { supabase } from './supabase.client';

export const ParticipantesRepository = {
  /**
   * Obtener un participante por ID.
   */
  async getById(id: number) {
    const { data, error } = await supabase
      .from('participantes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ ParticipantesRepository.getById():', error);
      return null;
    }

    return data;
  },

  /**
   * Obtener todos los participantes.
   * OJO: si la tabla crece mucho, luego podemos paginar.
   */
  async getAll() {
    const { data, error } = await supabase.from('participantes').select('*');

    if (error) {
      console.error('❌ ParticipantesRepository.getAll():', error);
      return [];
    }

    return data ?? [];
  },

  /**
   * Obtener participantes con filtros básicos.
   *
   * Filtros soportados (opcionales):
   *  - filters.nombre: string (ILike)
   *  - filters.genero: string (igual)
   *  - filters.acreditado: boolean
   */
  async getWithFilters(filters: {
    nombre?: string;
    genero?: string;
    acreditado?: boolean;
  }) {
    let query = supabase.from('participantes').select('*');

    if (filters.nombre) {
      query = query.ilike('nombre', `%${filters.nombre}%`);
    }

    if (filters.genero) {
      query = query.eq('genero', filters.genero);
    }

    if (typeof filters.acreditado === 'boolean') {
      query = query.eq('acreditado', filters.acreditado);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ ParticipantesRepository.getWithFilters():', error);
      return [];
    }

    return data ?? [];
  }
};
