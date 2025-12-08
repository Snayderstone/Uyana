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

// Aquí definiremos todas las funciones de consulta
export const InstitucionRepository = {

    // TODO: obtener Institucion por id
    async getById(id: number) { /* implementar */ },

    // TODO: obtener todos los Institucion
    async getAll() { /* implementar */ },

    // TODO: obtener Institucion con filtros básicos
    async getWithFilters(filters: any) { /* implementar */ },

};
