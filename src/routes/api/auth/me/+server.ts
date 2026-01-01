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

		// Log de cabeceras de cookie (solo nombres) y origen para depuración
		try {
			const cookieHeader = event.request.headers.get('cookie') || '';
			const cookieNames = cookieHeader
				.split(';')
				.map((c) => c.split('=')[0]?.trim())
				.filter(Boolean);
			console.log(`GET /api/auth/me - cookies=${JSON.stringify(cookieNames)} referer=${event.request.headers.get(
				'referer'
			)}`);
		} catch (e) {
			// no-op
		}

		if (!usuario) {
			console.log('GET /api/auth/me - no authenticated');
			return unauthorizedError('No autenticado');
		}

		// Retornar información del usuario
		console.log(`GET /api/auth/me - ok userId=${usuario.id} roles=${JSON.stringify(usuario.roles)}`);
		return json({
			success: true,
			usuario
		});
	} catch (error) {
		console.error('Error en GET /api/auth/me:', error);
		return jsonError('Error al obtener usuario', 500);
	}
}
