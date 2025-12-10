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
 *
 * Archivo: src/lib/db/relations.repository.ts
 */

import { supabase } from './supabase.client';

export const RelacionesSQLRepository = {
  // =========================================================
  // ⚠️ PLACEHOLDERS ORIGINALES (los dejo como están, sin usar)
  // =========================================================

  // TODO: obtener RelacionesSQL por id (si algún día existe esa entidad)
  async getById(id: number) {
    // Por ahora no hay una tabla "RelacionesSQL" como tal,
    // así que este método queda como placeholder.
    console.warn('RelacionesSQLRepository.getById() aún no está implementado');
    return null;
  },

  // TODO: obtener todos los RelacionesSQL
  async getAll() {
    console.warn('RelacionesSQLRepository.getAll() aún no está implementado');
    return [];
  },

  // TODO: obtener RelacionesSQL con filtros básicos
  async getWithFilters(_filters: any) {
    console.warn('RelacionesSQLRepository.getWithFilters() aún no está implementado');
    return [];
  },

  // =========================================================
  // CONSULTAS REALES PARA ANALYTICS
  // =========================================================

  /**
   * Devuelve TODOS los proyectos con la info básica + el estado (JOIN a tabla estado).
   *
   * Estructura aproximada:
   *  {
   *    id,
   *    codigo,
   *    titulo,
   *    objetivo,
   *    estado_id,
   *    fecha_inicio_planeada,
   *    fecha_fin_planeada,
   *    fecha_fin_real,
   *    cantidad_meses,
   *    porcentaje_avance,
   *    monto_presupuesto_total,
   *    requiere_aval,
   *    impacto_cientifico,
   *    impacto_economico,
   *    impacto_social,
   *    otros_impactos,
   *    estado: {
   *      id,
   *      nombre
   *    } | null
   *  }
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
   *
   * NOTA:
   *  - Un proyecto puede aparecer varias veces si tiene varios tipos.
   *  - Para muchos análisis nos sirven tal cual (después agregamos en el servicio).
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

  /**
   * Devuelve relaciones proyecto ↔ participante, incluyendo si el participante es acreditado.
   *
   * Estructura:
   *  {
   *    proyecto_id: number,
   *    participante_id: number | null,
   *    acreditado: boolean | null
   *  }[]
   *
   * Usos típicos:
   *  - Saber cuántos proyectos tienen al menos 1 participante acreditado.
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

  /**
   * 🔹 NUEVO:
   * Devuelve relaciones proyecto ↔ participante ↔ carrera ↔ facultad,
   * incluyendo datos básicos del proyecto y su estado.
   *
   * Estructura normalizada:
   *  {
   *    proyecto_id: number;
   *    codigo: string;
   *    titulo: string;
   *    estado: string;
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
        cargo_nombre: row.cargos?.nombre ?? null,
        fecha_inicio_planeada: proyecto?.fecha_inicio_planeada ?? null,
        fecha_fin_planeada: proyecto?.fecha_fin_planeada ?? null
      };
    });
  }
};
