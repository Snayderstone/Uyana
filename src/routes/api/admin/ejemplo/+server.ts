import { json, type RequestEvent } from '@sveltejs/kit';
import { requireAdmin, jsonError } from '$lib/utils/auth.utils';

/**
 * Ejemplo de API protegida para administradores
 * GET /api/admin/ejemplo
 */
export async function GET(event: RequestEvent) {
	try {
		// Verificar que el usuario sea administrador
		const usuario = await requireAdmin(event);

		// Si llegamos aquí, el usuario está autenticado y es admin

		return json({
			success: true,
			data: {
				mensaje: 'API protegida - solo para administradores',
				usuario: {
					nombre: usuario.nombre,
					email: usuario.email,
					roles: usuario.roles
				}
			}
		});
	} catch (error) {
		// Si no está autenticado o no es admin
		return jsonError('Acceso no autorizado', 401);
	}
}

/**
 * Ejemplo de POST protegido
 */
export async function POST(event: RequestEvent) {
	try {
		const usuario = await requireAdmin(event);

		// Obtener datos del body
		const body = await event.request.json();

		// Validar datos
		if (!body.titulo) {
			return jsonError('Título requerido', 400);
		}

		// Tu lógica aquí...

		return json({
			success: true,
			data: {
				mensaje: 'Recurso creado exitosamente'
			}
		});
	} catch (error) {
		return jsonError('Acceso no autorizado', 401);
	}
}
