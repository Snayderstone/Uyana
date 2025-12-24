/**
 * Admin Module - DTOs (Data Transfer Objects)
 * --------------------------------------------
 * @deprecated Este archivo se mantiene por compatibilidad.
 * Use las importaciones específicas desde:
 * - '$lib/models/admin/project.dto'
 * - '$lib/models/admin/participant.dto'
 * - '$lib/models/admin/blog.dto'
 * - '$lib/models/admin/common.dto'
 * O importe todo desde '$lib/models/admin'
 */

// Re-exportar todos los DTOs desde los archivos específicos
export * from './projects/project.dto';
export * from './participants/participant.dto';
export * from './blog/blog.dto';
export * from './catalog/common.dto';
