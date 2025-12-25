import { json, type RequestEvent } from '@sveltejs/kit';
import { verifyAuth, jsonError, unauthorizedError } from '$lib/utils/auth.utils';

/**
 * GET /api/auth/me
 * Obtener información del usuario autenticado
 */
export async function GET(event: RequestEvent) {
	try {
		// Verificar autenticación
		const usuario = await verifyAuth(event);

		if (!usuario) {
			return unauthorizedError('No autenticado');
		}

		// Retornar información del usuario
		return json({
			success: true,
			usuario
		});
	} catch (error) {
		console.error('Error en GET /api/auth/me:', error);
		return jsonError('Error al obtener usuario', 500);
	}
}
