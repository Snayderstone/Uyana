/**
 * facultades Repository
 * -------------------
 * Este repositorio contiene TODAS las consultas directas a la base
 * relacionadas con la tabla `facultades` y sus tablas puente.
 *
 * IMPORTANTE:
 *  - No incluir lógica de negocio
 *  - No transformar datos
 *  - No agregar filtros complejos
 *  - SOLO consultas puras a Supabase (BASE DE DATOS)
 */

import { supabase } from './supabase.client';

// Aquí definiremos todas las funciones de consulta
export const facultadesRepository = {

    // TODO: obtener facultades por id
    async getById(id: number) { /* implementar */ },

    // TODO: obtener todos los facultades
    async getAll() { /* implementar */ },

    // TODO: obtener facultades con filtros básicos
    async getWithFilters(filters: any) { /* implementar */ },

};
