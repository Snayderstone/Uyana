import { json, type RequestEvent } from '@sveltejs/kit';
import { getAuthToken, removeAuthCookie, jsonError } from '$lib/utils/auth.utils';
import { authService } from '$lib/services/auth.service';

/**
 * POST /api/auth/logout
 * Cerrar sesión
 */
export async function POST(event: RequestEvent) {
	try {
		// Obtener token de las cookies
		const token = getAuthToken(event);

		if (!token) {
			return jsonError('No hay sesión activa', 400);
		}

		// Eliminar sesión de la base de datos
		await authService.logout(token);

		// Eliminar cookie
		removeAuthCookie(event);

		return json({
			success: true,
			mensaje: 'Sesión cerrada exitosamente'
		});
	} catch (error) {
		console.error('Error en POST /api/auth/logout:', error);
		return jsonError('Error al cerrar sesión', 500);
	}
}
