/**
 * RelacionesSQL Repository
 * ------------------------
 * Consultas directas a la BD que combinan varias tablas:
 *  - proyectos + estado
 *  - proyecto_tipo + tipos
 *  - proyecto_participante + participantes
 *
 * IMPORTANTE:
 *  - NO lógica de negocio
 *  - NO agregaciones complejas
 *  - SOLO "SELECTs" a Supabase
 */

import { supabase } from './supabase.client';

export const RelacionesSQLRepository = {
  // =========================================================
  // PROYECTOS + ESTADO
  // =========================================================

  /**
   * Devuelve TODOS los proyectos con la info básica + el estado (JOIN a tabla estado).
   */
  async getAllProjectsWithEstado() {
    const { data, error } = await supabase
      .from('proyectos')
      .select(
        `
        id,
        codigo,
        titulo,
        objetivo,
        estado_id,
        fecha_inicio_planeada,
        fecha_fin_planeada,
        fecha_fin_real,
        cantidad_meses,
        porcentaje_avance,
        monto_presupuesto_total,
        requiere_aval,
        impacto_cientifico,
        impacto_economico,
        impacto_social,
        otros_impactos,
        para_siies,
        creado_en,
        estado:estado (
          id,
          nombre
        )
      `
      );

    if (error) {
      console.error('❌ RelacionesSQLRepository.getAllProjectsWithEstado():', error);
      return [];
    }

    return data ?? [];
  },

  // =========================================================
  // PROYECTO ↔ TIPOS
  // =========================================================

  /**
   * Devuelve relaciones proyecto ↔ tipos de proyecto, con nombre de tipo.
   *
   * Estructura:
   *  {
   *    proyecto_id: number,
   *    tipos: {
   *      id: number,
   *      nombre: string
   *    } | null
   *  }[]
   */
  async getProjectTypesWithNames() {
    const { data, error } = await supabase
      .from('proyecto_tipo')
      .select(
        `
        proyecto_id,
        tipos:tipos (
          id,
          nombre
        )
      `
      );

    if (error) {
      console.error('❌ RelacionesSQLRepository.getProjectTypesWithNames():', error);
      return [];
    }

    return data ?? [];
  },

  // =========================================================
  // PROYECTO ↔ ÁREAS DE CONOCIMIENTO
  // =========================================================

  /**
   * Devuelve relaciones proyecto ↔ área de conocimiento, con nombre de área.
   *
   * Tabla puente:
   *  - proyecto_area_conocimiento (proyecto_id, area_conocimiento_id)
   *  - areas_conocimiento (id, nombre)
   */
  async getProjectAreasWithNames() {
    const { data, error } = await supabase
      .from('proyecto_area_conocimiento')
      .select(
        `
        proyecto_id,
        area:areas_conocimiento (
          id,
          nombre
        )
      `
      );

    if (error) {
      console.error('❌ RelacionesSQLRepository.getProjectAreasWithNames():', error);
      return [];
    }

    return data ?? [];
  },

  // =========================================================
  // PROYECTO ↔ FUENTE DE FINANCIAMIENTO
  // =========================================================

  /**
   * Devuelve relaciones proyecto ↔ fuente de financiamiento, con nombre de fuente.
   *
   * Tabla puente:
   *  - proyecto_fuente_financiamiento (proyecto_id, fuente_financiamiento_id)
   *  - fuente_financiamiento (id, nombre)
   */
  async getProjectFundingWithNames() {
    const { data, error } = await supabase
      .from('proyecto_fuente_financiamiento')
      .select(
        `
        proyecto_id,
        fuente:fuente_financiamiento (
          id,
          nombre
        )
      `
      );

    if (error) {
      console.error('❌ RelacionesSQLRepository.getProjectFundingWithNames():', error);
      return [];
    }

    return data ?? [];
  },

  // =========================================================
  // PROYECTO ↔ PARTICIPANTES (ACREDITADO)
  // =========================================================

  /**
   * Devuelve relaciones proyecto ↔ participante, incluyendo si el participante es acreditado.
   *
   * Estructura normalizada:
   *  {
   *    proyecto_id: number,
   *    participante_id: number | null,
   *    acreditado: boolean | null
   *  }[]
   */
  async getProjectParticipantsWithAcreditado() {
    const { data, error } = await supabase
      .from('proyecto_participante')
      .select(
        `
        proyecto_id,
        participantes (
          id,
          acreditado
        )
      `
      );

    if (error) {
      console.error('❌ RelacionesSQLRepository.getProjectParticipantsWithAcreditado():', error);
      return [];
    }

    // Normalizamos la forma de los datos para que el servicio no tenga que pelear
    return (data ?? []).map((row: any) => ({
      proyecto_id: row.proyecto_id as number,
      participante_id: row.participantes?.id ?? null,
      acreditado: row.participantes?.acreditado ?? null
    }));
  },

  // =========================================================
  // PROYECTO ↔ PARTICIPANTES (DETALLES COMPLETOS)
  // =========================================================

  /**
   * Devuelve relaciones proyecto ↔ participante ↔ carrera ↔ facultad,
   * incluyendo datos básicos del proyecto y su estado.
   *
   * Estructura normalizada:
   *  {
   *    proyecto_id: number;
   *    codigo: string;
   *    titulo: string;
   *    estado: string;
   *    participante_email: string;
   *    facultad: string;
   *    participante_id: number | null;
   *    participante_nombre: string;
   *    cargo_nombre: string | null;
   *    fecha_inicio_planeada: string | null;
   *    fecha_fin_planeada: string | null;
   *  }[]
   */
  async getProjectParticipantsWithDetails() {
    const { data, error } = await supabase
      .from('proyecto_participante')
      .select(
        `
        proyecto_id,
        participantes (
          id,
          nombre,
          email,
          carreras (
            facultades (
              nombre
            )
          )
        ),
        cargos (
          nombre
        ),
        proyectos (
          codigo,
          titulo,
          fecha_inicio_planeada,
          fecha_fin_planeada,
          estado:estado (
            nombre
          )
        )
      `
      );
      console.log('[DEBUG] sample row raw:', data?.[0]);
console.log('[DEBUG] cargos raw:', data?.[0]?.cargos);

    if (error) {
      console.error('❌ RelacionesSQLRepository.getProjectParticipantsWithDetails():', error);
      return [];
    }

    return (data ?? []).map((row: any) => {
      const participante = row.participantes ?? null;
      const carrera = participante?.carreras ?? null;
      const facultad = carrera?.facultades ?? null;
      const proyecto = row.proyectos ?? null;

      return {
        proyecto_id: row.proyecto_id as number,
        codigo: proyecto?.codigo ?? '',
        titulo: proyecto?.titulo ?? '',
        estado: proyecto?.estado?.nombre ?? 'Sin estado',
        facultad: facultad?.nombre ?? 'Sin facultad',
        participante_id: participante?.id ?? null,
        participante_nombre: participante?.nombre ?? '',
        participante_email: participante?.email ?? '',
        cargo_nombre: row.cargos?.nombre ?? null,
        fecha_inicio_planeada: proyecto?.fecha_inicio_planeada ?? null,
        fecha_fin_planeada: proyecto?.fecha_fin_planeada ?? null
      };
    });
  },

  // =========================================================
  // PLACEHOLDERS (SE MANTIENEN POR COMPATIBILIDAD)
  // =========================================================

  /** @deprecated Placeholder, no hay entidad "RelacionesSQL" como tal. */
  async getById(id: number) {
    console.warn('RelacionesSQLRepository.getById() aún no está implementado, id =', id);
    return null;
  },

  /** @deprecated Placeholder genérico, sin uso actual. */
  async getAll() {
    console.warn('RelacionesSQLRepository.getAll() aún no está implementado');
    return [];
  },

  /** @deprecated Placeholder con filtros genéricos, sin uso actual. */
  async getWithFilters(_filters: any) {
    console.warn('RelacionesSQLRepository.getWithFilters() aún no está implementado');
    return [];
  },
  async getProjectLinesWithNames() {
    const { data, error } = await supabase
      .from('proyecto_linea_investigacion')
      .select(`
      proyecto_id,
      linea:lineas_investigacion (
        id,
        nombre
      )
    `);

    if (error) {
      console.error('❌ RelacionesSQLRepository.getProjectLinesWithNames():', error);
      return [];
    }

    return data ?? [];
  },
};
