/**
 * Projects Repository
 * -------------------
 * Este repositorio contiene TODAS las consultas directas a la base
 * relacionadas con la tabla `finance` y sus tablas puente.
 *
 * IMPORTANTE:
 *  - No incluir lógica de negocio
 *  - No transformar datos
 *  - No agregar filtros complejos
 *  - SOLO consultas puras a Supabase (BASE DE DATOS)
 */

import { supabase } from './supabase.client';

// Aquí definiremos todas las funciones de consulta
export const FinanceRepository = {

    // TODO: obtener finance por id
    async getById(id: number) { /* implementar */ },

    // TODO: obtener todos los finance
    async getAll() { /* implementar */ },

    // TODO: obtener finance con filtros básicos
    async getWithFilters(filters: any) { /* implementar */ },

};
