/**
 * Projects Repository
 * -------------------
 * Este repositorio contiene TODAS las consultas directas a la base
 * relacionadas con la tabla `area` y sus tablas puente.
 *
 * IMPORTANTE:
 *  - No incluir lógica de negocio
 *  - No transformar datos
 *  - No agregar filtros complejos
 *  - SOLO consultas puras a Supabase (BASE DE DATOS)
 */

import { supabase } from './supabase.client';

// Aquí definiremos todas las funciones de consulta
export const AreaRepository = {

    // TODO: obtener area por id
    async getById(id: number) { /* implementar */ },

    // TODO: obtener todos los areas
    async getAll() { /* implementar */ },

    // TODO: obtener areas con filtros básicos
    async getWithFilters(filters: any) { /* implementar */ },

};
