/**
 * Project Datasource
 * ------------------
 * Acceso directo a Supabase para obtener:
 *  - proyectos (tabla principal)
 *  - relaciones (instituciones, facultades, carreras, áreas, líneas, tipos, financiamiento, participantes)
 *
 * SIN lógica de negocio.
 */

import { supabase } from './supabase.client';

export const ProjectDatasource = {
  /** Obtener proyecto base (sin relaciones) */
  async getAllProjects() {
    const { data, error } = await supabase
      .from('proyectos')
      .select('*');

    if (error) {
      console.error('❌ Error getAllProjects():', error);
      return [];
    }

    return data;
  },

  /** Proyecto por ID */
  async getProjectById(id: number) {
    const { data, error } = await supabase
      .from('proyectos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('❌ Error getProjectById():', error);
      return null;
    }

    return data;
  },

  /** Relación proyecto → institución */
  async getProjectInstitutions() {
    const { data, error } = await supabase
      .from('proyecto_institucion')
      .select('proyecto_id, institucion_id');

    if (error) {
      console.error('❌ Error getProjectInstitutions():', error);
      return [];
    }

    return data;
  },

  /** Todas las instituciones con geometry */
  async getInstitutions() {
    const { data, error } = await supabase
      .from('instituciones')
      .select('id, nombre, geometry');

    if (error) {
      console.error('❌ Error getInstitutions():', error);
      return [];
    }

    return data;
  },

  /** Facultades con geometry, carreras, participantes, proyecto_participante */
  async getFacultiesFull() {
    const { data, error } = await supabase
      .from('facultades')
      .select(`
        id,
        nombre,
        geometry,
        carreras (
          id,
          nombre,
          geometry,
          participantes (
            id,
            nombre,
            proyecto_participante (
              proyecto_id
            )
          )
        )
      `);

    if (error) {
      console.error('❌ Error getFacultiesFull():', error);
      return [];
    }

    return data;
  },

  /** Áreas ↔ proyectos */
  async getProjectAreas() {
    const { data, error } = await supabase
      .from('proyecto_area_conocimiento')
      .select('proyecto_id, area_conocimiento_id');

    if (error) {
      console.error('❌ Error getProjectAreas():', error);
      return [];
    }

    return data;
  },

  /** Líneas ↔ proyectos */
  async getProjectLines() {
    const { data, error } = await supabase
      .from('proyecto_linea_investigacion')
      .select('proyecto_id, linea_investigacion_id');

    if (error) {
      console.error('❌ Error getProjectLines():', error);
      return [];
    }

    return data;
  },

  /** Tipos de proyecto ↔ proyectos */
  async getProjectTypes() {
    const { data, error } = await supabase
      .from('proyecto_tipo')
      .select('proyecto_id, tipo_id');

    if (error) {
      console.error('❌ Error getProjectTypes():', error);
      return [];
    }

    return data;
  },

  /** Financiamiento ↔ proyectos */
  async getProjectFinancing() {
    const { data, error } = await supabase
      .from('proyecto_fuente_financiamiento')
      .select('proyecto_id, fuente_financiamiento_id');

    if (error) {
      console.error('❌ Error getProjectFinancing():', error);
      return [];
    }

    return data;
  },

  /** Participantes ↔ proyectos */
  async getProjectParticipants() {
    const { data, error } = await supabase
      .from('proyecto_participante')
      .select('proyecto_id, participante_id');

    if (error) {
      console.error('❌ Error getProjectParticipants():', error);
      return [];
    }

    return data;
  }
};
