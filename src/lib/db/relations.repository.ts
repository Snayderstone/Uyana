/**
 * RelacionesSQL Repository
 * -------------------
 * Este repositorio contiene TODAS las consultas directas a la base
 * relacionadas con la tabla `RelacionesSQL` y sus tablas puente.
 *
 * IMPORTANTE:
 *  - No incluir lógica de negocio
 *  - No transformar datos
 *  - No agregar filtros complejos
 *  - SOLO consultas puras a Supabase (BASE DE DATOS)
 */

import { supabase } from './supabase.client';

// Aquí definiremos todas las funciones de consulta
export const RelacionesSQLRepository = {

    // TODO: obtener RelacionesSQL por id
    async getById(id: number) { /* implementar */ },

    // TODO: obtener todos los RelacionesSQL
    async getAll() { /* implementar */ },

    // TODO: obtener RelacionesSQL con filtros básicos
    async getWithFilters(filters: any) { /* implementar */ },

};
