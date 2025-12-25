import { json, type RequestEvent } from '@sveltejs/kit';
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';

/**
 * Middleware para proteger APIs de administración
 * Usar en cualquier endpoint que requiera autenticación de admin
 */
export async function protectAdminAPI(event: RequestEvent) {
	try {
		const usuario = await requireAdmin(event);
		return usuario;
	} catch (error) {
		return null;
	}
}

/**
 * Ejemplo de uso en un endpoint protegido:
 *
 * import { protectAdminAPI, jsonError } from '$lib/utils/admin-middleware';
 *
 * export async function GET(event: RequestEvent) {
 *   const usuario = await protectAdminAPI(event);
 *
 *   if (!usuario) {
 *     return jsonError('No autorizado', 401);
 *   }
 *
 *   // Lógica del endpoint...
 *   return json({ data: '...' });
 * }
 */
